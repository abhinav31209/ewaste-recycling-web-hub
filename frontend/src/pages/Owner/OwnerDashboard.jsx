import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchOwnerDevices } from "../../services/api.js";
import {
  getClassificationStyle,
  getDeviceTypeStyle,
  getWorkflowStatusStyle,
  inferDeviceType,
} from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const username = user?.email || "Owner";
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchOwnerDevices();
        setDevices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const summary = useMemo(() => {
    let currentRare = 0;
    let recycle = 0;
    let review = 0;
    let partnerReady = 0;

    devices.forEach((device) => {
      const cls = String(device.classification || "").toUpperCase();
      if (cls.includes("CURRENT") || cls.includes("RARE")) currentRare += 1;
      else if (cls.includes("RECYCLE")) recycle += 1;
      else review += 1;
      if (cls === "CURRENT" || cls === "RARE") partnerReady += 1;
    });

    return {
      total: devices.length,
      currentRare,
      recycle,
      review,
      partnerReady,
    };
  }, [devices]);

  const sortedDevices = useMemo(() => sortNewestFirst(devices), [devices]);
  const recentDevices = sortedDevices.slice(0, 5);

  return (
    <div className="app-page">
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <section className="page-hero hero-green">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>
              Owner Workspace
            </p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px", lineHeight: 1.1 }}>
              Welcome back, {username}
            </h1>
            <p style={{ margin: 0, maxWidth: "620px", lineHeight: 1.7, opacity: 0.95 }}>
              Track your submitted devices, review outcomes, and continue resale, recycling, or
              data retrieval workflows from one place.
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

          <section className="metric-grid">
            {[
              { label: "Submitted Devices", value: summary.total, color: "#0f172a", icon: "📦" },
              { label: "For Recycling", value: summary.recycle, color: "#2563eb", icon: "♻️" },
              { label: "Under Review", value: summary.review, color: "#d97706", icon: "🕒" },
              { label: "Ready for Action", value: summary.currentRare, color: "#16a34a", icon: "✅" },
              { label: "Partner Ready", value: summary.partnerReady, color: "#7c3aed", icon: "🤝" },
            ].map((item) => (
              <div key={item.label} className="metric-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "999px",
                      background: `${item.color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>
                    LIVE
                  </span>
                </div>
                <div className="metric-label">{item.label}</div>
                <div className="metric-value" style={{ color: item.color }}>
                  {loading ? "..." : item.value}
                </div>
              </div>
            ))}
          </section>

          <section className="split-layout" style={{ gridTemplateColumns: "1.3fr 0.9fr" }}>
            <div className="surface-card dashboard-progress-card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "20px 22px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
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
                  <h2 style={{ margin: 0, fontSize: "22px" }}>Recent device progress</h2>
                  <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                    Review the latest device outcomes and continue the next step for each submission.
                  </p>
                </div>
                <Link to="/my-devices" style={{ color: "#059669", textDecoration: "none", fontWeight: 700 }}>
                  View All
                </Link>
              </div>

              {loading ? (
                <div style={{ padding: "24px 22px", color: "#64748b" }}>Loading devices...</div>
              ) : recentDevices.length === 0 ? (
                <div
                  style={{
                    padding: "24px 22px",
                    display: "grid",
                    gap: "12px",
                    color: "#94a3b8",
                  }}
                >
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                    No device progress yet
                  </div>
                  <div style={{ lineHeight: 1.7 }}>
                    Submit your first device to start tracking review outcomes, recycling paths, and
                    retrieval options from this dashboard.
                  </div>
                  <Link to="/submit-device" className="btn-link primary" style={{ justifySelf: "start", minHeight: "48px" }}>
                    Submit Your First Device
                  </Link>
                </div>
              ) : (
                <div className="dashboard-progress-list">
                  {recentDevices.map((device) => (
                    (() => {
                      const typeStyle = getDeviceTypeStyle(inferDeviceType(device));
                      const classificationStyle = getClassificationStyle(device.classification);
                      const workflowStatusStyle = getWorkflowStatusStyle(device.workflowStatus);

                      return (
                        <article
                          key={device.id}
                          className="dashboard-progress-item"
                          onClick={() => navigate(`/devices/${device.id}/result`, { state: { submittedDevice: device } })}
                        >
                          <div className="dashboard-progress-main">
                            <div style={{ display: "grid", gap: "6px", minWidth: 0 }}>
                              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "18px" }}>
                                {device.deviceName}
                              </div>
                              <div style={{ color: "#64748b", fontSize: "13px" }}>
                                {device.brand || "Unknown brand"}
                              </div>
                            </div>

                            <div className="dashboard-progress-badges">
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
                          </div>

                          <Link
                            to={`/devices/${device.id}/result`}
                            state={{ submittedDevice: device }}
                            className="btn-link secondary"
                            onClick={(event) => event.stopPropagation()}
                            style={{ minHeight: "46px", whiteSpace: "nowrap" }}
                          >
                            View details
                          </Link>
                        </article>
                      );
                    })()
                  ))}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="surface-card dashboard-action-card" style={{ padding: "20px" }}>
                <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#059669" }}>
                    Owner Actions
                  </div>
                  <h2 style={{ margin: 0, fontSize: "22px" }}>Continue your journey</h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    Pick the next step that moves your device workflow forward.
                  </p>
                </div>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div className="dashboard-action-step">
                    <div style={{ display: "grid", gap: "4px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                        Step 1
                      </div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Submit a new device</div>
                      <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                        Start a new review so resale, recycling, or retrieval options can be prepared.
                      </div>
                    </div>
                    <Link to="/submit-device" className="btn-link primary" style={{ minHeight: "48px" }}>
                      + Submit New Device
                    </Link>
                  </div>

                  <div className="dashboard-action-step">
                    <div style={{ display: "grid", gap: "4px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                        Step 2
                      </div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Check device outcomes</div>
                      <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                        Review classifications, workflow updates, and latest device results.
                      </div>
                    </div>
                    <Link to="/my-devices" className="btn-link secondary" style={{ minHeight: "48px" }}>
                      Open My Devices
                    </Link>
                  </div>

                  <div className="dashboard-action-step">
                    <div style={{ display: "grid", gap: "4px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                        Step 3
                      </div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Continue retrieval or payment</div>
                      <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                        Move into data retrieval and complete payment when secure access is approved.
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: "10px" }}>
                      <Link to="/data-retrieval" className="btn-link teal" style={{ minHeight: "48px" }}>
                        Data Retrieval
                      </Link>
                      <Link to="/payments" className="btn-link secondary" style={{ minHeight: "48px" }}>
                        Open Payments
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="surface-card" style={{ padding: "20px", background: "#fcfdfd" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>What Happens Next</h2>
                <div style={{ display: "grid", gap: "12px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                  <div>1. Submit a device and wait for classification.</div>
                  <div>2. Review the result to see resale or recycling outcomes.</div>
                  <div>3. Use retrieval and payments when secure access becomes available.</div>
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


