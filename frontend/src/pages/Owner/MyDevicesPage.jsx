import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import { fetchOwnerDevices } from "../../services/api.js";
import {
  getClassificationStyle,
  getDeviceTypeStyle,
  getWorkflowStatusStyle,
  inferDeviceType,
} from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f3f4f6",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

function getNextActionText(device) {
  const classification = String(device?.classification || "").toUpperCase();
  const workflowStatus = String(device?.workflowStatus || "").toUpperCase();

  if (workflowStatus === "RETRIEVAL_FULFILLED") {
    return "Secure retrieval has been fulfilled.";
  }

  if (workflowStatus === "HIDDEN") {
    return "This device is hidden from active workflow.";
  }

  if (classification === "UNKNOWN" || !classification) {
    return "Waiting for staff review.";
  }

  if (classification.includes("RECYCLE")) {
    return "Follow recycle and data retrieval steps when available.";
  }

  if (classification === "CURRENT") {
    return "Check partner resale guidance.";
  }

  if (classification === "RARE") {
    return "Review rare device partner options.";
  }

  return "View details for the latest guidance.";
}

export default function MyDevicesPage() {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchOwnerDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const summary = useMemo(() => {
    let currentRare = 0;
    let forRecycling = 0;
    let underReview = 0;

    devices.forEach((d) => {
      const cls = String(d.classification || "").toUpperCase();
      if (cls.includes("CURRENT") || cls.includes("RARE")) currentRare += 1;
      else if (cls.includes("RECYCLE")) forRecycling += 1;
      else underReview += 1;
    });

    return { currentRare, forRecycling, underReview };
  }, [devices]);

  const sortedDevices = useMemo(() => sortNewestFirst(devices), [devices]);

  const filteredDevices = useMemo(() => {
    if (activeFilter === "currentRare") {
      return sortedDevices.filter((device) => {
        const classification = String(device.classification || "").toUpperCase();
        return classification === "CURRENT" || classification === "RARE";
      });
    }

    if (activeFilter === "recycle") {
      return sortedDevices.filter(
        (device) => String(device.classification || "").toUpperCase() === "RECYCLE"
      );
    }

    if (activeFilter === "review") {
      return sortedDevices.filter((device) => {
        const classification = String(device.classification || "").toUpperCase();
        const workflowStatus = String(device.workflowStatus || "").toUpperCase();
        return (
          classification === "UNKNOWN" ||
          workflowStatus === "SUBMITTED" ||
          workflowStatus === "UNDER_REVIEW" ||
          workflowStatus === "PENDING_REVIEW"
        );
      });
    }

    return sortedDevices;
  }, [activeFilter, sortedDevices]);

  const filterHeading = useMemo(() => {
    if (activeFilter === "currentRare") return "Current / Rare devices";
    if (activeFilter === "recycle") return "Recycle devices";
    if (activeFilter === "review") return "Devices under review";
    return "Device progress";
  }, [activeFilter]);

  const openDetail = (device) => {
    navigate(`/devices/${device.id}/result`, { state: { submittedDevice: device } });
  };

  return (
    <div style={pageStyle}>
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="page-hero hero-green">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.85 }}>Owner Devices</p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px" }}>My device pipeline</h1>
            <p style={{ margin: 0, maxWidth: "650px", lineHeight: 1.7, opacity: 0.92 }}>
              Track submitted devices, review classification outcomes, and continue the next action for each device.
            </p>
          </section>

          {loading && <p style={{ color: "#64748b" }}>Loading devices...</p>}
          {error && <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>}

          {!loading && !error && (
            <div className="stack">
              <section
                className="metric-grid"
                style={{
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                }}
              >
                {[
                  { key: "all", title: "Submitted Devices", value: devices.length, color: "#0f172a", icon: "📦" },
                  { key: "currentRare", title: "Current/Rare", value: summary.currentRare, color: "#22c55e", icon: "✅" },
                  { key: "recycle", title: "For Recycling", value: summary.forRecycling, color: "#3b82f6", icon: "♻️" },
                  { key: "review", title: "Under Review", value: summary.underReview, color: "#f59e0b", icon: "🕒" },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    className={`metric-card metric-filter-card${activeFilter === item.key ? " active" : ""}`}
                    onClick={() => setActiveFilter(item.key)}
                    style={{ textAlign: "left", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "999px",
                          background: `${item.color}20`,
                          color: item.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ fontWeight: activeFilter === item.key ? 800 : 700 }}>{item.title}</div>
                    </div>
                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: 800,
                        color: item.color,
                        opacity: activeFilter === item.key ? 1 : 0.92,
                      }}
                    >
                      {item.value}
                    </div>
                  </button>
                ))}
              </section>

              <section className="split-layout" style={{ gridTemplateColumns: "1.35fr 0.85fr", alignItems: "start" }}>
                <section
                  className="surface-card my-devices-progress-card"
                  style={{
                    overflow: "hidden",
                    minHeight: "420px",
                  }}
                >
                  <div
                    style={{
                      padding: "20px 22px",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "#059669",
                          marginBottom: "6px",
                        }}
                      >
                        Device Progress
                      </div>
                      <h2 style={{ margin: 0, fontSize: "22px" }}>{filterHeading}</h2>
                      <p style={{ margin: "8px 0 0 0", color: "#64748b", lineHeight: 1.6 }}>
                        Review the current route for each device and open the next workflow when guidance is ready.
                      </p>
                    </div>
                    <Link to="/submit-device" className="btn-link primary" style={{ minHeight: "48px" }}>
                      Submit New
                    </Link>
                  </div>

                  {filteredDevices.length === 0 ? (
                    <div
                      style={{
                        padding: "24px 22px",
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                        {devices.length === 0 ? "No devices submitted yet" : "No devices in this filter"}
                      </div>
                      <div style={{ color: "#64748b", lineHeight: 1.7 }}>
                        {devices.length === 0
                          ? "Submit your first device to start staff review and receive next-step guidance."
                          : "Try another filter to review devices in a different workflow route."}
                      </div>
                      {devices.length === 0 ? (
                        <Link to="/submit-device" className="btn-link primary" style={{ justifySelf: "start", minHeight: "48px" }}>
                          Submit your first device
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="btn-link secondary"
                          style={{ justifySelf: "start", minHeight: "48px" }}
                          onClick={() => setActiveFilter("all")}
                        >
                          Show all devices
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="dashboard-list">
                      {filteredDevices.map((device) => (
                        (() => {
                          const typeStyle = getDeviceTypeStyle(inferDeviceType(device));
                          const classificationStyle = getClassificationStyle(device.classification);
                          const workflowStatusStyle = getWorkflowStatusStyle(device.workflowStatus);
                          const nextActionText = getNextActionText(device);

                          return (
                            <article
                              key={device.id}
                              className="dashboard-list-item"
                              onClick={() => openDetail(device)}
                            >
                              <div className="dashboard-list-main">
                                <div className="dashboard-list-title-row">
                                  <strong style={{ fontSize: "18px", color: "#0f172a" }}>{device.deviceName}</strong>
                                </div>
                                <div className="dashboard-list-subtle">
                                  {device.brand || "-"} {device.condition ? `• ${device.condition}` : ""}
                                </div>
                                <div className="dashboard-list-badges">
                                  <span
                                    style={{
                                      background: typeStyle.bg,
                                      color: typeStyle.color,
                                      padding: "6px 10px",
                                      borderRadius: "999px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {typeStyle.label}
                                  </span>
                                  <span
                                    style={{
                                      background: classificationStyle.bg,
                                      color: classificationStyle.color,
                                      padding: "6px 10px",
                                      borderRadius: "999px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {classificationStyle.label}
                                  </span>
                                  <span
                                    style={{
                                      background: workflowStatusStyle.bg,
                                      color: workflowStatusStyle.color,
                                      border: `1px solid ${workflowStatusStyle.border}`,
                                      padding: "6px 10px",
                                      borderRadius: "999px",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      display: "inline-flex",
                                      maxWidth: "100%",
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {workflowStatusStyle.label}
                                  </span>
                                </div>
                                <div className="dashboard-list-note">
                                  <span className="dashboard-list-note-label">Next action</span>
                                  <p>{nextActionText}</p>
                                </div>
                              </div>
                              <div className="dashboard-list-side">
                                <Link
                                  to={`/devices/${device.id}/result`}
                                  state={{ submittedDevice: device }}
                                  className="btn-link secondary"
                                  onClick={(event) => event.stopPropagation()}
                                  style={{ minHeight: "46px", whiteSpace: "nowrap" }}
                                >
                                  View details
                                </Link>
                              </div>
                            </article>
                          );
                        })()
                      ))}
                    </div>
                  )}
                </section>

                <div className="stack">
                  <div className="surface-card" style={{ padding: "20px" }}>
                    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#2563eb" }}>
                        Continue Your Journey
                      </div>
                      <h2 style={{ margin: 0, fontSize: "22px" }}>Continue your journey</h2>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                        Open the next owner workflow whenever a device route is ready.
                      </p>
                    </div>
                    <div style={{ display: "grid", gap: "10px" }}>
                      <Link to="/submit-device" className="btn-link primary" style={{ minHeight: "48px" }}>
                        Submit another device
                      </Link>
                      <Link to="/data-retrieval" className="btn-link teal" style={{ minHeight: "48px" }}>
                        Open data retrieval
                      </Link>
                      <Link to="/payments" className="btn-link secondary" style={{ minHeight: "48px" }}>
                        Open payments
                      </Link>
                    </div>
                  </div>

                  <div className="surface-card" style={{ padding: "20px", background: "#fcfdfd" }}>
                    <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Status guide</h2>
                    <div style={{ display: "grid", gap: "12px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                      <div><strong style={{ color: "#0f172a" }}>Under review:</strong> staff is checking the submitted details.</div>
                      <div><strong style={{ color: "#0f172a" }}>Recycle:</strong> the device can move into data wiping and retrieval workflows.</div>
                      <div><strong style={{ color: "#0f172a" }}>Current / Rare:</strong> partner guidance may be available.</div>
                      <div><strong style={{ color: "#0f172a" }}>Hidden:</strong> the device is not currently active.</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}



