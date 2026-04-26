import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { BookOpen, Search, CheckCircle2, Loader2 } from "lucide-react";
import { courseService } from "../../api/course.service";
import { learningService } from "../../api/learning.service";
import CourseRatingSummary from "../../components/reviews/CourseRatingSummary";

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
          const priceA = parseFloat(String(a.price ?? "").replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(String(b.price ?? "").replace(/[^0-9.]/g, '')) || 0;
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

  const inputCls = "h-10 px-3 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 bg-white";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar page="courses" />

      <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Courses</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Browse the catalog, enroll, and resume learning.</p>

        <div className="mt-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses or instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={inputCls}
                >
                  <option value="name">Sort by Name</option>
                  <option value="instructor">Sort by Instructor</option>
                  <option value="price">Sort by Price</option>
                </select>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className={inputCls}
                >
                  <option value="all">All Courses</option>
                  <option value="available">Available</option>
                  <option value="enrolled">Enrolled</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Showing {displayedCourses.length} of {filteredAndSortedCourses.length} courses
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-primary font-semibold hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
              <Loader2 size={28} className="text-primary animate-spin mb-2" />
              <p className="text-sm text-slate-500">Loading courses...</p>
            </div>
          ) : filteredAndSortedCourses.length === 0 ? (
            <div className="mt-6 bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
              <Search size={40} className="text-slate-300 mb-2" />
              <h3 className="text-base font-semibold text-slate-900">No courses found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCourses.map((course) => {
                  const isEnrolled = enrolled.includes(course.course_id);
                  return (
                    <div
                      key={course.course_id}
                      className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="relative aspect-[16/9] bg-slate-100">
                        <img
                          src={course.p_link}
                          alt={course.course_name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 right-3 bg-white text-slate-900 text-xs font-semibold rounded-full px-2.5 py-1 shadow-sm border border-slate-200">
                          {course.price}
                        </span>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
                          {course.course_name.length < 8 ? `${course.course_name} Tutorial` : course.course_name}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          by {course.instructor}
                        </p>

                        <CourseRatingSummary
                          averageRating={course.averageRating}
                          reviewCount={course.reviewCount}
                          compact
                          className="mt-2"
                        />

                        <div className="mt-auto pt-4">
                          {isEnrolled ? (
                            <button
                              onClick={() => navigate("/learnings")}
                              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-md px-4 py-2 hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle2 size={15} /> Enrolled
                            </button>
                          ) : (
                            <button
                              onClick={() => enrollCourse(course.course_id)}
                              className="w-full bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
                            >
                              Enroll Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayedCourses.length < filteredAndSortedCourses.length && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={loadMore}
                    className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md px-4 py-2 transition-colors"
                  >
                    Load More Courses
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Courses;
