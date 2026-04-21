import React, { useState, useEffect } from "react";
import { Users, BookOpen, FileCheck, TrendingUp, Activity, Award, BarChart3 } from "lucide-react";
import { adminService } from "../../api/admin.service";
import UserGrowthChart from "../../components/UserGrowthChart";
import CoursePopularityChart from "../../components/CoursePopularityChart";

function AdminAnalytics() {
    const [userCount, setUserCount] = useState(0);
    const [courseCount, setCourseCount] = useState(0);
    const [enrollmentCount, setEnrollmentCount] = useState(0);
    const [userGrowthData, setUserGrowthData] = useState([]);
    const [coursePopData, setCoursePopData] = useState([]);

    useEffect(() => {
        async function load() {
            const usersRes = await adminService.getAllUsers();
            if (usersRes.success) {
                setUserCount(usersRes.data.length);
                processUserGrowth(usersRes.data);
            }
            const coursesRes = await adminService.getAllCourses();
            if (coursesRes.success) setCourseCount(coursesRes.data.length);
            const learnRes = await adminService.getAllLearning();
            if (learnRes.success) {
                setEnrollmentCount(learnRes.data.length);
                processCoursePop(learnRes.data);
            }
        }
        load();
    }, []);

    const processUserGrowth = (users) => {
        const grouped = {};
        users.forEach((u) => {
            let d = "";
            if (Array.isArray(u.createdAt)) {
                const [y, m, day] = u.createdAt;
                d = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            } else if (u.createdAt) {
                d = u.createdAt.substring(0, 10);
            }
            if (d) grouped[d] = (grouped[d] || 0) + 1;
        });
        let cum = 0;
        setUserGrowthData(
            Object.keys(grouped)
                .sort()
                .map((date) => {
                    cum += grouped[date];
                    return { date, users: cum };
                })
        );
    };

    const processCoursePop = (enrollments) => {
        const counts = {};
        enrollments.forEach((e) => {
            const n = e.courseName || "Unknown";
            counts[n] = (counts[n] || 0) + 1;
        });
        setCoursePopData(
            Object.keys(counts)
                .map((name) => ({ name, students: counts[name] }))
                .sort((a, b) => b.students - a.students)
        );
    };

    const stats = [
        { label: "Total Users", value: userCount, icon: Users, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
        { label: "Total Courses", value: courseCount, icon: BookOpen, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
        { label: "Enrollments", value: enrollmentCount, icon: FileCheck, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
        { label: "Completion Rate", value: "78%", icon: Award, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
        { label: "Active Today", value: 0, icon: Activity, iconBg: "bg-sky-100", iconColor: "text-sky-600" },
        { label: "Growth", value: "+12%", icon: TrendingUp, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
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
            <div className="admin-page-header">
                <h1>Analytics</h1>
                <p>Platform activity statistics, engagement, and trends.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div
                            key={s.label}
                            className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm"
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.iconBg} ${s.iconColor}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 m-0 leading-none">{s.value ?? 0}</p>
                                <p className="text-sm text-slate-500 mt-1 m-0">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

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
                    {coursePopData.length === 0 ? (
                        <ChartEmpty title="Course popularity" />
                    ) : (
                        <div className="flex-1">
                            <CoursePopularityChart data={coursePopData} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AdminAnalytics;
