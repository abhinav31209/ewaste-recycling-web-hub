import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import { fetchAdminUsers, fetchUnknownDevices } from "../../services/api.js";
import { getAccountStatusStyle } from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

function getRoleStyle(role) {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") {
    return {
      label: "ADMIN",
      bg: "#fef2f2",
      color: "#b91c1c",
      border: "#fecaca",
    };
  }

  if (normalized === "STAFF") {
    return {
      label: "STAFF",
      bg: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
    };
  }

  return {
    label: normalized || "OWNER",
    bg: "#ecfdf5",
    color: "#15803d",
    border: "#bbf7d0",
  };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [unknownDevices, setUnknownDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const [usersData, queueData] = await Promise.all([
          fetchAdminUsers(),
          fetchUnknownDevices(),
        ]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setUnknownDevices(Array.isArray(queueData) ? queueData : []);
      } catch (err) {
        setError(err.message || "Failed to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const admins = users.filter((user) => String(user.role).toUpperCase() === "ADMIN").length;
    const staff = users.filter((user) => String(user.role).toUpperCase() === "STAFF").length;
    const disabled = users.filter((user) => String(user.status).toLowerCase() === "disabled").length;

    return {
      totalUsers: users.length,
      admins,
      staff,
      disabled,
      pendingReview: unknownDevices.length,
    };
  }, [users, unknownDevices]);

  const sortedUsers = useMemo(() => sortNewestFirst(users), [users]);

  return (
    <div className="app-page">
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <section className="page-hero hero-ink">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>
              Admin Console
            </p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px", lineHeight: 1.1 }}>
              Platform overview
            </h1>
            <p style={{ margin: 0, maxWidth: "640px", lineHeight: 1.7, opacity: 0.95 }}>
              Monitor account distribution, review workload, and jump into the most important
              admin actions from one dashboard.
            </p>
          </section>

          {error && (
            <div
              style={{
                background: "#fff",
                padding: "16px 18px",
                color: "#dc2626",
                fontWeight: 600,
                border: "1px solid #fecaca",
                borderRadius: "16px",
              }}
            >
              {error}
            </div>
          )}

          <section className="metric-grid">
            {[
              { label: "Total Users", value: summary.totalUsers, color: "#0f172a", icon: "👥", tint: "#f8fafc" },
              { label: "Admins", value: summary.admins, color: "#dc2626", icon: "🛡️", tint: "#fef2f2" },
              { label: "Staff Members", value: summary.staff, color: "#2563eb", icon: "🧰", tint: "#eff6ff" },
              { label: "Disabled Accounts", value: summary.disabled, color: "#b45309", icon: "⛔", tint: "#fff7ed" },
              { label: "Pending Reviews", value: summary.pendingReview, color: "#15803d", icon: "📦", tint: "#ecfdf5" },
            ].map((item) => (
              <div
                key={item.label}
                className="metric-card"
                style={{
                  minHeight: "148px",
                  display: "grid",
                  alignContent: "space-between",
                  gap: "14px",
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
                  <div className="metric-label">{item.label}</div>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: item.color,
                    }}
                  >
                    {loading ? "..." : item.value}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="split-layout" style={{ gridTemplateColumns: "1.2fr 0.8fr", alignItems: "start" }}>
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
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: "6px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Recent Accounts</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                    Review the latest platform accounts and jump into role or status management.
                  </p>
                </div>
                <Link
                  to="/manage-accounts"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "38px",
                    padding: "0 14px",
                    borderRadius: "999px",
                    background: "#f8fafc",
                    border: "1px solid #dbeafe",
                    color: "#2563eb",
                    fontWeight: 800,
                    fontSize: "13px",
                  }}
                >
                  Manage Accounts
                </Link>
              </div>

              {loading ? (
                <div style={{ padding: "24px 20px", color: "#64748b" }}>Loading accounts...</div>
              ) : users.length === 0 ? (
                <div style={{ padding: "24px 20px", color: "#94a3b8" }}>
                  No user accounts found.
                </div>
              ) : (
                <div style={{ padding: "12px 14px 14px" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ textAlign: "left" }}>
                        <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>
                          Account
                        </th>
                        <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>
                          Role
                        </th>
                        <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.slice(0, 6).map((user) => {
                        const statusStyle = getAccountStatusStyle(user.status);
                        const roleStyle = getRoleStyle(user.role);

                        return (
                          <tr key={user.id} style={{ transition: "background 0.18s ease" }}>
                            <td
                              style={{
                                padding: "14px",
                                borderTop: "1px solid #eef2f7",
                                background: "#ffffff",
                              }}
                            >
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                {user.email || user.username || "-"}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "14px",
                                borderTop: "1px solid #eef2f7",
                                background: "#ffffff",
                              }}
                            >
                              <span
                                style={{
                                  background: roleStyle.bg,
                                  color: roleStyle.color,
                                  border: `1px solid ${roleStyle.border}`,
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                }}
                              >
                                {roleStyle.label}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "14px",
                                borderTop: "1px solid #eef2f7",
                                background: "#ffffff",
                              }}
                            >
                              <span
                                style={{
                                  background: statusStyle.bg,
                                  color: statusStyle.color,
                                  border: `1px solid ${statusStyle.border}`,
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                }}
                              >
                                {statusStyle.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="stack">
              <div
                className="surface-card"
                style={{
                  padding: "20px",
                  borderColor: "#cbd5e1",
                  boxShadow: "0 18px 36px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ display: "grid", gap: "6px", marginBottom: "14px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#64748b",
                    }}
                  >
                    Admin actions
                  </div>
                  <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Quick Actions</h2>
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  <Link
                    to="/manage-accounts"
                    className="btn-link dark"
                    style={{ minHeight: "48px" }}
                  >
                    Open Account Management
                  </Link>
                  <Link
                    to="/review-devices"
                    className="btn-link teal"
                    style={{ minHeight: "48px" }}
                  >
                    Review Pending Devices
                  </Link>
                  <Link
                    to="/admin-devices"
                    className="btn-link soft"
                    style={{ minHeight: "48px" }}
                  >
                    Open Device Database
                  </Link>
                  <Link
                    to="/admin-reports"
                    className="btn-link purple"
                    style={{ minHeight: "48px" }}
                  >
                    Open Reports
                  </Link>
                </div>
              </div>

              <div className="surface-card" style={{ padding: "20px" }}>
                <div style={{ display: "grid", gap: "6px", marginBottom: "14px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#64748b",
                    }}
                  >
                    Admin checklist
                  </div>
                  <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Admin Checklist</h2>
                </div>
                <div style={{ display: "grid", gap: "12px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                  <div>1. Use account management to assign or revoke staff and admin roles.</div>
                  <div>2. Review disabled accounts and unresolved moderation backlog.</div>
                  <div>3. Check the review queue regularly to keep device moderation current.</div>
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
