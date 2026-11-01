import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import BrandMark from "../../components/BrandMark.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { login } from "../../services/api.js";

const demoAccounts = [
  { role: "Owner", email: "owner@test.com", password: "123456" },
  { role: "Staff", email: "staff@test.com", password: "123456" },
  { role: "Admin", email: "admin@test.com", password: "admin123" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, applyAuthResponse } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getRedirectPath = (role) => {
    if (role === "STAFF") return "/staff-dashboard";
    if (role === "ADMIN") return "/admin-dashboard";
    return "/dashboard";
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const data = await login(formData.email, formData.password);
      const resolvedUser = applyAuthResponse(data);

      navigate(getRedirectPath(resolvedUser?.role || "OWNER"), { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <AppHeader />

      <main className="auth-shell">
        <div className="auth-layout">
          <section className="auth-info-panel hero-ink">
            <div className="auth-info-eyebrow">Secure workspace</div>
            <h1 className="auth-info-title">Welcome back to eWaste Hub</h1>
            <p className="auth-info-description">
              Sign in to track submitted devices, review outcomes, retrieval requests, and
              workspace actions from one account.
            </p>

            <div className="auth-workflow-list">
              {[
                {
                  title: "Owner dashboard",
                  copy: "Track submitted devices and next actions.",
                },
                {
                  title: "Secure retrieval",
                  copy: "Manage data retrieval requests and access windows.",
                },
                {
                  title: "Staff / admin routing",
                  copy: "Accounts are routed to the correct workspace after sign in.",
                },
              ].map((item, index) => (
                <div key={item.title} className="auth-workflow-item">
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.16)",
                      color: "#fff",
                      fontWeight: 800,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: "#fff" }}>{item.title}</div>
                    <div style={{ marginTop: "5px", color: "rgba(255,255,255,0.82)", lineHeight: 1.65 }}>
                      {item.copy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="auth-card surface-card">
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div className="auth-logo-mark">
                <BrandMark size={38} />
              </div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "34px", color: "#0f172a" }}>
                Welcome Back
              </h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: 1.7 }}>
                Sign in and we will route you to the correct workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>Email address</label>
                <input
                  className="auth-input"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  className="auth-input"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" disabled={loading} className="auth-primary-button">
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {error && <div className="auth-error">{error}</div>}

            <div className="demo-account-panel">
              <div className="demo-account-title">Demo accounts</div>
              <p className="demo-account-help">Click one to fill the login form for testing.</p>
              <div className="demo-account-list">
                {demoAccounts.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    className="demo-account-button"
                    onClick={() =>
                      setFormData({
                        email: account.email,
                        password: account.password,
                      })
                    }
                  >
                    <span>{account.role}</span>
                    <small>{account.email}</small>
                  </button>
                ))}
              </div>
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: "18px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              Don&apos;t have an account?{" "}
              <Link to="/register" className="auth-muted-link">
                Sign up
              </Link>
            </p>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
