import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import DashboardSelect from "../../components/DashboardSelect.jsx";
import {
  cancelOwnerPayment,
  completeOwnerSandboxPayment,
  createOwnerPayment,
  fetchOwnerOrders,
  fetchOwnerPayments,
  fetchPaymentProviders,
  fetchPaymentQuote,
} from "../../services/api.js";
import { getOrderStatusStyle, getPaymentStatusStyle } from "../../services/deviceInsights.js";
import { sortNewestFirst } from "../../services/sortUtils.js";

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f3f4f6",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

function formatMoney(amount, currency = "GBP") {
  const numeric = Number(amount || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function hasSuccessfulPayment(payments, orderId) {
  return payments.some(
    (payment) =>
      payment.orderId === orderId &&
      String(payment.status || "").toLowerCase() === "succeeded"
  );
}

function isOrderPaymentPending(order) {
  const status = String(order?.status || "").toUpperCase();
  const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
  return (
    ["PAYMENT_PENDING", "CREATED"].includes(status) &&
    ["UNPAID", "FAILED", "CANCELLED", "INITIATED"].includes(paymentStatus)
  );
}
function getPaymentJourneyState(payments, retrievalOrders) {
  const hasInitiated = payments.some(
    (payment) => String(payment.status || "").toLowerCase() === "initiated"
  );
  const hasSucceeded = payments.some(
    (payment) => String(payment.status || "").toLowerCase() === "succeeded"
  );
  const hasProcessingOrder = retrievalOrders.some(
    (order) => {
      const status = String(order.status || "").toUpperCase();
      return status === "READY_FOR_FULFILLMENT" || status === "PAID";
    }
  );
  const hasFulfilledOrder = retrievalOrders.some((order) => {
    const status = String(order.status || "").toUpperCase();
    return status === "FULFILLED" || status === "RESTORED";
  });

  if (hasFulfilledOrder) {
    return {
      title: "Secure access ready",
      body: "Your paid retrieval order has been fulfilled. Go back to Data Retrieval to copy the secure token and access the recovery window.",
      tone: { border: "#bbf7d0", background: "#f0fdf4", color: "#15803d" },
    };
  }

  if (hasSucceeded || hasProcessingOrder) {
    return {
      title: "Payment confirmed, waiting for staff fulfillment",
      body: "The payment has been accepted in the backend. Staff now needs to fulfill the retrieval order before secure access can be issued.",
      tone: { border: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" },
    };
  }

  if (hasInitiated) {
    return {
      title: "Checkout created, payment still pending",
      body: "Finish checkout with the provider, then staff or admin must confirm the payment before the retrieval order moves forward.",
      tone: { border: "#fde68a", background: "#fffbeb", color: "#b45309" },
    };
  }

  return {
    title: "No payment started yet",
    body: "Choose a retrieval order, create a payment intent, and complete checkout before staff can continue the retrieval workflow.",
    tone: { border: "#e2e8f0", background: "#f8fafc", color: "#475569" },
  };
}

export default function PaymentsPage() {
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("stripe");
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [quote, setQuote] = useState(null);
  const [createdPayment, setCreatedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutPaymentId, setCheckoutPaymentId] = useState("");
  const [error, setError] = useState("");

  const sortedOrders = useMemo(
    () => sortNewestFirst(orders, ["createdAt", "updatedAt"]),
    [orders]
  );

  const sortedPayments = useMemo(
    () => sortNewestFirst(payments, ["createdAt", "updatedAt", "paidAt"]),
    [payments]
  );

  const retrievalOrders = useMemo(
    () =>
      sortedOrders.filter(
        (order) => String(order.type || "").toUpperCase() === "DATA_RETRIEVAL"
      ),
    [sortedOrders]
  );

  const payableOrders = useMemo(
    () =>
      retrievalOrders.filter(
        (order) => isOrderPaymentPending(order) && !hasSuccessfulPayment(payments, order.id)
      ),
    [payments, retrievalOrders]
  );

  const visiblePayments = useMemo(
    () =>
      sortedPayments.filter((payment) => String(payment.status || "").toLowerCase() !== "cancelled"),
    [sortedPayments]
  );

  const orderOptions = useMemo(
    () => [
      { value: "", label: "Select a retrieval order" },
      ...payableOrders.map((order) => ({
        value: order.id,
        label: `${order.id} - ${order.status} - ${order.paymentStatus || "UNPAID"}`,
      })),
    ],
    [payableOrders]
  );

  const selectedOrderOption =
    orderOptions.find((option) => option.value === selectedOrderId) ?? orderOptions[0];

  const summary = useMemo(() => {
    const totalAmount = visiblePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return {
      total: visiblePayments.length,
      totalAmount,
      initiated: visiblePayments.filter((payment) => String(payment.status || "").toLowerCase() === "initiated").length,
      succeeded: visiblePayments.filter((payment) => String(payment.status || "").toLowerCase() === "succeeded").length,
    };
  }, [visiblePayments]);

  const paymentJourney = useMemo(
    () => getPaymentJourneyState(payments, retrievalOrders),
    [payments, retrievalOrders]
  );

  const loadPage = async () => {
    const [providerData, orderData, paymentData] = await Promise.all([
      fetchPaymentProviders(),
      fetchOwnerOrders(),
      fetchOwnerPayments(),
    ]);

    const enabledProviders = Array.isArray(providerData)
      ? providerData.filter((item) => item.enabled)
      : [];
    setProviders(enabledProviders);
    if (enabledProviders[0]?.code) {
      setProvider((current) =>
        enabledProviders.some((item) => item.code === current) ? current : enabledProviders[0].code
      );
    }
    setOrders(Array.isArray(orderData) ? orderData : []);
    setPayments(Array.isArray(paymentData) ? paymentData : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        await loadPage();
      } catch (err) {
        setError(err.message || "Failed to load payment data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadQuote = async () => {
      if (!selectedOrderId) {
        setQuote(null);
        return;
      }

      try {
        setQuoteLoading(true);
        setError("");
        const data = await fetchPaymentQuote(selectedOrderId);
        setQuote(data);
      } catch (err) {
        setQuote(null);
        setError(err.message || "Failed to load payment quote.");
      } finally {
        setQuoteLoading(false);
      }
    };

    loadQuote();
  }, [selectedOrderId]);

  const handleCheckout = async () => {
    if (!selectedOrderId || !quote) {
      setError("Choose a retrieval order with a valid backend quote first.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const payment = await createOwnerPayment({
        provider,
        amount: quote.amount,
        currency: quote.currency,
        orderId: selectedOrderId,
        description: quote.item,
        metadata: {
          type: "data_retrieval",
        },
      });
      setCreatedPayment(payment);
      await loadPage();
    } catch (err) {
      setError(err.message || "Failed to create payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (paymentId) => {
    try {
      setError("");
      await cancelOwnerPayment(paymentId);
      await loadPage();
    } catch (err) {
      setError(err.message || "Failed to cancel payment.");
    }
  };

  const handleSandboxCheckout = async (paymentId) => {
    try {
      setCheckoutPaymentId(paymentId);
      setError("");
      setCreatedPayment(null);
      await completeOwnerSandboxPayment(paymentId);
      await loadPage();
    } catch (err) {
      setError(err.message || "Failed to complete sandbox checkout.");
    } finally {
      setCheckoutPaymentId("");
    }
  };

  return (
    <div style={pageStyle}>
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="page-hero hero-blue">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.85 }}>Payments</p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px" }}>Data retrieval checkout</h1>
            <p style={{ margin: 0, maxWidth: "650px", lineHeight: 1.7, opacity: 0.92 }}>
              Pay for approved data retrieval requests and track recent payment status before staff fulfillment.
            </p>
          </section>

          {error && (
            <section
              style={{
                background: "#fff",
                border: "1px solid #fecaca",
                borderRadius: "18px",
                padding: "16px 18px",
                color: "#dc2626",
                fontWeight: 700,
              }}
            >
              {error}
            </section>
          )}

          <section className="metric-grid">
            {[
              { label: "Pending Checkout Orders", value: payableOrders.length, color: "#d97706" },
              { label: "Paid Orders", value: summary.succeeded, color: "#15803d" },
              { label: "Total Paid Value", value: formatMoney(summary.totalAmount), color: "#2563eb" },
              { label: "Recent Payment Records", value: summary.total, color: "#0f172a" },
            ].map((item) => (
              <div key={item.label} className="metric-card">
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>{item.label}</div>
                <div style={{ marginTop: "8px", fontSize: "30px", fontWeight: 800, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </section>

          <section className="split-layout" style={{ alignItems: "start" }}>
            <div
              className="surface-card payment-checkout-card"
              style={{
                padding: "22px",
              }}
            >
              <div style={{ display: "grid", gap: "8px", marginBottom: "22px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#2563eb" }}>
                  Owner Checkout
                </div>
                <h2 style={{ margin: 0, fontSize: "28px" }}>Data retrieval checkout</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Complete payment for your selected retrieval order.
                </p>
              </div>
              {loading ? (
                <div style={{ color: "#64748b" }}>Loading backend payment options...</div>
              ) : (
                <div style={{ display: "grid", gap: "18px" }}>
                  {payableOrders.length === 0 ? (
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
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                        Checkout Unavailable
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                        No payment-pending retrieval orders right now
                      </div>
                      <div style={{ color: "#475569", lineHeight: 1.7 }}>
                        Once a retrieval request reaches payment pending, you can return here to choose
                        a payment method, review the quote, and continue checkout.
                      </div>
                      <Link to="/data-retrieval" className="btn-link secondary" style={{ justifySelf: "start" }}>
                        Open Data Retrieval
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="payment-step">
                        <div style={{ display: "grid", gap: "4px", marginBottom: "10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                            Step 1
                          </div>
                          <label style={{ fontWeight: 800, color: "#0f172a" }}>Select retrieval order</label>
                        </div>
                        <DashboardSelect
                          inputId="payment-order-select"
                          name="selectedOrderId"
                          options={orderOptions}
                          value={selectedOrderOption}
                          onChange={(selectedOption) => setSelectedOrderId(selectedOption?.value || "")}
                        />
                      </div>

                      <div className="payment-step">
                        <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                            Step 2
                          </div>
                          <label style={{ fontWeight: 800, color: "#0f172a" }}>Choose payment method</label>
                        </div>
                        <div className="payment-method-options">
                          {providers.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => setProvider(item.code)}
                              className={`payment-method-option${provider === item.code ? " active" : ""}`}
                            >
                              <strong style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                                {item.name}
                              </strong>
                              <span style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
                                {item.code === "stripe"
                                  ? "Card payment checkout"
                                  : "PayPal checkout"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="payment-step">
                        <div style={{ display: "grid", gap: "4px", marginBottom: "10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                            Step 3
                          </div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>Retrieval quote</div>
                        </div>
                        <div
                          style={{
                            padding: "18px",
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                            borderRadius: "14px",
                          }}
                        >
                          {quoteLoading ? (
                            <div style={{ color: "#64748b" }}>Loading quote...</div>
                          ) : quote ? (
                            <div style={{ display: "grid", gap: "8px" }}>
                              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Current amount</div>
                              <div style={{ fontSize: "32px", fontWeight: 800, color: "#2563eb" }}>
                                {formatMoney(quote.amount, quote.currency)}
                              </div>
                              <div style={{ color: "#475569", lineHeight: 1.6 }}>{quote.explanation}</div>
                            </div>
                          ) : (
                            <div style={{ color: "#94a3b8" }}>Select an order to request a quote.</div>
                          )}
                        </div>
                      </div>

                      <div className="payment-step" style={{ gap: "12px" }}>
                        <div style={{ display: "grid", gap: "4px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                            Step 4
                          </div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>Continue checkout</div>
                        </div>
                        <button
                          type="button"
                          disabled={submitting || !quote || !provider}
                          onClick={handleCheckout}
                          style={{
                            width: "100%",
                            minHeight: "48px",
                            border: "none",
                            background: "#2563eb",
                            color: "#fff",
                            padding: "14px 16px",
                            borderRadius: "12px",
                            fontWeight: 800,
                            fontSize: "15px",
                            cursor: "pointer",
                            opacity: submitting || !quote || !provider ? 0.7 : 1,
                            boxShadow: "0 14px 28px rgba(37,99,235,0.22)",
                          }}
                        >
                          {submitting ? "Creating..." : "Continue to payment"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {(createdPayment || paymentJourney.title === "Secure access ready") && (
                <div className="payment-success-notice" style={{ marginTop: "18px" }}>
                  {createdPayment ? (
                    (() => {
                      const createdPaymentStatusStyle = getPaymentStatusStyle(createdPayment.status);

                      return (
                        <>
                          <div style={{ display: "grid", gap: "8px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#1d4ed8" }}>
                              Payment created
                            </div>
                            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                              Sandbox payment intent created
                            </div>
                            <div style={{ color: "#475569", lineHeight: 1.7 }}>
                              Status:{" "}
                              <span
                                style={{
                                  background: createdPaymentStatusStyle.bg,
                                  color: createdPaymentStatusStyle.color,
                                  border: `1px solid ${createdPaymentStatusStyle.border}`,
                                  padding: "5px 9px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                }}
                              >
                                {createdPaymentStatusStyle.label}
                              </span>
                              . Continue checkout below to finish this sandbox payment flow before staff fulfillment continues.
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => handleSandboxCheckout(createdPayment.id)}
                              disabled={checkoutPaymentId === createdPayment.id}
                              style={{
                                border: "none",
                                background: "#2563eb",
                                color: "#fff",
                                padding: "12px 16px",
                                borderRadius: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                                opacity: checkoutPaymentId === createdPayment.id ? 0.7 : 1,
                              }}
                            >
                              {checkoutPaymentId === createdPayment.id ? "Completing..." : "Open Checkout"}
                            </button>
                            <Link to="/data-retrieval" className="btn-link secondary">
                              Open Data Retrieval
                            </Link>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div style={{ display: "grid", gap: "8px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: paymentJourney.tone.color }}>
                          Payment confirmed
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                          {paymentJourney.title}
                        </div>
                        <div style={{ color: "#475569", lineHeight: 1.7 }}>{paymentJourney.body}</div>
                      </div>
                      <Link to="/data-retrieval" className="btn-link secondary" style={{ justifySelf: "start" }}>
                        Go Back to Data Retrieval
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <section
              className="surface-card"
              style={{
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ margin: 0, fontSize: "22px" }}>Recent payments</h2>
                <p style={{ margin: "8px 0 0 0", color: "#64748b", lineHeight: 1.6 }}>
                  Review your latest payment activity and continue any open sandbox checkout that still
                  needs confirmation.
                </p>
              </div>

              {visiblePayments.length === 0 ? (
                <div style={{ padding: "20px 22px", color: "#94a3b8" }}>
                  No payment records yet.
                </div>
              ) : (
                <div className="dashboard-list compact-payments-list">
                  {visiblePayments.map((payment) => {
                    const paymentStatusStyle = getPaymentStatusStyle(payment.status);
                    const linkedOrder = orders.find((order) => order.id === payment.orderId);
                    const orderStatusStyle = getOrderStatusStyle(linkedOrder?.status);
                    const shortOrderId = payment.orderId ? `${payment.orderId.slice(0, 8)}...` : "-";

                    return (
                      <article key={payment.id} className="dashboard-list-item payment-list-item">
                        <div className="dashboard-list-main">
                          <div className="dashboard-list-title-row">
                            <div className="payment-amount">{formatMoney(payment.amount, payment.currency)}</div>
                          </div>
                          <div className="dashboard-list-subtle">
                            {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}
                          </div>
                          <div className="dashboard-list-subtle">
                            Payment method: {payment.provider || "-"}
                          </div>
                          <div className="dashboard-list-note">
                            <span className="dashboard-list-note-label">Linked order</span>
                            <p title={payment.orderId || ""}>{shortOrderId}</p>
                          </div>
                        </div>

                        <div className="dashboard-list-meta">
                          <div className="dashboard-list-meta-block">
                            <span className="dashboard-list-note-label">Order status</span>
                            <div className="dashboard-list-badges">
                              <span
                                style={{
                                  background: orderStatusStyle.bg,
                                  color: orderStatusStyle.color,
                                  border: `1px solid ${orderStatusStyle.border}`,
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                }}
                              >
                                {orderStatusStyle.label}
                              </span>
                              <span
                                style={{
                                  background: "#f8fafc",
                                  color: "#475569",
                                  border: "1px solid #e2e8f0",
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                }}
                              >
                                {linkedOrder?.paymentStatus || "-"}
                              </span>
                            </div>
                          </div>
                          <div className="dashboard-list-meta-block">
                            <span className="dashboard-list-note-label">Payment status</span>
                            <div className="dashboard-list-badges">
                              <span
                                style={{
                                  background: paymentStatusStyle.bg,
                                  color: paymentStatusStyle.color,
                                  border: `1px solid ${paymentStatusStyle.border}`,
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                }}
                              >
                                {paymentStatusStyle.label}
                              </span>
                            </div>
                            {String(payment.status || "").toLowerCase() === "initiated" && (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  onClick={() => handleSandboxCheckout(payment.id)}
                                  disabled={checkoutPaymentId === payment.id}
                                  style={{
                                    border: "1px solid #bfdbfe",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    padding: "9px 12px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    opacity: checkoutPaymentId === payment.id ? 0.7 : 1,
                                  }}
                                >
                                  {checkoutPaymentId === payment.id ? "Completing..." : "Resume Checkout"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancel(payment.id)}
                                  style={{
                                    border: "1px solid #fecaca",
                                    background: "#fff",
                                    color: "#dc2626",
                                    padding: "9px 12px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}




