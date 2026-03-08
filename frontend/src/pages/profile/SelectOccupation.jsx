import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import { personalizeService } from "../../api/personalize.service";
import "./Personalize.css";

export default function SelectOccupation() {
    const navigate = useNavigate();
    const location = useLocation();
    const field = location.state?.field;

    const [occupations, setOccupations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!field) {
            navigate("/profile/personalize/field", { replace: true });
            return;
        }

        const fetchOccupations = async () => {
            setLoading(true);
            const res = await personalizeService.getOccupations(field);
            if (res.success) {
                setOccupations(res.data.occupations || []);
            } else {
                message.error("Failed to load occupations");
            }
            setLoading(false);
        };

        fetchOccupations();
    }, [field, navigate]);

    const handleSave = async () => {
        if (!selected) return;

        const userId = localStorage.getItem("id");
        if (!userId) {
            message.error("User not logged in");
            return;
        }

        setSaving(true);
        const res = await personalizeService.saveInterests({
            userId,
            learningField: field,
            occupation: selected,
        });

        if (res.success) {
            message.success("Preferences saved successfully!");
            navigate("/profile");
        } else {
            message.error("Failed to save preferences");
        }
        setSaving(false);
    };

    return (
        <div className="personalize-page">
            {/* ── Stepper ── */}
            <div className="personalize-stepper">
                <div className="personalize-step completed">
                    <span className="personalize-step-number">✓</span>
                    Select Field
                </div>
                <div className="personalize-step-connector completed" />
                <div className="personalize-step active">
                    <span className="personalize-step-number">2</span>
                    Select Occupation
                </div>
            </div>

            {/* ── Title ── */}
            <div className="personalize-title">
                <h1>Choose your occupation</h1>
            </div>
            <p className="personalize-subtitle">
                Showing occupations for <strong>{field}</strong>
            </p>

            {/* ── Cards ── */}
            {loading ? (
                <div className="personalize-loading">
                    <div className="personalize-spinner" />
                    <span>Loading occupations…</span>
                </div>
            ) : (
                <div className="personalize-grid">
                    {occupations.map((occ) => (
                        <div
                            key={occ}
                            className={`personalize-card${selected === occ ? " selected" : ""}`}
                            onClick={() => setSelected(occ)}
                        >
                            <h3 className="personalize-card-title">{occ}</h3>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Actions ── */}
            <div className="personalize-actions">
                <button
                    className="personalize-btn personalize-btn-secondary"
                    onClick={() => navigate("/profile/personalize/field")}
                >
                    ← Back
                </button>
                <button
                    className="personalize-btn personalize-btn-primary"
                    disabled={!selected || saving}
                    onClick={handleSave}
                >
                    {saving ? "Saving…" : "Save Preferences"}
                </button>
            </div>
        </div>
    );
}
