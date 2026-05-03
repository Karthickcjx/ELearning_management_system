import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Download,
  Trophy,
  CheckCircle2,
  Clock,
  GraduationCap,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { performanceService } from "../../api/performance.service";
import Navbar from "../../components/common/Navbar";

const Performance = ({ embedded = false }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCert, setDownloadingCert] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      const userId = localStorage.getItem("id");
      const result = await performanceService.getPerformanceData(userId);

      if (result.success) {
        setPerformanceData(result.data);
      } else {
        console.error("Failed to fetch performance data:", result.error);
      }
      setLoading(false);
    };

    fetchPerformanceData();
  }, []);

  const handleCertificateDownload = async (courseId) => {
    setDownloadingCert(courseId);
    navigate(`/certificate/${courseId}`);
    setDownloadingCert(null);
  };

  const getScoreChipClass = (marks) => {
    if (marks >= 80) return "bg-emerald-50 text-emerald-700";
    if (marks >= 60) return "bg-amber-50 text-amber-700";
    if (marks >= 40) return "bg-orange-50 text-orange-700";
    return "bg-rose-50 text-rose-700";
  };

  const calculateStats = () => {
    const completed = performanceData.filter((data) => data.marks > 0).length;
    const totalCourses = performanceData.length;
    const avgScore =
      performanceData.length > 0
        ? performanceData.reduce((sum, data) => sum + data.marks, 0) / performanceData.length
        : 0;

    return { completed, totalCourses, avgScore: Math.round(avgScore) };
  };

  const stats = calculateStats();

  const Wrapper = ({ children }) => (
    <div className={embedded ? "" : "min-h-screen bg-slate-50"}>
      {!embedded && <Navbar page="profile" />}
      <div className={embedded ? "" : "max-w-container-lg mx-auto px-6 py-6 lg:py-8"}>{children}</div>
    </div>
  );

  if (loading) {
    return (
      <Wrapper>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your performance…</p>
        </div>
      </Wrapper>
    );
  }

  const isEmpty = performanceData.length === 0;

  return (
    <Wrapper>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Completed Courses"
          value={stats.completed}
          suffix={`of ${stats.totalCourses}`}
          icon={CheckCircle2}
          accent="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          label="Average Score"
          value={`${stats.avgScore}%`}
          suffix="across all courses"
          icon={TrendingUp}
          accent="text-primary"
          bg="bg-primary/5"
        />
        <StatCard
          label="Certificates Earned"
          value={stats.completed}
          suffix="ready for download"
          icon={Award}
          accent="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      {/* Table or Empty */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Trophy size={18} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Course Performance</h2>
        </div>

        {isEmpty ? (
          <div className="py-16 px-6 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <BarChart3 size={22} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No performance data yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Start taking assessments to see your performance metrics here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/courses")}
              className="lms-btn lms-btn-primary mt-5 inline-flex items-center gap-2"
            >
              <GraduationCap size={16} />
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Certificate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {performanceData.map((data, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {data.course.course_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {data.course.course_name}
                          </div>
                          <div className="text-xs text-slate-500">ID: {data.course.course_id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-center">
                      {data.marks > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <Clock size={12} /> In Progress
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-center">
                      {data.marks > 0 ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getScoreChipClass(data.marks)}`}>
                          {data.marks}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-center">
                      {data.marks > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleCertificateDownload(data.course.course_id)}
                          disabled={downloadingCert === data.course.course_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingCert === data.course.course_id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                              Processing…
                            </>
                          ) : (
                            <>
                              <Download size={12} /> Download
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Complete course first</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

function StatCard({ label, value, suffix, icon: Icon, accent = "text-primary", bg = "bg-primary/5" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
          <p className="text-xs text-slate-500">{suffix}</p>
        </div>
        <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default Performance;
