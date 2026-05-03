import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Navbar from "../../components/common/Navbar";

function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 mb-5">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2">Page not found</h1>
          <p className="text-sm text-slate-500 mb-7 max-w-md">
            The page you requested does not exist or was moved to a different route.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
