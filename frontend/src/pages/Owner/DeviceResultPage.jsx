import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import QRCode from "qrcode";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import { fetchOwnerDevice, fetchOwnerOrders, generateQrToken } from "../../services/api.js";
import {
  getClassificationStyle,
  getDeviceTypeStyle,
  getWorkflowStatusStyle,
  getPartnerOffers,
  getReferralEstimate,
  getVoucherBonus,
  inferDeviceType,
} from "../../services/deviceInsights.js";

const resultMeta = {
  CURRENT: {
    title: "Partner resale route",
    tone: "#15803d",
    bg: "#ecfdf5",
    border: "#bbf7d0",
    badgeBg: "#dcfce7",
  },
  RARE: {
    title: "Rare device route",
    tone: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    badgeBg: "#ede9fe",
  },
  RECYCLE: {
    title: "Recycling workflow",
    tone: "#0f766e",
    bg: "#ecfeff",
    border: "#99f6e4",
    badgeBg: "#ccfbf1",
  },
  UNKNOWN: {
    title: "Waiting for staff review",
    tone: "#475569",
    bg: "#f8fafc",
    border: "#cbd5e1",
    badgeBg: "#e2e8f0",
  },
  DEFAULT: {
    title: "Review latest status",
    tone: "#334155",
    bg: "#f8fafc",
    border: "#cbd5e1",
    badgeBg: "#e2e8f0",
  },
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB");
}

function toDisplayLabel(value) {
  if (!value) return "Unknown";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const workflowDisplayMap = {
  HIDDEN: { label: "Hidden", lines: ["Hidden"] },
  PUBLISHED: { label: "Published", lines: ["Published"] },
  RETRIEVAL_AVAILABLE: { label: "Retrieval available", lines: ["Retrieval", "Available"] },
  RETRIEVAL_REQUESTED: { label: "Payment pending", lines: ["Payment", "Pending"] },
  PAYMENT_PENDING: { label: "Payment pending", lines: ["Payment", "Pending"] },
  RETRIEVAL_PAID: { label: "Ready for fulfillment", lines: ["Ready for", "Fulfillment"] },
  READY_FOR_FULFILLMENT: { label: "Ready for fulfillment", lines: ["Ready for", "Fulfillment"] },
  RETRIEVAL_FULFILLED: { label: "Secure access ready", lines: ["Secure access", "Ready"] },
  DATA_WIPE_PENDING: { label: "Staff preparation", lines: ["Staff", "Preparation"] },
  DATA_WIPE_COMPLETED: { label: "Retrieval available", lines: ["Retrieval", "Available"] },
  PENDING_REVIEW: { label: "Waiting for staff", lines: ["Waiting for", "Staff"] },
  UNDER_REVIEW: { label: "Waiting for staff", lines: ["Waiting for", "Staff"] },
  SUBMITTED: { label: "Waiting for staff", lines: ["Waiting for", "Staff"] },
};

export default function DeviceResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const [device, setDevice] = useState(location.state?.submittedDevice || null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(!location.state?.submittedDevice);
  const [error, setError] = useState("");
  const [qrToken, setQrToken] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrSvgMarkup, setQrSvgMarkup] = useState("");
  const [accessMessage, setAccessMessage] = useState("");
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    if (location.state?.submittedDevice) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchOwnerDevice(id);
        setDevice(data);
      } catch (err) {
        setError(err.message || "Failed to load result.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, location.state]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await fetchOwnerOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      }
    };

    fetchOrders();
  }, []);

  const classification = String(device?.classification || "UNKNOWN").toUpperCase();
  const workflowStatus = String(device?.workflowStatus || "SUBMITTED").toUpperCase();
  const meta = useMemo(() => resultMeta[classification] || resultMeta.DEFAULT, [classification]);
  const deviceType = useMemo(() => inferDeviceType(device), [device]);
  const typeStyle = useMemo(() => getDeviceTypeStyle(deviceType), [deviceType]);
  const classificationStyle = useMemo(() => getClassificationStyle(classification), [classification]);
  const workflowStatusStyle = useMemo(
    () => getWorkflowStatusStyle(device?.workflowStatus),
    [device?.workflowStatus]
  );
  const workflowStatusDisplay = useMemo(() => {
    if (classification === "UNKNOWN") return { label: "Waiting for staff", lines: ["Waiting for", "Staff"] };
    if (workflowDisplayMap[workflowStatus]) return workflowDisplayMap[workflowStatus];
    return {
      label: workflowStatusStyle.label || toDisplayLabel(workflowStatus),
      lines: [workflowStatusStyle.label || toDisplayLabel(workflowStatus)],
    };
  }, [classification, workflowStatus, workflowStatusStyle.label]);
  const workflowStatusDisplayLabel = workflowStatusDisplay.label;
  const partnerOffers = useMemo(
    () => getPartnerOffers({ ...(device || {}), deviceType, classification }),
    [classification, device, deviceType]
  );
  const referralEstimate = useMemo(
    () => getReferralEstimate({ ...(device || {}), deviceType, classification }),
    [classification, device, deviceType]
  );
  const voucherBonus = useMemo(
    () => getVoucherBonus({ ...(device || {}), deviceType, classification }),
    [classification, device, deviceType]
  );
  const retrievalAvailable =
    classification === "RECYCLE" &&
    device?.retrievalAvailable === true &&
    !!device?.retrievalAvailableUntil &&
    new Date(device.retrievalAvailableUntil).getTime() > Date.now();
  const retrievalWindowExpired =
    classification === "RECYCLE" &&
    device?.retrievalAvailable === true &&
    !!device?.retrievalAvailableUntil &&
    new Date(device.retrievalAvailableUntil).getTime() <= Date.now();
  const secureAccessReady = workflowStatus === "RETRIEVAL_FULFILLED";
  const heroClass = useMemo(() => {
    if (classification === "CURRENT") return "hero-green";
    if (classification === "RARE") return "hero-indigo";
    if (classification === "RECYCLE") return "hero-teal";
    return "hero-ink";
  }, [classification]);

  const retrievalOrder = useMemo(() => {
    if (!device?.id) return null;

    return (
      orders
        .filter(
          (order) =>
            order.deviceId === device.id &&
            String(order.type || "").toUpperCase() === "DATA_RETRIEVAL"
        )
        .sort((left, right) => {
          const leftStatus = String(left.status || "").toUpperCase();
          const rightStatus = String(right.status || "").toUpperCase();
          const leftFulfilled = leftStatus === "FULFILLED" || leftStatus === "RESTORED";
          const rightFulfilled = rightStatus === "FULFILLED" || rightStatus === "RESTORED";

          if (leftFulfilled !== rightFulfilled) return rightFulfilled - leftFulfilled;

          return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
        })[0] || null
    );
  }, [device?.id, orders]);

  const secureRetrievalAccess = useMemo(() => {
    const token =
      retrievalOrder?.retrievalToken ||
      device?.retrievalToken ||
      device?.secureToken ||
      device?.accessToken ||
      device?.token ||
      "";
    const expiresAt =
      retrievalOrder?.expiresAt ||
      device?.expiresAt ||
      device?.expiry ||
      device?.retrievalAvailableUntil ||
      null;
    const orderId = retrievalOrder?.id || device?.orderId || device?.retrievalOrderId || null;
    const fulfilledAt = retrievalOrder?.fulfilledAt || device?.fulfilledAt || null;
    const createdAt = retrievalOrder?.createdAt || device?.createdAt || null;

    if (!token) return null;

    return {
      token,
      expiresAt,
      orderId,
      fulfilledAt,
      createdAt,
    };
  }, [device, retrievalOrder]);

  const retrievalAvailabilityLabel =
    classification !== "RECYCLE"
      ? "Not applicable"
      : secureAccessReady
      ? device?.retrievalAvailableUntil
        ? `Secure access ready until ${formatShortDate(device.retrievalAvailableUntil)}`
        : "Secure access ready"
      : retrievalAvailable
      ? `Available until ${formatShortDate(device.retrievalAvailableUntil)}`
      : retrievalWindowExpired
      ? "Window expired"
      : String(device?.dataWipeStatus || "").toUpperCase() === "PENDING"
      ? "Waiting for staff prep"
      : "Not available yet";

  const qrValue = useMemo(() => {
    if (!device || !qrToken?.token) return "";

    return [
      "Device",
      `${device.deviceName || "-"}`,
      "",
      "Token",
      `${qrToken.token}`,
      "",
      "Expires",
      `${formatDate(qrToken.expiresAt)}`,
    ].join("\n");
  }, [device, qrToken]);

  useEffect(() => {
    let active = true;

    const renderQrImage = async () => {
      if (!qrValue) {
        setQrSvgMarkup("");
        return;
      }

      try {
        const svg = await QRCode.toString(qrValue, {
          type: "svg",
          width: 320,
          margin: 2,
          errorCorrectionLevel: "L",
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });

        if (active) {
          setQrSvgMarkup(svg);
        }
      } catch (err) {
        if (active) {
          setQrSvgMarkup("");
          setQrError(err.message || "Failed to render QR code.");
        }
      }
    };

    renderQrImage();

    return () => {
      active = false;
    };
  }, [qrValue]);

  const handleGenerateQrToken = async () => {
    if (!device?.id) return;

    try {
      setQrLoading(true);
      setQrError("");
      setQrMessage("");
      const token = await generateQrToken(device.id);
      setQrToken(token);
      setQrMessage("QR token generated and rendered locally.");
    } catch (err) {
      setQrError(err.message || "Failed to generate QR token.");
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyQrUrl = async () => {
    if (!qrValue) return;

    try {
      await navigator.clipboard.writeText(qrValue);
      setQrError("");
      setQrMessage("QR text copied.");
    } catch (err) {
      setQrError(err.message || "Failed to copy QR text.");
    }
  };

  const handleCopySecureToken = async () => {
    if (!secureRetrievalAccess?.token) return;

    try {
      await navigator.clipboard.writeText(secureRetrievalAccess.token);
      setAccessError("");
      setAccessMessage("Secure retrieval token copied.");
    } catch (err) {
      setAccessError(err.message || "Failed to copy secure retrieval token.");
    }
  };

  const orderStatus = String(retrievalOrder?.status || "").toUpperCase();
  const isRecycle = classification === "RECYCLE";
  const isCurrent = classification === "CURRENT";
  const isRare = classification === "RARE";
  const isUnknown = classification === "UNKNOWN";
  const isHidden = workflowStatus === "HIDDEN";
  const waitingForStaff =
    isUnknown || ["PENDING_REVIEW", "UNDER_REVIEW", "SUBMITTED"].includes(workflowStatus);
  const paymentPending =
    workflowStatus === "RETRIEVAL_REQUESTED" || orderStatus === "PAYMENT_PENDING";
  const readyForFulfillment =
    workflowStatus === "RETRIEVAL_PAID" ||
    orderStatus === "PAID" ||
    orderStatus === "READY_FOR_FULFILLMENT";
  const secureAccessScenario =
    secureAccessReady || orderStatus === "FULFILLED" || orderStatus === "RESTORED";
  const staffPreparation =
    isRecycle &&
    !secureAccessScenario &&
    !retrievalAvailable &&
    !paymentPending &&
    !readyForFulfillment;

  const scenario = useMemo(() => {
    if (isHidden) return "HIDDEN";
    if (isUnknown || waitingForStaff) return "UNKNOWN";
    if (isRecycle) {
      if (secureAccessScenario) return "RECYCLE_FULFILLED";
      if (paymentPending) return "RECYCLE_PAYMENT";
      if (readyForFulfillment) return "RECYCLE_READY";
      if (retrievalAvailable) return "RECYCLE_AVAILABLE";
      if (staffPreparation) return "RECYCLE_PREP";
    }
    if (isCurrent) return "CURRENT";
    if (isRare) return "RARE";
    return "DEFAULT";
  }, [
    isCurrent,
    isHidden,
    isRare,
    isRecycle,
    isUnknown,
    paymentPending,
    readyForFulfillment,
    retrievalAvailable,
    secureAccessScenario,
    staffPreparation,
    waitingForStaff,
  ]);

  const nextActionLabel = useMemo(() => {
    switch (scenario) {
      case "RECYCLE_FULFILLED":
        return "Open Data Retrieval";
      case "RECYCLE_AVAILABLE":
        return "Start Data Retrieval";
      case "RECYCLE_PAYMENT":
        return "Open Payments";
      case "RECYCLE_READY":
        return "Check fulfillment";
      case "CURRENT":
        return "Review partner guidance";
      case "RARE":
        return "Review specialist options";
      case "UNKNOWN":
        return "Check later";
      case "HIDDEN":
        return "Return later";
      default:
        return "Back to My Devices";
    }
  }, [scenario]);

  const heroDescription = useMemo(() => {
    if (scenario === "HIDDEN") {
      return "This device is not currently active in the owner workflow. Staff may need to review, update, or publish it before next steps become available.";
    }
    if (scenario === "UNKNOWN") {
      return "Staff will review the submitted details and classify this device before next steps become available.";
    }
    return "Classification complete. Review the recommended route and continue the next step for this device.";
  }, [scenario]);

  const summaryCards = useMemo(() => {
    const fourthCard = isRecycle
      ? {
          label: "Retrieval Availability",
          valueLines: retrievalAvailabilityLabel.split(" "),
          color: secureAccessScenario || retrievalAvailable ? "#15803d" : "#475569",
          bg: secureAccessScenario || retrievalAvailable ? "#dcfce7" : "#e2e8f0",
          icon: "🗂️",
        }
      : {
          label: "Next Action",
          valueLines: nextActionLabel.split(" "),
          color: "#2563eb",
          bg: "#dbeafe",
          icon: "➡️",
        };

    return [
      {
        label: "Classification",
        valueLines: [classificationStyle.label],
        color: classificationStyle.color,
        bg: classificationStyle.bg,
        icon: "🏷️",
      },
      {
        label: "Device Type",
        valueLines: [typeStyle.label],
        color: typeStyle.color,
        bg: typeStyle.bg,
        icon: "📱",
      },
      {
        label: "Workflow Status",
        valueLines: workflowStatusDisplay.lines,
        color: workflowStatusStyle.color,
        bg: workflowStatusStyle.bg,
        icon: "🧭",
      },
      fourthCard,
    ];
  }, [
    classificationStyle.bg,
    classificationStyle.color,
    classificationStyle.label,
    isRecycle,
    nextActionLabel,
    retrievalAvailabilityLabel,
    retrievalAvailable,
    secureAccessScenario,
    typeStyle.bg,
    typeStyle.color,
    typeStyle.label,
    workflowStatusDisplay.lines,
    workflowStatusStyle.bg,
    workflowStatusStyle.color,
  ]);

  const routeCard = useMemo(() => {
    switch (scenario) {
      case "RECYCLE_FULFILLED":
        return {
          title: "Secure retrieval fulfilled",
          body: "Your retrieval request has been fulfilled. Open Data Retrieval to copy the secure token and check the access window.",
          detail: `Secure access is ready${secureRetrievalAccess?.expiresAt ? ` until ${formatShortDate(secureRetrievalAccess.expiresAt)}.` : "."}`,
          action: { to: "/data-retrieval", label: "Open Data Retrieval", className: "btn-link teal" },
        };
      case "RECYCLE_AVAILABLE":
        return {
          title: "Retrieval available",
          body: "Staff has completed free preparation. You can request paid data retrieval before the deadline.",
          detail: device?.retrievalAvailableUntil
            ? `Available until ${formatDate(device.retrievalAvailableUntil)}.`
            : "Retrieval is now available for this device.",
          action: { to: "/data-retrieval", label: "Start Data Retrieval", className: "btn-link teal" },
        };
      case "RECYCLE_PAYMENT":
        return {
          title: "Payment required",
          body: "A retrieval request has been created. Complete payment before staff fulfillment.",
          detail: "Open Payments to complete this request and continue secure retrieval.",
          action: { to: "/payments", label: "Open Payments", className: "btn-link secondary" },
        };
      case "RECYCLE_READY":
        return {
          title: "Ready for staff fulfillment",
          body: "Payment has been confirmed. Staff can now fulfill secure retrieval.",
          detail: "Check Data Retrieval for the latest order progress while staff prepares secure access.",
          action: { to: "/data-retrieval", label: "Open Data Retrieval", className: "btn-link teal" },
        };
      case "RECYCLE_PREP":
        return {
          title: "Waiting for staff preparation",
          body: "Staff needs to complete free data wipe preparation before retrieval can be requested.",
          detail: "No owner action is needed yet. Check back later or return to My Devices.",
          action: null,
        };
      case "CURRENT":
        return {
          title: "Partner resale route",
          body: "This device is suitable for mainstream resale or reuse. Review partner handoff guidance and QR access if available.",
          detail: `Estimated referral value: £${referralEstimate}. ${voucherBonus}`,
          action: null,
        };
      case "RARE":
        return {
          title: "Rare device route",
          body: "This device may need specialist or collector review before handoff.",
          detail: `Specialist guidance is recommended before disposal. Estimated referral value: £${referralEstimate}.`,
          action: null,
        };
      case "HIDDEN":
        return {
          title: "This device is not currently active",
          body: "This device is hidden from the active owner workflow. Staff may need to update, approve, or publish it before next steps become available.",
          detail: "Return to My Devices or submit another device.",
          action: null,
        };
      case "UNKNOWN":
        return {
          title: "Waiting for staff review",
          body: "Staff will check the submitted details and classify the device before next steps become available.",
          detail: "Check back later or return to My Devices.",
          action: null,
        };
      default:
        return {
          title: "Review latest status",
          body: "Open My Devices to check the latest stored status for this device.",
          detail: "Submit another device if you want to continue a different workflow now.",
          action: null,
        };
    }
  }, [
    device?.retrievalAvailableUntil,
    referralEstimate,
    scenario,
    secureRetrievalAccess?.expiresAt,
    voucherBonus,
  ]);

  const sideCard = useMemo(() => {
    switch (scenario) {
      case "RECYCLE_FULFILLED":
        return {
          eyebrow: "Secure access ready",
          title: "Secure retrieval access",
          description:
            "If secure retrieval has been fulfilled for this device, you can copy the token here and review the access expiry.",
          tone: { bg: "#f8fbff", border: "#bfdbfe", shadow: "0 14px 30px rgba(37,99,235,0.08)" },
        };
      case "RECYCLE_AVAILABLE":
        return {
          eyebrow: "Retrieval next step",
          title: "Availability window",
          description:
            "Create the paid retrieval request before the availability window expires.",
          tone: { bg: "#fcfffe", border: "#99f6e4", shadow: "0 14px 30px rgba(15,118,110,0.08)" },
        };
      case "RECYCLE_PAYMENT":
        return {
          eyebrow: "Payment pending",
          title: "Complete checkout",
          description:
            "A retrieval order already exists. Complete payment so staff can continue fulfillment.",
          tone: { bg: "#fffaf0", border: "#fbd38d", shadow: "0 14px 30px rgba(194,65,12,0.08)" },
        };
      case "RECYCLE_READY":
        return {
          eyebrow: "Ready for fulfillment",
          title: "Staff can continue",
          description:
            "Payment is confirmed. Wait for staff fulfillment, then secure access will become available.",
          tone: { bg: "#f8fafc", border: "#cbd5e1", shadow: "0 12px 24px rgba(15,23,42,0.05)" },
        };
      case "CURRENT":
        return {
          eyebrow: "Partner guidance",
          title: "Resale next step",
          description:
            "Use the recommended partner route, estimated value, and handoff notes to continue this device outcome.",
          tone: { bg: "#fcfffd", border: "#bbf7d0", shadow: "0 14px 30px rgba(21,128,61,0.08)" },
        };
      case "RARE":
        return {
          eyebrow: "Specialist handoff",
          title: "Collector or specialist route",
          description:
            "Review the suggested specialist channels and handoff guidance before moving this device onward.",
          tone: { bg: "#fcfbff", border: "#ddd6fe", shadow: "0 14px 30px rgba(124,58,237,0.08)" },
        };
      case "HIDDEN":
        return {
          eyebrow: "Status note",
          title: "Not active",
          description:
            "No owner action is currently available. Staff may need to update, approve, or publish this device.",
          tone: { bg: "#f8fafc", border: "#cbd5e1", shadow: "0 12px 24px rgba(15,23,42,0.04)" },
        };
      case "UNKNOWN":
        return {
          eyebrow: "Status note",
          title: "Waiting for staff",
          description:
            "The submitted details are still being reviewed. Next steps will appear after classification is complete.",
          tone: { bg: "#f8fafc", border: "#cbd5e1", shadow: "0 12px 24px rgba(15,23,42,0.04)" },
        };
      default:
        return {
          eyebrow: "Latest status",
          title: "Check current workflow",
          description: "Use the stored status to decide the next step for this device.",
          tone: { bg: "#f8fafc", border: "#cbd5e1", shadow: "0 12px 24px rgba(15,23,42,0.04)" },
        };
    }
  }, [scenario]);

  const showQrSection = scenario === "RECYCLE_FULFILLED" || scenario === "CURRENT" || scenario === "RARE";
  const qrNotice = useMemo(() => {
    if (scenario === "UNKNOWN" || scenario === "HIDDEN") {
      return {
        title: "Access not available yet",
        body: "QR or secure access will appear after staff approval and an eligible workflow is available.",
      };
    }
    if (scenario === "RECYCLE_AVAILABLE") {
      return {
        title: "Secure access is not available yet",
        body: "Start the paid retrieval request first. Secure access will appear after payment and staff fulfillment.",
      };
    }
    if (scenario === "RECYCLE_PAYMENT") {
      return {
        title: "Payment required before access",
        body: "Complete payment first. QR or secure access is not available until staff fulfillment is complete.",
      };
    }
    if (scenario === "RECYCLE_READY") {
      return {
        title: "Waiting for secure fulfillment",
        body: "Payment is confirmed. QR or secure access will appear after staff completes fulfillment.",
      };
    }
    if (scenario === "RECYCLE_PREP") {
      return {
        title: "Waiting for staff preparation",
        body: "Free data wipe preparation must finish before retrieval actions or secure access can appear.",
      };
    }
    return {
      title: "Access not available yet",
      body: "QR or secure access will appear after the relevant workflow becomes available.",
    };
  }, [scenario]);

  const nextActions = useMemo(() => {
    const actions = [];

    if (scenario === "RECYCLE_FULFILLED") {
      actions.push({ type: "link", to: "/data-retrieval", label: "Open Data Retrieval", className: "btn-link teal" });
    }
    if (scenario === "RECYCLE_PAYMENT") {
      actions.push({ type: "link", to: "/payments", label: "Open Payments", className: "btn-link secondary" });
    }
    if (scenario === "RECYCLE_READY") {
      actions.push({ type: "link", to: "/data-retrieval", label: "Open Data Retrieval", className: "btn-link secondary" });
    }
    if ((scenario === "CURRENT" || scenario === "RARE") && partnerOffers[0]?.link) {
      actions.push({ type: "external", href: partnerOffers[0].link, label: "Open partner guidance" });
    }

    actions.push({ type: "link", to: "/my-devices", label: "Back to My Devices", className: "btn-link secondary" });
    actions.push({ type: "link", to: "/submit-device", label: "Submit another device", className: "btn-link soft" });
    return actions;
  }, [partnerOffers, scenario]);

  return (
    <div className="app-page">
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <Link to="/my-devices" className="back-pill">
            ← My Devices
          </Link>

          {loading && (
            <div
              style={{
                color: "#64748b",
                background: "#fff",
                padding: "18px 20px",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
              }}
            >
              Loading result...
            </div>
          )}

          {error && (
            <div
              style={{
                color: "#dc2626",
                fontWeight: 600,
                background: "#fff",
                padding: "18px 20px",
                borderRadius: "16px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          {!loading && device && (
            <>
              <section className={`page-hero ${heroClass}`}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>Device outcome</p>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "34px", lineHeight: 1.1 }}>{device.deviceName}</h1>
                <p style={{ margin: "0 0 14px 0", opacity: 0.95 }}>
                  {device.brand || "Unknown brand"} • {device.condition || "Unknown condition"}
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: classificationStyle.bg,
                      color: classificationStyle.color,
                      padding: "8px 12px",
                      borderRadius: "999px",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {classificationStyle.label}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      padding: "8px 12px",
                      borderRadius: "999px",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {typeStyle.label}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      background: workflowStatusStyle.bg,
                      color: workflowStatusStyle.color,
                      border: `1px solid ${workflowStatusStyle.border}`,
                      padding: "8px 12px",
                      borderRadius: "999px",
                      fontWeight: 800,
                      fontSize: "13px",
                    }}
                  >
                    {workflowStatusDisplayLabel}
                  </span>
                </div>
                <p style={{ margin: "14px 0 0 0", maxWidth: "760px", lineHeight: 1.7, opacity: 0.94 }}>
                  {heroDescription}
                </p>
              </section>

              <section className="metric-grid">
                {summaryCards.map((item) => (
                  <div key={item.label} className="metric-card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "999px",
                          background: item.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                        }}
                      >
                        {item.icon}
                      </div>
                      <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>LIVE</span>
                    </div>
                    <div className="metric-label">{item.label}</div>
                    <div
                      style={{
                        color: item.color,
                        fontSize: "24px",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        display: "grid",
                        gap: "2px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {item.valueLines.map((line, index) => (
                        <span key={`${item.label}-${index}`}>{line}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              <section className="split-layout" style={{ gridTemplateColumns: "1.15fr 0.85fr", alignItems: "start" }}>
                <section
                  className="surface-card device-outcome-card"
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    padding: "22px 24px",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      background: meta.badgeBg,
                      color: meta.tone,
                      padding: "7px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 800,
                      marginBottom: "14px",
                    }}
                  >
                    Recommended route
                  </div>
                  <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", color: meta.tone }}>{routeCard.title}</h2>
                  <p style={{ margin: "0 0 14px 0", color: meta.tone, lineHeight: 1.7 }}>{routeCard.body}</p>
                  <div style={{ margin: "0 0 16px 0", color: meta.tone, fontWeight: 700, lineHeight: 1.6 }}>
                    {routeCard.detail}
                  </div>
                  {routeCard.action && (
                    <Link to={routeCard.action.to} className={routeCard.action.className} style={{ minHeight: "48px" }}>
                      {routeCard.action.label}
                    </Link>
                  )}
                </section>

                <section
                  className="surface-card"
                  style={{
                    padding: "22px 24px",
                    background: sideCard.tone.bg,
                    border: `1px solid ${sideCard.tone.border}`,
                    boxShadow: sideCard.tone.shadow,
                  }}
                >
                  <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b" }}>
                      {sideCard.eyebrow}
                    </div>
                    <h2 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>{sideCard.title}</h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{sideCard.description}</p>
                  </div>

                  {scenario === "RECYCLE_FULFILLED" && secureRetrievalAccess ? (
                    <>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: "#dbeafe",
                          color: "#1d4ed8",
                          fontSize: "12px",
                          fontWeight: 800,
                          marginBottom: "14px",
                        }}
                      >
                        Secure access ready
                      </div>

                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "14px",
                          background: "#ffffff",
                          border: "1px solid #dbeafe",
                          display: "grid",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>Secure token</div>
                          <div
                            style={{
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                              fontSize: "12px",
                              lineHeight: 1.7,
                              fontWeight: 700,
                              color: "#0f172a",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {secureRetrievalAccess.token}
                          </div>
                        </div>
                        <div style={{ display: "grid", gap: "8px", color: "#475569", fontSize: "14px" }}>
                          <div>Order ID: {secureRetrievalAccess.orderId || "-"}</div>
                          <div>Created: {formatDate(secureRetrievalAccess.createdAt)}</div>
                          <div>Fulfilled: {formatDate(secureRetrievalAccess.fulfilledAt)}</div>
                          <div>Access expires on: {formatDate(secureRetrievalAccess.expiresAt)}</div>
                        </div>
                        <div style={{ display: "grid", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={handleCopySecureToken}
                            style={{
                              border: "none",
                              background: "#2563eb",
                              color: "#fff",
                              padding: "12px 16px",
                              borderRadius: "12px",
                              fontWeight: 800,
                              minHeight: "48px",
                              cursor: "pointer",
                            }}
                          >
                            Copy Secure Token
                          </button>
                          <Link to="/data-retrieval" className="btn-link secondary" style={{ minHeight: "48px" }}>
                            Open Data Retrieval
                          </Link>
                        </div>
                      </div>

                      {accessError && (
                        <div
                          style={{
                            marginTop: "14px",
                            background: "#fff",
                            border: "1px solid #fecaca",
                            borderRadius: "12px",
                            padding: "14px 16px",
                            color: "#dc2626",
                            fontWeight: 600,
                          }}
                        >
                          {accessError}
                        </div>
                      )}

                      {accessMessage && (
                        <div
                          style={{
                            marginTop: "14px",
                            background: "#fff",
                            border: "1px solid #bbf7d0",
                            borderRadius: "12px",
                            padding: "14px 16px",
                            color: "#15803d",
                            fontWeight: 600,
                          }}
                        >
                          {accessMessage}
                        </div>
                      )}
                    </>
                  ) : scenario === "CURRENT" || scenario === "RARE" ? (
                    <div style={{ display: "grid", gap: "12px" }}>
                      <div
                        style={{
                          padding: "14px 16px",
                          borderRadius: "14px",
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          display: "grid",
                          gap: "8px",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>
                          Incentive snapshot
                        </div>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>{voucherBonus}</div>
                        <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                          Estimated referral value: £{referralEstimate}
                        </div>
                      </div>

                      {partnerOffers.slice(0, 2).map((offer) => (
                        <div
                          key={offer.name}
                          style={{
                            padding: "14px 16px",
                            borderRadius: "14px",
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            display: "grid",
                            gap: "8px",
                          }}
                        >
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{offer.name}</div>
                          <div style={{ color: "#64748b", fontSize: "13px" }}>{offer.channel}</div>
                          <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                            <div>{offer.payout}</div>
                            <div>{offer.handoff}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : scenario === "UNKNOWN" || scenario === "HIDDEN" ? (
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        display: "grid",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: classificationStyle.bg,
                            color: classificationStyle.color,
                            fontSize: "12px",
                            fontWeight: 800,
                          }}
                        >
                          {classificationStyle.label}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: workflowStatusStyle.bg,
                            color: workflowStatusStyle.color,
                            border: `1px solid ${workflowStatusStyle.border}`,
                            fontSize: "12px",
                            fontWeight: 800,
                          }}
                        >
                          {scenario === "HIDDEN" ? "Hidden" : "Waiting for staff"}
                        </span>
                      </div>
                      <div style={{ color: "#0f172a", fontWeight: 800 }}>
                        {scenario === "HIDDEN" ? "This device is currently outside the active owner workflow." : "Staff review is still in progress for this device."}
                      </div>
                      <div style={{ color: "#475569", lineHeight: 1.7 }}>
                        {scenario === "HIDDEN"
                          ? "No owner action is available right now. Staff may need to update, approve, or publish the device before next steps appear."
                          : "No owner action is required yet. Return later or check My Devices for the latest stored status."}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        color: "#475569",
                        lineHeight: 1.7,
                      }}
                    >
                      {scenario === "RECYCLE_AVAILABLE" && (
                        <>
                          <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Available until</div>
                          <div>{formatDate(device?.retrievalAvailableUntil)}</div>
                        </>
                      )}
                      {scenario === "RECYCLE_PAYMENT" && (
                        <>
                          <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Existing retrieval order</div>
                          <div>Order ID: {retrievalOrder?.id || "-"}</div>
                          <div>Created: {formatDate(retrievalOrder?.createdAt)}</div>
                        </>
                      )}
                      {scenario === "RECYCLE_READY" && (
                        <>
                          <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Fulfillment status</div>
                          <div>Payment confirmed. Staff can now fulfill secure retrieval.</div>
                          <div>Order ID: {retrievalOrder?.id || "-"}</div>
                        </>
                      )}
                      {scenario === "RECYCLE_PREP" && (
                        <>
                          <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Review status</div>
                          <div>Staff preparation is still in progress before retrieval can be requested.</div>
                          <div>Data wipe status: {toDisplayLabel(device?.dataWipeStatus || "PENDING")}</div>
                        </>
                      )}
                      {scenario === "DEFAULT" && (
                        <>
                          <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Latest status</div>
                          <div>Review the latest stored workflow before taking the next action.</div>
                        </>
                      )}
                    </div>
                  )}
                </section>
              </section>

              <section
                className="split-layout"
                style={{ gridTemplateColumns: showQrSection ? "1.6fr 1fr" : "1.15fr 0.85fr", alignItems: "start" }}
              >
                <section className="surface-card" style={{ padding: "22px 24px", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
                  {showQrSection ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                        <div>
                          <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "#0f172a" }}>Device handoff QR</h2>
                          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                            Generate a QR code using the backend-issued token, then package it into a phone-friendly text payload for scanning.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={handleGenerateQrToken}
                            disabled={qrLoading}
                            style={{
                              border: "none",
                              background: "#0f172a",
                              color: "#fff",
                              padding: "12px 14px",
                              borderRadius: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              opacity: qrLoading ? 0.7 : 1,
                            }}
                          >
                            {qrLoading ? "Generating..." : "Generate Token"}
                          </button>
                          {qrToken?.token && (
                            <button
                              type="button"
                              onClick={handleCopyQrUrl}
                              style={{
                                border: "none",
                                background: "#eff6ff",
                                color: "#2563eb",
                                padding: "12px 14px",
                                borderRadius: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Copy QR Text
                            </button>
                          )}
                        </div>
                      </div>

                      {qrError && (
                        <div
                          style={{
                            marginTop: "16px",
                            background: "#fff",
                            border: "1px solid #fecaca",
                            borderRadius: "12px",
                            padding: "14px 16px",
                            color: "#dc2626",
                            fontWeight: 600,
                          }}
                        >
                          {qrError}
                        </div>
                      )}

                      {qrMessage && (
                        <div
                          style={{
                            marginTop: "16px",
                            background: "#fff",
                            border: "1px solid #bbf7d0",
                            borderRadius: "12px",
                            padding: "14px 16px",
                            color: "#15803d",
                            fontWeight: 600,
                          }}
                        >
                          {qrMessage}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: "16px",
                          padding: "16px 18px",
                          borderRadius: "14px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "grid",
                          gap: "10px",
                          color: "#475569",
                          lineHeight: 1.6,
                        }}
                      >
                        {qrToken ? (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(280px, 320px) minmax(0, 1fr)",
                              gap: "18px",
                              alignItems: "start",
                            }}
                          >
                            <div
                              style={{
                                width: "320px",
                                minWidth: "320px",
                                background: "#fff",
                                border: "1px solid #cbd5e1",
                                borderRadius: "12px",
                                padding: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                aria-label="QR code for this device"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "100%",
                                  minHeight: "100%",
                                  lineHeight: 0,
                                }}
                                dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
                              />
                            </div>

                            <div style={{ minWidth: 0, display: "grid", gap: "14px" }}>
                              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                Use this QR code only for the generated device access payload.
                              </div>
                              <div
                                style={{
                                  borderRadius: "12px",
                                  border: "1px solid #dbe4f0",
                                  background: "#ffffff",
                                  padding: "14px 16px",
                                  display: "grid",
                                  gap: "12px",
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Token</div>
                                  <div
                                    style={{
                                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                                      fontSize: "12px",
                                      color: "#0f172a",
                                      overflowWrap: "anywhere",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {qrToken.token}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Expires</div>
                                  <div style={{ color: "#0f172a", fontWeight: 600 }}>{formatDate(qrToken.expiresAt)}</div>
                                </div>
                              </div>

                              <div
                                style={{
                                  overflowWrap: "anywhere",
                                  borderRadius: "12px",
                                  border: "1px solid #dbe4f0",
                                  background: "#ffffff",
                                  padding: "14px 16px",
                                }}
                              >
                                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>QR Content</div>
                                <pre
                                  style={{
                                    margin: 0,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                                    fontSize: "12px",
                                    color: "#334155",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {qrValue}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>Generate a token to inspect the backend QR access for this device.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: "16px 18px",
                        borderRadius: "14px",
                        background: scenario === "UNKNOWN" || scenario === "HIDDEN" ? "#f8fafc" : "#fffaf0",
                        border: `1px solid ${scenario === "UNKNOWN" || scenario === "HIDDEN" ? "#e2e8f0" : "#fbd38d"}`,
                        display: "grid",
                        gap: "10px",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "18px" }}>{qrNotice.title}</div>
                      <div style={{ color: "#475569", lineHeight: 1.7 }}>{qrNotice.body}</div>
                    </div>
                  )}
                </section>

                <section className="surface-card" style={{ padding: "20px" }}>
                  <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Next actions</h2>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {nextActions.map((action) =>
                      action.type === "external" ? (
                        <a
                          key={action.label}
                          href={action.href}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "48px",
                            background: "#0f172a",
                            color: "#fff",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            fontWeight: 800,
                          }}
                        >
                          {action.label}
                        </a>
                      ) : (
                        <Link key={action.label} to={action.to} className={action.className} style={{ minHeight: "48px" }}>
                          {action.label}
                        </Link>
                      )
                    )}
                  </div>
                </section>
              </section>
            </>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
