import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Navbar from "../../components/common/Navbar";

function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="udemy-page min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="udemy-panel p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-5">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
          <p className="text-slate-600 mb-7">
            The page you requested does not exist or was moved to a different route.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
