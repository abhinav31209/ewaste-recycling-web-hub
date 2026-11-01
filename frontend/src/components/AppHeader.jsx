import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppSidebar from "./AppSidebar";
import BrandMark from "./BrandMark";

export default function AppHeader() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user, signOut } = useAuth();

  const username = user?.email || "User";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header
        className="app-topbar"
        style={{
          height: "72px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BrandMark />
          <span style={{ fontWeight: 700, fontSize: "20px", color: "#0f172a" }}>
            eWaste Hub
          </span>
        </div>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: "14px",
          }}
        >
          {!isAuthenticated ? (
            <>
              <Link
                to="/"
                style={{ textDecoration: "none", color: "#475569", fontWeight: 500 }}
              >
                Home
              </Link>

              <Link
                to="/login"
                style={{ textDecoration: "none", color: "#475569", fontWeight: 500 }}
              >
                Login
              </Link>

              <Link to="/register" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Register
                </button>
              </Link>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "999px",
                  background: "#3b82f6",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {(username.charAt(0) || "U").toUpperCase()}
              </div>

              <span style={{ color: "#475569", fontWeight: 500 }}>{username}</span>

              <button
                onClick={handleLogout}
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: loading ? "wait" : "pointer",
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>

      <AppSidebar />
    </>
  );
}
