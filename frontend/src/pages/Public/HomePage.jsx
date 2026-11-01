import { Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import BrandMark from "../../components/BrandMark.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const workflowSteps = [
  {
    title: "Submit device",
    copy: "Add the basic device details and condition.",
  },
  {
    title: "Staff review",
    copy: "Each record is checked and prepared for the next route.",
  },
  {
    title: "Route decision",
    copy: "Devices move into current, rare, recycle, or follow-up workflows.",
  },
  {
    title: "Data retrieval or resale",
    copy: "Continue secure retrieval, recycling, or partner guidance when available.",
  },
];

const routeCards = [
  {
    title: "Current / Rare",
    copy: "Partner guidance and resale value routes for devices that may still hold market value.",
    accent: "blue",
  },
  {
    title: "Recycle",
    copy: "Free data wipe preparation before retrieval or ethical recycling handling.",
    accent: "green",
  },
  {
    title: "Secure Data Retrieval",
    copy: "Paid retrieval request after staff preparation and owner payment confirmation.",
    accent: "teal",
  },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath =
    user?.role === "ADMIN"
      ? "/admin-dashboard"
      : user?.role === "STAFF"
        ? "/staff-dashboard"
        : "/dashboard";

  const primaryLink = isAuthenticated
    ? user?.role === "OWNER"
      ? "/submit-device"
      : dashboardPath
    : "/register";

  const primaryLabel = isAuthenticated
    ? user?.role === "OWNER"
      ? "Submit Your Device"
      : "Open Workspace"
    : "Submit Your Device";

  return (
    <div className="app-page home-page-shell">
      <AppHeader />

      <main className="home-page-main">
        <section className="home-hero">
          <div className="home-hero-grid">
            <div className="home-hero-copy">
              <div className="home-hero-eyebrow">eWaste Hub</div>
              <h1>Turn old electronics into secure value</h1>
              <p>
                Submit devices, receive staff-reviewed routes, and manage recycling, resale, and
                secure data retrieval from one platform.
              </p>

              <div className="home-hero-actions">
                <Link to={primaryLink} className="btn-link secondary">
                  {primaryLabel}
                </Link>
                {!isAuthenticated && (
                  <Link to="/login" className="btn-link soft">
                    Login
                  </Link>
                )}
              </div>
            </div>

            <div className="home-hero-card surface-card">
              <div className="home-hero-card-label">Device workflow</div>
              <div className="home-workflow-list">
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className="home-workflow-item">
                    <div className="home-workflow-badge">{index + 1}</div>
                    <div>
                      <div className="home-workflow-title">{step.title}</div>
                      <p>{step.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <span className="home-section-eyebrow">Routes after review</span>
            <h2>Choose the right outcome for every device</h2>
            <p>
              eWaste Hub helps owners understand what happens after staff review without repeating
              the same workflow explanation across the page.
            </p>
          </div>

          <div className="home-route-grid">
            {routeCards.map((card) => (
              <article key={card.title} className={`home-route-card home-route-card-${card.accent}`}>
                <div className="home-route-icon">
                  {card.title === "Current / Rare" ? "↗" : card.title === "Recycle" ? "♻" : "🔐"}
                </div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-cta">
          <div className="home-cta-brand">
            <BrandMark size={40} />
          </div>
          <h2>Ready to manage your old devices?</h2>
          <p>
            Create an account to submit your first device and follow its review outcome from one
            secure workspace.
          </p>
          <div className="home-cta-actions">
            <Link to={isAuthenticated ? primaryLink : "/register"} className="btn-link secondary">
              {isAuthenticated ? primaryLabel : "Create Account"}
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn-link soft">
                Login
              </Link>
            )}
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
