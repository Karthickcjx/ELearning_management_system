import React, { useState, useEffect } from "react";
import { Users, BookOpen, GraduationCap, BarChart3 } from "lucide-react";
import { adminService } from "../../api/admin.service";
import UserGrowthChart from "../../components/UserGrowthChart";
import CoursePopularityChart from "../../components/CoursePopularityChart";

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
    const grouped = {};
    users.forEach((user) => {
      let dateStr = "";
      if (Array.isArray(user.createdAt)) {
        const [year, month, day] = user.createdAt;
        dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      } else if (user.createdAt) {
        dateStr = user.createdAt.substring(0, 10);
      }

      if (dateStr) {
        grouped[dateStr] = (grouped[dateStr] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(grouped).sort();
    let cumulative = 0;
    const data = sortedDates.map((date) => {
      cumulative += grouped[date];
      return { date, users: cumulative };
    });

    setUserGrowthData(data);
  };

  const processCoursePopularity = (enrollments) => {
    const counts = {};
    enrollments.forEach((item) => {
      const name = item.courseName || "Unknown Course";
      counts[name] = (counts[name] || 0) + 1;
    });

    const data = Object.keys(counts)
      .map((name) => ({ name, students: counts[name] }))
      .sort((a, b) => b.students - a.students);

    setCoursePopularityData(data);
  };

  const statCards = [
    {
      label: "Total Users",
      value: userscount,
      icon: Users,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      label: "Total Courses",
      value: coursescount,
      icon: BookOpen,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Total Enrollments",
      value: enrolled,
      icon: GraduationCap,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  const ChartEmpty = ({ title }) => (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 text-slate-400 flex-1">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <BarChart3 size={22} />
      </div>
      <h3 className="text-sm font-semibold text-slate-600 m-0">No data yet</h3>
      <p className="text-xs text-slate-400 mt-1 m-0">{title} will appear once activity starts.</p>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of platform activity and engagement.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-4 p-5 bg-white rounded-lg border border-slate-200 shadow-sm"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.iconBg} ${s.iconColor}`}
              >
                <Icon size={20} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 m-0 leading-none">
                  {s.value ?? 0}
                </p>
                <p className="text-sm text-slate-500 mt-1 m-0">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col min-h-[320px]">
          <h3 className="text-base font-semibold text-slate-800 m-0 mb-3">User Growth</h3>
          {userGrowthData.length === 0 ? (
            <ChartEmpty title="User growth" />
          ) : (
            <div className="flex-1">
              <UserGrowthChart data={userGrowthData} />
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col min-h-[320px]">
          <h3 className="text-base font-semibold text-slate-800 m-0 mb-3">Course Popularity</h3>
          {coursePopularityData.length === 0 ? (
            <ChartEmpty title="Course popularity" />
          ) : (
            <div className="flex-1">
              <CoursePopularityChart data={coursePopularityData} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
