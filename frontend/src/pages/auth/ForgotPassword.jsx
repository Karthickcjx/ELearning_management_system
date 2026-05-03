import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { authService } from "../../api/auth.service";
import { Mail, Lock, Key, KeyRound, GraduationCap, CheckCircle2 } from "lucide-react";

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
                    state: { message: "Password reset successfully! Please sign in with your new password." },
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

    const bullets = [
        "Secure one-time code",
        "Expires in 5 minutes",
        "No phone required",
    ];

    const inputClass =
        "w-full h-11 pl-10 pr-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition";

    return (
        <div className="udemy-page min-h-screen bg-slate-50">
            <Navbar />
            <div className="flex min-h-[calc(100vh-4rem)]">
                {/* Form side */}
                <div className="w-full lg:w-[55%] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="mb-6">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <h1 className="text-2xl font-semibold text-slate-900">Reset password</h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    {step === 1
                                        ? "We'll send a verification code to your email"
                                        : "Enter the code and choose a new password"}
                                </p>
                            </div>

                            {message && step === 2 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                                    <p className="text-green-800 text-sm font-medium">{message}</p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                                    <p className="text-red-700 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {step === 1 ? (
                                <form onSubmit={handleSendOtp} className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="Enter your registered email"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full h-12 rounded-lg font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                                            isLoading
                                                ? "bg-slate-400 cursor-not-allowed"
                                                : "bg-primary hover:bg-primary-dark"
                                        }`}
                                    >
                                        {isLoading ? "Sending OTP..." : "Send verification code"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    <div>
                                        <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Verification code (OTP)
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
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            New password
                                        </label>
                                        <div className="relative">
                                            <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                id="newPassword"
                                                name="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                placeholder="Enter your new password"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>

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
                                            {isLoading ? "Resetting..." : "Reset password"}
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

                            <div className="mt-6 text-center">
                                <Link to="/login" className="text-sm text-primary hover:text-primary-dark font-semibold">
                                    Back to sign in
                                </Link>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 text-center mt-6">
                            Having trouble? Contact{" "}
                            <Link to="/" className="text-primary hover:text-primary-dark">support</Link>
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
                            <h2 className="text-4xl font-bold leading-tight mb-3">Reset safely.</h2>
                            <p className="text-white/80 text-base mb-8 max-w-sm">
                                Recover access in a few seconds with a secure one-time code.
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

export default ForgotPassword;
