import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Personalize.css";

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
        <div className="personalize-page">
            {/* ── Stepper ── */}
            <div className="personalize-stepper">
                <div className="personalize-step active">
                    <span className="personalize-step-number">1</span>
                    Select Field
                </div>
                <div className="personalize-step-connector" />
                <div className="personalize-step inactive">
                    <span className="personalize-step-number">2</span>
                    Select Occupation
                </div>
            </div>

            {/* ── Title ── */}
            <div className="personalize-title">
                <h1>What field are you interested in?</h1>
            </div>
            <p className="personalize-subtitle">
                Choose a learning field to see relevant occupations tailored for you.
            </p>

            {/* ── Cards ── */}
            <div className="personalize-grid">
                {FIELDS.map((f) => (
                    <div
                        key={f.name}
                        className={`personalize-card${selected === f.name ? " selected" : ""}`}
                        onClick={() => setSelected(f.name)}
                    >
                        <span className="personalize-card-icon">{f.icon}</span>
                        <h3 className="personalize-card-title">{f.name}</h3>
                    </div>
                ))}
            </div>

            {/* ── Actions ── */}
            <div className="personalize-actions">
                <button
                    className="personalize-btn personalize-btn-primary"
                    disabled={!selected}
                    onClick={handleNext}
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
