import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Confetti from "react-dom-confetti";
import {
  Download,
  Share2,
  Award,
  Calendar,
  BadgeCheck,
  CheckCircle,
  GraduationCap,
  Star,
  ArrowLeft,
  Loader2,
  Linkedin,
  Twitter,
  Facebook,
} from "lucide-react";
import img from '../../assets/images/logo.jpg';
import seal from '../../assets/images/seal.png';
import { courseService } from "../../api/course.service";
import { profileService } from "../../api/profile.service";
import Navbar from "../../components/common/Navbar";

const Certificate = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { courseId } = useParams();
  const authToken = localStorage.getItem("token");
  const userId = localStorage.getItem("id");

  const [course, setCourse] = useState({
    course_name: "",
    instructor: "",
    description: "",
  });

  const certificateNumber = `CERT-${courseId}-${userId}-${Date.now().toString().slice(-6)}`;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, courseRes] = await Promise.all([
          profileService.getUserDetails(userId),
          courseService.getCourseById(courseId)
        ]);

        if (userRes.success) {
          setUserDetails(userRes.data);
        } else {
          throw new Error("Failed to fetch user details");
        }

        if (courseRes.success) {
          setCourse(courseRes.data);
        } else {
          throw new Error("Failed to fetch course details");
        }

        setTimeout(() => setShowConfetti(true), 500);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load certificate data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authToken, navigate, userId, courseId]);

  const handleDownloadPDF = async () => {
    setPdfDownloading(true);

    try {
      const certificateElement = document.getElementById("certificate");

      if (!certificateElement) {
        throw new Error("Certificate element not found");
      }

      const buttonsContainer = document.getElementById("certificate-buttons");
      if (buttonsContainer) {
        buttonsContainer.style.display = "none";
      }

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgAspectRatio = canvas.width / canvas.height;
      const pdfAspectRatio = pdfWidth / pdfHeight;

      let imgWidth, imgHeight;
      if (imgAspectRatio > pdfAspectRatio) {
        imgWidth = pdfWidth;
        imgHeight = pdfWidth / imgAspectRatio;
      } else {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * imgAspectRatio;
      }

      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`${userDetails?.username || 'Certificate'}_${course?.course_name || 'Course'}_Certificate.pdf`);

      if (buttonsContainer) {
        buttonsContainer.style.display = "flex";
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleShare = (platform) => {
    const shareText = `I just completed ${course?.course_name} and earned my certificate! #Achievement #Learning`;
    const shareUrl = window.location.href;

    const urls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="learnings" />
        <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
            <Loader2 size={36} className="text-primary animate-spin mb-3" />
            <h3 className="text-base font-semibold text-slate-900">Preparing Your Certificate</h3>
            <p className="text-sm text-slate-500 mt-1">Please wait while we generate your achievement certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="learnings" />
        <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
            <Award size={40} className="text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-900">Something went wrong</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar page="learnings" />
      {showConfetti && (
        <Confetti />
      )}

      <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full mb-4">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Congratulations
          </h1>
          <p className="mt-1 text-sm text-slate-500">You've earned your completion certificate.</p>
        </div>

        {/* Certificate */}
        <div className="max-w-4xl mx-auto">
          <div
            id="certificate"
            className="bg-white rounded-lg shadow-md overflow-hidden border-8 border-amber-300"
            style={{
              background: "linear-gradient(135deg, #fef9e7 0%, #fff 50%, #fef3e2 100%)",
              position: "relative"
            }}
          >
            <div className="absolute inset-4 border-4 border-amber-200 rounded-md opacity-40"></div>
            <div className="absolute inset-8 border-2 border-amber-100 rounded opacity-30"></div>

            <div className="relative p-10 md:p-16 text-center">
              <div className="mb-6">
                <img
                  src={img}
                  alt="Institution Logo"
                  className="w-44 h-12 mx-auto rounded-md bg-white p-1"
                />
              </div>

              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-amber-600 mb-3 tracking-tight">
                  Certificate of Achievement
                </h1>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px bg-amber-300 flex-1 max-w-[120px]"></div>
                  <Star size={20} className="text-amber-500 fill-amber-500" />
                  <div className="h-px bg-amber-300 flex-1 max-w-[120px]"></div>
                </div>
              </div>

              <div className="mb-10 space-y-4">
                <p className="text-base text-slate-700">
                  This is to proudly certify that
                </p>

                <h2 className="text-3xl md:text-4xl font-bold text-primary py-2">
                  {userDetails?.username || "Student"}
                </h2>

                <p className="text-base text-slate-700 max-w-2xl mx-auto">
                  has successfully completed the comprehensive course
                </p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-5 mx-auto max-w-2xl">
                  <h3 className="text-xl md:text-2xl font-bold text-emerald-700">
                    {course?.course_name?.length > 50
                      ? course?.course_name
                      : `${course?.course_name} - Complete Course`}
                  </h3>
                </div>

                <p className="text-sm text-slate-600 mt-6">
                  demonstrating dedication, skill, and mastery of the subject matter
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center mb-10 bg-slate-50 border border-slate-200 rounded-md p-6 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium">Date Issued</p>
                    <p className="text-sm font-semibold text-slate-900">{currentDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BadgeCheck size={20} className="text-accent" />
                  <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium">Certificate ID</p>
                    <p className="text-sm font-semibold text-slate-900">{certificateNumber}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-center">
                <div className="text-center">
                  <img
                    src={seal}
                    alt="Official Seal"
                    className="w-28 h-20 mx-auto mb-3 opacity-80"
                  />
                  <div className="border-t-2 border-slate-400 pt-2 w-48">
                    <p className="text-sm font-semibold text-slate-800">Authorized Signature</p>
                    <p className="text-xs text-slate-600">Learning Platform</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs border border-emerald-200 font-medium">
                  <CheckCircle size={14} />
                  <span>This certificate can be verified online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div id="certificate-buttons" className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfDownloading}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {pdfDownloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download Certificate
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleShare('linkedin')}
                className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
              >
                <Linkedin size={16} className="text-[#0A66C2]" />
                LinkedIn
              </button>

              <button
                onClick={() => handleShare('twitter')}
                className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
              >
                <Twitter size={16} className="text-sky-500" />
                Twitter
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
              >
                <Facebook size={16} className="text-blue-700" />
                Facebook
              </button>
            </div>
          </div>

          {/* Certificate Info */}
          <div className="mt-8 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4 text-center">About Your Achievement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-5 bg-slate-50 border border-slate-200 rounded-md">
                <GraduationCap size={28} className="text-primary mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-900 mb-1">Course Completed</h4>
                <p className="text-xs text-slate-500">You have successfully finished all course requirements.</p>
              </div>

              <div className="text-center p-5 bg-slate-50 border border-slate-200 rounded-md">
                <Award size={28} className="text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-900 mb-1">Verified Certificate</h4>
                <p className="text-xs text-slate-500">This certificate is digitally verified and authentic.</p>
              </div>

              <div className="text-center p-5 bg-slate-50 border border-slate-200 rounded-md">
                <Share2 size={28} className="text-accent mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-900 mb-1">Share Your Success</h4>
                <p className="text-xs text-slate-500">Show your achievement on social media platforms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
