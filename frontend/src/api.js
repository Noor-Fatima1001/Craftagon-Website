const API = import.meta.env.VITE_API_URL || "";

export async function request(path, options = {}) {
  const headers = { "X-Requested-With": "XMLHttpRequest", ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  store: () => request("/api/store"),
  products: (params = "") => request(`/api/catalog/products${params}`),
  product: (slug) => request(`/api/catalog/products/${slug}`),
  categories: () => request("/api/catalog/categories"),
  quote: (body) => request("/api/checkout/quote", { method: "POST", body }),
  createOrder: (body) => request("/api/orders", { method: "POST", body }),
  lookup: (qs) => request(`/api/orders/lookup?${qs}`),
  submitPayment: (form) => request("/api/orders/payment", { method: "POST", body: form }),
  adminLogin: (body) => request("/api/admin/auth/login", { method: "POST", body }),
  adminLogout: () => request("/api/admin/auth/logout", { method: "POST" }),
  adminMe: () => request("/api/admin/auth/me"),
  adminPassword: (body) => request("/api/admin/auth/password", { method: "PATCH", body }),
  dashboard: () => request("/api/admin/dashboard"),
  adminProducts: (q = "") => request(`/api/admin/products${q}`),
  saveProduct: (id, form) =>
    request(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      body: form,
    }),
  deactivateProduct: (id) => request(`/api/admin/products/${id}`, { method: "DELETE" }),
  adminCategories: () => request("/api/admin/categories"),
  saveCategory: (id, body) =>
    request(id ? `/api/admin/categories/${id}` : "/api/admin/categories", {
      method: id ? "PUT" : "POST",
      body,
    }),
  deleteCategory: (id) => request(`/api/admin/categories/${id}`, { method: "DELETE" }),
  adminOrders: (qs = "") => request(`/api/admin/orders${qs}`),
  adminOrder: (id) => request(`/api/admin/orders/${id}`),
  updateOrder: (id, body) => request(`/api/admin/orders/${id}`, { method: "PATCH", body }),
  adminPayments: (qs = "") => request(`/api/admin/payments${qs}`),
  reviewPayment: (id, body) => request(`/api/admin/payments/${id}`, { method: "PATCH", body }),
  paymentShot: (id) => `${API}/api/admin/payments/${id}/screenshot`,
  settings: () => request("/api/admin/settings"),
  saveSettings: (body) => request("/api/admin/settings", { method: "PUT", body }),
  coupons: () => request("/api/admin/coupons"),
  saveCoupon: (id, body) =>
    request(id ? `/api/admin/coupons/${id}` : "/api/admin/coupons", { method: id ? "PUT" : "POST", body }),
  deleteCoupon: (id) => request(`/api/admin/coupons/${id}`, { method: "DELETE" }),
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
