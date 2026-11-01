import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import DashboardInput from "../../components/DashboardInput.jsx";
import DashboardSelect from "../../components/DashboardSelect.jsx";
import DashboardTextarea from "../../components/DashboardTextarea.jsx";
import {
  getErasureStatusStyle,
  getOrderStatusStyle,
  getWorkflowStatusStyle,
} from "../../services/deviceInsights.js";
import {
  createStaffDataErasureRecord,
  fetchStaffDataErasureRecord,
  fetchStaffOrders,
  fetchStaffRecycleProcessingDevices,
  fulfillStaffOrder,
  markStaffDataWipeComplete,
  updateStaffDataErasureStatus,
} from "../../services/api.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

const ERASURE_STATUSES = ["REQUESTED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"];
const FULFILLED_STATUSES = new Set(["FULFILLED", "RESTORED"]);
const READY_FOR_FULFILLMENT_STATUSES = new Set(["READY_FOR_FULFILLMENT", "PAID", "PROCESSING"]);
const WAITING_FOR_PAYMENT_STATUSES = new Set(["PAYMENT_PENDING", "CREATED"]);
const erasureStatusOptions = ERASURE_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

function formatDateTime(value, fallback = "-") {
  return value ? new Date(value).toLocaleString() : fallback;
}

function isMissingErasureRecord(error) {
  return String(error?.message || "").toLowerCase().includes("not found");
}

function formatShortId(value) {
  if (!value) return "-";
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getPaymentReadinessCopy(status) {
  const normalized = String(status || "").toUpperCase();
  if (WAITING_FOR_PAYMENT_STATUSES.has(normalized)) return "Waiting payment";
  if (READY_FOR_FULFILLMENT_STATUSES.has(normalized)) return "Ready to fulfill";
  if (FULFILLED_STATUSES.has(normalized)) return "Completed";
  return "In progress";
}

export default function StaffOrdersPage() {
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState([]);
  const [recycleQueue, setRecycleQueue] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setFulfilledOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [erasureRecord, setErasureRecord] = useState(null);
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureSaving, setErasureSaving] = useState(false);
  const [erasureError, setErasureError] = useState("");
  const [erasureNotice, setErasureNotice] = useState("");
  const [activeQueueFilter, setActiveQueueFilter] = useState("NEEDS_ACTION");
  const [erasureForm, setErasureForm] = useState({
    status: "REQUESTED",
    certificateCode: "",
    staffNote: "",
  });

  const sortedOrders = useMemo(
    () => sortNewestFirst(orders, ["createdAt", "updatedAt"]),
    [orders]
  );

  const sortedRecycleQueue = useMemo(() => sortNewestFirst(recycleQueue), [recycleQueue]);

  const retrievalOrders = useMemo(
    () =>
      sortedOrders.filter((order) => String(order.type || "").toUpperCase() === "DATA_RETRIEVAL"),
    [sortedOrders]
  );

  const selectedOrder = useMemo(() => {
    return retrievalOrders.find((order) => order.id === selectedOrderId) || null;
  }, [retrievalOrders, selectedOrderId]);

  const pendingWipeDevices = useMemo(
    () =>
      sortedRecycleQueue.filter((device) => {
        const wipeStatus = String(device.dataWipeStatus || "").toUpperCase();
        return device.retrievalAvailable !== true && wipeStatus !== "COMPLETED";
      }),
    [sortedRecycleQueue]
  );

  const orderSummary = useMemo(() => {
    const readyToFulfill = retrievalOrders.filter(
      (order) => READY_FOR_FULFILLMENT_STATUSES.has(String(order.status || "").toUpperCase())
    ).length;
    const fulfilled = retrievalOrders.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      return FULFILLED_STATUSES.has(status);
    }).length;
    const active = retrievalOrders.filter((order) => {
      if (!order.expiresAt) return false;
      return new Date(order.expiresAt).getTime() > Date.now();
    }).length;

    return {
      total: retrievalOrders.length,
      dataWipePending: pendingWipeDevices.length,
      readyToFulfill,
      fulfilled,
      active,
    };
  }, [pendingWipeDevices.length, retrievalOrders]);

  const loadOrders = async () => {
    try {
      setPageLoading(true);
      const [orderData, recycleData] = await Promise.all([
        fetchStaffOrders(),
        fetchStaffRecycleProcessingDevices(),
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setRecycleQueue(Array.isArray(recycleData) ? recycleData : []);
    } catch (err) {
      setError(err.message || "Failed to load staff orders.");
    } finally {
      setPageLoading(false);
    }
  };

  const syncErasureForm = (record) => {
    setErasureForm({
      status: String(record?.status || "REQUESTED").toUpperCase(),
      certificateCode: record?.certificateCode || "",
      staffNote: record?.staffNote || "",
    });
  };

  const loadErasureRecord = useCallback(async (deviceId) => {
    if (!deviceId) {
      setErasureRecord(null);
      setErasureError("");
      setErasureNotice("");
      syncErasureForm(null);
      return;
    }

    try {
      setErasureLoading(true);
      setErasureError("");
      setErasureNotice("");
      const data = await fetchStaffDataErasureRecord(deviceId);
      setErasureRecord(data);
      syncErasureForm(data);
    } catch (err) {
      if (isMissingErasureRecord(err)) {
        setErasureRecord(null);
        syncErasureForm(null);
      } else {
        setErasureError(err.message || "Failed to load data wiping record.");
      }
    } finally {
      setErasureLoading(false);
    }
  }, []);

  const selectedErasureStatusOption =
    erasureStatusOptions.find((option) => option.value === erasureForm.status) ??
    erasureStatusOptions[0];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!retrievalOrders.length) {
      setSelectedOrderId("");
    }
  }, [retrievalOrders, selectedOrderId]);

  useEffect(() => {
    if (selectedOrder?.deviceId) {
      loadErasureRecord(selectedOrder.deviceId);
    } else {
      loadErasureRecord(null);
    }
  }, [loadErasureRecord, selectedOrder?.deviceId]);

  const handleFulfill = async (nextOrderId = orderId) => {
    if (!nextOrderId.trim()) {
      setError("Order ID is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await fulfillStaffOrder(nextOrderId.trim());
      setFulfilledOrder(result);
      setOrderId(nextOrderId.trim());
      setSelectedOrderId(result.id);
      await loadOrders();
    } catch (err) {
      setError(err.message || "Failed to fulfill order.");
      setFulfilledOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateErasureRecord = async () => {
    if (!selectedOrder?.deviceId) return;

    try {
      setErasureSaving(true);
      setErasureError("");
      setErasureNotice("");
      const data = await createStaffDataErasureRecord(selectedOrder.deviceId);
      setErasureRecord(data);
      syncErasureForm(data);
      setErasureNotice("Data wiping record created.");
    } catch (err) {
      setErasureError(err.message || "Failed to create data wiping record.");
    } finally {
      setErasureSaving(false);
    }
  };

  const handleSaveErasureStatus = async () => {
    if (!selectedOrder?.deviceId) return;

    try {
      setErasureSaving(true);
      setErasureError("");
      setErasureNotice("");
      const data = await updateStaffDataErasureStatus(selectedOrder.deviceId, {
        status: erasureForm.status,
        certificateCode: erasureForm.certificateCode.trim(),
        staffNote: erasureForm.staffNote.trim(),
      });
      setErasureRecord(data);
      syncErasureForm(data);
      setErasureNotice("Data wiping record updated.");
    } catch (err) {
      setErasureError(err.message || "Failed to update data wiping record.");
    } finally {
      setErasureSaving(false);
    }
  };

  const selectedOrderStatus = String(selectedOrder?.status || "").toUpperCase();
  const selectedOrderIsFulfilled = FULFILLED_STATUSES.has(selectedOrderStatus);
  const selectedOrderReadyForFulfillment = READY_FOR_FULFILLMENT_STATUSES.has(selectedOrderStatus);
  const selectedOrderWaitingForPayment = WAITING_FOR_PAYMENT_STATUSES.has(selectedOrderStatus);
  const waitingPaymentCount = retrievalOrders.filter((order) =>
    WAITING_FOR_PAYMENT_STATUSES.has(String(order.status || "").toUpperCase())
  ).length;
  const completedWipeDevices = sortedRecycleQueue.filter((device) => !pendingWipeDevices.includes(device));
  const readyOrders = retrievalOrders.filter((order) =>
    READY_FOR_FULFILLMENT_STATUSES.has(String(order.status || "").toUpperCase())
  );
  const waitingPaymentOrders = retrievalOrders.filter((order) =>
    WAITING_FOR_PAYMENT_STATUSES.has(String(order.status || "").toUpperCase())
  );
  const fulfilledOrders = retrievalOrders.filter((order) =>
    FULFILLED_STATUSES.has(String(order.status || "").toUpperCase())
  );
  const visibleOrders = useMemo(() => {
    if (activeQueueFilter === "NEEDS_ACTION") return readyOrders;
    if (activeQueueFilter === "WAITING_PAYMENT") return waitingPaymentOrders;
    if (activeQueueFilter === "FULFILLED") return fulfilledOrders;
    return retrievalOrders;
  }, [
    activeQueueFilter,
    fulfilledOrders,
    readyOrders,
    retrievalOrders,
    waitingPaymentOrders,
  ]);
  const queueFilters = [
    { key: "NEEDS_ACTION", label: "Needs action" },
    { key: "WAITING_PAYMENT", label: "Waiting payment" },
    { key: "FULFILLED", label: "Fulfilled" },
    { key: "ALL", label: "All" },
  ];

  useEffect(() => {
    if (!selectedOrderId) return;
    if (!visibleOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId("");
    }
  }, [selectedOrderId, visibleOrders]);

  return (
    <div className="app-page">
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <section className="page-hero hero-teal">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.85 }}>Staff Orders</p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px" }}>Fulfill retrieval orders</h1>
            <p style={{ margin: 0, maxWidth: "660px", lineHeight: 1.7, opacity: 0.92 }}>
              Complete free data wipe preparation, verify paid retrieval orders, and issue secure
              access after successful owner payment.
            </p>
          </section>

          <section className="metric-grid">
            {[
              { label: "Data Wipe Pending", value: orderSummary.dataWipePending, color: "#0f766e", icon: "🧹" },
              { label: "Ready To Fulfill", value: orderSummary.readyToFulfill, color: "#d97706", icon: "⏳" },
              { label: "Waiting Payment", value: waitingPaymentCount, color: "#c2410c", icon: "💳" },
              { label: "Fulfilled", value: orderSummary.fulfilled, color: "#15803d", icon: "✅" },
            ].map((item) => (
              <div key={item.label} className="metric-card">
                <div style={{ fontSize: "26px", marginBottom: "12px" }}>{item.icon}</div>
                <div className="metric-label">{item.label}</div>
                <div className="metric-value" style={{ color: item.color }}>
                  {pageLoading ? "..." : item.value}
                </div>
              </div>
            ))}
          </section>

          {error && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #fecaca",
                borderRadius: "16px",
                padding: "18px 20px",
                color: "#dc2626",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <section
            className="split-layout"
            style={{ gridTemplateColumns: "1.35fr 0.9fr", alignItems: "start" }}
          >
            <div className="surface-card" style={{ padding: "24px 24px 26px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "start",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 10px 0", fontSize: "22px" }}>Work queue</h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, maxWidth: "640px" }}>
                    Focus on devices that still need free preparation and orders that are waiting
                    for payment or ready for final fulfillment.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {queueFilters.map((filter) => {
                    const active = activeQueueFilter === filter.key;
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setActiveQueueFilter(filter.key)}
                        style={{
                          border: `1px solid ${active ? "#7dd3fc" : "#cbd5e1"}`,
                          background: active ? "#ecfeff" : "#fff",
                          color: active ? "#0f766e" : "#475569",
                          padding: "9px 12px",
                          borderRadius: "999px",
                          fontWeight: 800,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(activeQueueFilter === "NEEDS_ACTION" || activeQueueFilter === "ALL") && (
                <div style={{ display: "grid", gap: "16px", marginBottom: "22px" }}>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "baseline",
                        marginBottom: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                        Data wipe preparation
                      </div>
                      <div style={{ color: "#64748b", fontSize: "13px", fontWeight: 700 }}>
                        {pendingWipeDevices.length} pending
                      </div>
                    </div>

                    {pageLoading ? (
                      <div style={{ color: "#64748b" }}>Loading recycle processing queue...</div>
                    ) : pendingWipeDevices.length === 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gap: "8px",
                          padding: "16px",
                          borderRadius: "16px",
                          border: "1px solid #e2e8f0",
                          background: "#fcfdff",
                        }}
                      >
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          All recycle devices are prepared
                        </div>
                        <div style={{ color: "#64748b", lineHeight: 1.7 }}>
                          No devices are waiting for free data wipe preparation.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "12px" }}>
                        {pendingWipeDevices.map((device) => {
                  const wipeStatus = String(device.dataWipeStatus || "PENDING").toUpperCase();
                  const available = device.retrievalAvailable === true;
                  const workflowStatusStyle = getWorkflowStatusStyle(
                    device.workflowStatus || "DATA_WIPE_PENDING"
                  );
                  const wipeStatusStyle = getErasureStatusStyle(
                    wipeStatus === "PENDING" ? "REQUESTED" : wipeStatus
                  );
                  return (
                    <div
                      key={device.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "16px 18px",
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: "14px",
                        alignItems: "center",
                        background: "#fff",
                      }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{device.deviceName}</div>
                          <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            alignItems: "center",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          <span>{device.brand || "Unknown brand"}</span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "5px 10px",
                              borderRadius: "999px",
                              fontWeight: 800,
                              fontSize: "11px",
                              letterSpacing: 0,
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {device.deviceType || "Unknown type"}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "5px 10px",
                              borderRadius: "999px",
                              fontWeight: 800,
                              fontSize: "11px",
                              letterSpacing: 0,
                              background: workflowStatusStyle.bg,
                              color: workflowStatusStyle.color,
                              border: `1px solid ${workflowStatusStyle.border}`,
                            }}
                          >
                            {workflowStatusStyle.label}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "5px 10px",
                              borderRadius: "999px",
                              fontWeight: 800,
                              fontSize: "11px",
                              letterSpacing: 0,
                              background: wipeStatusStyle.bg,
                              color: wipeStatusStyle.color,
                              border: `1px solid ${wipeStatusStyle.border}`,
                            }}
                          >
                            {wipeStatusStyle.label}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: "10px",
                            color: available ? "#15803d" : "#475569",
                            fontWeight: 700,
                          }}
                        >
                          {available
                            ? `Available until ${formatDateTime(device.retrievalAvailableUntil, "-")}`
                            : wipeStatus === "COMPLETED"
                            ? "Data wipe completed"
                            : "Waiting for free data wipe completion"}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={loading || available}
                        onClick={async () => {
                          try {
                            setLoading(true);
                            setError("");
                            setErasureNotice("");
                            await markStaffDataWipeComplete(device.id);
                            setErasureNotice("Free data wipe completed. Retrieval is now available to the owner.");
                            await loadOrders();
                          } catch (err) {
                            setError(err.message || "Failed to mark data wipe complete.");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{
                          border: "none",
                          background: available ? "#e2e8f0" : "#0f766e",
                          color: available ? "#475569" : "#fff",
                          padding: "11px 14px",
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: available ? "default" : "pointer",
                          opacity: loading ? 0.7 : 1,
                        }}
                      >
                        {available ? "Retrieval Available" : "Mark Data Wipe Complete"}
                      </button>
                    </div>
                  );
                        })}
                      </div>
                    )}
                  </div>

                  {activeQueueFilter === "ALL" && completedWipeDevices.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "baseline",
                          marginBottom: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          Prepared devices
                        </div>
                        <div style={{ color: "#64748b", fontSize: "13px", fontWeight: 700 }}>
                          {completedWipeDevices.length} ready
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: "10px" }}>
                        {completedWipeDevices.map((device) => {
                          const wipeStatus = String(device.dataWipeStatus || "COMPLETED").toUpperCase();
                          const workflowStatusStyle = getWorkflowStatusStyle(
                            device.workflowStatus || "DATA_WIPE_COMPLETED"
                          );
                          const wipeStatusStyle = getErasureStatusStyle(
                            wipeStatus === "PENDING" ? "REQUESTED" : wipeStatus
                          );

                          return (
                            <div
                              key={`prepared-${device.id}`}
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "14px 16px",
                                background: "#ffffff",
                                display: "grid",
                                gap: "10px",
                              }}
                            >
                              <div style={{ fontWeight: 800, color: "#0f172a" }}>{device.deviceName}</div>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "8px",
                                  alignItems: "center",
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                <span>{device.brand || "Unknown brand"}</span>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "5px 10px",
                                    borderRadius: "999px",
                                    fontWeight: 800,
                                    fontSize: "11px",
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                    border: "1px solid #bfdbfe",
                                  }}
                                >
                                  {device.deviceType || "Unknown type"}
                                </span>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "5px 10px",
                                    borderRadius: "999px",
                                    fontWeight: 800,
                                    fontSize: "11px",
                                    background: workflowStatusStyle.bg,
                                    color: workflowStatusStyle.color,
                                    border: `1px solid ${workflowStatusStyle.border}`,
                                  }}
                                >
                                  {workflowStatusStyle.label}
                                </span>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "5px 10px",
                                    borderRadius: "999px",
                                    fontWeight: 800,
                                    fontSize: "11px",
                                    background: wipeStatusStyle.bg,
                                    color: wipeStatusStyle.color,
                                    border: `1px solid ${wipeStatusStyle.border}`,
                                  }}
                                >
                                  {wipeStatusStyle.label}
                                </span>
                              </div>
                              <div style={{ color: "#15803d", fontWeight: 700 }}>
                                Available until {formatDateTime(device.retrievalAvailableUntil, "-")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "baseline",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                    Retrieval order queue
                  </div>
                  <div style={{ color: "#64748b", fontSize: "13px", fontWeight: 700 }}>
                    {activeQueueFilter === "NEEDS_ACTION"
                      ? `${readyOrders.length} ready to fulfill`
                      : activeQueueFilter === "WAITING_PAYMENT"
                      ? `${waitingPaymentOrders.length} waiting payment`
                      : activeQueueFilter === "FULFILLED"
                      ? `${fulfilledOrders.length} completed`
                      : `${retrievalOrders.length} orders`}
                  </div>
                </div>

                {pageLoading ? (
                  <div style={{ color: "#64748b", paddingTop: "8px" }}>Loading orders...</div>
                ) : (
                  (() => {
                    if (!visibleOrders.length) {
                      return (
                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            padding: "16px",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            background: "#fcfdff",
                          }}
                        >
                          <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                            No orders in this queue
                          </div>
                          <div style={{ color: "#64748b", lineHeight: 1.7 }}>
                            Select another queue to review payment, fulfillment, or completed
                            retrieval records.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {visibleOrders.map((order) => {
                          const status = String(order.status || "CREATED").toUpperCase();
                          const orderStatusStyle = getOrderStatusStyle(status);
                          const isFulfilled = FULFILLED_STATUSES.has(status);
                          const isWaitingForPayment = WAITING_FOR_PAYMENT_STATUSES.has(status);
                          const isReadyToFulfill = READY_FOR_FULFILLMENT_STATUSES.has(status);
                          const isSelected = selectedOrder?.id === order.id;

                          return (
                            <div
                              key={order.id}
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setOrderId(order.id);
                              }}
                              style={{
                                border: `1px solid ${isSelected ? "#99f6e4" : "#e5e7eb"}`,
                                borderRadius: "16px",
                                padding: "16px 18px",
                                background: isSelected ? "#f0fdfa" : "#ffffff",
                                display: "grid",
                                gap: "12px",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(0, 1fr) auto",
                                  gap: "12px",
                                  alignItems: "start",
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{ fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}
                                    title={order.id}
                                  >
                                    {formatShortId(order.id)}
                                  </div>
                                  <div style={{ marginTop: "6px", color: "#64748b", fontSize: "13px" }}>
                                    Device {formatShortId(order.deviceId)}
                                  </div>
                                </div>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "6px 12px",
                                    borderRadius: "999px",
                                    fontWeight: 800,
                                    fontSize: "12px",
                                    letterSpacing: 0,
                                    background: orderStatusStyle.bg,
                                    color: orderStatusStyle.color,
                                    border: `1px solid ${orderStatusStyle.border}`,
                                  }}
                                >
                                  {orderStatusStyle.label}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "8px 10px",
                                  alignItems: "center",
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "5px 10px",
                                    borderRadius: "999px",
                                    fontWeight: 800,
                                    fontSize: "11px",
                                    background: isWaitingForPayment
                                      ? "#fff7ed"
                                      : isFulfilled
                                      ? "#f0fdf4"
                                      : isReadyToFulfill
                                      ? "#eff6ff"
                                      : "#f8fafc",
                                    color: isWaitingForPayment
                                      ? "#c2410c"
                                      : isFulfilled
                                      ? "#15803d"
                                      : isReadyToFulfill
                                      ? "#2563eb"
                                      : "#475569",
                                    border: `1px solid ${
                                      isWaitingForPayment
                                        ? "#fdba74"
                                        : isFulfilled
                                        ? "#bbf7d0"
                                        : isReadyToFulfill
                                        ? "#bfdbfe"
                                        : "#e2e8f0"
                                    }`,
                                  }}
                                >
                                  {getPaymentReadinessCopy(status)}
                                </span>
                                <span>Created {formatDateTime(order.createdAt)}</span>
                                <span>Expiry {formatDateTime(order.expiresAt, "Pending fulfillment")}</span>
                              </div>

                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedOrderId(order.id);
                                    setOrderId(order.id);
                                  }}
                                  style={{
                                    border: "1px solid #cbd5e1",
                                    background: "#fff",
                                    color: "#0f172a",
                                    padding: "8px 12px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Open Wipe
                                </button>
                                {isFulfilled ? (
                                  <span style={{ color: "#94a3b8", fontWeight: 700, alignSelf: "center" }}>
                                    Completed
                                  </span>
                                ) : isWaitingForPayment ? (
                                  <span style={{ color: "#c2410c", fontWeight: 700, alignSelf: "center" }}>
                                    Waiting for payment
                                  </span>
                                ) : (
                                  <span style={{ color: "#2563eb", fontWeight: 700, alignSelf: "center" }}>
                                    Ready to fulfill
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="surface-card" style={{ padding: "24px 24px 26px" }}>
              <h2 style={{ margin: "0 0 12px 0", fontSize: "22px" }}>Selected order detail</h2>
              {selectedOrder ? (
                <>
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "16px",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        Selected order
                      </div>
                      <div
                        style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}
                        title={selectedOrder.id}
                      >
                        {formatShortId(selectedOrder.id)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        Linked device
                      </div>
                      <div
                        style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}
                        title={selectedOrder.deviceId}
                      >
                        {formatShortId(selectedOrder.deviceId)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        Current order status
                      </div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {getOrderStatusStyle(selectedOrder.status).label}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        Payment status
                      </div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {getPaymentReadinessCopy(selectedOrder.status)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        Expiry
                      </div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {formatDateTime(selectedOrder.expiresAt, "Pending fulfillment")}
                      </div>
                    </div>
                  </div>

                  {!selectedOrderIsFulfilled && (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#fff7ed",
                        border: "1px solid #fdba74",
                        color: "#9a3412",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedOrderWaitingForPayment
                        ? "This order is still waiting for payment confirmation. Staff can still prepare the linked recycle device for free data wiping, but secure retrieval fulfillment must wait until payment succeeds."
                        : selectedOrderReadyForFulfillment
                          ? "This order has been paid and is ready for fulfillment. Staff can now complete the secure retrieval fulfillment step."
                          : "This order is not fulfilled yet. You can still open the backend data wiping record now, but the retrieval access window will only be active after fulfillment."}
                    </div>
                  )}

                  {!selectedOrderWaitingForPayment && !selectedOrderIsFulfilled && (
                    <button
                      type="button"
                      onClick={() => handleFulfill(selectedOrder.id)}
                      disabled={loading || !selectedOrderReadyForFulfillment}
                      style={{
                        width: "100%",
                        minHeight: "48px",
                        marginBottom: "16px",
                        border: "none",
                        background: selectedOrderReadyForFulfillment ? "#0f766e" : "#cbd5e1",
                        color: selectedOrderReadyForFulfillment ? "#fff" : "#475569",
                        padding: "14px 18px",
                        borderRadius: "12px",
                        fontWeight: 800,
                        cursor: selectedOrderReadyForFulfillment ? "pointer" : "default",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? "Fulfilling..." : "Fulfill Order"}
                    </button>
                  )}

                  {erasureError && (
                    <div
                      style={{
                        marginBottom: "14px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#fff",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      {erasureError}
                    </div>
                  )}

                  {erasureNotice && (
                    <div
                      style={{
                        marginBottom: "14px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#15803d",
                        fontWeight: 600,
                      }}
                    >
                      {erasureNotice}
                    </div>
                  )}

                  {erasureLoading ? (
                    <div style={{ color: "#64748b" }}>Loading data wiping record...</div>
                  ) : !erasureRecord ? (
                    <div
                      style={{
                        display: "grid",
                        gap: "14px",
                        padding: "18px",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        background: "#fcfdff",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          No wipe record yet
                        </div>
                        <div style={{ marginTop: "8px", color: "#64748b", lineHeight: 1.7 }}>
                          Create a data wipe record when this order is ready for secure handling.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateErasureRecord}
                        disabled={erasureSaving}
                        style={{
                          justifySelf: "start",
                          border: "none",
                          background: "#0f766e",
                          color: "#fff",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          opacity: erasureSaving ? 0.7 : 1,
                        }}
                      >
                        {erasureSaving ? "Creating..." : "Create Data Wipe Record"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                      {(() => {
                        const erasureStatusStyle = getErasureStatusStyle(erasureRecord.status);
                        return (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>
                              Current status
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 12px",
                                borderRadius: "999px",
                                fontWeight: 800,
                                fontSize: "12px",
                                letterSpacing: 0,
                                background: erasureStatusStyle.bg,
                                color: erasureStatusStyle.color,
                                border: `1px solid ${erasureStatusStyle.border}`,
                              }}
                            >
                              {erasureStatusStyle.label}
                            </span>
                          </div>
                        );
                      })()}

                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "14px",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          display: "grid",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Provider</div>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{erasureRecord.erasureProvider || "-"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Requested</div>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {formatDateTime(erasureRecord.requestedAt)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Completed</div>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {formatDateTime(erasureRecord.completedAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: "12px" }}>
                        <label style={{ display: "grid", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Status</span>
                          <DashboardSelect
                            inputId="erasure-status-select"
                            name="erasureStatus"
                            options={erasureStatusOptions}
                            value={selectedErasureStatusOption}
                            onChange={(selectedOption) =>
                              setErasureForm((current) => ({
                                ...current,
                                status: selectedOption?.value || "REQUESTED",
                              }))
                            }
                          />
                        </label>

                        <label style={{ display: "grid", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                            Certificate code
                          </span>
                          <DashboardInput
                            value={erasureForm.certificateCode}
                            onChange={(e) =>
                              setErasureForm((current) => ({
                                ...current,
                                certificateCode: e.target.value,
                              }))
                            }
                            placeholder="ERASURE-XXXXXXXX"
                          />
                        </label>

                        <label style={{ display: "grid", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                            Staff note
                          </span>
                          <DashboardTextarea
                            rows={4}
                            value={erasureForm.staffNote}
                            onChange={(e) =>
                              setErasureForm((current) => ({
                                ...current,
                                staffNote: e.target.value,
                              }))
                            }
                            placeholder="Add wiping progress, recycler confirmation, or failure notes."
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveErasureStatus}
                        disabled={erasureSaving}
                        style={{
                          justifySelf: "start",
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          opacity: erasureSaving ? 0.7 : 1,
                        }}
                      >
                        {erasureSaving ? "Saving..." : "Save Data Wipe Update"}
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "18px",
                      padding: "16px",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      background: "#fcfdff",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                      Manual lookup
                    </div>
                    <div style={{ color: "#64748b", lineHeight: 1.7 }}>
                      Keep manual order lookup available for pasted order IDs or queue handoff work.
                    </div>
                    <DashboardInput
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Order UUID"
                    />
                    <button
                      type="button"
                      onClick={() => handleFulfill()}
                      disabled={loading}
                      style={{
                        justifySelf: "start",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#0f172a",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? "Checking..." : "Fulfill by ID"}
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "grid",
                      gap: "8px",
                      color: "#475569",
                      lineHeight: 1.7,
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>Fulfillment checklist</div>
                    <div>1. Complete free preparation first.</div>
                    <div>2. Owner payment is required before fulfillment.</div>
                    <div>3. Fulfillment issues token and expiry.</div>
                  </div>
                </>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      padding: "18px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      background: "#fcfdff",
                      color: "#64748b",
                    }}
                  >
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                      Select an order to review
                    </div>
                    <div style={{ lineHeight: 1.7 }}>
                      Choose a retrieval order from the work queue to inspect payment status, wipe
                      record, and fulfillment action.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      background: "#fcfdff",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                      Manual lookup
                    </div>
                    <DashboardInput
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Order UUID"
                    />
                    <button
                      type="button"
                      onClick={() => handleFulfill()}
                      disabled={loading}
                      style={{
                        justifySelf: "start",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#0f172a",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? "Checking..." : "Fulfill by ID"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}






