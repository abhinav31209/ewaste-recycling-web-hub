import { useEffect, useMemo, useState } from "react";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import {
  fetchAdminDevices,
  fetchAdminPayments,
  fetchAdminUsers,
  fetchReferralFees,
  fetchHiddenStaffDevices,
  fetchStaffRecycleProcessingDevices,
  fetchStaffOrders,
  fetchStaffPayments,
  fetchUnknownDevices,
} from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const CLASSIFICATIONS = ["UNKNOWN", "CURRENT", "RECYCLE", "RARE"];

function getPaymentSummary(payments) {
  const summary = {
    total: payments.length,
    totalAmount: 0,
    byMethod: {
      stripe: 0,
      paypal: 0,
    },
  };

  payments.forEach((payment) => {
    const amount = Number(payment.amount || 0);
    summary.totalAmount += Number.isFinite(amount) ? amount : 0;

    const provider = String(payment.provider || "").toLowerCase();
    if (provider === "stripe" || provider === "paypal") {
      summary.byMethod[provider] += 1;
    }
  });

  summary.totalAmount = Number(summary.totalAmount.toFixed(2));
  return summary;
}

function getReferralSummary(referrals) {
  const summary = {
    total: referrals.length,
    totalAmount: 0,
    byStatus: {
      pending: 0,
      confirmed: 0,
      paid: 0,
      cancelled: 0,
    },
    byPartner: {
      cex: 0,
      ebay: 0,
    },
  };

  referrals.forEach((referral) => {
    const amount = Number(referral.estimatedFee || 0);
    summary.totalAmount += Number.isFinite(amount) ? amount : 0;

    const status = String(referral.status || "").toLowerCase();
    if (status in summary.byStatus) {
      summary.byStatus[status] += 1;
    }

    const partner = String(referral.thirdPartyName || "").toLowerCase();
    if (partner === "cex") {
      summary.byPartner.cex += 1;
    } else if (partner === "ebay") {
      summary.byPartner.ebay += 1;
    }
  });

  summary.totalAmount = Number(summary.totalAmount.toFixed(2));
  return summary;
}

function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
        <span style={{ color: "#475569", fontWeight: 600 }}>{label}</span>
        <span style={{ color: "#64748b" }}>
          {value} ({pct}%)
        </span>
      </div>
      <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px" }} />
      </div>
    </div>
  );
}

function ReportCard({ title, description, children, highlight = false, accent = "#dbeafe" }) {
  return (
    <div
      className="surface-card"
      style={{
        padding: "22px",
        borderColor: highlight ? accent : "#e5e7eb",
        boxShadow: highlight ? "0 18px 36px rgba(15,23,42,0.06)" : "0 10px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ display: "grid", gap: "6px", marginBottom: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>{title}</h2>
        {description && (
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6, fontSize: "14px" }}>{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function HighlightBox({ title, amount, color, background, border, body, meta = [] }) {
  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div
        style={{
          padding: "18px",
          borderRadius: "16px",
          background,
          border: `1px solid ${border}`,
          display: "grid",
          gap: "8px",
        }}
      >
        <div style={{ fontSize: "12px", color: "#64748b" }}>{title}</div>
        <div style={{ fontSize: "30px", fontWeight: 800, color }}>£{amount}</div>
        <div style={{ color: "#475569", lineHeight: 1.6 }}>{body}</div>
      </div>
      {meta.length > 0 && (
        <div style={{ display: "grid", gap: "8px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
          {meta.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [unknownDevices, setUnknownDevices] = useState([]);
  const [hiddenDevices, setHiddenDevices] = useState([]);
  const [recycleQueue, setRecycleQueue] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentWarning, setPaymentWarning] = useState("");
  const [referralWarning, setReferralWarning] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setPaymentWarning("");
        setReferralWarning("");

        const [queueResult, recycleResult, hiddenResult, orderResult, paymentResult, referralResult] = await Promise.allSettled([
          fetchUnknownDevices(),
          fetchStaffRecycleProcessingDevices(),
          fetchHiddenStaffDevices(),
          fetchStaffOrders(),
          isAdmin ? fetchAdminPayments() : fetchStaffPayments(),
          fetchReferralFees(),
        ]);

        if (queueResult.status !== "fulfilled") {
          throw queueResult.reason;
        }

        if (orderResult.status !== "fulfilled") {
          throw orderResult.reason;
        }

        let deviceData = [];
        let userData = [];

        if (isAdmin) {
          const [deviceResult, userResult] = await Promise.allSettled([
            fetchAdminDevices(),
            fetchAdminUsers(),
          ]);

          if (deviceResult.status !== "fulfilled") {
            throw deviceResult.reason;
          }

          if (userResult.status !== "fulfilled") {
            throw userResult.reason;
          }

          deviceData = deviceResult.value;
          userData = userResult.value;
        }

        if (paymentResult.status === "fulfilled") {
          setPayments(Array.isArray(paymentResult.value) ? paymentResult.value : []);
        } else {
          setPayments([]);
          setPaymentWarning("Payment records are temporarily unavailable.");
        }

        if (referralResult.status === "fulfilled") {
          setReferrals(Array.isArray(referralResult.value) ? referralResult.value : []);
        } else {
          setReferrals([]);
          setReferralWarning("Referral fee records are temporarily unavailable.");
        }

        setDevices(Array.isArray(deviceData) ? deviceData : []);
        setUsers(Array.isArray(userData) ? userData : []);
        setUnknownDevices(Array.isArray(queueResult.value) ? queueResult.value : []);
        setRecycleQueue(
          recycleResult.status === "fulfilled" && Array.isArray(recycleResult.value)
            ? recycleResult.value
            : []
        );
        setHiddenDevices(
          hiddenResult.status === "fulfilled" && Array.isArray(hiddenResult.value)
            ? hiddenResult.value
            : []
        );
        setOrders(Array.isArray(orderResult.value) ? orderResult.value : []);
      } catch (err) {
        setError(err.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const summary = useMemo(() => {
    const reportDevices = isAdmin ? devices : [...unknownDevices, ...recycleQueue, ...hiddenDevices];
    const classifications = Object.fromEntries(CLASSIFICATIONS.map((item) => [item, 0]));
    reportDevices.forEach((device) => {
      const key = String(device.classification || "UNKNOWN").toUpperCase();
      classifications[key] = (classifications[key] || 0) + 1;
    });

    const roles = { OWNER: 0, STAFF: 0, ADMIN: 0 };
    users.forEach((user) => {
      const key = String(user.role || "OWNER").toUpperCase();
      roles[key] = (roles[key] || 0) + 1;
    });

    const statuses = { active: 0, disabled: 0 };
    users.forEach((user) => {
      const key = String(user.status || "active").toLowerCase();
      statuses[key] = (statuses[key] || 0) + 1;
    });

    const deviceProcessing = {
      partnerReady: 0,
      recyclePipeline: 0,
      underReview: 0,
      dataWipePending: 0,
      dataWipeCompleted: 0,
      retrievalAvailable: 0,
    };

    const retrievalOrders = orders.filter(
      (order) => String(order.type || "").toUpperCase() === "DATA_RETRIEVAL"
    );
    const fulfilledOrders = retrievalOrders.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      return status === "FULFILLED" || status === "RESTORED";
    });
    const activeAccess = retrievalOrders.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      const expiry = order.expiresAt ? new Date(order.expiresAt).getTime() : 0;
      return (status === "FULFILLED" || status === "RESTORED") && expiry > Date.now();
    });
    const pendingFulfillment = retrievalOrders.filter(
      (order) => {
        const status = String(order.status || "").toUpperCase();
        return status === "PAYMENT_PENDING" || status === "CREATED";
      }
    );
    const paidOrders = retrievalOrders.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      return status === "READY_FOR_FULFILLMENT" || status === "PAID";
    });
    const restoredOrders = retrievalOrders.filter(
      (order) => String(order.status || "").toUpperCase() === "RESTORED"
    );
    const expiredAccess = retrievalOrders.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      const expiry = order.expiresAt ? new Date(order.expiresAt).getTime() : 0;
      return (status === "FULFILLED" || status === "RESTORED") && expiry > 0 && expiry <= Date.now();
    });

    reportDevices.forEach((device) => {
      const key = String(device.classification || "UNKNOWN").toUpperCase();
      const dataWipeStatus = String(device.dataWipeStatus || "").toUpperCase();
      const retrievalAvailable = device.retrievalAvailable === true;
      if (key === "CURRENT" || key === "RARE") {
        deviceProcessing.partnerReady += 1;
      } else if (key === "RECYCLE") {
        deviceProcessing.recyclePipeline += 1;
      } else {
        deviceProcessing.underReview += 1;
      }
      if (dataWipeStatus === "PENDING") {
        deviceProcessing.dataWipePending += 1;
      }
      if (dataWipeStatus === "COMPLETED") {
        deviceProcessing.dataWipeCompleted += 1;
      }
      if (retrievalAvailable) {
        deviceProcessing.retrievalAvailable += 1;
      }
    });

    const estimatedRetrievalRevenue = deviceProcessing.recyclePipeline * 25;
    const paymentSummary = getPaymentSummary(payments);
    const referralSummary = getReferralSummary(referrals);
    const hiddenDraftMetrics = {
      total: hiddenDevices.length,
      hidden: hiddenDevices.length,
      currentRare: hiddenDevices.filter((device) => {
        const classification = String(device.classification || "").toUpperCase();
        return classification === "CURRENT" || classification === "RARE";
      }).length,
      recycle: hiddenDevices.filter(
        (device) => String(device.classification || "").toUpperCase() === "RECYCLE"
      ).length,
    };

    return {
      classifications,
      roles,
      statuses,
      deviceProcessing,
      retrievalOrders: retrievalOrders.length,
      fulfilledOrders: fulfilledOrders.length,
      paidOrders: paidOrders.length,
      restoredOrders: restoredOrders.length,
      activeAccess: activeAccess.length,
      expiredAccess: expiredAccess.length,
      pendingFulfillment: pendingFulfillment.length,
      estimatedRetrievalRevenue,
      hiddenDraftMetrics,
      paymentSummary,
      referralSummary,
    };
  }, [devices, hiddenDevices, isAdmin, orders, payments, recycleQueue, referrals, unknownDevices, users]);

  const heroClass = isAdmin ? "hero-ink" : "hero-blue";
  const heroTitle = isAdmin ? "Operational analytics" : "Workflow reports";
  const heroDescription = isAdmin
    ? "Review payments, processing status, referral value, and account activity from one place."
    : "Review queue activity, data wipe progress, payment readiness, fulfillment, and secure access windows.";

  const topMetrics = isAdmin
    ? [
        { label: "Total Devices", value: devices.length, color: "#0f172a", icon: "📦", tint: "#f8fafc" },
        { label: "Total Users", value: users.length, color: "#2563eb", icon: "👥", tint: "#eff6ff" },
        { label: "Payment Records", value: summary.paymentSummary.total, color: "#1d4ed8", icon: "💳", tint: "#eff6ff" },
        { label: "Referral Value", value: `£${summary.referralSummary.totalAmount}`, color: "#7c3aed", icon: "💸", tint: "#f5f3ff" },
      ]
    : [
        { label: "Data Wipe Pending", value: summary.deviceProcessing.dataWipePending, color: "#0f766e", icon: "🧼", tint: "#ecfeff" },
        { label: "Retrieval Available", value: summary.deviceProcessing.retrievalAvailable, color: "#16a34a", icon: "🗂️", tint: "#ecfdf5" },
        { label: "Payment Pending", value: summary.pendingFulfillment, color: "#d97706", icon: "💳", tint: "#fff7ed" },
        { label: "Fulfilled Orders", value: summary.fulfilledOrders, color: "#2563eb", icon: "✅", tint: "#eff6ff" },
      ];

  return (
    <div className="app-page">
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <section className={`page-hero ${heroClass}`}>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.85 }}>
              {isAdmin ? "Admin Reports" : "Staff Reports"}
            </p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px" }}>{heroTitle}</h1>
            <p style={{ margin: 0, maxWidth: "680px", lineHeight: 1.7, opacity: 0.92 }}>
              {heroDescription}
            </p>
          </section>

          {error && (
            <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: "16px", padding: "18px 20px", color: "#dc2626", fontWeight: 600 }}>
              {error}
            </div>
          )}

          {paymentWarning && (
            <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: "16px", padding: "18px 20px", color: "#b45309", fontWeight: 600 }}>
              {paymentWarning}
            </div>
          )}

          {referralWarning && (
            <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: "16px", padding: "18px 20px", color: "#b45309", fontWeight: 600 }}>
              {referralWarning}
            </div>
          )}

          <section className="metric-grid report-metric-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            {topMetrics.map((item) => (
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
                  <div style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1.1, color: item.color }}>
                    {loading ? "..." : item.value}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {isAdmin ? (
            <>
              <section className="split-layout" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                <ReportCard
                  title="Payment Pipeline Estimate"
                  description="A financial snapshot of recorded retrieval checkout activity."
                  highlight
                  accent="#bfdbfe"
                >
                  <HighlightBox
                    title="Payment records captured"
                    amount={summary.paymentSummary.totalAmount}
                    color="#1d4ed8"
                    background="#eff6ff"
                    border="#bfdbfe"
                    body={`Based on ${summary.paymentSummary.total} recorded payment item(s).`}
                    meta={[
                      `Stripe receipts: ${summary.paymentSummary.byMethod.stripe} • PayPal receipts: ${summary.paymentSummary.byMethod.paypal}`,
                      `Retrieval available: ${summary.deviceProcessing.retrievalAvailable} • Paid orders: ${summary.paidOrders} • Fulfilled: ${summary.fulfilledOrders}`,
                      `Estimated recycle pipeline exposure: £${summary.estimatedRetrievalRevenue}`,
                    ]}
                  />
                </ReportCard>

                <ReportCard
                  title="Referral Fee Outlook"
                  description="A financial view of current and rare resale referral value."
                  highlight
                  accent="#ddd6fe"
                >
                  <HighlightBox
                    title="Current + rare resale estimate"
                    amount={summary.referralSummary.totalAmount}
                    color="#7c3aed"
                    background="#f5f3ff"
                    border="#ddd6fe"
                    body={`Based on ${summary.referralSummary.total} tracked referral record(s).`}
                    meta={[
                      `Pending: ${summary.referralSummary.byStatus.pending} • Confirmed: ${summary.referralSummary.byStatus.confirmed} • Paid: ${summary.referralSummary.byStatus.paid}`,
                      `CeX referrals: ${summary.referralSummary.byPartner.cex} • eBay referrals: ${summary.referralSummary.byPartner.ebay}`,
                    ]}
                  />
                </ReportCard>
              </section>

              <section className="split-layout" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                <ReportCard
                  title="Device Classification Mix"
                  description="How the current device population is distributed across classification outcomes."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Unknown" value={summary.classifications.UNKNOWN} total={Math.max(devices.length, 1)} color="#94a3b8" />
                    <ProgressBar label="Current" value={summary.classifications.CURRENT} total={Math.max(devices.length, 1)} color="#2563eb" />
                    <ProgressBar label="Recycle" value={summary.classifications.RECYCLE} total={Math.max(devices.length, 1)} color="#16a34a" />
                    <ProgressBar label="Rare" value={summary.classifications.RARE} total={Math.max(devices.length, 1)} color="#7c3aed" />
                  </div>
                </ReportCard>

                <ReportCard
                  title="Device Processing Status"
                  description="Operational status across partner-ready, recycle, and review workloads."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Partner Ready" value={summary.deviceProcessing.partnerReady} total={Math.max(devices.length, 1)} color="#7c3aed" />
                    <ProgressBar label="Recycle Pipeline" value={summary.deviceProcessing.recyclePipeline} total={Math.max(devices.length, 1)} color="#2563eb" />
                    <ProgressBar label="Under Review" value={summary.deviceProcessing.underReview} total={Math.max(devices.length, 1)} color="#d97706" />
                  </div>
                </ReportCard>
              </section>

              <section className="split-layout" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                <ReportCard
                  title="User Distribution"
                  description="Current account distribution by role and active status."
                >
                  <div style={{ display: "grid", gap: "14px", marginBottom: "18px" }}>
                    <ProgressBar label="Owners" value={summary.roles.OWNER} total={Math.max(users.length, 1)} color="#16a34a" />
                    <ProgressBar label="Staff" value={summary.roles.STAFF} total={Math.max(users.length, 1)} color="#2563eb" />
                    <ProgressBar label="Admins" value={summary.roles.ADMIN} total={Math.max(users.length, 1)} color="#7c3aed" />
                  </div>
                  <div style={{ paddingTop: "18px", borderTop: "1px solid #e5e7eb", display: "grid", gap: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Account Status</div>
                    <ProgressBar label="Active" value={summary.statuses.active || 0} total={Math.max(users.length, 1)} color="#16a34a" />
                    <ProgressBar label="Disabled" value={summary.statuses.disabled || 0} total={Math.max(users.length, 1)} color="#ef4444" />
                  </div>
                </ReportCard>

                <ReportCard
                  title="Staff Draft Activity"
                  description="Hidden draft movement across current, rare, and recycle classifications."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Hidden Draft Records" value={summary.hiddenDraftMetrics.hidden} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#0f766e" />
                    <ProgressBar label="Current / Rare Drafts" value={summary.hiddenDraftMetrics.currentRare} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#7c3aed" />
                    <ProgressBar label="Recycle Drafts" value={summary.hiddenDraftMetrics.recycle} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#2563eb" />
                  </div>
                </ReportCard>
              </section>
            </>
          ) : (
            <>
              <section className="split-layout" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                <ReportCard
                  title="Retrieval Workflow Summary"
                  description="A quick overview of daily recycle processing and retrieval readiness."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Data Wipe Pending" value={summary.deviceProcessing.dataWipePending} total={Math.max(summary.deviceProcessing.recyclePipeline, 1)} color="#0f766e" />
                    <ProgressBar label="Retrieval Available" value={summary.deviceProcessing.retrievalAvailable} total={Math.max(summary.deviceProcessing.recyclePipeline, 1)} color="#16a34a" />
                    <ProgressBar label="Paid Retrieval Orders" value={summary.paidOrders} total={Math.max(summary.retrievalOrders, 1)} color="#2563eb" />
                    <ProgressBar label="Fulfilled Orders" value={summary.fulfilledOrders} total={Math.max(summary.retrievalOrders, 1)} color="#7c3aed" />
                  </div>
                </ReportCard>

                <ReportCard
                  title="Review Priorities"
                  description="Where staff attention is most likely needed next."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Unknown Queue" value={unknownDevices.length} total={Math.max(unknownDevices.length + summary.pendingFulfillment + summary.hiddenDraftMetrics.total, 1)} color="#d97706" />
                    <ProgressBar label="Payment Pending" value={summary.pendingFulfillment} total={Math.max(summary.retrievalOrders, 1)} color="#2563eb" />
                    <ProgressBar label="Current / Rare Drafts" value={summary.hiddenDraftMetrics.currentRare} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#7c3aed" />
                    <ProgressBar label="Recycle Drafts" value={summary.hiddenDraftMetrics.recycle} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#0f766e" />
                    <ProgressBar label="Hidden Drafts" value={summary.hiddenDraftMetrics.total} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#0f766e" />
                  </div>
                </ReportCard>
              </section>

              <section className="split-layout" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                <ReportCard
                  title="Payment Pipeline Estimate"
                  description="Recorded retrieval checkout activity and its current payment mix."
                  highlight
                  accent="#bfdbfe"
                >
                  <HighlightBox
                    title="Payment records captured"
                    amount={summary.paymentSummary.totalAmount}
                    color="#1d4ed8"
                    background="#eff6ff"
                    border="#bfdbfe"
                    body={`Based on ${summary.paymentSummary.total} recorded payment item(s).`}
                    meta={[
                      `Stripe receipts: ${summary.paymentSummary.byMethod.stripe} • PayPal receipts: ${summary.paymentSummary.byMethod.paypal}`,
                      `Retrieval available: ${summary.deviceProcessing.retrievalAvailable} • Paid orders: ${summary.paidOrders} • Fulfilled: ${summary.fulfilledOrders}`,
                    ]}
                  />
                </ReportCard>

                <ReportCard
                  title="Order Access Windows"
                  description="A view of fulfillment and secure access lifecycle across retrieval orders."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Retrieval Orders" value={summary.retrievalOrders} total={Math.max(summary.retrievalOrders, 1)} color="#2563eb" />
                    <ProgressBar label="Fulfilled Orders" value={summary.fulfilledOrders} total={Math.max(summary.retrievalOrders, 1)} color="#16a34a" />
                    <ProgressBar label="Active Access" value={summary.activeAccess} total={Math.max(summary.retrievalOrders, 1)} color="#7c3aed" />
                    <ProgressBar label="Expired Access" value={summary.expiredAccess} total={Math.max(summary.retrievalOrders, 1)} color="#64748b" />
                    <ProgressBar label="Restored Orders" value={summary.restoredOrders} total={Math.max(summary.retrievalOrders, 1)} color="#0f766e" />
                  </div>
                </ReportCard>
              </section>

              <section className="split-layout" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                <ReportCard
                  title="Payment Method Split"
                  description="How recorded checkout payments are distributed across providers."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Stripe" value={summary.paymentSummary.byMethod.stripe} total={Math.max(summary.paymentSummary.total, 1)} color="#2563eb" />
                    <ProgressBar label="PayPal" value={summary.paymentSummary.byMethod.paypal} total={Math.max(summary.paymentSummary.total, 1)} color="#7c3aed" />
                  </div>
                </ReportCard>

                <ReportCard
                  title="Staff Draft Activity"
                  description="Hidden draft movement across recycle and partner handoff paths."
                >
                  <div style={{ display: "grid", gap: "14px" }}>
                    <ProgressBar label="Hidden Draft Records" value={summary.hiddenDraftMetrics.hidden} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#0f766e" />
                    <ProgressBar label="Current / Rare Drafts" value={summary.hiddenDraftMetrics.currentRare} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#7c3aed" />
                    <ProgressBar label="Recycle Drafts" value={summary.hiddenDraftMetrics.recycle} total={Math.max(summary.hiddenDraftMetrics.total, 1)} color="#2563eb" />
                  </div>
                </ReportCard>
              </section>
            </>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
