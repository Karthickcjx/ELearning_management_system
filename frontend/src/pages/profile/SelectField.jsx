import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FIELDS = [
    { name: "Software Development", icon: "💻" },
    { name: "Data & Analytics", icon: "📊" },
    { name: "Information Technology", icon: "🖥️" },
    { name: "Marketing", icon: "📢" },
    { name: "Design", icon: "🎨" },
    { name: "Finance & Accounting", icon: "💰" },
    { name: "Human Resources", icon: "🤝" },
    { name: "Education & Training", icon: "📚" },
    { name: "Customer Support", icon: "🎧" },
    { name: "Health & Wellness", icon: "🏥" },
];

export default function SelectField() {
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();

    const handleNext = () => {
        if (selected) {
            navigate("/profile/personalize/occupation", { state: { field: selected } });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-container-lg mx-auto">
                {/* Stepper */}
                <ol className="flex items-center justify-center gap-4 text-sm mb-8" aria-label="Steps">
                    <li className="flex items-center gap-2 text-primary font-medium">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">1</span>
                        Select Field
                    </li>
                    <li aria-hidden className="h-px w-10 bg-slate-300" />
                    <li className="flex items-center gap-2 text-slate-400">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs">2</span>
                        Select Occupation
                    </li>
                </ol>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">What field are you interested in?</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Choose a learning field to see relevant occupations tailored for you.
                    </p>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {FIELDS.map((f) => {
                            const isSelected = selected === f.name;
                            return (
                                <button
                                    key={f.name}
                                    type="button"
                                    onClick={() => setSelected(f.name)}
                                    className={`rounded-lg border px-3 py-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                        isSelected
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                                    }`}
                                    aria-pressed={isSelected}
                                >
                                    <div className="text-2xl" aria-hidden>{f.icon}</div>
                                    <div className="mt-2 text-sm font-medium">{f.name}</div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            className="lms-btn lms-btn-primary"
                            disabled={!selected}
                            onClick={handleNext}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
