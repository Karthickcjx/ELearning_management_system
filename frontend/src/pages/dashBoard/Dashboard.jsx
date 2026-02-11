import React, { useState, useEffect } from "react";
import { adminService } from "../../api/admin.service";
import UserGrowthChart from "../../Components/UserGrowthChart";
import CoursePopularityChart from "../../Components/CoursePopularityChart";

function Dashboard({ isAuthenticated }) {
  const [userscount, setUserscount] = useState(0);
  const [coursescount, setCoursescount] = useState(0);
  const [enrolled, setEnrolled] = useState(0);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [coursePopularityData, setCoursePopularityData] = useState([]);

  useEffect(() => {

    if (!isAuthenticated) {
      return;
    }

    async function fetchData() {
      const usersRes = await adminService.getAllUsers();
      if (usersRes.success) {
        setUserscount(usersRes.data.length);
        processUserGrowth(usersRes.data);
      }

      const coursesRes = await adminService.getAllCourses();
      if (coursesRes.success) setCoursescount(coursesRes.data.length);

      const learningRes = await adminService.getAllLearning();
      if (learningRes.success) {
        setEnrolled(learningRes.data.length);
        processCoursePopularity(learningRes.data);
      }
    }

    fetchData();
  }, [isAuthenticated]);

  const processUserGrowth = (users) => {
    // Group by date
    const grouped = {};
    users.forEach(user => {
      // Handle LocalDateTime array [2024, 2, 21, ...] or string
      let dateStr = "";
      if (Array.isArray(user.createdAt)) {
        const [year, month, day] = user.createdAt;
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else if (user.createdAt) {
        dateStr = user.createdAt.substring(0, 10);
      }

      if (dateStr) {
        grouped[dateStr] = (grouped[dateStr] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(grouped).sort();
    let cumulative = 0;
    const data = sortedDates.map(date => {
      cumulative += grouped[date];
      return { date, users: cumulative };
    });

    setUserGrowthData(data);
  };

  const processCoursePopularity = (enrollments) => {
    const counts = {};
    enrollments.forEach(item => {
      const name = item.courseName || "Unknown Course";
      counts[name] = (counts[name] || 0) + 1;
    });

    const data = Object.keys(counts).map(name => ({
      name,
      students: counts[name]
    })).sort((a, b) => b.students - a.students); // Sort by popularity

    setCoursePopularityData(data);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Info Cards */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        {/* Users */}
        <li className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 flex items-center gap-6 shadow-lg hover:shadow-2xl border border-white/30 transition-transform duration-300 hover:-translate-y-2">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl shadow-md group-hover:scale-110 transition-transform duration-300">
            <i className="bx bxs-group" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">{userscount}</h3>
            <p className="text-slate-600 text-lg">Total Users</p>
          </div>
        </li>

        {/* Courses */}
        <li className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 flex items-center gap-6 shadow-lg hover:shadow-2xl border border-white/30 transition-transform duration-300 hover:-translate-y-2">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-4xl shadow-md group-hover:scale-110 transition-transform duration-300">
            <i className="bx bx-book" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">{coursescount}</h3>
            <p className="text-slate-600 text-lg">Total Courses</p>
          </div>
        </li>

        {/* Enrollments */}
        <li className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 flex items-center gap-6 shadow-lg hover:shadow-2xl border border-white/30 transition-transform duration-300 hover:-translate-y-2">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white text-4xl shadow-md group-hover:scale-110 transition-transform duration-300">
            <i className="bx bxs-calendar-check" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">{enrolled}</h3>
            <p className="text-slate-600 text-lg">Total Enrollment</p>
          </div>
        </li>
      </ul>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <UserGrowthChart data={userGrowthData} />
        <CoursePopularityChart data={coursePopularityData} />
      </div>
    </>
  );
}

export default Dashboard;
