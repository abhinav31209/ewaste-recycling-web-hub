const API_BASE_URL = "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || data || text || "Request failed.");
  }

  return data;
}

export async function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser() {
  return request("/api/auth/me", { method: "GET" });
}

export async function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export async function fetchOwnerDevices() {
  return request("/api/owner/devices", { method: "GET" });
}

export async function fetchOwnerDevice(id) {
  return request(`/api/owner/devices/${id}`, { method: "GET" });
}

export async function submitOwnerDevice(payload) {
  return request("/api/owner/devices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchUnknownDevices() {
  return request("/api/staff/devices/unknown", { method: "GET" });
}

export async function fetchHiddenStaffDevices() {
  return request("/api/staff/devices/hidden", { method: "GET" });
}

export async function fetchStaffRecycleProcessingDevices() {
  return request("/api/staff/devices/recycle-processing", { method: "GET" });
}

export async function updateStaffDevice(id, payload) {
  return request(`/api/staff/devices/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function reclassifyStaffDevice(id, classification) {
  return request(`/api/staff/devices/${id}/reclassify`, {
    method: "POST",
    body: JSON.stringify({ classification }),
  });
}

export async function publishStaffDevice(id) {
  return request(`/api/staff/devices/${id}/publish`, {
    method: "POST",
  });
}

export async function hideStaffDevice(id) {
  return request(`/api/staff/devices/${id}/hide`, {
    method: "POST",
  });
}

export async function markStaffDataWipeComplete(id) {
  return request(`/api/staff/devices/${id}/data-wipe/complete`, {
    method: "POST",
  });
}

export async function fetchAdminUsers() {
  return request("/api/admin/users", { method: "GET" });
}

export async function updateAdminUserRole(id, role) {
  return request(`/api/admin/users/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export async function updateAdminUserStatus(id, status) {
  return request(`/api/admin/users/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminDevices() {
  return request("/api/admin/devices", { method: "GET" });
}

export async function classifyAdminDevice(id, classification) {
  return request(`/api/admin/device/${id}/classify`, {
    method: "PUT",
    body: JSON.stringify({ classification }),
  });
}

export async function createDataRetrievalOrder(deviceId) {
  return request(`/api/owner/devices/${deviceId}/orders/data-retrieval`, {
    method: "POST",
  });
}

export async function fetchOwnerOrders() {
  return request("/api/owner/orders", { method: "GET" });
}

export async function fetchOwnerOrder(orderId) {
  return request(`/api/owner/orders/${orderId}`, { method: "GET" });
}

export async function fetchOwnerSecureLink(orderId) {
  return request(`/api/owner/orders/${orderId}/secure-link`, { method: "GET" });
}

export async function restoreOwnerOrder(orderId) {
  return request(`/api/owner/orders/${orderId}/restore`, { method: "POST" });
}

export async function fulfillStaffOrder(orderId) {
  return request(`/api/staff/orders/${orderId}/fulfill`, {
    method: "POST",
  });
}

export async function fetchStaffOrders() {
  return request("/api/staff/orders", { method: "GET" });
}

export async function createStaffDataErasureRecord(deviceId) {
  return request(`/api/staff/devices/${deviceId}/data-erasure`, {
    method: "POST",
  });
}

export async function fetchStaffDataErasureRecord(deviceId) {
  return request(`/api/staff/devices/${deviceId}/data-erasure`, {
    method: "GET",
  });
}

export async function updateStaffDataErasureStatus(deviceId, payload) {
  return request(`/api/staff/devices/${deviceId}/data-erasure/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchStaffPayments() {
  return request("/api/staff/payments", { method: "GET" });
}

export async function fetchAdminPayments() {
  return request("/api/admin/payments", { method: "GET" });
}

export async function fetchReferralFees() {
  return request("/api/staff/reports/referral-fees", { method: "GET" });
}

export async function fetchReferralFeesByDevice(deviceId) {
  return request(`/api/staff/reports/referral-fees/device/${deviceId}`, { method: "GET" });
}

export async function updateReferralFeeStatus(referralId, payload) {
  return request(`/api/staff/reports/referral-fees/${referralId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchPaymentProviders() {
  return request("/api/owner/payments/providers", { method: "GET" });
}

export async function fetchOwnerPayments() {
  return request("/api/owner/payments", { method: "GET" });
}

export async function fetchPaymentQuote(orderId, storageExtension = false) {
  const query = storageExtension ? "?storageExtension=true" : "";
  return request(`/api/owner/orders/${orderId}/payment-quote${query}`, { method: "GET" });
}

export async function createOwnerPayment(payload) {
  return request("/api/owner/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelOwnerPayment(paymentId) {
  return request(`/api/owner/payments/${paymentId}/cancel`, { method: "POST" });
}

export async function completeOwnerSandboxPayment(paymentId) {
  return request(`/api/owner/payments/${paymentId}/complete-sandbox`, { method: "POST" });
}

export async function generateQrToken(deviceId) {
  return request(`/api/qr/devices/${deviceId}/token`, { method: "POST" });
}

export async function resolveQrToken(token) {
  return request(`/api/qr/${token}`, { method: "GET" });
}

export { API_BASE_URL };
