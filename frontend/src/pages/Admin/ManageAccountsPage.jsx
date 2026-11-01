import { useEffect, useMemo, useState } from "react";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import DashboardSelect from "../../components/DashboardSelect.jsx";
import { fetchAdminUsers, updateAdminUserRole, updateAdminUserStatus } from "../../services/api.js";
import { getAccountStatusStyle } from "../../services/deviceInsights.js";

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  color: "#0f172a",
};

const roleOptions = [
  { value: "OWNER", label: "OWNER" },
  { value: "STAFF", label: "STAFF" },
  { value: "ADMIN", label: "ADMIN" },
];

const statusOptions = [
  { value: "active", label: "active" },
  { value: "disabled", label: "disabled" },
];

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

export default function ManageAccountsPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeUserFilter, setActiveUserFilter] = useState("all");

  const [editForm, setEditForm] = useState({
    role: "OWNER",
    status: "active",
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role || "OWNER",
      status: user.status || "active",
    });
    setMessage("");
    setError("");
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");
      await updateAdminUserRole(selectedUser.id, editForm.role);

      setMessage("User role updated successfully.");
      await fetchUsers();

      setSelectedUser((prev) =>
          prev ? { ...prev, role: editForm.role } : prev
      );
    } catch (err) {
      setError(err.message || "Failed to update role.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      setError("");
      setMessage("");
      await updateAdminUserStatus(selectedUser.id, editForm.status);

      setMessage("User status updated successfully.");
      await fetchUsers();

      setSelectedUser((prev) =>
          prev ? { ...prev, status: editForm.status } : prev
      );
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const accountSummary = useMemo(() => {
    const owners = users.filter((user) => String(user.role || "").toUpperCase() === "OWNER").length;
    const staff = users.filter((user) => String(user.role || "").toUpperCase() === "STAFF").length;
    const admins = users.filter((user) => String(user.role || "").toUpperCase() === "ADMIN").length;
    const disabled = users.filter((user) => String(user.status || "").toLowerCase() === "disabled").length;

    return {
      total: users.length,
      owners,
      staff,
      admins,
      disabled,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (activeUserFilter === "owners") {
      return users.filter((user) => String(user.role || "").toUpperCase() === "OWNER");
    }

    if (activeUserFilter === "staff") {
      return users.filter((user) => String(user.role || "").toUpperCase() === "STAFF");
    }

    if (activeUserFilter === "admins") {
      return users.filter((user) => String(user.role || "").toUpperCase() === "ADMIN");
    }

    if (activeUserFilter === "disabled") {
      return users.filter((user) => String(user.status || "").toUpperCase() === "DISABLED");
    }

    return users;
  }, [activeUserFilter, users]);

  const accountListTitle = useMemo(() => {
    if (activeUserFilter === "owners") return "Owner Accounts";
    if (activeUserFilter === "staff") return "Staff Accounts";
    if (activeUserFilter === "admins") return "Admin Accounts";
    if (activeUserFilter === "disabled") return "Disabled Accounts";
    return "User Accounts";
  }, [activeUserFilter]);

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
                Manage accounts
              </h1>
              <p style={{ margin: 0, maxWidth: "640px", lineHeight: 1.7, opacity: 0.95 }}>
                Review account distribution, choose a user, and apply role or status updates from one controlled workflow.
              </p>
            </section>

            <section className="metric-grid">
              {[
                { key: "all", label: "Total Users", value: accountSummary.total, color: "#0f172a", icon: "👥", tint: "#f8fafc" },
                { key: "owners", label: "Owners", value: accountSummary.owners, color: "#15803d", icon: "🙍", tint: "#ecfdf5" },
                { key: "staff", label: "Staff", value: accountSummary.staff, color: "#2563eb", icon: "🧰", tint: "#eff6ff" },
                { key: "admins", label: "Admins", value: accountSummary.admins, color: "#b91c1c", icon: "🛡️", tint: "#fef2f2" },
                { key: "disabled", label: "Disabled", value: accountSummary.disabled, color: "#b45309", icon: "⛔", tint: "#fff7ed" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`metric-card metric-filter-card interactive-metric-card${activeUserFilter === item.key ? " active" : ""}`}
                  onClick={() => setActiveUserFilter(item.key)}
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
                    <div className="metric-label" style={{ fontWeight: activeUserFilter === item.key ? 800 : 700 }}>
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: item.color,
                        opacity: activeUserFilter === item.key ? 1 : 0.92,
                      }}
                    >
                      {loading ? "..." : item.value}
                    </div>
                  </div>
                </button>
              ))}
            </section>

            {error && (
                <div
                    style={{
                      background: "#fff5f5",
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
                    }}
                >
                  <div style={{ display: "grid", gap: "6px" }}>
                    <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{accountListTitle}</h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                      Select a user to manage access, role assignments, and account status.
                    </p>
                  </div>
                </div>

                {loading ? (
                    <div style={{ padding: "24px 20px", color: "#64748b" }}>
                      Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: "24px 20px", color: "#94a3b8" }}>
                      No users found.
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: "24px 20px", color: "#94a3b8" }}>
                      No accounts in this category.
                    </div>
                ) : (
                    <div style={{ padding: "12px 14px 14px", overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Account</th>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Role</th>
                          <th style={{ padding: "12px 14px", fontSize: "12px", color: "#94a3b8", fontWeight: 800 }}>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.map((user) => {
                          const statusStyle = getAccountStatusStyle(user.status);
                          const roleStyle = getRoleStyle(user.role);
                          const isSelected = selectedUser?.id === user.id;

                          return (
                            <tr
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              style={{
                                cursor: "pointer",
                                background: isSelected ? "#eff6ff" : "#fff",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px",
                                  borderTop: "1px solid #eef2f7",
                                  background: isSelected ? "#eff6ff" : "#fff",
                                  boxShadow: isSelected ? "inset 3px 0 0 #2563eb" : "none",
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
                                  background: isSelected ? "#eff6ff" : "#fff",
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
                                  background: isSelected ? "#eff6ff" : "#fff",
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
                      Account workflow
                    </div>
                    <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>
                      Account Control Panel
                    </h2>
                  </div>

                  {!selectedUser ? (
                      <div
                          style={{
                            padding: "18px",
                            borderRadius: "16px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "grid",
                            gap: "14px",
                          }}
                      >
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                          Select a user to begin
                        </div>
                        <div style={{ color: "#475569", lineHeight: 1.6 }}>
                          Choose an account from the list to review permissions and account status.
                        </div>
                        <div style={{ display: "grid", gap: "10px" }}>
                          {[
                            { step: "1", title: "Select account", body: "Choose a user from the table on the left." },
                            { step: "2", title: "Review role and status", body: "Check the current access level before making edits." },
                            { step: "3", title: "Apply account changes", body: "Update role or status from this control panel." },
                          ].map((item) => (
                            <div
                              key={item.step}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "34px minmax(0, 1fr)",
                                gap: "12px",
                                alignItems: "start",
                                padding: "12px 14px",
                                borderRadius: "14px",
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "999px",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  display: "grid",
                                  placeItems: "center",
                                  fontWeight: 800,
                                  fontSize: "13px",
                                }}
                              >
                                {item.step}
                              </div>
                              <div style={{ display: "grid", gap: "4px" }}>
                                <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
                                <div style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6 }}>{item.body}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                  ) : (
                      <>
                        <div
                            style={{
                              marginBottom: "16px",
                              padding: "16px",
                              borderRadius: "14px",
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              display: "grid",
                              gap: "10px",
                            }}
                        >
                          <div
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                fontWeight: 800,
                              }}
                          >
                            Selected account
                          </div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>
                            {selectedUser.email || selectedUser.username || "-"}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {(() => {
                              const roleStyle = getRoleStyle(selectedUser.role);
                              const statusStyle = getAccountStatusStyle(selectedUser.status);
                              return (
                                <>
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
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: "16px" }}>
                          <section
                            style={{
                              display: "grid",
                              gap: "10px",
                              padding: "16px",
                              borderRadius: "16px",
                              border: "1px solid #e5e7eb",
                              background: "#ffffff",
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                              Step 1
                            </div>
                            <label style={labelStyle}>Choose role</label>
                            <DashboardSelect
                              inputId="manage-account-role-select"
                              name="role"
                              options={roleOptions}
                              value={roleOptions.find((option) => option.value === editForm.role) ?? roleOptions[0]}
                              onChange={(selectedOption) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  role: selectedOption?.value || "OWNER",
                                }))
                              }
                            />
                          </section>

                          <section
                            style={{
                              display: "grid",
                              gap: "10px",
                              padding: "16px",
                              borderRadius: "16px",
                              border: "1px solid #e5e7eb",
                              background: "#ffffff",
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                              Step 2
                            </div>
                            <label style={labelStyle}>Choose status</label>
                            <DashboardSelect
                              inputId="manage-account-status-select"
                              name="status"
                              options={statusOptions}
                              value={
                                statusOptions.find((option) => option.value === editForm.status) ??
                                statusOptions[0]
                              }
                              onChange={(selectedOption) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  status: selectedOption?.value || "active",
                                }))
                              }
                            />
                          </section>

                          <section
                            style={{
                              display: "grid",
                              gap: "10px",
                              padding: "16px",
                              borderRadius: "16px",
                              border: "1px solid #e5e7eb",
                              background: "#ffffff",
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                              Step 3
                            </div>
                            <div style={{ color: "#475569", lineHeight: 1.6 }}>
                              Apply the selected role or status change for this account.
                            </div>

                            <div style={{ display: "grid", gap: "10px" }}>
                              <button
                                  type="button"
                                  onClick={handleUpdateRole}
                                  disabled={actionLoading}
                                  className="btn-link dark"
                                  style={{
                                    border: "none",
                                    width: "100%",
                                    minHeight: "48px",
                                    cursor: actionLoading ? "wait" : "pointer",
                                    opacity: actionLoading ? 0.7 : 1,
                                  }}
                              >
                                Update Role
                              </button>

                              <button
                                  type="button"
                                  onClick={handleUpdateStatus}
                                  disabled={actionLoading}
                                  className="btn-link soft"
                                  style={{
                                    width: "100%",
                                    minHeight: "48px",
                                    cursor: actionLoading ? "wait" : "pointer",
                                    opacity: actionLoading ? 0.7 : 1,
                                  }}
                              >
                                Update Status
                              </button>
                            </div>
                          </section>
                        </div>
                      </>
                  )}
                  <div
                    style={{
                      marginTop: "18px",
                      paddingTop: "18px",
                      borderTop: "1px solid #e5e7eb",
                      display: "grid",
                      gap: "10px",
                    }}
                  >
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
                    <div style={{ display: "grid", gap: "10px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                      <div>1. Select a user before applying account changes.</div>
                      <div>2. Use role updates to control permissions.</div>
                      <div>3. Use status updates to activate or disable accounts.</div>
                    </div>
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
