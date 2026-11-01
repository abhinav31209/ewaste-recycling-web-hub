import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import { fetchUnknownDevices } from "../../services/api.js";
import { getDraftMetrics, listStaffDrafts } from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

export default function StaffDashboard() {
  const [devices, setDevices] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchUnknownDevices();
        setDevices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load review queue.");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  useEffect(() => {
    const syncDrafts = () => {
      setDrafts(listStaffDrafts());
    };

    syncDrafts();
    window.addEventListener("focus", syncDrafts);

    return () => window.removeEventListener("focus", syncDrafts);
  }, []);

  const sortedDevices = useMemo(() => sortNewestFirst(devices), [devices]);

  const summary = useMemo(() => {
    const noBrand = devices.filter((device) => !device.brand).length;
    const noCondition = devices.filter((device) => !device.condition).length;
    const draftMetrics = getDraftMetrics(drafts);

    return {
      queue: devices.length,
      noBrand,
      noCondition,
      drafts: draftMetrics.total,
    };
  }, [devices, drafts]);


  return (
    <div className="app-page">
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <section className="page-hero hero-blue">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>
              Staff Workspace
            </p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px", lineHeight: 1.1 }}>
              Review queue overview
            </h1>
            <p style={{ margin: 0, maxWidth: "620px", lineHeight: 1.7, opacity: 0.95 }}>
              Check the current unknown-device queue, see what needs manual cleanup, and jump
              directly into the review workflow.
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
              { label: "Pending Reviews", value: summary.queue, color: "#2563eb", icon: "📋" },
              { label: "Missing Brand", value: summary.noBrand, color: "#d97706", icon: "🏷️" },
              { label: "Missing Condition", value: summary.noCondition, color: "#7c3aed", icon: "🛠️" },
              { label: "Hidden Drafts", value: summary.drafts, color: "#0f766e", icon: "📝" },
            ].map((item) => (
              <div key={item.label} className="metric-card">
                <div style={{ fontSize: "26px", marginBottom: "12px" }}>{item.icon}</div>
                <div className="metric-label">{item.label}</div>
                <div className="metric-value" style={{ color: item.color }}>
                  {loading ? "..." : item.value}
                </div>
              </div>
            ))}
          </section>

          <section className="split-layout" style={{ gridTemplateColumns: "1.35fr 0.85fr" }}>
            <div className="surface-card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px" }}>Unknown Device Queue</h2>
                  <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                    Devices that still need manual review and classification
                  </p>
                </div>
                <Link to="/review-devices" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700 }}>
                  Open Queue
                </Link>
              </div>

              {loading ? (
                <div style={{ padding: "24px 20px", color: "#64748b" }}>Loading queue...</div>
              ) : devices.length === 0 ? (
                <div style={{ padding: "24px 20px", color: "#94a3b8" }}>
                  No unknown devices found. The review queue is clear right now.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: "14px 20px" }}>Device</th>
                      <th style={{ padding: "14px 20px" }}>Brand</th>
                      <th style={{ padding: "14px 20px" }}>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDevices.slice(0, 6).map((device) => (
                      <tr key={device.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "14px 20px", fontWeight: 700 }}>{device.deviceName}</td>
                        <td style={{ padding: "14px 20px", color: "#475569" }}>{device.brand || "-"}</td>
                        <td style={{ padding: "14px 20px", color: "#475569" }}>{device.condition || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="stack">
              <div className="surface-card" style={{ padding: "20px" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Quick Actions</h2>
                <div style={{ display: "grid", gap: "10px" }}>
                  <Link
                    to="/review-devices"
                    className="btn-link secondary"
                    style={{ background: "#2563eb", color: "#fff" }}
                  >
                    Review Unknown Devices
                  </Link>
                  <Link
                    to="/staff-orders"
                    className="btn-link teal"
                  >
                    Fulfill Retrieval Orders
                  </Link>
                  <Link
                    to="/staff-drafts"
                    className="btn-link soft"
                    style={{ background: "#ecfeff", color: "#0f766e", borderColor: "#99f6e4" }}
                  >
                    Open Hidden Drafts
                  </Link>
                  <Link
                    to="/admin-reports"
                    className="btn-link purple"
                  >
                    Open Reports
                  </Link>
                </div>
              </div>

              <div className="surface-card" style={{ padding: "20px" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Review Checklist</h2>
                <div style={{ display: "grid", gap: "12px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                  <div>1. Verify device name, brand, and visible condition details.</div>
                  <div>2. Choose the right device type and save hidden drafts before publish.</div>
                  <div>3. Publish completed items or hide invalid submissions.</div>
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



