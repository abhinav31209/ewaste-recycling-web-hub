import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import DashboardInput from "../../components/DashboardInput.jsx";
import DashboardSelect from "../../components/DashboardSelect.jsx";
import {
  fetchHiddenStaffDevices,
  publishStaffDevice,
  reclassifyStaffDevice,
  updateStaffDevice,
} from "../../services/api.js";
import {
  DEVICE_TYPE_OPTIONS,
  getClassificationStyle,
  getDeviceTypeStyle,
  getWorkflowStatusStyle,
} from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

const CLASSIFICATIONS = ["UNKNOWN", "CURRENT", "RECYCLE", "RARE"];
const classificationOptions = CLASSIFICATIONS.map((classification) => ({
  value: classification,
  label: classification,
}));
const deviceTypeOptions = DEVICE_TYPE_OPTIONS.map((type) => ({
  value: type,
  label: getDeviceTypeStyle(type).label,
}));

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#0f172a",
};

function getDraftWorkflowLabel(status) {
  const normalized = String(status || "HIDDEN").toUpperCase();
  const labels = {
    HIDDEN: "Hidden",
    PUBLISHED: "Published",
    UNKNOWN: "Unknown",
    PENDING_REVIEW: "Pending review",
    UNDER_REVIEW: "Pending review",
    DATA_WIPE_PENDING: "Data wipe pending",
    DATA_WIPE_COMPLETED: "Data wipe complete",
    RETRIEVAL_AVAILABLE: "Retrieval available",
    RETRIEVAL_REQUESTED: "Payment pending",
    RETRIEVAL_PAID: "Ready for fulfillment",
    RETRIEVAL_FULFILLED: "Retrieval fulfilled",
  };
  return labels[normalized] || normalized.replaceAll("_", " ");
}

function getHiddenMetrics(devices) {
  let currentRare = 0;
  let recycle = 0;

  devices.forEach((device) => {
    const classification = String(device.classification || "UNKNOWN").toUpperCase();
    if (classification === "CURRENT" || classification === "RARE") currentRare += 1;
    if (classification === "RECYCLE") recycle += 1;
  });

  return {
    total: devices.length,
    hidden: devices.length,
    currentRare,
    recycle,
  };
}

export default function StaffDraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshDrafts = useCallback(async (preferredId = selectedDraftId) => {
    try {
      setLoading(true);
      const data = await fetchHiddenStaffDevices();
      const hiddenDevices = Array.isArray(data) ? data : [];
      const sortedHiddenDevices = sortNewestFirst(hiddenDevices, [
        "updatedAt",
        "createdAt",
        "submittedAt",
      ]);
      setDrafts(hiddenDevices);
      setSelectedDraftId((current) => {
        const nextId = preferredId || current;
        if (nextId && sortedHiddenDevices.some((draft) => draft.id === nextId)) {
          return nextId;
        }
        return null;
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDraftId]);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        await refreshDrafts(null);
      } catch (err) {
        setError(err.message || "Failed to load hidden drafts.");
      }
    };

    load();
  }, [refreshDrafts]);

  const sortedDrafts = useMemo(
      () => sortNewestFirst(drafts, ["updatedAt", "createdAt", "submittedAt"]),
      [drafts]
  );

  const selectedDraft = useMemo(
      () => drafts.find((draft) => draft.id === selectedDraftId) || null,
      [drafts, selectedDraftId]
  );

  const metrics = useMemo(() => getHiddenMetrics(drafts), [drafts]);

  const selectedDraftDeviceTypeOption =
      deviceTypeOptions.find((option) => option.value === (selectedDraft?.deviceType || "OTHER")) ??
      deviceTypeOptions[0];

  const selectedDraftClassificationOption =
      classificationOptions.find(
          (option) => option.value === (selectedDraft?.classification || "UNKNOWN")
      ) ?? classificationOptions[0];

  const patchDraft = (field, value) => {
    if (!selectedDraft) return;
    setDrafts((prev) =>
        prev.map((draft) => (draft.id === selectedDraft.id ? { ...draft, [field]: value } : draft))
    );
    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    if (!selectedDraft) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await updateStaffDevice(selectedDraft.id, {
        deviceName: selectedDraft.deviceName,
        brand: selectedDraft.brand,
        condition: selectedDraft.condition,
        deviceType: selectedDraft.deviceType,
      });

      await reclassifyStaffDevice(selectedDraft.id, selectedDraft.classification);
      await refreshDrafts(selectedDraft.id);
      setMessage("Hidden draft updated.");
    } catch (err) {
      setError(err.message || "Failed to save hidden draft.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedDraft) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");
      await publishStaffDevice(selectedDraft.id);
      await refreshDrafts(null);
      setMessage("Hidden draft published.");
    } catch (err) {
      setError(err.message || "Failed to publish hidden draft.");
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="app-page">
        <AppHeader />

        <main style={{ padding: "36px 16px 60px" }}>
          <div className="page-shell">
            <section className="page-hero hero-teal">
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>
                Staff Draft Workspace
              </p>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "34px", lineHeight: 1.1 }}>
                Hidden draft workspace
              </h1>
              <p style={{ margin: 0, maxWidth: "720px", lineHeight: 1.7, opacity: 0.95 }}>
                Review hidden device drafts, update details, and publish records when they are ready
                for the owner workflow.
              </p>
            </section>

            {message && (
                <div
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                      borderRadius: "16px",
                      padding: "16px 18px",
                      color: "#15803d",
                      fontWeight: 700,
                    }}
                >
                  {message}
                </div>
            )}

            {error && (
                <div
                    style={{
                      background: "#fff",
                      border: "1px solid #fecaca",
                      borderRadius: "16px",
                      padding: "16px 18px",
                      color: "#dc2626",
                      fontWeight: 700,
                    }}
                >
                  {error}
                </div>
            )}

            <section className="metric-grid">
              {[
                { label: "Hidden Drafts", value: metrics.total, color: "#0f172a", icon: "🗂️" },
                { label: "Hidden From Owners", value: metrics.hidden, color: "#0f766e", icon: "🙈" },
                { label: "Current / Rare Drafts", value: metrics.currentRare, color: "#2563eb", icon: "⭐" },
                { label: "Recycle Drafts", value: metrics.recycle, color: "#d97706", icon: "♻️" },
              ].map((item) => (
                  <div key={item.label} className="metric-card">
                    <div style={{ fontSize: "24px", marginBottom: "12px" }}>{item.icon}</div>
                    <div className="metric-label">{item.label}</div>
                    <div className="metric-value" style={{ color: item.color }}>
                      {item.value}
                    </div>
                  </div>
              ))}
            </section>

            <section className="split-layout" style={{ gridTemplateColumns: "1.05fr 1fr" }}>
              <div className="surface-card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "18px 20px", borderBottom: "1px solid #e5e7eb" }}>
                  <h2 style={{ margin: 0, fontSize: "18px" }}>Hidden draft queue</h2>
                  <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                    Select a hidden draft to update details, classification, or publish it back to the
                    owner workflow.
                  </p>
                </div>

                {loading ? (
                    <div
                        style={{
                          padding: "24px 20px",
                          color: "#64748b",
                        }}
                    >
                      Loading hidden drafts...
                    </div>
                ) : drafts.length === 0 ? (
                    <div
                        style={{
                          padding: "24px 20px",
                          display: "grid",
                          gap: "8px",
                          color: "#64748b",
                        }}
                    >
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                        No hidden drafts
                      </div>
                      <div>Hidden drafts created from the review workflow will appear here.</div>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "12px", padding: "16px" }}>
                      {sortedDrafts.map((draft) => {
                        const typeStyle = getDeviceTypeStyle(draft.deviceType);
                        const classificationStyle = getClassificationStyle(draft.classification);
                        const workflowStyle = getWorkflowStatusStyle(draft.workflowStatus || "HIDDEN");
                        const isSelected = selectedDraft?.id === draft.id;

                        return (
                            <div
                                key={draft.id}
                                onClick={() => setSelectedDraftId(draft.id)}
                                style={{
                                  border: `1px solid ${isSelected ? "#99f6e4" : "#e5e7eb"}`,
                                  borderRadius: "16px",
                                  padding: "16px 18px",
                                  background: isSelected ? "#f0fdfa" : "#fff",
                                  cursor: "pointer",
                                  display: "grid",
                                  gap: "12px",
                                  boxShadow: isSelected ? "0 12px 24px rgba(15, 118, 110, 0.08)" : "none",
                                }}
                            >
                              <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(0, 1fr) auto",
                                    gap: "12px",
                                    alignItems: "start",
                                  }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 800, color: "#0f172a" }}>
                                    {draft.deviceName || "Untitled draft"}
                                  </div>
                                  <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b" }}>
                                    {draft.brand || "Unknown brand"} • Hidden from owner
                                  </div>
                                </div>
                                <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      padding: "6px 10px",
                                      borderRadius: "999px",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      background: workflowStyle.bg,
                                      color: workflowStyle.color,
                                      border: `1px solid ${workflowStyle.border}`,
                                      whiteSpace: "nowrap",
                                    }}
                                >
                            {getDraftWorkflowLabel(draft.workflowStatus)}
                          </span>
                              </div>

                              <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                    alignItems: "center",
                                  }}
                              >
                          <span
                              style={{
                                background: typeStyle.bg,
                                color: typeStyle.color,
                                padding: "6px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                          >
                            {typeStyle.label}
                          </span>
                                <span
                                    style={{
                                      background: classificationStyle.bg,
                                      color: classificationStyle.color,
                                      border: `1px solid ${classificationStyle.border}`,
                                      padding: "6px 10px",
                                      borderRadius: "999px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      whiteSpace: "nowrap",
                                    }}
                                >
                            {classificationStyle.label}
                          </span>
                                <span style={{ color: "#475569", fontSize: "13px" }}>
                            {draft.condition || "No condition"}
                          </span>
                              </div>
                            </div>
                        );
                      })}
                    </div>
                )}
              </div>

              <div className="surface-card dashboard-action-card right-panel" style={{ padding: "24px" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Hidden draft editor</h2>

                {!selectedDraft ? (
                    <div
                        className="right-panel-empty"
                        style={{
                          display: "grid",
                          gap: "14px",
                          padding: "18px",
                          borderRadius: "16px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                    >
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          Select a draft to edit
                        </div>
                        <div className="right-panel-muted" style={{ marginTop: "8px", lineHeight: 1.7 }}>
                          Choose a hidden device draft from the queue to update details and publish it
                          when ready.
                        </div>
                      </div>
                      {[
                        "Select hidden draft",
                        "Update device details",
                        "Save draft or publish device",
                      ].map((step, index) => (
                          <div
                              className="right-panel-empty-step"
                              key={step}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "32px minmax(0, 1fr)",
                                gap: "12px",
                                alignItems: "start",
                                padding: "14px",
                                borderRadius: "14px",
                                border: "1px solid #e2e8f0",
                                background: "#fff",
                              }}
                          >
                            <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "999px",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  fontWeight: 800,
                                  display: "grid",
                                  placeItems: "center",
                                }}
                            >
                              {index + 1}
                            </div>
                            <div style={{ fontWeight: 700, color: "#334155" }}>{step}</div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <>
                      <div
                          className="right-panel-summary"
                          style={{
                            marginBottom: "16px",
                            padding: "16px",
                            borderRadius: "14px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "grid",
                            gap: "12px",
                          }}
                      >
                        <div>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                            Edit selected draft
                          </div>
                          <div className="right-panel-muted" style={{ marginTop: "6px" }}>
                            {selectedDraft.deviceName || "Untitled draft"}
                          </div>
                        </div>
                        <div className="right-panel-badges" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 800,
                            background: getClassificationStyle(selectedDraft.classification).bg,
                            color: getClassificationStyle(selectedDraft.classification).color,
                            border: `1px solid ${getClassificationStyle(selectedDraft.classification).border}`,
                          }}
                      >
                        {getClassificationStyle(selectedDraft.classification).label}
                      </span>
                          <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 800,
                                background: getWorkflowStatusStyle(selectedDraft.workflowStatus || "HIDDEN").bg,
                                color: getWorkflowStatusStyle(selectedDraft.workflowStatus || "HIDDEN").color,
                                border: `1px solid ${getWorkflowStatusStyle(selectedDraft.workflowStatus || "HIDDEN").border}`,
                              }}
                          >
                        {getDraftWorkflowLabel(selectedDraft.workflowStatus)}
                      </span>
                          <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 800,
                                background: getDeviceTypeStyle(selectedDraft.deviceType || "OTHER").bg,
                                color: getDeviceTypeStyle(selectedDraft.deviceType || "OTHER").color,
                              }}
                          >
                        {getDeviceTypeStyle(selectedDraft.deviceType || "OTHER").label}
                      </span>
                        </div>
                      </div>

                      <div className="right-panel-sections" style={{ display: "grid", gap: "14px" }}>
                        <div className="dashboard-action-step right-panel-step">
                          <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                            Step 1 Review draft identity
                          </div>
                          <div className="right-panel-field">
                            <label style={labelStyle}>Device Name</label>
                            <DashboardInput
                                value={selectedDraft.deviceName || ""}
                                onChange={(e) => patchDraft("deviceName", e.target.value)}
                            />
                          </div>
                          <div className="right-panel-field">
                            <label style={labelStyle}>Brand</label>
                            <DashboardInput
                                value={selectedDraft.brand || ""}
                                onChange={(e) => patchDraft("brand", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="dashboard-action-step right-panel-step">
                          <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                            Step 2 Update condition and type
                          </div>
                          <div className="right-panel-field">
                            <label style={labelStyle}>Condition</label>
                            <DashboardInput
                                value={selectedDraft.condition || ""}
                                onChange={(e) => patchDraft("condition", e.target.value)}
                            />
                          </div>
                          <div className="right-panel-field">
                            <label style={labelStyle}>Device Type</label>
                            <div className="right-panel-field-control">
                              <DashboardSelect
                                  inputId="staff-draft-device-type-select"
                                  name="deviceType"
                                  options={deviceTypeOptions}
                                  value={selectedDraftDeviceTypeOption}
                                  onChange={(selectedOption) =>
                                      patchDraft("deviceType", selectedOption?.value || "OTHER")
                                  }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="dashboard-action-step right-panel-step">
                          <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                            Step 3 Choose classification
                          </div>
                          <div className="right-panel-field">
                            <DashboardSelect
                                inputId="staff-draft-classification-select"
                                name="classification"
                                options={classificationOptions}
                                value={selectedDraftClassificationOption}
                                onChange={(selectedOption) =>
                                    patchDraft("classification", selectedOption?.value || "UNKNOWN")
                                }
                            />
                          </div>
                        </div>

                        <div className="dashboard-action-step right-panel-step">
                          <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                            Step 4 Save or publish
                          </div>
                          <p className="right-panel-muted" style={{ margin: 0, lineHeight: 1.7 }}>
                            Save the draft to keep it hidden, or publish it when the record is ready to
                            return to the owner workflow.
                          </p>
                          <div className="right-panel-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-link secondary"
                                style={{
                                  border: "none",
                                  width: "100%",
                                  cursor: saving ? "wait" : "pointer",
                                  opacity: saving ? 0.7 : 1,
                                }}
                            >
                              {saving ? "Saving..." : "Save Hidden Draft"}
                            </button>

                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={saving}
                                className="btn-link primary"
                                style={{
                                  border: "none",
                                  width: "100%",
                                  cursor: saving ? "wait" : "pointer",
                                  opacity: saving ? 0.7 : 1,
                                }}
                            >
                              Publish Device
                            </button>
                          </div>
                        </div>

                        <div
                            className="right-panel-checklist"
                            style={{
                              padding: "16px",
                              borderRadius: "14px",
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              display: "grid",
                              gap: "10px",
                              color: "#475569",
                              lineHeight: 1.6,
                            }}
                        >
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>Draft checklist</div>
                          <div className="right-panel-checklist-list">1. Hidden drafts stay invisible to owners until published.</div>
                          <div className="right-panel-checklist-list">2. Update device details before publishing.</div>
                          <div className="right-panel-checklist-list">3. Choose the correct classification before returning it to workflow.</div>
                        </div>
                      </div>
                    </>
                )}
              </div>
            </section>
          </div>
        </main>

        <AppFooter />
      </div>
  );
}


