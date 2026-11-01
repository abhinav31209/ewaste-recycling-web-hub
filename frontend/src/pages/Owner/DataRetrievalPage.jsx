import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import DashboardSelect from "../../components/DashboardSelect.jsx";
import {
  createDataRetrievalOrder,
  fetchOwnerDevices,
  fetchOwnerOrders,
  fetchOwnerSecureLink,
  restoreOwnerOrder,
} from "../../services/api.js";
import {
  getClassificationStyle,
  getDeviceTypeStyle,
  getOrderStatusStyle,
  getStatusStyle,
  inferDeviceType,
} from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

const ACTIVE_ORDER_STATUSES = new Set([
  "PAYMENT_PENDING",
  "PAID",
  "READY_FOR_FULFILLMENT",
  "FULFILLED",
  "RESTORED",
]);

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB");
}

function isFutureDate(value) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function isRetrievalAvailable(device) {
  return (
    String(device.classification || "").toUpperCase() === "RECYCLE" &&
    device.retrievalAvailable === true &&
    !!device.retrievalAvailableUntil &&
    isFutureDate(device.retrievalAvailableUntil)
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f3f4f6",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export default function DataRetrievalPage() {
  const [devices, setDevices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [activeRetrievalFilter, setActiveRetrievalFilter] = useState("ready");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionOrderId, setActionOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const copyOrderId = async (orderId) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setMessage("Order ID copied.");
      setError("");
    } catch {
      setError("Failed to copy order ID.");
    }
  };

  const copySecureToken = async (orderId) => {
    try {
      setActionOrderId(orderId);
      setError("");
      const data = await fetchOwnerSecureLink(orderId);
      await navigator.clipboard.writeText(data.token || "");
      setMessage("Secure retrieval token copied.");
    } catch (err) {
      setError(err.message || "Failed to copy secure retrieval token.");
    } finally {
      setActionOrderId("");
    }
  };

  const handleRestore = async (orderId) => {
    try {
      setActionOrderId(orderId);
      setError("");
      setMessage("");
      await restoreOwnerOrder(orderId);
      setMessage("Secure retrieval access restored for a new 3-month window.");
      await load();
    } catch (err) {
      setError(err.message || "Failed to restore secure retrieval access.");
    } finally {
      setActionOrderId("");
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [deviceData, orderData] = await Promise.all([fetchOwnerDevices(), fetchOwnerOrders()]);
      setDevices(Array.isArray(deviceData) ? deviceData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (err) {
      setError(err.message || "Failed to load data retrieval page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sortedOrders = useMemo(
    () => sortNewestFirst(orders, ["createdAt", "updatedAt"]),
    [orders]
  );

  const retrievalOrders = useMemo(
    () =>
      sortedOrders.filter((order) => String(order.type || "").toUpperCase() === "DATA_RETRIEVAL"),
    [sortedOrders]
  );

  const orderByDeviceId = useMemo(() => {
    const entries = sortNewestFirst(retrievalOrders, ["createdAt", "updatedAt"]);

    return entries.reduce((acc, order) => {
      const status = String(order.status || "").toUpperCase();
      if (!acc[order.deviceId] && ACTIVE_ORDER_STATUSES.has(status)) {
        acc[order.deviceId] = order;
      }
      return acc;
    }, {});
  }, [retrievalOrders]);

  const requestedDeviceIds = useMemo(
    () =>
      new Set(
        retrievalOrders
          .filter((order) => ACTIVE_ORDER_STATUSES.has(String(order.status || "").toUpperCase()))
          .map((order) => order.deviceId)
      ),
    [retrievalOrders]
  );

  const recycleDevices = useMemo(
    () =>
      devices.filter(
        (device) => String(device.classification || "").toUpperCase() === "RECYCLE"
      ),
    [devices]
  );

  const sortedRecycleDevices = useMemo(() => sortNewestFirst(recycleDevices), [recycleDevices]);

  const deviceStateById = useMemo(() => {
    return sortedRecycleDevices.reduce((acc, device) => {
      const order = orderByDeviceId[device.id] || null;
      const available = isRetrievalAvailable(device);
      const expiredAvailability =
        device.retrievalAvailable === true &&
        !!device.retrievalAvailableUntil &&
        !isFutureDate(device.retrievalAvailableUntil);
      const wipePending =
        String(device.dataWipeStatus || "").toUpperCase() === "PENDING" ||
        String(device.workflowStatus || "").toUpperCase() === "DATA_WIPE_PENDING" ||
        String(device.workflowStatus || "").toUpperCase() === "RECYCLE_APPROVED";

      let state = "NO_RECYCLE_ACTION";
      if (order) {
        state = "ORDER_EXISTS";
      } else if (available) {
        state = "AVAILABLE";
      } else if (expiredAvailability) {
        state = "WINDOW_EXPIRED";
      } else if (wipePending) {
        state = "WAITING_FOR_WIPE";
      }

      acc[device.id] = { state, order, available, expiredAvailability, wipePending };
      return acc;
    }, {});
  }, [orderByDeviceId, sortedRecycleDevices]);

  const availableDevices = useMemo(
    () =>
      sortedRecycleDevices.filter((device) => deviceStateById[device.id]?.state === "AVAILABLE"),
    [deviceStateById, sortedRecycleDevices]
  );

  const waitingForStaffDevices = useMemo(
    () =>
      sortedRecycleDevices.filter((device) => deviceStateById[device.id]?.state === "WAITING_FOR_WIPE"),
    [deviceStateById, sortedRecycleDevices]
  );

  const devicesWithOrders = useMemo(
    () =>
      sortedRecycleDevices.filter((device) => deviceStateById[device.id]?.state === "ORDER_EXISTS"),
    [deviceStateById, sortedRecycleDevices]
  );

  const secureAccessReadyDevices = useMemo(
    () =>
      sortedRecycleDevices.filter((device) => {
        const order = orderByDeviceId[device.id];
        if (!order) return false;
        const orderStatus = String(order.status || "").toUpperCase();
        return orderStatus === "FULFILLED" || orderStatus === "RESTORED";
      }),
    [orderByDeviceId, sortedRecycleDevices]
  );

  const availableDeviceOptions = useMemo(
    () => [
      { value: "", label: "Select a RECYCLE device" },
      ...availableDevices.map((device) => ({
        value: device.id,
        label: `${device.deviceName}${device.brand ? ` • ${device.brand}` : ""}`,
      })),
    ],
    [availableDevices]
  );

  const selectedDeviceOption =
    availableDeviceOptions.find((option) => option.value === selectedDeviceId) ??
    availableDeviceOptions[0];

  const blockedReasons = useMemo(() => {
    const recycleWithoutOrders = sortedRecycleDevices.filter(
      (device) => !requestedDeviceIds.has(device.id)
    );
    return {
      noRecycleDevices: sortedRecycleDevices.length === 0,
      waitingForWipe: recycleWithoutOrders.some(
        (device) => deviceStateById[device.id]?.state === "WAITING_FOR_WIPE"
      ),
      expired: recycleWithoutOrders.some(
        (device) => deviceStateById[device.id]?.state === "WINDOW_EXPIRED"
      ),
      existingOrder: sortedRecycleDevices.some(
        (device) => deviceStateById[device.id]?.state === "ORDER_EXISTS"
      ),
    };
  }, [deviceStateById, requestedDeviceIds, sortedRecycleDevices]);

  const filteredRecycleDevices = useMemo(() => {
    if (activeRetrievalFilter === "ready") {
      return sortedRecycleDevices.filter((device) => deviceStateById[device.id]?.state === "AVAILABLE");
    }

    if (activeRetrievalFilter === "waiting") {
      return sortedRecycleDevices.filter((device) => deviceStateById[device.id]?.state === "WAITING_FOR_WIPE");
    }

    if (activeRetrievalFilter === "orders") {
      return sortedRecycleDevices.filter((device) => deviceStateById[device.id]?.state === "ORDER_EXISTS");
    }

    if (activeRetrievalFilter === "secure") {
      return sortedRecycleDevices.filter((device) => {
        const order = orderByDeviceId[device.id];
        if (!order) return false;
        const orderStatus = String(order.status || "").toUpperCase();
        return orderStatus === "FULFILLED" || orderStatus === "RESTORED";
      });
    }

    return sortedRecycleDevices;
  }, [activeRetrievalFilter, deviceStateById, orderByDeviceId, sortedRecycleDevices]);

  const retrievalListTitle = useMemo(() => {
    if (activeRetrievalFilter === "ready") return "Ready to request devices";
    if (activeRetrievalFilter === "waiting") return "Waiting for staff preparation";
    if (activeRetrievalFilter === "orders") return "Devices with retrieval orders";
    if (activeRetrievalFilter === "secure") return "Secure access ready";
    return "Device retrieval status";
  }, [activeRetrievalFilter]);

  const retrievalListDescription = useMemo(() => {
    if (activeRetrievalFilter === "ready") {
      return "Recycle devices that can start a paid retrieval request within the active availability window.";
    }
    if (activeRetrievalFilter === "waiting") {
      return "Recycle devices that still need staff data wipe preparation before retrieval can open.";
    }
    if (activeRetrievalFilter === "orders") {
      return "Recycle devices that already have an order in progress or waiting for payment or fulfillment.";
    }
    if (activeRetrievalFilter === "secure") {
      return "Recycle devices with fulfilled secure access windows or expired access that can be restored.";
    }
    return "Track each recycle device once, including availability, payment, fulfillment, and secure access.";
  }, [activeRetrievalFilter]);

  const handleRequest = async () => {
    if (!selectedDeviceId) return;

    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      await createDataRetrievalOrder(selectedDeviceId);
      setMessage("Data retrieval order created successfully.");
      setSelectedDeviceId("");
      await load();
    } catch (err) {
      setError(err.message || "Failed to create data retrieval order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestForDevice = async (deviceId) => {
    if (!deviceId) return;

    try {
      setSubmitting(true);
      setSelectedDeviceId(deviceId);
      setError("");
      setMessage("");
      await createDataRetrievalOrder(deviceId);
      setMessage("Data retrieval order created successfully.");
      setSelectedDeviceId("");
      await load();
    } catch (err) {
      setError(err.message || "Failed to create data retrieval order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
              <section
                className="page-hero hero-teal"
              >
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.85 }}>Data Retrieval</p>
                <h1 style={{ margin: "0 0 10px 0", fontSize: "34px" }}>Secure data retrieval</h1>
                <p style={{ margin: 0, maxWidth: "650px", lineHeight: 1.7, opacity: 0.92 }}>
                  Staff prepares free data wiping first. Once retrieval is available, you can request paid data retrieval before the deadline.
                </p>
              </section>

              {error && (
                <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: "16px", padding: "18px 20px", color: "#dc2626", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "18px 20px", color: "#15803d", fontWeight: 600 }}>
                  {message}
                </div>
              )}

              <section className="metric-grid">
                {[
                  { key: "ready", label: "Ready to request", value: availableDevices.length, color: "#15803d", bg: "#ecfdf5", icon: "✅" },
                  { key: "waiting", label: "Waiting for staff", value: waitingForStaffDevices.length, color: "#d97706", bg: "#fffbeb", icon: "🕒" },
                  { key: "orders", label: "Existing orders", value: devicesWithOrders.length, color: "#2563eb", bg: "#eff6ff", icon: "📦" },
                  {
                    key: "secure",
                    label: "Secure access ready",
                    value: secureAccessReadyDevices.length,
                    color: "#0f766e",
                    bg: "#ecfeff",
                    icon: "🔐",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`metric-card metric-filter-card interactive-metric-card${activeRetrievalFilter === item.key ? " active" : ""}`}
                    onClick={() => setActiveRetrievalFilter(item.key)}
                    style={{ background: item.bg, textAlign: "left", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "999px",
                          background: `${item.color}20`,
                          color: item.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ fontWeight: activeRetrievalFilter === item.key ? 800 : 700, color: "#475569" }}>{item.label}</div>
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "28px",
                        fontWeight: 800,
                        color: item.color,
                        opacity: activeRetrievalFilter === item.key ? 1 : 0.92,
                      }}
                    >
                      {loading ? "..." : item.value}
                    </div>
                  </button>
                ))}
              </section>

              <section
                className="surface-card retrieval-request-card"
                style={{
                  padding: "22px",
                }}
              >
                  <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#0f766e" }}>
                      Retrieval Workflow
                    </div>
                    <h2 style={{ margin: 0, fontSize: "26px" }}>Create retrieval request</h2>
                    <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.7 }}>
                      Start a paid request once a recycle device becomes retrieval-ready within the active availability window.
                    </p>
                  </div>

                  {availableDevices.length === 0 && !loading ? (
                    <div
                      style={{
                        padding: "22px",
                        borderRadius: "16px",
                        border: "1px dashed #cbd5e1",
                        background: "#f8fafc",
                        display: "grid",
                        gap: "10px",
                      }}
                    >
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                        No devices ready for a new request
                      </div>
                      <div style={{ color: "#475569", lineHeight: 1.7 }}>
                        Your recycle devices may already have an order, may still be waiting for staff data wipe preparation, or the availability window may have expired.
                      </div>
                      <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                        {blockedReasons.noRecycleDevices && "No recycle devices yet."}
                        {!blockedReasons.noRecycleDevices && blockedReasons.waitingForWipe && " Waiting for staff data wipe preparation."}
                        {!blockedReasons.noRecycleDevices && !blockedReasons.waitingForWipe && blockedReasons.expired && " Retrieval availability has expired for the current window."}
                        {!blockedReasons.noRecycleDevices && !blockedReasons.waitingForWipe && !blockedReasons.expired && blockedReasons.existingOrder && " An existing retrieval order is already in progress."}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                      <section className="retrieval-step">
                        <div style={{ display: "grid", gap: "4px", marginBottom: "10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                            Step 1
                          </div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>Select eligible device</div>
                        </div>
                        <DashboardSelect
                          inputId="retrieval-device-select"
                          name="selectedDeviceId"
                          options={availableDeviceOptions}
                          value={selectedDeviceOption}
                          onChange={(selectedOption) => setSelectedDeviceId(selectedOption?.value || "")}
                        />
                      </section>

                      <section className="retrieval-step">
                        <div style={{ display: "grid", gap: "4px", marginBottom: "10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                            Step 2
                          </div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>Check availability deadline</div>
                        </div>
                        <div
                          style={{
                            padding: "16px",
                            borderRadius: "14px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            color: "#475569",
                            lineHeight: 1.6,
                          }}
                        >
                          {selectedDeviceId
                            ? `Retrieval is available until ${formatDate(
                                availableDevices.find((device) => device.id === selectedDeviceId)?.retrievalAvailableUntil
                              )}.`
                            : "Choose a retrieval-ready device to confirm the availability deadline."}
                        </div>
                      </section>

                      <section className="retrieval-step">
                        <div style={{ display: "grid", gap: "4px", marginBottom: "10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                            Step 3
                          </div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>Start paid retrieval request</div>
                          <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                            Create the order now, then continue to payment before staff can fulfill secure access.
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={submitting || !selectedDeviceId}
                          onClick={handleRequest}
                          style={{
                            width: "100%",
                            minHeight: "48px",
                            border: "none",
                            background: "#10b981",
                            color: "#fff",
                            padding: "13px 18px",
                            borderRadius: "10px",
                            fontWeight: 800,
                            cursor: "pointer",
                            opacity: submitting ? 0.7 : 1,
                            boxShadow: "0 14px 28px rgba(16,185,129,0.18)",
                          }}
                        >
                          {submitting ? "Creating..." : "Start retrieval request"}
                        </button>
                      </section>
                    </div>
                  )}
              </section>

              <section
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
                }}
              >
                <div style={{ padding: "18px 20px", borderBottom: "1px solid #e5e7eb" }}>
                  <h2 style={{ margin: 0, fontSize: "22px" }}>{retrievalListTitle}</h2>
                  <p style={{ margin: "8px 0 0 0", color: "#64748b", lineHeight: 1.6 }}>
                    {retrievalListDescription}
                  </p>
                </div>

                {loading ? (
                  <div style={{ padding: "24px 20px", color: "#64748b" }}>Checking devices...</div>
                ) : sortedRecycleDevices.length === 0 ? (
                  <div style={{ padding: "24px 20px", color: "#94a3b8", lineHeight: 1.7 }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                      No recycle devices yet
                    </div>
                    Once staff classifies a device as recycle and completes free data wipe preparation, it will appear here.
                  </div>
                ) : filteredRecycleDevices.length === 0 ? (
                  <div style={{ padding: "24px 20px", color: "#94a3b8", lineHeight: 1.7 }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                      No devices in this filter
                    </div>
                    Try another summary card to review a different part of the retrieval workflow.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "12px", padding: "18px 20px" }}>
                    {filteredRecycleDevices.map((device) => {
                      const order = orderByDeviceId[device.id] || null;
                      const deviceState = deviceStateById[device.id] || { state: "WAITING_FOR_WIPE" };
                      const isEligible = deviceState.state === "AVAILABLE";
                      const classification = String(device.classification || "UNKNOWN").toUpperCase();
                      const typeStyle = getDeviceTypeStyle(inferDeviceType(device));
                      const classificationStyle = getClassificationStyle(classification);
                      const statusText =
                        deviceState.state === "AVAILABLE"
                          ? `Retrieval Available until ${formatDate(device.retrievalAvailableUntil)}`
                          : deviceState.state === "WAITING_FOR_WIPE"
                          ? "Waiting for staff data wipe preparation"
                          : deviceState.state === "WINDOW_EXPIRED"
                          ? "Retrieval window expired"
                          : order
                          ? "Retrieval order already created"
                          : "Not currently available for retrieval request";
                      const statusPill =
                        deviceState.state === "AVAILABLE"
                          ? getStatusStyle("RETRIEVAL_AVAILABLE")
                          : deviceState.state === "WAITING_FOR_WIPE"
                          ? getStatusStyle("PREPARATION_PENDING")
                          : deviceState.state === "WINDOW_EXPIRED"
                          ? getStatusStyle("EXPIRED")
                          : order
                          ? getStatusStyle("LOCKED")
                          : getStatusStyle("BLOCKED");
                      const orderStatus = String(order?.status || "CREATED").toUpperCase();
                      const isExpired = !!order?.expiresAt && new Date(order.expiresAt).getTime() < Date.now();
                      const canCopySecureToken =
                        !!order &&
                        (orderStatus === "FULFILLED" || orderStatus === "RESTORED") &&
                        !isExpired;
                      const canRestore =
                        !!order &&
                        (orderStatus === "FULFILLED" || orderStatus === "RESTORED") &&
                        isExpired;
                      const orderStatusStyle = getOrderStatusStyle(isExpired ? "EXPIRED" : orderStatus);
                      const isFulfilledCard = canCopySecureToken || canRestore;
                      const requiresPayment = !!order && orderStatus === "PAYMENT_PENDING";

                      return (
                        <div
                          key={device.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: isFulfilledCard ? "20px" : deviceState.state === "AVAILABLE" || order ? "18px" : "14px 16px",
                            display: "grid",
                            gap: isFulfilledCard ? "16px" : "12px",
                            background: isFulfilledCard ? "#f8fbff" : deviceState.state === "WAITING_FOR_WIPE" || deviceState.state === "WINDOW_EXPIRED" ? "#fcfcfb" : "#fff",
                            boxShadow: isFulfilledCard ? "0 10px 24px rgba(37,99,235,0.08)" : "0 6px 18px rgba(15,23,42,0.04)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "17px" }}>{device.deviceName}</div>
                              <div style={{ marginTop: "6px", color: "#64748b", fontSize: "13px" }}>
                                {device.brand || "Unknown brand"} · {device.condition || "Unknown condition"}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                              <span
                                style={{
                                  background: statusPill.bg,
                                  color: statusPill.color,
                                  border: `1px solid ${statusPill.border}`,
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                }}
                              >
                                {statusPill.label}
                              </span>
                              <span
                                style={{
                                  background: typeStyle.bg,
                                  color: typeStyle.color,
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                }}
                              >
                                {typeStyle.label}
                              </span>
                              <span
                                style={{
                                  background: classificationStyle.bg,
                                  color: classificationStyle.color,
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                }}
                              >
                                {classificationStyle.label}
                              </span>
                              {order && (
                                <span
                                  style={{
                                    background: orderStatusStyle.bg,
                                    color: orderStatusStyle.color,
                                    border: `1px solid ${orderStatusStyle.border}`,
                                    padding: "6px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                  }}
                                >
                                  {orderStatusStyle.label}
                                </span>
                              )}
                            </div>
                          </div>

                          {isEligible ? (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1.4fr) minmax(220px, 0.9fr)",
                                gap: "14px",
                                alignItems: "stretch",
                              }}
                            >
                              <div
                                style={{
                                  padding: "14px 16px",
                                  borderRadius: "14px",
                                  background: "#ecfdf5",
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    color: "#15803d",
                                    marginBottom: "8px",
                                  }}
                                >
                                  Eligibility Status
                                </div>
                                <div style={{ color: "#15803d", lineHeight: 1.6, fontWeight: 700 }}>
                                  {statusText}
                                </div>
                              </div>

                              <div
                                style={{
                                  padding: "14px 16px",
                                  borderRadius: "14px",
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                  display: "grid",
                                  gap: "10px",
                                  alignContent: "start",
                                }}
                              >
                                <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                  Next Route
                                </div>
                                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                  Create retrieval order
                                </div>
                                <div style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.5 }}>
                                      Retrieval is available for a paid request until {formatDate(device.retrievalAvailableUntil)}.
                                </div>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleRequestForDevice(device.id)}
                                  style={{
                                    width: "fit-content",
                                    border: "none",
                                    background: "#10b981",
                                    color: "#fff",
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    opacity: submitting ? 0.7 : 1,
                                  }}
                                >
                                  {submitting && selectedDeviceId === device.id ? "Creating..." : "Start retrieval request"}
                                </button>
                              </div>
                            </div>
                          ) : order ? (
                            isFulfilledCard ? (
                              <div style={{ display: "grid", gap: "14px" }}>
                                <div
                                  style={{
                                    padding: "16px",
                                    borderRadius: "14px",
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    display: "grid",
                                    gap: "10px",
                                  }}
                                >
                                  <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Secure access ready
                                  </div>
                                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                                    {canRestore ? "Restore secure access" : "Copy secure retrieval token"}
                                  </div>
                                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                    {canRestore
                                      ? `Access expired on ${formatDate(order.expiresAt)}. Restore a new 3-month retrieval window.`
                                      : `Access expires on ${formatDate(order.expiresAt)}.`}
                                  </div>
                                  {canCopySecureToken ? (
                                    <button
                                      type="button"
                                      onClick={() => copySecureToken(order.id)}
                                      disabled={actionOrderId === order.id}
                                      style={{
                                        width: "100%",
                                        minHeight: "48px",
                                        border: "none",
                                        background: "#2563eb",
                                        color: "#fff",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        opacity: actionOrderId === order.id ? 0.7 : 1,
                                      }}
                                    >
                                      {actionOrderId === order.id ? "Copying..." : "Copy Secure Token"}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRestore(order.id)}
                                      disabled={actionOrderId === order.id}
                                      style={{
                                        width: "100%",
                                        minHeight: "48px",
                                        border: "1px solid #c7d2fe",
                                        background: "#fff",
                                        color: "#4338ca",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        opacity: actionOrderId === order.id ? 0.7 : 1,
                                      }}
                                    >
                                      {actionOrderId === order.id ? "Restoring..." : "Restore Access"}
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    onClick={() => copyOrderId(order.id)}
                                    style={{
                                      border: "1px solid #cbd5e1",
                                      background: "#fff",
                                      color: "#0f172a",
                                      padding: "10px 12px",
                                      borderRadius: "10px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Copy order ID
                                  </button>
                                  <div style={{ color: "#64748b", fontSize: "13px", alignSelf: "center" }}>
                                    Created {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 0.95fr)",
                                  gap: "14px",
                                  alignItems: "stretch",
                                }}
                              >
                                <div
                                  style={{
                                    padding: "14px 16px",
                                    borderRadius: "14px",
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    display: "grid",
                                    gap: "10px",
                                  }}
                                >
                                  <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Order progress
                                  </div>
                                  <div style={{ color: "#334155", fontWeight: 700, lineHeight: 1.6 }}>
                                    {requiresPayment
                                      ? "Payment required before staff can continue fulfillment."
                                      : orderStatus === "READY_FOR_FULFILLMENT" || orderStatus === "PAID"
                                      ? "Payment confirmed. Staff can now fulfill this retrieval order."
                                      : "Track the latest order progress for this recycle device."}
                                  </div>
                                  <div style={{ display: "grid", gap: "6px", color: "#64748b", fontSize: "13px" }}>
                                    <div>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</div>
                                    <div>Fulfilled: {order.fulfilledAt ? new Date(order.fulfilledAt).toLocaleString() : "Pending fulfillment"}</div>
                                    <div>Expiry: {order.expiresAt ? new Date(order.expiresAt).toLocaleString() : "Pending fulfillment"}</div>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    padding: "14px 16px",
                                    borderRadius: "14px",
                                    background: requiresPayment ? "#fff7ed" : "#f8fafc",
                                    border: `1px solid ${requiresPayment ? "#fdba74" : "#e2e8f0"}`,
                                    display: "grid",
                                    gap: "10px",
                                    alignContent: "start",
                                  }}
                                >
                                  <div style={{ fontSize: "12px", color: requiresPayment ? "#c2410c" : "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    {requiresPayment ? "Payment required" : "Next action"}
                                  </div>
                                  <div style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.6 }}>
                                    {requiresPayment
                                      ? "Continue to payments to complete this retrieval request."
                                      : "Use the existing order and wait for staff fulfillment."}
                                  </div>
                                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {requiresPayment && (
                                      <Link to="/payments" className="btn-link secondary" style={{ minHeight: "46px" }}>
                                        Open payments
                                      </Link>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => copyOrderId(order.id)}
                                      style={{
                                        border: "1px solid #cbd5e1",
                                        background: "#fff",
                                        color: "#0f172a",
                                        padding: "9px 12px",
                                        borderRadius: "10px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        fontSize: "12px",
                                      }}
                                    >
                                      Copy order ID
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          ) : (
                            <div
                              style={{
                                padding: "12px 14px",
                                borderRadius: "14px",
                                background: "#fffaf0",
                                border: "1px solid #fbd38d",
                                color: "#64748b",
                                lineHeight: 1.6,
                              }}
                            >
                              Waiting for staff data wipe preparation, existing order, or expired availability.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}














