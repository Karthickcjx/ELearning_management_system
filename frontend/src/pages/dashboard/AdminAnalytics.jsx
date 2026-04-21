import React, { useState, useEffect } from "react";
import { Users, BookOpen, FileCheck, TrendingUp, Activity, Award } from "lucide-react";
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
        { label: "Total Users", value: userCount, icon: Users, gradient: "linear-gradient(135deg,#2563eb,#3b82f6)" },
        { label: "Total Courses", value: courseCount, icon: BookOpen, gradient: "linear-gradient(135deg,#d97706,#f59e0b)" },
        { label: "Enrollments", value: enrollmentCount, icon: FileCheck, gradient: "linear-gradient(135deg,#059669,#10b981)" },
        { label: "Completion Rate", value: "78%", icon: Award, gradient: "linear-gradient(135deg,#7c3aed,#8b5cf6)" },
        { label: "Active Today", value: "—", icon: Activity, gradient: "linear-gradient(135deg,#0891b2,#06b6d4)" },
        { label: "Growth", value: "+12%", icon: TrendingUp, gradient: "linear-gradient(135deg,#059669,#34d399)" },
    ];

    return (
        <>
            <div className="admin-page-header">
                <h1>Analytics</h1>
                <p>Platform activity statistics, engagement, and trends.</p>
            </div>

            <div className="admin-stat-grid">
                {stats.map((s) => (
                    <div key={s.label} className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: s.gradient }}>
                            <s.icon size={18} color="#fff" />
                        </div>
                        <div>
                            <p className="admin-stat-value">{s.value}</p>
                            <p className="admin-stat-label">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <UserGrowthChart data={userGrowthData} />
                <CoursePopularityChart data={coursePopData} />
            </div>
        </>
    );
}

export default AdminAnalytics;
