const STAFF_DRAFTS_KEY = "ewaste_staff_drafts_v1";
const REVIEW_OVERRIDES_KEY = "ewaste_review_overrides_v1";

const DEVICE_TYPE_PATTERNS = [
  { type: "PHONE", matchers: ["phone", "iphone", "galaxy", "pixel", "smartphone", "mobile"] },
  { type: "LAPTOP", matchers: ["laptop", "macbook", "thinkpad", "notebook", "chromebook"] },
  { type: "TABLET", matchers: ["tablet", "ipad", "surface go", "kindle"] },
  { type: "DESKTOP", matchers: ["desktop", "pc", "imac", "workstation", "tower", "all-in-one"] },
  { type: "CONSOLE", matchers: ["console", "playstation", "xbox", "switch", "ps4", "ps5"] },
  { type: "TV", matchers: ["tv", "television", "monitor", "display"] },
  { type: "WEARABLE", matchers: ["watch", "smartwatch", "wearable", "fitbit", "apple watch", "galaxy watch"] },
];

const TYPE_STYLES = {
  PHONE: { label: "Phone", bg: "#dcfce7", color: "#15803d" },
  LAPTOP: { label: "Laptop", bg: "#dbeafe", color: "#1d4ed8" },
  TABLET: { label: "Tablet", bg: "#ede9fe", color: "#7c3aed" },
  DESKTOP: { label: "Desktop", bg: "#e0f2fe", color: "#0369a1" },
  CONSOLE: { label: "Console", bg: "#fef3c7", color: "#b45309" },
  TV: { label: "TV / Display", bg: "#fce7f3", color: "#be185d" },
  WEARABLE: { label: "Wearable", bg: "#ecfccb", color: "#4d7c0f" },
  OTHER: { label: "Other", bg: "#e2e8f0", color: "#475569" },
};

const CLASSIFICATION_STYLES = {
  CURRENT: { label: "CURRENT", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  RARE: { label: "RARE", bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
  RECYCLE: { label: "RECYCLE", bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  UNKNOWN: { label: "UNKNOWN", bg: "#e2e8f0", color: "#475569", border: "#cbd5e1" },
  UNWANTED: { label: "UNWANTED", bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
};

const STATUS_STYLES = {
  SUBMITTED: { label: "SUBMITTED", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  PENDING_REVIEW: { label: "PENDING_REVIEW", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  PUBLISHED: { label: "PUBLISHED", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  HIDDEN: { label: "HIDDEN", bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
  RECYCLE_APPROVED: { label: "RECYCLE_APPROVED", bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  DATA_WIPE_PENDING: { label: "DATA_WIPE_PENDING", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  DATA_WIPE_COMPLETED: { label: "DATA_WIPE_COMPLETED", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  RETRIEVAL_REQUESTED: { label: "RETRIEVAL_REQUESTED", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  RETRIEVAL_PAID: { label: "RETRIEVAL_PAID", bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
  RETRIEVAL_FULFILLED: { label: "RETRIEVAL_FULFILLED", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  CREATED: { label: "CREATED", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  PAYMENT_PENDING: { label: "PAYMENT_PENDING", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  PAID: { label: "PAID", bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
  READY_FOR_FULFILLMENT: { label: "READY_FOR_FULFILLMENT", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  PROCESSING: { label: "PROCESSING", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  FULFILLED: { label: "FULFILLED", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  RESTORED: { label: "RESTORED", bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
  EXPIRED: { label: "EXPIRED", bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
  CANCELLED: { label: "CANCELLED", bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
  BLOCKED: { label: "BLOCKED", bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
  LOCKED: { label: "LOCKED", bg: "#e2e8f0", color: "#475569", border: "#cbd5e1" },
  PREPARATION_PENDING: { label: "PREPARATION_PENDING", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  ACTIVE: { label: "ACTIVE", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  DISABLED: { label: "DISABLED", bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
  INITIATED: { label: "INITIATED", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  REQUIRES_ACTION: { label: "REQUIRES_ACTION", bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe" },
  SUCCEEDED: { label: "SUCCEEDED", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  FAILED: { label: "FAILED", bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
  REFUNDED: { label: "REFUNDED", bg: "#e2e8f0", color: "#475569", border: "#cbd5e1" },
  PARTIALLY_REFUNDED: { label: "PARTIALLY_REFUNDED", bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
  REQUESTED: { label: "REQUESTED", bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  IN_PROGRESS: { label: "IN_PROGRESS", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  COMPLETED: { label: "COMPLETED", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
};

export const DEVICE_TYPE_OPTIONS = [
  "PHONE",
  "LAPTOP",
  "TABLET",
  "DESKTOP",
  "CONSOLE",
  "TV",
  "WEARABLE",
  "OTHER",
];

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStorage() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STAFF_DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(drafts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAFF_DRAFTS_KEY, JSON.stringify(drafts));
}

function readReviewOverrides() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(REVIEW_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeReviewOverrides(overrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REVIEW_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function getClassification(device) {
  return String(device?.classification || "UNKNOWN").toUpperCase();
}

export function inferDeviceType(device) {
  const explicitType = String(device?.deviceType || device?.type || "").toUpperCase();
  if (TYPE_STYLES[explicitType]) {
    return explicitType;
  }

  const searchableText = [
    device?.deviceName,
    device?.brand,
    device?.notes,
    device?.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matched = DEVICE_TYPE_PATTERNS.find(({ matchers }) =>
    matchers.some((matcher) => searchableText.includes(matcher))
  );

  return matched?.type || "OTHER";
}

export function getDeviceTypeStyle(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.OTHER;
}

export function getClassificationStyle(classification) {
  const normalized = String(classification || "UNKNOWN").toUpperCase();
  return CLASSIFICATION_STYLES[normalized] || CLASSIFICATION_STYLES.UNKNOWN;
}

export function getStatusStyle(status, fallback = "SUBMITTED") {
  const normalized = String(status || fallback).toUpperCase();
  return STATUS_STYLES[normalized] || {
    label: normalized,
    bg: "#e2e8f0",
    color: "#475569",
    border: "#cbd5e1",
  };
}

export function getWorkflowStatusStyle(status) {
  return getStatusStyle(status, "SUBMITTED");
}

export function getOrderStatusStyle(status) {
  return getStatusStyle(status, "CREATED");
}

export function getAccountStatusStyle(status) {
  return getStatusStyle(status, "ACTIVE");
}

export function getPaymentStatusStyle(status) {
  return getStatusStyle(status, "INITIATED");
}

export function getErasureStatusStyle(status) {
  return getStatusStyle(status, "REQUESTED");
}

export function getReferralEstimate(device) {
  const classification = getClassification(device);
  const type = inferDeviceType(device);

  if (classification === "CURRENT") {
    if (type === "LAPTOP") return 18;
    if (type === "PHONE") return 12;
    return 10;
  }

  if (classification === "RARE") {
    if (type === "CONSOLE") return 28;
    return 22;
  }

  return 0;
}

export function getVoucherBonus(device) {
  const classification = getClassification(device);
  if (classification === "CURRENT") return "£10 drop-off voucher";
  if (classification === "RARE") return "priority valuation slot";
  return "standard recycling receipt";
}

export function getPartnerOffers(device) {
  const classification = getClassification(device);
  const type = inferDeviceType(device);

  if (classification === "CURRENT") {
    return [
      {
        name: type === "PHONE" ? "CeX Local Trade-In" : "CeX Device Counter",
        channel: "Local drop-off partner",
        payout: type === "LAPTOP" ? "Typical resale range: £120-£280" : "Typical resale range: £45-£180",
        fee: `Referral fee estimate: £${getReferralEstimate(device)}`,
        link: "https://uk.webuy.com/",
        handoff: "Owner receives a QR code and bonus voucher for in-person handoff.",
      },
      {
        name: "Community Tech Hub",
        channel: "Local reuse / collection point",
        payout: "Fast local valuation with device wipe handoff note",
        fee: "Local referral recorded for staff reporting",
        link: "https://www.backmarket.co.uk/en-gb",
        handoff: "Best for current devices that can move quickly into reuse.",
      },
    ];
  }

  if (classification === "RARE") {
    return [
      {
        name: "eBay Collector Listing",
        channel: "Specialist / collector marketplace",
        payout: "Specialist demand may exceed standard used-device value",
        fee: `Referral fee estimate: £${getReferralEstimate(device)}`,
        link: "https://www.ebay.co.uk/",
        handoff: "Keep full model details and accessories for premium listing quality.",
      },
      {
        name: "Retro Reboot Partner",
        channel: "Collector / restoration partner",
        payout: "Manual valuation after condition review",
        fee: "Higher staff follow-up time, higher potential upside",
        link: "https://www.facebook.com/marketplace/",
        handoff: "Good fit for rare consoles, niche tablets, and vintage handsets.",
      },
    ];
  }

  return [];
}

export function countByDeviceType(devices) {
  const counts = {
    PHONE: 0,
    LAPTOP: 0,
    TABLET: 0,
    DESKTOP: 0,
    CONSOLE: 0,
    TV: 0,
    WEARABLE: 0,
    OTHER: 0,
  };
  (devices || []).forEach((device) => {
    const type = inferDeviceType(device);
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}

export function listStaffDrafts() {
  return readStorage().sort((a, b) => {
    const left = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const right = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return left - right;
  });
}

export function createDraftFromDevice(device, overrides = {}) {
  const classification = getClassification(device);
  const type = inferDeviceType(device);
  const partnerOffers = getPartnerOffers({ ...device, classification, deviceType: type });
  const now = new Date().toISOString();

  return {
    id: uid(),
    sourceDeviceId: device?.id || null,
    createdAt: now,
    updatedAt: now,
    visibleToOwners: false,
    ownerEmail: overrides.ownerEmail || "owner-submission",
    deviceName: device?.deviceName || "",
    brand: device?.brand || "",
    condition: device?.condition || "",
    deviceType: type,
    proposedClassification: classification,
    workflowStatus: device?.workflowStatus || "DRAFT_REVIEW",
    targetChannel: partnerOffers[0]?.name || "Internal review",
    referralEstimate: getReferralEstimate({ ...device, classification, deviceType: type }),
    handlingPlan:
      classification === "CURRENT"
        ? "Prepare QR handoff and local trade-in guidance"
        : classification === "RARE"
        ? "Preserve item for specialist listing review"
        : "Confirm details before publish or reclassify",
    notes: overrides.notes || "",
  };
}

export function saveStaffDraft(draft) {
  const drafts = readStorage();
  const now = new Date().toISOString();
  const nextDraft = {
    ...draft,
    id: draft.id || uid(),
    updatedAt: now,
    createdAt: draft.createdAt || now,
  };
  const existingIndex = drafts.findIndex((item) => item.id === nextDraft.id);

  if (existingIndex >= 0) {
    drafts[existingIndex] = nextDraft;
  } else {
    drafts.push(nextDraft);
  }

  writeStorage(drafts);
  return nextDraft;
}

export function deleteStaffDraft(draftId) {
  const drafts = readStorage().filter((draft) => draft.id !== draftId);
  writeStorage(drafts);
}

export function getDraftMetrics(drafts = listStaffDrafts()) {
  const typeCounts = countByDeviceType(drafts);
  let currentRare = 0;
  let recycle = 0;

  drafts.forEach((draft) => {
    const classification = String(draft.proposedClassification || "UNKNOWN").toUpperCase();
    if (classification === "CURRENT" || classification === "RARE") currentRare += 1;
    if (classification === "RECYCLE") recycle += 1;
  });

  return {
    total: drafts.length,
    hidden: drafts.filter((draft) => draft.visibleToOwners === false).length,
    currentRare,
    recycle,
    typeCounts,
  };
}

export function saveReviewOverride(deviceId, patch) {
  if (!deviceId) return;
  const overrides = readReviewOverrides();
  overrides[deviceId] = {
    ...(overrides[deviceId] || {}),
    ...patch,
  };
  writeReviewOverrides(overrides);
}

export function applyReviewOverrides(devices = []) {
  const overrides = readReviewOverrides();
  return devices.map((device) => ({
    ...device,
    ...(overrides[device.id] || {}),
  }));
}

