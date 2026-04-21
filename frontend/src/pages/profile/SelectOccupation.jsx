import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import { personalizeService } from "../../api/personalize.service";

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
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-container-lg mx-auto">
                {/* Stepper */}
                <ol className="flex items-center justify-center gap-4 text-sm mb-8" aria-label="Steps">
                    <li className="flex items-center gap-2 text-primary font-medium">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">✓</span>
                        Select Field
                    </li>
                    <li aria-hidden className="h-px w-10 bg-primary" />
                    <li className="flex items-center gap-2 text-primary font-medium">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">2</span>
                        Select Occupation
                    </li>
                </ol>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Choose your occupation</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Showing occupations for <strong className="text-slate-800">{field}</strong>
                    </p>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                            <span className="text-sm">Loading occupations…</span>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {occupations.map((occ) => {
                                const isSelected = selected === occ;
                                return (
                                    <button
                                        key={occ}
                                        type="button"
                                        onClick={() => setSelected(occ)}
                                        className={`rounded-lg border px-3 py-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                            isSelected
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                                        }`}
                                        aria-pressed={isSelected}
                                    >
                                        <div className="text-sm font-medium">{occ}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8 flex justify-between">
                        <button
                            type="button"
                            className="lms-btn lms-btn-secondary"
                            onClick={() => navigate("/profile/personalize/field")}
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            className="lms-btn lms-btn-primary"
                            disabled={!selected || saving}
                            onClick={handleSave}
                        >
                            {saving ? "Saving…" : "Save Preferences"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
