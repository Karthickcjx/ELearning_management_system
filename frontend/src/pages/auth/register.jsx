import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { authService } from "../../api/auth.service";
import { User, Mail, Phone, Lock, Calendar, MapPin, Briefcase, Github, Linkedin, UserPlus, Key } from "lucide-react";
import { InputField } from "../../components/common/InputFeild";

function RegistrationForm() {
  const navigate = useNavigate();
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
        navigate("/login", {
          state: { message: "Registration successful! Please sign in to continue." }
        });
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

  return (
    <div className="udemy-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-4">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600">Join our community and start your journey</p>
          </div>

          <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InputField id="username" name="username" value={formData.username} onChange={handleChange} icon={<User className="h-5 w-5 text-gray-400" />} label="Full Name" required placeholder="Enter your full name" />
                    <InputField id="email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail className="h-5 w-5 text-gray-400" />} label="Email Address" required placeholder="Enter your email" />
                    <InputField id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} icon={<Phone className="h-5 w-5 text-gray-400" />} label="Phone Number" required placeholder="Enter your phone number" />
                    <InputField id="password" name="password" type="password" value={formData.password} onChange={handleChange} icon={<Lock className="h-5 w-5 text-gray-400" />} label="Password" required placeholder="Create a strong password" />
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InputField id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} icon={<Calendar className="h-5 w-5 text-gray-400" />} label="Date of Birth" />
                    <div className="space-y-2">
                      <label htmlFor="gender" className="block font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Gender</label>
                      <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InputField id="location" name="location" value={formData.location} onChange={handleChange} icon={<MapPin className="h-5 w-5 text-gray-400" />} label="Location" placeholder="Enter your location" />
                    <InputField id="profession" name="profession" value={formData.profession} onChange={handleChange} icon={<Briefcase className="h-5 w-5 text-gray-400" />} label="Profession" placeholder="Enter your profession" />
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Social Links
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InputField id="linkedin_url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} icon={<Linkedin className="h-5 w-5 text-gray-400" />} label="LinkedIn" placeholder="https://linkedin.com/in/your-profile" />
                    <InputField id="github_url" name="github_url" value={formData.github_url} onChange={handleChange} icon={<Github className="h-5 w-5 text-gray-400" />} label="GitHub" placeholder="https://github.com/your-username" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={isLoading} className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-300 ${isLoading ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"}`}>
                  {isLoading ? "Sending OTP..." : "Get Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Verify Your Email</h3>
                  <p className="text-gray-600 mt-2">We sent a 6-digit code to <span className="font-semibold">{formData.email}</span></p>
                </div>

                <InputField id="otp" name="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} icon={<Key className="h-5 w-5 text-gray-500" />} label="Verification Code" required placeholder="Enter 6-digit OTP" />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="flex flex-col space-y-4">
                  <button type="submit" disabled={isLoading} className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isLoading ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"}`}>
                    {isLoading ? "Verifying..." : "Verify & Create Account"}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="w-full py-3 px-6 rounded-lg font-semibold text-lg text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all duration-200">
                    Go Back
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors text-lg">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              By creating an account, you agree to our <Link to="/" className="text-blue-600 hover:text-blue-700 transition-colors">Terms of Service</Link> and <Link to="/" className="text-blue-600 hover:text-blue-700 transition-colors">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;
