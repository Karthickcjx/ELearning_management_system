import React, { useEffect, useState } from "react";
import Navbar from "../../Components/common/Navbar";
import Footer from "../../Components/common/Footer";
import { Link, useNavigate } from "react-router-dom";
import { learningService } from "../../api/learning.service";
import "./Learnings.css";

function Learnings() {
  const userId = localStorage.getItem("id");
  const [courses, setCourse] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCourse() {
      try {
        const response = await learningService.getEnrollments(userId);
        setCourse(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [userId]);

  if (loading) {
    return (
      <div className="learn-page">
        <Navbar page="learnings" />
        <div className="lms-loading">
          <div className="lms-spinner"></div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="learn-page">
        <Navbar page="learnings" />
        <div className="learn-empty-wrap">
          <h1 className="learn-empty-title">
            You haven’t enrolled in any courses yet 🚀
          </h1>
          <p className="learn-empty-desc">
            Explore our collection of courses and begin your learning journey today.
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="lms-btn lms-btn-primary"
            style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
          >
            Explore Courses
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="learn-page">
      <Navbar page="learnings" />

      <div className="learn-container">
        <div className="lms-page-header">
          <h1>My Learning</h1>
        </div>
        <p className="lms-page-subtitle">Pick up where you left off</p>

        <div className="learn-grid">
          {courses.map((course) => (
            <div key={course.id} className="learn-card">
              <img
                src={course.p_link}
                alt={course.course_name}
                className="learn-card-img"
              />
              <div className="learn-card-info">
                <h3 className="learn-card-title">
                  {course.course_name.length < 8
                    ? `${course.course_name} Tutorial`
                    : course.course_name}
                </h3>
                <p className="learn-card-instructor">
                  by {course.instructor}
                </p>
              </div>
              <div className="learn-card-action">
                <Link to={`/course/${course.course_id}`}>
                  <button className="lms-btn lms-btn-secondary">
                    Continue Learning
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Learnings;
