import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import { fetchAdminDevices } from "../../services/api.js";
import {
  getClassificationStyle,
  getDeviceTypeStyle,
  getWorkflowStatusStyle,
  inferDeviceType,
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

const TYPE_FALLBACK = {
  label: "Unknown",
  bg: "#f1f5f9",
  color: "#475569",
};

function getWorkflowDisplay(status) {
  const normalized = String(status || "").toUpperCase();
  const labels = {
    PUBLISHED: "Published",
    HIDDEN: "Hidden",
    RETRIEVAL_FULFILLED: "Retrieval fulfilled",
    RETRIEVAL_AVAILABLE: "Retrieval available",
    RETRIEVAL_REQUESTED: "Payment pending",
    RETRIEVAL_PAID: "Ready for fulfillment",
    DATA_WIPE_PENDING: "Staff preparation",
    DATA_WIPE_COMPLETED: "Retrieval available",
    PENDING_REVIEW: "Pending review",
    UNDER_REVIEW: "Pending review",
    SUBMITTED: "Pending review",
  };

  return labels[normalized] || normalized || "Unknown";
}

function isReviewable(device) {
  const classification = String(device?.classification || "UNKNOWN").toUpperCase();
  const workflowStatus = String(device?.workflowStatus || "SUBMITTED").toUpperCase();

  return (
    classification === "UNKNOWN" ||
    workflowStatus === "PENDING_REVIEW" ||
    workflowStatus === "UNDER_REVIEW" ||
    workflowStatus === "SUBMITTED" ||
    workflowStatus === "HIDDEN"
  );
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDeviceFilter, setActiveDeviceFilter] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load admin devices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const counts = Object.fromEntries(CLASSIFICATIONS.map((item) => [item, 0]));

    devices.forEach((device) => {
      const key = String(device.classification || "UNKNOWN").toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    return {
      totalDevices: devices.length,
      ...counts,
    };
  }, [devices]);

  const sortedDevices = useMemo(
    () => sortNewestFirst(devices, ["updatedAt", "reviewedAt", "createdAt", "submittedAt"]),
    [devices]
  );

  const filteredDevices = useMemo(() => {
    if (activeDeviceFilter === "unknown") {
      return sortedDevices.filter((device) => {
        const classification = String(device.classification || "UNKNOWN").toUpperCase();
        const workflowStatus = String(device.workflowStatus || "").toUpperCase();
        return (
          classification === "UNKNOWN" ||
          workflowStatus === "PENDING_REVIEW" ||
          workflowStatus === "UNDER_REVIEW" ||
          workflowStatus === "SUBMITTED" ||
          workflowStatus === "HIDDEN"
        );
      });
    }

    if (activeDeviceFilter === "current") {
      return sortedDevices.filter(
        (device) => String(device.classification || "").toUpperCase() === "CURRENT"
      );
    }

    if (activeDeviceFilter === "recycle") {
      return sortedDevices.filter(
        (device) => String(device.classification || "").toUpperCase() === "RECYCLE"
      );
    }

    if (activeDeviceFilter === "rare") {
      return sortedDevices.filter(
        (device) => String(device.classification || "").toUpperCase() === "RARE"
      );
    }

    return sortedDevices;
  }, [activeDeviceFilter, sortedDevices]);

  const deviceListTitle = useMemo(() => {
    if (activeDeviceFilter === "unknown") return "Unknown devices";
    if (activeDeviceFilter === "current") return "Current devices";
    if (activeDeviceFilter === "recycle") return "Recycle devices";
    if (activeDeviceFilter === "rare") return "Rare devices";
    return "Device records";
  }, [activeDeviceFilter]);

  const metrics = [
    {
      key: "all",
      label: "Total Devices",
      value: summary.totalDevices,
      color: "#0f172a",
      icon: "📱",
      tint: "#f8fafc",
    },
    {
      key: "unknown",
      label: "Unknown",
      value: summary.UNKNOWN,
      color: CLASSIFICATION_META.UNKNOWN.color,
      icon: CLASSIFICATION_META.UNKNOWN.icon,
      tint: "#ecfdf5",
    },
    {
      key: "current",
      label: "Current",
      value: summary.CURRENT,
      color: CLASSIFICATION_META.CURRENT.color,
      icon: CLASSIFICATION_META.CURRENT.icon,
      tint: "#eff6ff",
    },
    {
      key: "recycle",
      label: "Recycle",
      value: summary.RECYCLE,
      color: CLASSIFICATION_META.RECYCLE.color,
      icon: CLASSIFICATION_META.RECYCLE.icon,
      tint: "#ecfeff",
    },
    {
      key: "rare",
      label: "Rare",
      value: summary.RARE,
      color: CLASSIFICATION_META.RARE.color,
      icon: CLASSIFICATION_META.RARE.icon,
      tint: "#fff7ed",
    },
  ];
  return (
      <div className="app-page">
        <AppHeader />

        <main style={{ padding: "36px 16px 60px" }}>
          <div className="page-shell">
            <section className="page-hero hero-ink">
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>
                Admin Devices
              </p>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "34px", lineHeight: 1.1 }}>
                Global device database
              </h1>
              <p style={{ margin: 0, maxWidth: "640px", lineHeight: 1.7, opacity: 0.95 }}>
                View all device records, audit workflow status, and open pending items in the review queue.
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
              {metrics.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`metric-card metric-filter-card interactive-metric-card${activeDeviceFilter === item.key ? " active" : ""}`}
                    onClick={() => setActiveDeviceFilter(item.key)}
                    style={{
                      minHeight: "148px",
                      display: "grid",
                      alignContent: "space-between",
                      gap: "14px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "999px",
                          background: item.tint,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "18px",
                        }}
                      >
                        {item.icon}
                      </div>
                      <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>LIVE</span>
                    </div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div className="metric-label" style={{ fontWeight: activeDeviceFilter === item.key ? 800 : 700 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1.1, color: item.color, opacity: activeDeviceFilter === item.key ? 1 : 0.92 }}>
                        {loading ? "..." : item.value}
                      </div>
                    </div>
                  </button>
              ))}
            </section>

            <section>
              <div
                className="surface-card"
                style={{
                  overflow: "hidden",
                  borderColor: "#dbeafe",
                  boxShadow: "0 18px 36px rgba(15,23,42,0.06)",
                }}
              >
                <div
                    style={{
                      padding: "18px 20px",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                >
                  <div style={{ display: "grid", gap: "6px" }}>
                    <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{deviceListTitle}</h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                      All submitted and processed devices are listed here for audit and status review.
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      Use Review Pending Devices for classification and pending review work.
                    </p>
                  </div>
                  <Link
                    to="/review-devices"
                    className="btn-link dark"
                    style={{ minHeight: "42px", padding: "0 14px" }}
                  >
                    Open Review Queue
                  </Link>
                </div>

                {loading ? (
                    <div style={{ padding: "24px 20px", color: "#64748b" }}>
                      Loading devices...
                    </div>
                ) : devices.length === 0 ? (
                    <div style={{ padding: "24px 20px", color: "#94a3b8" }}>
                      No devices found.
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div style={{ padding: "24px 20px", color: "#94a3b8" }}>
                      No devices in this category.
                    </div>
                ) : (
                    <div style={{ padding: "12px 14px 14px", overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Device</th>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Type</th>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Classification</th>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Workflow</th>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredDevices.map((device) => {
                          const typeStyle = getDeviceTypeStyle(inferDeviceType(device)) || TYPE_FALLBACK;
                          const classification = String(device.classification || "UNKNOWN").toUpperCase();
                          const classificationStyle = getClassificationStyle(classification);
                          const workflowStyle = getWorkflowStatusStyle(device.workflowStatus);
                          const reviewable = isReviewable(device);

                          return (
                              <tr
                                  key={device.id}
                                  style={{
                                    opacity: 1,
                                  }}
                              >
                                <td style={{ padding: "14px", borderTop: "1px solid #eef2f7", background: "#ffffff" }}>
                                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                    {device.deviceName || "-"}
                                  </div>
                                  <div
                                      style={{
                                        marginTop: "6px",
                                        fontSize: "13px",
                                        color: "#64748b",
                                      }}
                                  >
                                    {[device.brand, device.condition].filter(Boolean).join(" · ") ||
                                        "No brand or condition"}
                                  </div>
                                </td>

                                <td style={{ padding: "14px", borderTop: "1px solid #eef2f7", background: "#ffffff" }}>
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
                                </td>

                                <td style={{ padding: "14px", borderTop: "1px solid #eef2f7", background: "#ffffff" }}>
                                  <span
                                    style={{
                                      background: classificationStyle.bg,
                                      color: classificationStyle.color,
                                      border: `1px solid ${classificationStyle.border}`,
                                      padding: "6px 10px",
                                      borderRadius: "999px",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {classificationStyle.label}
                                  </span>
                                </td>

                                <td style={{ padding: "14px", borderTop: "1px solid #eef2f7", background: "#ffffff" }}>
                                  <span
                                    style={{
                                      background: workflowStyle.bg,
                                      color: workflowStyle.color,
                                      border: `1px solid ${workflowStyle.border}`,
                                      padding: "6px 10px",
                                      borderRadius: "999px",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {getWorkflowDisplay(device.workflowStatus)}
                                  </span>
                                </td>

                                <td style={{ padding: "14px", borderTop: "1px solid #eef2f7", background: "#ffffff" }}>
                                  {reviewable ? (
                                    <Link
                                      to="/review-devices"
                                      className="btn-link secondary"
                                      style={{ minHeight: "38px", fontSize: "12px", padding: "0 12px" }}
                                    >
                                      Open Review
                                    </Link>
                                  ) : (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: "38px",
                                        padding: "0 12px",
                                        borderRadius: "999px",
                                        background: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        color: "#64748b",
                                        fontWeight: 800,
                                        fontSize: "12px",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      Status locked
                                    </span>
                                  )}
                                </td>
                              </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                )}
              </div>
            </section>
          </div>
        </main>

        <AppFooter />
      </div>
  );
}



