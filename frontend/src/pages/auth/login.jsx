import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../../contexts/UserContext";
import Navbar from "../../components/common/Navbar";
import { authService } from "../../api/auth.service";
import { Mail, Lock, LogIn, GraduationCap, CheckCircle2 } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useUserContext();

  const login = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        if (result.user) {
          setUser(result.user);
        }
        navigate("/courses");
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const bullets = [
    "Resume learning anytime",
    "Track every milestone",
    "Join collaborative rooms",
  ];

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
                  <LogIn className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
                <p className="text-sm text-slate-500 mt-1">Access your learning dashboard</p>
              </div>

              <form autoComplete="off" onSubmit={login} className="space-y-5">
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
                      placeholder="you@example.com"
                      className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:text-primary-dark font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
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
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              <p className="text-sm text-slate-600 text-center mt-6">
                New here?{" "}
                <Link to="/register" className="text-primary hover:text-primary-dark font-semibold">
                  Create account
                </Link>
              </p>
            </div>

            <p className="text-xs text-slate-500 text-center mt-6">
              By signing in, you agree to our{" "}
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
              <h2 className="text-4xl font-bold leading-tight mb-3">Welcome back.</h2>
              <p className="text-white/80 text-base mb-8 max-w-sm">
                Pick up where you left off and keep building momentum.
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

export default Login;
