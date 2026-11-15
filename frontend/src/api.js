const API = import.meta.env.VITE_API_URL || "";

// ---- Global loading tracker ----
let activeRequests = 0;
const loadingListeners = new Set();

function notifyLoading() {
  loadingListeners.forEach((fn) => fn(activeRequests > 0));
}

export function subscribeLoading(fn) {
  loadingListeners.add(fn);
  return () => loadingListeners.delete(fn);
}

// ---- Retry settings (sirf GET, cold start ke liye ~30 sec tak) ----
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;
const RETRY_STATUSES = [502, 503, 504];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function request(path, options = {}) {
  const headers = { "X-Requested-With": "XMLHttpRequest", ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const method = (options.method || "GET").toUpperCase();
  // Retry sirf GET par, taake POST (order/payment) duplicate na ho
  const retries = method === "GET" ? MAX_RETRIES : 0;

  const fetchOptions = {
    credentials: "include",
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  };

  activeRequests++;
  notifyLoading();
  try {
       let res;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await fetch(`${API}${path}`, fetchOptions);
      } catch (networkError) {
        if (attempt >= retries) {
          throw new Error("");
        }
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      if (RETRY_STATUSES.includes(res.status) && attempt < retries) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      break;
    }


    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } finally {
    activeRequests--;
    notifyLoading();
  }
}

export const api = {
  store: () => request("/api/store"),
  products: (params = "") => request(`/api/catalog/products${params}`),
  product: (slug) => request(`/api/catalog/products/${slug}`),
  productReviews: (slug) => request(`/api/catalog/products/${slug}/reviews`),
  reviewInvitation: (token) => request(`/api/reviews/${encodeURIComponent(token)}`),
  submitProductReview: (token, body) =>
    request(`/api/reviews/${encodeURIComponent(token)}`, { method: "POST", body }),
  categories: () => request("/api/catalog/categories"),
  quote: (body) => request("/api/checkout/quote", { method: "POST", body }),
  createOrder: (body) => request("/api/orders", { method: "POST", body }),
  lookup: (qs) => request(`/api/orders/lookup?${qs}`),
  submitPayment: (form) => request("/api/orders/payment", { method: "POST", body: form }),
  contact: (body) => request("/api/contact", { method: "POST", body }),
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  myOrders: () => request("/api/me/orders"),
  adminLogin: (body) => request("/api/admin/auth/login", { method: "POST", body }),
  adminLogout: () => request("/api/admin/auth/logout", { method: "POST" }),
  adminMe: () => request("/api/admin/auth/me"),
  adminPassword: (body) => request("/api/admin/auth/password", { method: "PATCH", body }),
  dashboard: () => request("/api/admin/dashboard"),
  adminProducts: (q = "") => request(`/api/admin/products${q}`),
  adminProduct: (id) => request(`/api/admin/products/${id}`),
  saveProduct: (id, form) =>
    request(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      body: form,
    }),
  deleteProduct: (id) => request(`/api/admin/products/${id}`, { method: "DELETE" }),
  adminCategories: (q = "") => request(`/api/admin/categories${q}`),
  saveCategory: (id, body) =>
    request(id ? `/api/admin/categories/${id}` : "/api/admin/categories", {
      method: id ? "PUT" : "POST",
      body,
    }),
  deleteCategory: (id) => request(`/api/admin/categories/${id}`, { method: "DELETE" }),
  coupons: () => request("/api/admin/coupons"),
  couponUsage: (id, qs = "") => request(`/api/admin/coupons/${id}/usage${qs}`),
  saveCoupon: (id, body) =>
    request(id ? `/api/admin/coupons/${id}` : "/api/admin/coupons", {
      method: id ? "PUT" : "POST",
      body,
    }),
  deleteCoupon: (id) => request(`/api/admin/coupons/${id}`, { method: "DELETE" }),
  adminOrders: (qs = "") => request(`/api/admin/orders${qs}`),
  adminOrder: (id) => request(`/api/admin/orders/${id}`),
  updateOrder: (id, body) => request(`/api/admin/orders/${id}`, { method: "PATCH", body }),
  adminPayments: (qs = "") => request(`/api/admin/payments${qs}`),
  reviewPayment: (id, body) => request(`/api/admin/payments/${id}`, { method: "PATCH", body }),
  adminReviews: (qs = "") => request(`/api/admin/reviews${qs}`),
  moderateReview: (id, status) =>
    request(`/api/admin/reviews/${id}`, { method: "PATCH", body: { status } }),
  deleteReview: (id) => request(`/api/admin/reviews/${id}`, { method: "DELETE" }),
  paymentShot: (id) => `${API}/api/admin/payments/${id}/screenshot`,
  settings: () => request("/api/admin/settings"),
  saveSettings: (body) => request("/api/admin/settings", { method: "PUT", body }),
  reports: (qs = "") => request(`/api/admin/reports${qs}`),
  runCancel: () => request("/api/admin/jobs/cancel-overdue/run", { method: "POST" }),
  audit: () => request("/api/admin/audit"),
};

export function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

export function asset(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API}${url}`;
}

export function statusLabel(value) {
  return String(value || "").replaceAll("_", " ");
}