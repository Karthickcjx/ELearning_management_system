import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { courseService } from "../../api/course.service";
import { learningService } from "../../api/learning.service";
import "./Courses.css";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [displayCount, setDisplayCount] = useState(6);

  const userId = localStorage.getItem("id");
  const authToken = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const incomingSearch = params.get("search") || "";
    setSearchTerm(incomingSearch);
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await courseService.getAllCourses();
        if (coursesRes.success) setCourses(coursesRes.data);

        if (userId) {
          const enrollmentsRes = await learningService.getEnrollments(userId);
          if (enrollmentsRes.success) {
            setEnrolled(enrollmentsRes.data.map((item) => item.course_id));
          }
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterBy === "enrolled") return matchesSearch && enrolled.includes(course.course_id);
      if (filterBy === "available") return matchesSearch && !enrolled.includes(course.course_id);
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.course_name.localeCompare(b.course_name);
        case "instructor":
          return a.instructor.localeCompare(b.instructor);
        case "price":
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
          return priceA - priceB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchTerm, sortBy, filterBy, enrolled]);

  const displayedCourses = filteredAndSortedCourses.slice(0, displayCount);

  const enrollCourse = async (courseId) => {
    if (!authToken) {
      message.error("You need to login to continue");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const res = await learningService.enrollCourse(userId, courseId);
    if (res.success && res.data === "Enrolled successfully") {
      message.success("Course Enrolled successfully");
      setTimeout(() => navigate(`/course/${courseId}`), 2000);
    }
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 6);
  };

  return (
    <div className="courses-page">
      <Navbar page="courses" />

      <div className="courses-container">
        <div className="courses-toolbar">
          <div className="courses-search-row">
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="courses-search-input"
            />
            <div className="courses-select-group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="courses-select"
              >
                <option value="name">Sort by Name</option>
                <option value="instructor">Sort by Instructor</option>
                <option value="price">Sort by Price</option>
              </select>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="courses-select"
              >
                <option value="all">All Courses</option>
                <option value="available">Available</option>
                <option value="enrolled">Enrolled</option>
              </select>
            </div>
          </div>

          <div className="courses-info-bar">
            <span>Showing {displayedCourses.length} of {filteredAndSortedCourses.length} courses</span>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="courses-clear-btn">
                Clear search
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="courses-loading">
            <div className="lms-spinner"></div>
          </div>
        ) : filteredAndSortedCourses.length === 0 ? (
          <div className="courses-empty">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="courses-empty-title">No courses found</p>
            <p className="courses-empty-sub">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="courses-grid">
              {displayedCourses.map((course) => (
                <div key={course.course_id} className="course-card">
                  <div className="course-card-img-wrap">
                    <img
                      src={course.p_link}
                      alt={course.course_name}
                      className="course-card-img"
                    />
                    <span className="course-card-price">{course.price}</span>
                  </div>

                  <div className="course-card-body">
                    <h3 className="course-card-title">
                      {course.course_name.length < 8 ? `${course.course_name} Tutorial` : course.course_name}
                    </h3>

                    <p className="course-card-instructor">
                      by {course.instructor}
                    </p>

                    {enrolled.includes(course.course_id) ? (
                      <button
                        onClick={() => navigate("/learnings")}
                        className="course-btn-enrolled"
                      >
                        ✓ Enrolled
                      </button>
                    ) : (
                      <button
                        onClick={() => enrollCourse(course.course_id)}
                        className="course-btn-enroll"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {displayedCourses.length < filteredAndSortedCourses.length && (
              <div className="courses-load-more">
                <button onClick={loadMore} className="courses-load-more-btn">
                  Load More Courses
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Courses;
