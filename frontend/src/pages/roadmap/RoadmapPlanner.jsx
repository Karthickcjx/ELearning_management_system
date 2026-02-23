import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import Navbar from "../../Components/common/Navbar";
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

  const renderRoadmapDetails = (roadmap, editable) => {
    if (!roadmap) {
      return (
        <div className="rounded-xl bg-white border border-gray-200 p-6 text-gray-500">
          No roadmap selected yet.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900">
              {roadmap.domain} - {roadmap.level}
            </h3>
            <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              Progress: {roadmap.completionPercentage || 0}%
            </span>
          </div>

          <p className="text-gray-700 text-sm">{roadmap.theory?.overview}</p>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-sm text-gray-800 mb-2">Key Principles</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {(roadmap.theory?.keyPrinciples || []).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-sm text-gray-800 mb-2">Career Outcomes</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {(roadmap.theory?.careerOutcomes || []).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="font-semibold text-sm text-indigo-800 mb-2">Tools and Technologies</p>
              <div className="flex flex-wrap gap-2">
                {(roadmap.learningPlan?.toolsAndTechnologies || []).map((tool) => (
                  <span key={tool} className="text-xs bg-white border border-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="font-semibold text-sm text-emerald-800 mb-2">Practice Activities</p>
              <ul className="space-y-1 text-sm text-emerald-700">
                {(roadmap.learningPlan?.practiceActivities || []).map((activity, index) => (
                  <li key={activity}>{index + 1}. {activity}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-semibold text-sm text-gray-800 mb-2">Roadmap Steps</p>
            <div className="space-y-3">
              {(roadmap.steps || []).map((step) => {
                const stepKey = `${roadmap.planId}-${step.stepOrder}`;
                const isUpdating = updatingStepKey === stepKey;
                return (
                  <div key={`${step.stepOrder}-${step.title}`} className="rounded-lg border border-gray-200 p-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Step {step.stepOrder}</p>
                        <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      </div>
                      {editable && roadmap.planId && (
                        <button
                          onClick={() => toggleStep(roadmap, step)}
                          disabled={isUpdating}
                          className={`min-w-[95px] text-xs font-semibold px-3 py-2 rounded-lg ${
                            step.completed
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <Navbar page="roadmaps" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Career Roadmap Planner</h1>
          <p className="text-gray-600 text-sm mb-5">
            Generate a personalized learning roadmap, save it, and track completion step by step.
          </p>

          <div className="grid md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1 font-medium">Domain</label>
              <select
                value={form.domain}
                onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
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
              <label className="block text-sm text-gray-700 mb-1 font-medium">Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Weekly Hours</label>
              <input
                type="number"
                min={1}
                max={80}
                value={form.weeklyHours}
                onChange={(e) => setForm((prev) => ({ ...prev, weeklyHours: e.target.value }))}
                placeholder="e.g. 8"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1 font-medium">Target Date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm text-gray-700 mb-1 font-medium">Target Role (optional)</label>
            <input
              type="text"
              value={form.targetRole}
              onChange={(e) => setForm((prev) => ({ ...prev, targetRole: e.target.value }))}
              placeholder="e.g. Backend Developer, Cloud Engineer, Security Analyst"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={generatePreview}
              disabled={loadingInitial || generating}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate Preview"}
            </button>
            <button
              onClick={saveRoadmap}
              disabled={loadingInitial || saving}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Roadmap"}
            </button>
          </div>
        </div>

        {loadingInitial ? (
          <div className="flex justify-center items-center h-56">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.1fr_1.9fr] gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">My Saved Roadmaps</h2>
              {myPlans.length === 0 ? (
                <p className="text-sm text-gray-500">No saved roadmap yet. Create your first one.</p>
              ) : (
                <div className="space-y-2">
                  {myPlans.map((plan) => (
                    <button
                      key={plan.planId}
                      onClick={() => setSelectedPlanId(plan.planId)}
                      className={`w-full text-left border rounded-lg p-3 transition ${
                        selectedPlanId === plan.planId
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {plan.domain} - {plan.level}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Progress: {plan.completionPercentage || 0}%
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Preview</h2>
                {renderRoadmapDetails(preview, false)}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Saved Plan Details</h2>
                {renderRoadmapDetails(selectedPlan, true)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoadmapPlanner;
