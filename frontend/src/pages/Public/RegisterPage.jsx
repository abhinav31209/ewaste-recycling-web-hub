import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import BrandMark from "../../components/BrandMark.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { register } from "../../services/api.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const path =
        user?.role === "ADMIN"
          ? "/admin-dashboard"
          : user?.role === "STAFF"
          ? "/staff-dashboard"
          : "/dashboard";
      navigate(path, { replace: true });
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
    setMessage("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await register(formData.email, formData.password);

      setMessage("Account created successfully. Redirecting to sign in...");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <AppHeader />

      <main className="auth-shell">
        <div className="auth-layout">
          <section className="auth-info-panel hero-green">
            <div className="auth-info-eyebrow">Start your device workflow</div>
            <h1 className="auth-info-title">Create your eWaste Hub account</h1>
            <p className="auth-info-description">
              Submit devices, receive staff-reviewed routes, and continue into resale, recycling,
              or secure data retrieval workflows.
            </p>

            <div className="auth-workflow-list">
              {[
                {
                  title: "Submit device",
                  copy: "Add device name, brand, type, and condition.",
                },
                {
                  title: "Staff review",
                  copy: "Staff classify and route each device.",
                },
                {
                  title: "Continue the outcome",
                  copy: "Follow resale guidance, recycling, or secure retrieval when available.",
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
                Create Account
              </h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: 1.7 }}>
                Join eWaste Hub and start managing devices responsibly.
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

              <div className="auth-field">
                <label>Confirm Password</label>
                <input
                  className="auth-input"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" disabled={loading} className="auth-primary-button">
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="auth-divider">
              <div />
              <span>Optional provider</span>
              <div />
            </div>

            <button
              type="button"
              disabled
              title="Google login is not available yet"
              className="auth-secondary-button"
            >
              Login with Google (Coming Soon)
            </button>

            {message && (
              <div
                style={{
                  marginTop: "16px",
                  color: "#059669",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {message}
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <p
              style={{
                textAlign: "center",
                marginTop: "18px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              Already have an account?{" "}
              <Link to="/login" className="auth-muted-link">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
