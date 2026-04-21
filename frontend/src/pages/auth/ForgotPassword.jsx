import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { authService } from "../../api/auth.service";
import { Mail, Lock, Key, ShieldCheck } from "lucide-react";
import { InputField } from "../../components/common/InputFeild";

function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const result = await authService.sendOtp(email);
            if (result.success) {
                setMessage(result.message);
                setStep(2);
            } else {
                setError(result.error || "Failed to send OTP.");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await authService.resetPassword(email, otp, newPassword);
            if (result.success) {
                navigate("/login", {
                    state: { message: "Password reset successfully! Please sign in with your new password." }
                });
            } else {
                setError(result.error || "Failed to reset password. Please try again.");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="udemy-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navbar />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-4">
                    <div className="text-center">
                        <div className="mx-auto h-14 w-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Reset Password</h2>
                        <p className="text-gray-600">Enter your details below to secure your account</p>
                    </div>

                    <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
                        {message && step === 2 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                                <p className="text-green-800 text-sm font-medium">{message}</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                                <p className="text-red-800 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <InputField
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                                    label="Email Address"
                                    required
                                    placeholder="Enter your registered email"
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isLoading ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"}`}
                                >
                                    {isLoading ? "Sending OTP..." : "Send Verification Code"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <InputField
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    icon={<Key className="h-5 w-5 text-gray-400" />}
                                    label="Verification Code (OTP)"
                                    required
                                    placeholder="Enter 6-digit OTP"
                                />

                                <InputField
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                                    label="New Password"
                                    required
                                    placeholder="Enter your new password"
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isLoading ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"}`}
                                >
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full py-3 px-6 rounded-lg font-semibold text-lg text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all duration-200 mt-2"
                                >
                                    Go Back
                                </button>
                            </form>
                        )}

                        <div className="mt-8 text-center border-t border-gray-200 pt-6">
                            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
