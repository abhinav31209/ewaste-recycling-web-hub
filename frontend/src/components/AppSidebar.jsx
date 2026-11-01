import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppSidebar() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const pathname = location.pathname;
  const authenticatedPaths = [
    "/dashboard",
    "/submit-device",
    "/my-devices",
    "/data-retrieval",
    "/payments",
    "/staff-dashboard",
    "/review-devices",
    "/staff-orders",
    "/staff-drafts",
    "/admin-dashboard",
    "/manage-accounts",
    "/admin-reports",
    "/admin-devices",
  ];
  const shouldShowSidebar =
    isAuthenticated &&
    (authenticatedPaths.includes(pathname) || pathname.startsWith("/devices/"));

  const loginRole = user?.role || "OWNER";
  const isOwner = loginRole === "OWNER";
  const isStaff = loginRole === "STAFF";

  useEffect(() => {
    if (!shouldShowSidebar) {
      document.body.classList.remove("authenticated-shell");
      return;
    }

    document.body.classList.add("authenticated-shell");
    return () => document.body.classList.remove("authenticated-shell");
  }, [shouldShowSidebar]);

  const navItems = useMemo(() => {
    if (!shouldShowSidebar) return [];

    if (isOwner) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Submit Device", path: "/submit-device" },
        { label: "My Devices", path: "/my-devices" },
        { label: "Data Retrieval", path: "/data-retrieval" },
        { label: "Payments", path: "/payments" },
      ];
    }

    if (isStaff) {
      return [
        { label: "Staff Dashboard", path: "/staff-dashboard" },
        { label: "Review Devices", path: "/review-devices" },
        { label: "Orders", path: "/staff-orders" },
        { label: "Staff Drafts", path: "/staff-drafts" },
        { label: "Reports", path: "/admin-reports" },
      ];
    }

    return [
      { label: "Admin Dashboard", path: "/admin-dashboard" },
      { label: "Manage Accounts", path: "/manage-accounts" },
      { label: "Review Devices", path: "/review-devices" },
      { label: "Device Database", path: "/admin-devices" },
      { label: "Orders", path: "/staff-orders" },
      { label: "Staff Drafts", path: "/staff-drafts" },
      { label: "Reports", path: "/admin-reports" },
    ];
  }, [shouldShowSidebar, isOwner, isStaff]);

  const sidebarMeta = isOwner
    ? {
        eyebrow: "Owner",
        title: "Device workspace",
        label: "Navigation",
      }
    : isStaff
    ? {
        eyebrow: "Staff",
        title: "Review workspace",
        label: "Workflow Links",
      }
    : {
        eyebrow: "Admin",
        title: "Platform workspace",
        label: "Admin Links",
      };

  if (!shouldShowSidebar) return null;

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-hero">
        <div className="app-sidebar-eyebrow">{sidebarMeta.eyebrow}</div>
        <div className="app-sidebar-title">{sidebarMeta.title}</div>
      </div>

      <div className="app-sidebar-label">{sidebarMeta.label}</div>
      <div className="app-sidebar-links">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`app-sidebar-link${isActive ? " active" : ""}`}
            >
              <span className="app-sidebar-link-dot" aria-hidden="true" />
              <span className="app-sidebar-link-text">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
