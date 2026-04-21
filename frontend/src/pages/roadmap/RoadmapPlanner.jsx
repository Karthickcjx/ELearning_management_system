import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { Map, Loader2, Inbox } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import { roadmapService } from "../../api/roadmap.service";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function RoadmapPlanner() {
  const [domains, setDomains] = useState([]);
  const [myPlans, setMyPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStepKey, setUpdatingStepKey] = useState("");

  const [form, setForm] = useState({
    domain: "",
    level: "Beginner",
    targetRole: "",
    weeklyHours: "",
    targetDate: "",
  });

  const selectedPlan = useMemo(
    () => myPlans.find((plan) => plan.planId === selectedPlanId) || null,
    [myPlans, selectedPlanId]
  );

  const loadInitialData = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const [domainsRes, plansRes] = await Promise.all([
        roadmapService.getDomains(),
        roadmapService.getMyRoadmaps(),
      ]);

      if (domainsRes.success) {
        const availableDomains = domainsRes.data || [];
        setDomains(availableDomains);

        if (availableDomains.length > 0) {
          setForm((prev) => (prev.domain ? prev : { ...prev, domain: availableDomains[0] }));
        }
      } else {
        message.error(domainsRes.error || "Unable to load domains");
      }

      if (plansRes.success) {
        setMyPlans(plansRes.data || []);
        if (plansRes.data && plansRes.data.length > 0) {
          setSelectedPlanId(plansRes.data[0].planId);
        }
      } else {
        message.error(plansRes.error || "Unable to load saved roadmaps");
      }
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const buildPayload = () => {
    const weeklyHoursValue = form.weeklyHours ? Number(form.weeklyHours) : null;
    return {
      domain: form.domain,
      level: form.level,
      targetRole: form.targetRole.trim() || null,
      weeklyHours: Number.isNaN(weeklyHoursValue) ? null : weeklyHoursValue,
      targetDate: form.targetDate || null,
    };
  };

  const generatePreview = async () => {
    if (!form.domain) {
      message.warning("Please select a domain first");
      return;
    }

    setGenerating(true);
    const res = await roadmapService.previewRoadmap(buildPayload());
    setGenerating(false);

    if (!res.success) {
      message.error(res.error || "Failed to generate roadmap");
      return;
    }

    setPreview(res.data);
    message.success("Roadmap preview generated");
  };

  const saveRoadmap = async () => {
    if (!form.domain) {
      message.warning("Please select a domain first");
      return;
    }

    setSaving(true);
    const res = await roadmapService.saveRoadmap(buildPayload());
    setSaving(false);

    if (!res.success) {
      message.error(res.error || "Failed to save roadmap");
      return;
    }

    const saved = res.data;
    setPreview(saved);
    setMyPlans((prev) => [saved, ...prev.filter((plan) => plan.planId !== saved.planId)]);
    setSelectedPlanId(saved.planId);
    message.success("Roadmap saved to your account");
  };

  const toggleStep = async (plan, step) => {
    const stepKey = `${plan.planId}-${step.stepOrder}`;
    setUpdatingStepKey(stepKey);

    const res = await roadmapService.updateStepStatus(plan.planId, step.stepOrder, !step.completed);
    setUpdatingStepKey("");

    if (!res.success) {
      message.error(res.error || "Failed to update step");
      return;
    }

    const updatedPlan = res.data;
    setMyPlans((prev) => prev.map((item) => (item.planId === updatedPlan.planId ? updatedPlan : item)));
    if (preview && preview.planId === updatedPlan.planId) {
      setPreview(updatedPlan);
    }
  };

  const inputCls = "w-full h-10 px-3 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 bg-white";
  const labelCls = "text-sm font-medium text-slate-700 mb-1.5 block";

  const renderRoadmapDetails = (roadmap, editable) => {
    if (!roadmap) {
      return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-10">
          <Inbox size={36} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No roadmap selected yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-slate-900">
            {roadmap.domain} - {roadmap.level}
          </h3>
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            Progress: {roadmap.completionPercentage || 0}%
          </span>
        </div>

        <p className="text-sm text-slate-600">{roadmap.theory?.overview}</p>

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <p className="text-sm font-semibold text-slate-900 mb-2">Key Principles</p>
            <ul className="space-y-1 text-sm text-slate-600">
              {(roadmap.theory?.keyPrinciples || []).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <p className="text-sm font-semibold text-slate-900 mb-2">Career Outcomes</p>
            <ul className="space-y-1 text-sm text-slate-600">
              {(roadmap.theory?.careerOutcomes || []).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
            <p className="text-sm font-semibold text-primary mb-2">Tools and Technologies</p>
            <div className="flex flex-wrap gap-2">
              {(roadmap.learningPlan?.toolsAndTechnologies || []).map((tool) => (
                <span key={tool} className="text-xs bg-white border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {tool}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
            <p className="text-sm font-semibold text-emerald-700 mb-2">Practice Activities</p>
            <ul className="space-y-1 text-sm text-emerald-700">
              {(roadmap.learningPlan?.practiceActivities || []).map((activity, index) => (
                <li key={activity}>{index + 1}. {activity}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-900 mb-2">Roadmap Steps</p>
          <div className="space-y-2">
            {(roadmap.steps || []).map((step) => {
              const stepKey = `${roadmap.planId}-${step.stepOrder}`;
              const isUpdating = updatingStepKey === stepKey;
              return (
                <div key={`${step.stepOrder}-${step.title}`} className="rounded-md border border-slate-200 p-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-primary font-semibold">Step {step.stepOrder}</p>
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                    </div>
                    {editable && roadmap.planId && (
                      <button
                        onClick={() => toggleStep(roadmap, step)}
                        disabled={isUpdating}
                        className={`min-w-[100px] text-xs font-semibold px-3 py-2 rounded-md transition-colors ${
                          step.completed
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"
                        }`}
                      >
                        {isUpdating ? "Saving..." : step.completed ? "Completed" : "Mark Done"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar page="roadmaps" />

      <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
        <div className="flex items-center gap-2">
          <Map size={22} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Career Roadmap Planner</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Generate a personalized learning roadmap, save it, and track completion step by step.
        </p>

        <div className="mt-6 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Domain</label>
                <select
                  value={form.domain}
                  onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
                  className={inputCls}
                >
                  {!form.domain && <option value="">Select domain</option>}
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
                  className={inputCls}
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Weekly Hours</label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={form.weeklyHours}
                  onChange={(e) => setForm((prev) => ({ ...prev, weeklyHours: e.target.value }))}
                  placeholder="e.g. 8"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Target Date</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={labelCls}>Target Role (optional)</label>
              <input
                type="text"
                value={form.targetRole}
                onChange={(e) => setForm((prev) => ({ ...prev, targetRole: e.target.value }))}
                placeholder="e.g. Backend Developer, Cloud Engineer, Security Analyst"
                className={inputCls}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={generatePreview}
                disabled={loadingInitial || generating}
                className="bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? "Generating..." : "Generate Preview"}
              </button>
              <button
                onClick={saveRoadmap}
                disabled={loadingInitial || saving}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md px-4 py-2 disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving..." : "Save Roadmap"}
              </button>
            </div>
          </div>

          {loadingInitial ? (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
              <Loader2 size={32} className="text-primary animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading roadmaps...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-3">My Saved Roadmaps</h2>
                {myPlans.length === 0 ? (
                  <p className="text-sm text-slate-500">No saved roadmap yet. Create your first one.</p>
                ) : (
                  <div className="space-y-2">
                    {myPlans.map((plan) => (
                      <button
                        key={plan.planId}
                        onClick={() => setSelectedPlanId(plan.planId)}
                        className={`w-full text-left border rounded-md p-3 transition-colors ${
                          selectedPlanId === plan.planId
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {plan.domain} - {plan.level}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Progress: {plan.completionPercentage || 0}%
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-3">Preview</h2>
                  {renderRoadmapDetails(preview, false)}
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-3">Saved Plan Details</h2>
                  {renderRoadmapDetails(selectedPlan, true)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoadmapPlanner;
