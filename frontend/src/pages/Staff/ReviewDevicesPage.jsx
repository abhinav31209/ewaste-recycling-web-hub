import { useEffect, useMemo, useState } from "react";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import DashboardInput from "../../components/DashboardInput.jsx";
import DashboardSelect from "../../components/DashboardSelect.jsx";
import {
  fetchUnknownDevices as fetchUnknownDevicesApi,
  hideStaffDevice,
  publishStaffDevice,
  reclassifyStaffDevice,
  updateStaffDevice,
} from "../../services/api.js";
import {
  applyReviewOverrides,
  DEVICE_TYPE_OPTIONS,
  getClassificationStyle,
  getDeviceTypeStyle,
  getWorkflowStatusStyle,
  saveReviewOverride,
} from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

const CLASSIFICATIONS = ["UNKNOWN", "CURRENT", "RECYCLE", "RARE"];

const CLASSIFICATION_META = {
  UNKNOWN: {
    label: "Unknown",
    icon: "📦",
    color: "#16a34a",
  },
  CURRENT: {
    label: "Current",
    icon: "✅",
    color: "#2563eb",
  },
  RECYCLE: {
    label: "Recycle",
    icon: "♻️",
    color: "#059669",
  },
  RARE: {
    label: "Rare",
    icon: "⭐",
    color: "#d97706",
  },
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#0f172a",
};

const classificationOptions = CLASSIFICATIONS.map((classification) => ({
  value: classification,
  label: classification,
}));

const deviceTypeOptions = DEVICE_TYPE_OPTIONS.map((type) => ({
  value: type,
  label: getDeviceTypeStyle(type).label,
}));

function getReviewWorkflowLabel(status) {
  const normalized = String(status || "PENDING_REVIEW").toUpperCase();
  const labels = {
    PENDING_REVIEW: "Pending review",
    UNDER_REVIEW: "Pending review",
    UNKNOWN: "Unknown",
    PUBLISHED: "Published",
    HIDDEN: "Hidden",
    DATA_WIPE_PENDING: "Data wipe pending",
    RETRIEVAL_AVAILABLE: "Retrieval available",
    RETRIEVAL_REQUESTED: "Payment pending",
    RETRIEVAL_PAID: "Ready for fulfillment",
    RETRIEVAL_FULFILLED: "Retrieval fulfilled",
  };
  return labels[normalized] || normalized.replaceAll("_", " ");
}

export default function ReviewDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [editForm, setEditForm] = useState({
    deviceName: "",
    brand: "",
    condition: "",
    deviceType: "PHONE",
    classification: "UNKNOWN",
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUnknownDevices = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchUnknownDevicesApi();
      setDevices(applyReviewOverrides(Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnknownDevices();
  }, []);

  const summary = useMemo(() => {
    const counts = Object.fromEntries(CLASSIFICATIONS.map((item) => [item, 0]));

    devices.forEach((device) => {
      const key = String(device.classification || "UNKNOWN").toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    return {
      pending: devices.length,
      selected: selectedDevice ? 1 : 0,
      readyToRoute: (counts.CURRENT || 0) + (counts.RECYCLE || 0) + (counts.RARE || 0),
      ...counts,
    };
  }, [devices, selectedDevice]);

  const sortedDevices = useMemo(
    () => sortNewestFirst(devices, ["submittedAt", "createdAt", "updatedAt"]),
    [devices]
  );

  const metrics = [
    {
      label: "Pending Reviews",
      value: summary.pending,
      color: "#0f172a",
      icon: "📦",
    },
    {
      label: "Selected Device",
      value: summary.selected,
      color: "#2563eb",
      icon: "🔎",
    },
    {
      label: "Unknown Queue",
      value: summary.UNKNOWN,
      color: CLASSIFICATION_META.UNKNOWN.color,
      icon: CLASSIFICATION_META.UNKNOWN.icon,
    },
    {
      label: "Ready to Route",
      value: summary.readyToRoute,
      color: "#0f766e",
      icon: "🧭",
    },
  ];

  const selectedDeviceTypeOption =
    deviceTypeOptions.find((option) => option.value === editForm.deviceType) ??
    deviceTypeOptions[0];

  const selectedClassificationOption =
    classificationOptions.find((option) => option.value === editForm.classification) ??
    classificationOptions[0];

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    setEditForm({
      deviceName: device.deviceName || "",
      brand: device.brand || "",
      condition: device.condition || "",
      deviceType: device.deviceType || device.type || "PHONE",
      classification: String(device.classification || "UNKNOWN").toUpperCase(),
    });
    setMessage("");
    setError("");
  };

  const handleInputChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateDevice = async () => {
    if (!selectedDevice) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await updateStaffDevice(selectedDevice.id, {
        deviceName: editForm.deviceName,
        brand: editForm.brand,
        condition: editForm.condition,
        deviceType: editForm.deviceType,
      });

      saveReviewOverride(selectedDevice.id, {
        deviceType: editForm.deviceType,
      });

      setSelectedDevice((prev) =>
        prev
          ? {
              ...prev,
              deviceName: editForm.deviceName,
              brand: editForm.brand,
              condition: editForm.condition,
              deviceType: editForm.deviceType,
            }
          : prev
      );

      setMessage(
        "Device details and type have been saved. Use Approve & Publish to apply the final classification."
      );
      await loadUnknownDevices();
    } catch (err) {
      setError(err.message || "Failed to update device.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedDevice) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      await updateStaffDevice(selectedDevice.id, {
        deviceName: editForm.deviceName,
        brand: editForm.brand,
        condition: editForm.condition,
        deviceType: editForm.deviceType,
      });

      const nextClassification = String(editForm.classification || "UNKNOWN").toUpperCase();
      const previousClassification = String(
        selectedDevice.classification || "UNKNOWN"
      ).toUpperCase();

      if (nextClassification !== previousClassification) {
        await reclassifyStaffDevice(selectedDevice.id, nextClassification);
      }

      saveReviewOverride(selectedDevice.id, {
        deviceType: editForm.deviceType,
      });

      await publishStaffDevice(selectedDevice.id);

      setMessage(
        nextClassification === "RECYCLE"
          ? "Recycle device approved. It now moves into staff data wipe preparation before owner retrieval becomes available."
          : "Device approved, classified, and published."
      );
      setSelectedDevice(null);
      await loadUnknownDevices();
    } catch (err) {
      setError(err.message || "Failed to publish device.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHide = async () => {
    if (!selectedDevice) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");
      await hideStaffDevice(selectedDevice.id);

      setMessage("Device hidden.");
      setSelectedDevice(null);
      await loadUnknownDevices();
    } catch (err) {
      setError(err.message || "Failed to hide device.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!selectedDevice) return;
    handleHide();
  };

  return (
    <div className="app-page">
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <section className="page-hero hero-ink">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>
              Staff Review Queue
            </p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px", lineHeight: 1.1 }}>
              Review pending devices
            </h1>
            <p style={{ margin: 0, maxWidth: "680px", lineHeight: 1.7, opacity: 0.95 }}>
              Review submitted devices, correct item details, classify each record, and publish or
              hide it from one controlled workflow.
            </p>
          </section>

          {error && (
            <div
              style={{
                background: "#fff",
                padding: "16px 18px",
                color: "#dc2626",
                fontWeight: 600,
                borderColor: "#fecaca",
                border: "1px solid #fecaca",
                borderRadius: "16px",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                background: "#ecfdf5",
                padding: "16px 18px",
                color: "#15803d",
                fontWeight: 700,
                border: "1px solid #bbf7d0",
                borderRadius: "16px",
              }}
            >
              {message}
            </div>
          )}

          <section className="metric-grid">
            {metrics.map((item) => (
              <div key={item.label} className="metric-card">
                <div style={{ fontSize: "26px", marginBottom: "12px" }}>{item.icon}</div>
                <div className="metric-label">{item.label}</div>
                <div className="metric-value" style={{ color: item.color }}>
                  {loading ? "..." : item.value}
                </div>
              </div>
            ))}
          </section>

          <section className="split-layout" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
            <div className="surface-card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "18px" }}>Review queue</h2>
                <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                  Select a submitted device to review details, classify it, and publish or hide it.
                </p>
              </div>

              {loading ? (
                <div style={{ padding: "24px 20px", color: "#64748b" }}>Loading devices...</div>
              ) : devices.length === 0 ? (
                <div
                  style={{
                    padding: "24px 20px",
                    display: "grid",
                    gap: "8px",
                    color: "#64748b",
                  }}
                >
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                    No pending devices
                  </div>
                  <div>All submitted devices have been reviewed or routed.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px", padding: "16px" }}>
                  {sortedDevices.map((device) => {
                    const typeStyle = getDeviceTypeStyle(
                      device.deviceType || device.type || "PHONE"
                    );
                    const classificationStyle = getClassificationStyle(device.classification);
                    const workflowStyle = getWorkflowStatusStyle(
                      device.workflowStatus || "PENDING_REVIEW"
                    );
                    const isSelected = selectedDevice?.id === device.id;

                    return (
                      <div
                        key={device.id}
                        onClick={() => handleSelectDevice(device)}
                        style={{
                          border: `1px solid ${isSelected ? "#99f6e4" : "#e5e7eb"}`,
                          borderRadius: "16px",
                          padding: "16px 18px",
                          background: isSelected ? "#f0fdfa" : "#fff",
                          cursor: "pointer",
                          display: "grid",
                          gap: "10px",
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
                              {device.deviceName || "-"}
                            </div>
                            <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b" }}>
                              {device.brand || "No brand"}
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
                              background: classificationStyle.bg,
                              color: classificationStyle.color,
                              border: `1px solid ${classificationStyle.border}`,
                            }}
                          >
                            {classificationStyle.label}
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
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: workflowStyle.bg,
                              color: workflowStyle.color,
                              border: `1px solid ${workflowStyle.border}`,
                            }}
                          >
                            {getReviewWorkflowLabel(device.workflowStatus)}
                          </span>
                          <span style={{ color: "#475569", fontSize: "13px" }}>
                            {device.condition || "No condition"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="surface-card dashboard-action-card right-panel" style={{ padding: "24px" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Review panel</h2>

                {!selectedDevice ? (
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
                          Select a device to begin
                        </div>
                        <div className="right-panel-muted" style={{ marginTop: "8px", lineHeight: 1.7 }}>
                          Choose a submitted device from the queue to review details, update
                          classification, and apply staff actions.
                        </div>
                      </div>
                      {[
                      "Check submitted details",
                      "Choose device type and classification",
                      "Save, publish, or hide the record",
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
                          Review selected device
                        </div>
                        <div className="right-panel-muted" style={{ marginTop: "6px" }}>
                          {selectedDevice.deviceName || "-"}
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
                            background: getClassificationStyle(selectedDevice.classification).bg,
                            color: getClassificationStyle(selectedDevice.classification).color,
                            border: `1px solid ${getClassificationStyle(selectedDevice.classification).border}`,
                          }}
                        >
                          {getClassificationStyle(selectedDevice.classification).label}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 800,
                            background: getWorkflowStatusStyle(selectedDevice.workflowStatus).bg,
                            color: getWorkflowStatusStyle(selectedDevice.workflowStatus).color,
                            border: `1px solid ${getWorkflowStatusStyle(selectedDevice.workflowStatus).border}`,
                          }}
                        >
                          {getReviewWorkflowLabel(selectedDevice.workflowStatus)}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 800,
                            background: getDeviceTypeStyle(
                              selectedDevice.deviceType || selectedDevice.type || "PHONE"
                            ).bg,
                            color: getDeviceTypeStyle(
                              selectedDevice.deviceType || selectedDevice.type || "PHONE"
                            ).color,
                          }}
                        >
                          {getDeviceTypeStyle(
                            selectedDevice.deviceType || selectedDevice.type || "PHONE"
                          ).label}
                        </span>
                      </div>
                    </div>

                    <div className="right-panel-sections" style={{ display: "grid", gap: "14px" }}>
                      <div className="dashboard-action-step right-panel-step">
                        <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                          Step 1 Check submitted details
                        </div>
                        <div className="right-panel-field">
                          <label style={labelStyle}>Device Name</label>
                          <DashboardInput
                            name="deviceName"
                            value={editForm.deviceName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="right-panel-field">
                          <label style={labelStyle}>Brand</label>
                          <DashboardInput
                            name="brand"
                            value={editForm.brand}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="right-panel-field">
                          <label style={labelStyle}>Condition</label>
                          <DashboardInput
                            name="condition"
                            value={editForm.condition}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="dashboard-action-step right-panel-step">
                        <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                          Step 2 Choose device type
                        </div>
                        <div className="right-panel-field">
                          <DashboardSelect
                            inputId="review-device-type-select"
                            name="deviceType"
                            options={deviceTypeOptions}
                            value={selectedDeviceTypeOption}
                            onChange={(selectedOption) =>
                              setEditForm((current) => ({
                                ...current,
                                deviceType: selectedOption?.value || "PHONE",
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="dashboard-action-step right-panel-step">
                        <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                          Step 3 Choose classification
                        </div>
                        <div className="right-panel-field">
                          <DashboardSelect
                            inputId="review-classification-select"
                            name="classification"
                            options={classificationOptions}
                            value={selectedClassificationOption}
                            onChange={(selectedOption) =>
                              setEditForm((current) => ({
                                ...current,
                                classification: selectedOption?.value || "UNKNOWN",
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="dashboard-action-step right-panel-step">
                        <div className="right-panel-step-title" style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                          Step 4 Apply staff action
                        </div>
                        <div className="right-panel-actions" style={{ display: "grid", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={handleUpdateDevice}
                            disabled={actionLoading}
                            className="btn-link dark"
                            style={{
                              border: "none",
                              width: "100%",
                              cursor: actionLoading ? "wait" : "pointer",
                              opacity: actionLoading ? 0.7 : 1,
                            }}
                          >
                            Save Changes
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={actionLoading}
                            className="btn-link teal"
                            style={{
                              border: "none",
                              width: "100%",
                              background: "#eef2ff",
                              color: "#4338ca",
                              cursor: actionLoading ? "wait" : "pointer",
                            }}
                          >
                            Save As Hidden Draft
                          </button>

                          <button
                            type="button"
                            onClick={handlePublish}
                            disabled={actionLoading}
                            className="btn-link secondary"
                            style={{
                              border: "none",
                              width: "100%",
                              background: "#0f766e",
                              color: "#fff",
                              cursor: actionLoading ? "wait" : "pointer",
                            }}
                          >
                            Approve & Publish
                          </button>
                          
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="surface-card right-panel-checklist" style={{ padding: "20px" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Review checklist</h2>
                <div
                  className="right-panel-checklist-list"
                  style={{ display: "grid", gap: "12px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}
                >
                  <div>1. Confirm device name, brand, and condition.</div>
                  <div>2. Choose the correct type and classification.</div>
                  <div>3. Save draft if more staff follow-up is needed.</div>
                  <div>
                    4. Publish recycle devices into data wipe preparation, not directly into owner
                    retrieval.
                  </div>
                  <div>5. Hide invalid or incomplete submissions only when needed.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
