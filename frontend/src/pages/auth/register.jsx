import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { authService } from "../../api/auth.service";
import { useUserContext } from "../../contexts/UserContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  MapPin,
  Briefcase,
  Github,
  Linkedin,
  UserPlus,
  Key,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const INPUT_CLASS =
  "w-full h-11 pl-10 pr-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

function Field({ id, name, type = "text", value, onChange, icon: Icon, label, required, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <Icon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}

function RegistrationForm() {
  const navigate = useNavigate();
  const { setUser } = useUserContext();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobileNumber: "",
    password: "",
    dob: "",
    gender: "",
    location: "",
    profession: "",
    linkedin_url: "",
    github_url: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authService.sendOtp(formData.email);
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP send error:", error);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const dataToSubmit = { ...formData, otp };
      const result = await authService.register(dataToSubmit);

      if (result.success) {
        if (result.user) {
          setUser(result.user);
        }

        if (result.autoLoggedIn) {
          navigate("/profile", { replace: true });
        } else {
          navigate("/login", {
            replace: true,
            state: {
              message: result.warning || "Registration successful! Please sign in to continue.",
            },
          });
        }
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const bullets = [
    "Curated learning paths",
    "AI-powered recommendations",
    "Certified on completion",
  ];

  return (
    <div className="udemy-page min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Form side */}
        <div className="w-full lg:w-[55%] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
                <p className="text-sm text-slate-500 mt-1">Join EduVerse in under a minute</p>
              </div>

              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      icon={User}
                      label="Full name"
                      required
                      placeholder="Jane Doe"
                    />
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      icon={Mail}
                      label="Email"
                      required
                      placeholder="you@example.com"
                    />
                    <Field
                      id="mobileNumber"
                      name="mobileNumber"
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      icon={Phone}
                      label="Phone number"
                      required
                      placeholder="+1 555 000 0000"
                    />
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      icon={Lock}
                      label="Password"
                      required
                      placeholder="Create a strong password"
                    />
                    <Field
                      id="dob"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      icon={Calendar}
                      label="Date of birth"
                    />
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Gender
                      </label>
                      <div className="relative">
                        <User className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full h-11 pl-10 pr-8 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition appearance-none"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <Field
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      icon={MapPin}
                      label="Location"
                      placeholder="City, Country"
                    />
                    <Field
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      icon={Briefcase}
                      label="Profession"
                      placeholder="Software Engineer"
                    />
                    <Field
                      id="linkedin_url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      icon={Linkedin}
                      label="LinkedIn"
                      placeholder="https://linkedin.com/in/..."
                    />
                    <Field
                      id="github_url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      icon={Github}
                      label="GitHub"
                      placeholder="https://github.com/..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-12 rounded-lg font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                      isLoading
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-primary hover:bg-primary-dark"
                    }`}
                  >
                    {isLoading ? "Sending OTP..." : "Get verification code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5 max-w-md mx-auto">
                  <div className="text-center mb-2">
                    <h3 className="text-xl font-semibold text-slate-900">Verify your email</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      We sent a 6-digit code to{" "}
                      <span className="font-semibold text-slate-700">{formData.email}</span>
                    </p>
                  </div>

                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Verification code
                    </label>
                    <div className="relative">
                      <Key className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        placeholder="Enter 6-digit OTP"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-12 rounded-lg font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                        isLoading
                          ? "bg-slate-400 cursor-not-allowed"
                          : "bg-primary hover:bg-primary-dark"
                      }`}
                    >
                      {isLoading ? "Verifying..." : "Verify & create account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full h-11 rounded-lg font-medium text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition"
                    >
                      Go back
                    </button>
                  </div>
                </form>
              )}

              <p className="text-sm text-slate-600 text-center mt-6">
                Already have account?{" "}
                <Link to="/login" className="text-primary hover:text-primary-dark font-semibold">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="text-xs text-slate-500 text-center mt-6">
              By creating an account, you agree to our{" "}
              <Link to="/" className="text-primary hover:text-primary-dark">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/" className="text-primary hover:text-primary-dark">Privacy Policy</Link>
            </p>
          </div>
        </div>

        {/* Brand panel */}
        <div className="hidden lg:block lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-secondary">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.25) 0, transparent 45%)",
            }}
          />
          <div className="relative h-full flex flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7" />
              <span className="text-xl font-semibold tracking-tight">EduVerse</span>
            </div>

            <div>
              <h2 className="text-4xl font-bold leading-tight mb-3">Start your journey.</h2>
              <p className="text-white/80 text-base mb-8 max-w-sm">
                Learn faster with personalized paths built around your goals.
              </p>
              <ul className="space-y-3">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-white/90">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-white" />
                    <span className="text-sm">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-white/60">© {new Date().getFullYear()} EduVerse Learning</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;
