import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, asset, money } from "./api";
import { useAuth } from "./context";
import { Alert, CustomPreview, Field } from "./components";

export function AdminLogin() {
  const { setAdmin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      const d = await api.adminLogin({ email, password });
      setAdmin(d.admin);
      nav("/admin");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="mx-auto mt-24 max-w-md card p-6">
      <h1 className="text-2xl font-bold">Admin sign in</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <Alert>{err}</Alert>}
        <button className="btn w-full">Sign in</button>
      </form>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.dashboard().then(setData);
  }, []);
  if (!data) return <p>Loading…</p>;
  const s = data.stats;
  const cards = [
    ["Orders", s.totalOrders],
    ["Pending payments", s.pendingPayments],
    ["Verified payments", s.verifiedPayments],
    ["Cancelled", s.cancelledOrders],
    ["Verified sales", money(s.sales)],
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([l, v]) => (
          <div key={l} className="card p-4">
            <div className="text-sm text-slate-500">{l}</div>
            <div className="text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-bold">Recent orders</h2>
      <table className="mt-3 w-full text-left text-sm">
        <thead><tr className="text-slate-500"><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          {data.recent.map((o) => (
            <tr key={o._id} className="border-t">
              <td className="py-2"><Link className="text-accent" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td>
              <td>{o.customer?.fullName}</td>
              <td>{o.status} / {o.paymentStatus}</td>
              <td>{money(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    try {
      const d = await api.adminProducts();
      setProducts(d.products);
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function remove(product) {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
    try {
      await api.deleteProduct(product._id);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link className="btn" to="/admin/products/new">Add product</Link>
      </div>
      {err && <div className="mt-4"><Alert>{err}</Alert></div>}
      {loading ? <p className="mt-4">Loading products…</p> : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-slate-500"><th className="p-3">Name</th><th>Price</th><th>Stock</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3">{p.name}</td>
                  <td>{money(p.salePrice || p.price)}</td>
                  <td>{p.stock}</td>
                  <td>{p.active ? "Yes" : "No"}</td>
                  <td className="space-x-3 py-2">
                    <Link className="text-accent" to={`/admin/products/${p._id}`}>Edit</Link>
                    <button className="text-red-600" type="button" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!products.length && <tr><td className="p-3 text-slate-500" colSpan="5">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    price: "",
    salePrice: "",
    stock: 0,
    active: true,
    featured: false,
    bestseller: false,
    images: [],
    customization: { enabled: true, required: true, maxLength: 24, label: "Custom text" },
    preview: { enabled: true, x: 50, y: 55, fontSize: 22, fontFamily: "Georgia, serif", color: "#1f2937", align: "center", maxWidth: 70 },
  });
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState("");
  const [sample, setSample] = useState("Ayesha");

  useEffect(() => {
    api.adminCategories().then((d) => setCats(d.categories)).catch((e) => setErr(e.message));
    if (id && id !== "new") {
      api.adminProduct(id).then(({ product: p }) => {
        setForm((current) => ({
          ...current,
          ...p,
          category: p.category?._id || p.category,
          salePrice: p.salePrice ?? "",
          customization: { ...current.customization, ...p.customization },
          preview: { ...current.preview, ...p.preview },
        }));
      }).catch((e) => setErr(e.message));
    }
  }, [id]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    ["name", "slug", "description", "category", "price", "salePrice", "stock"].forEach((k) => fd.append(k, form[k] ?? ""));
    fd.append("active", form.active);
    fd.append("featured", form.featured);
    fd.append("bestseller", form.bestseller);
    fd.append("customization", JSON.stringify(form.customization));
    fd.append("preview", JSON.stringify(form.preview));
    fd.append("images", JSON.stringify(form.images || []));
    [...files].forEach((f) => fd.append("images", f));
    try {
      await api.saveProduct(id && id !== "new" ? id : null, fd);
      nav("/admin/products");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{id === "new" ? "New product" : "Edit product"}</h1>
        <Field label="Name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Slug"><input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
        <Field label="Description"><textarea className="input" value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Category">
          <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Select</option>
            {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Price"><input className="input" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
          <Field label="Sale price"><input className="input" type="number" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} /></Field>
          <Field label="Stock"><input className="input" type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} /></Field>
        </div>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!form.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!form.bestseller} onChange={(e) => set("bestseller", e.target.checked)} /> Bestseller</label>
        <Field label="Add images"><input className="input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setFiles([...e.target.files])} /></Field>
        {!!form.images?.length && (
          <div className="flex flex-wrap gap-2">
            {form.images.map((image) => (
              <div key={image} className="relative">
                <img className="h-20 w-20 rounded object-cover" src={asset(image)} alt="" />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 rounded-full bg-white px-2 text-red-600 shadow"
                  aria-label="Remove image"
                  onClick={() => set("images", form.images.filter((item) => item !== image))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <Field label="Custom label"><input className="input" value={form.customization.label} onChange={(e) => set("customization", { ...form.customization, label: e.target.value })} /></Field>
        <Field label="Max characters"><input className="input" type="number" value={form.customization.maxLength} onChange={(e) => set("customization", { ...form.customization, maxLength: Number(e.target.value) })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          {["x", "y", "fontSize", "maxWidth"].map((k) => (
            <Field key={k} label={`Preview ${k}`}>
              <input className="input" type="number" value={form.preview[k]} onChange={(e) => set("preview", { ...form.preview, [k]: Number(e.target.value) })} />
            </Field>
          ))}
          <Field label="Color"><input className="input" value={form.preview.color} onChange={(e) => set("preview", { ...form.preview, color: e.target.value })} /></Field>
          <Field label="Font"><input className="input" value={form.preview.fontFamily} onChange={(e) => set("preview", { ...form.preview, fontFamily: e.target.value })} /></Field>
        </div>
        {err && <Alert>{err}</Alert>}
        <button className="btn">Save</button>
      </div>
      <div>
        <Field label="Sample preview text"><input className="input" value={sample} onChange={(e) => setSample(e.target.value)} /></Field>
        <div className="mt-3">
          <CustomPreview product={form} text={sample} />
        </div>
      </div>
    </form>
  );
}

export function Categories() {
  const [list, setList] = useState([]);
  const emptyForm = { name: "", slug: "", description: "", sortOrder: 0, active: true };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  async function load() {
    const d = await api.adminCategories();
    setList(d.categories);
  }
  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);
  async function save(e) {
    e.preventDefault();
    try {
      await api.saveCategory(editing, form);
      setForm(emptyForm);
      setEditing(null);
      setErr("");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }
  async function remove(category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await api.deleteCategory(category._id);
      setErr("");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      {err && <div className="mt-4"><Alert>{err}</Alert></div>}
      <form onSubmit={save} className="card mt-4 grid gap-3 p-4 sm:grid-cols-2">
        <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Slug (optional)"><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
        <Field label="Description"><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Sort order"><input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
        <div className="flex gap-2">
          <button className="btn">{editing ? "Update category" : "Add category"}</button>
          {editing && <button className="btn-outline" type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
      <ul className="mt-6 space-y-2">
        {list.map((c) => (
          <li key={c._id} className="card flex items-center justify-between p-3">
            <span>{c.name} ({c.slug}) {!c.active && "· inactive"}</span>
            <span className="space-x-3">
              <button className="text-accent" type="button" onClick={() => {
                setEditing(c._id);
                setForm({ ...emptyForm, ...c });
              }}>Edit</button>
              <button className="text-red-600" type="button" onClick={() => remove(c)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  async function load() {
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (status) qs.set("status", status);
      const d = await api.adminOrders(`?${qs}`);
      setOrders(d.orders);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      {err && <div className="mt-4"><Alert>{err}</Alert></div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search name, email, phone, order #" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["pending_payment", "payment_submitted", "confirmed", "processing", "dispatched", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <table className="mt-4 w-full text-left text-sm">
        <thead><tr className="text-slate-500"><th>Order</th><th>Customer</th><th>Payment</th><th>Total</th><th>Details</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} className="border-t">
              <td className="py-2">{o.orderNumber}<div className="text-xs">{o.status}</div></td>
              <td>{o.customer?.fullName}<div className="text-xs">{o.customer?.city}</div></td>
              <td>{o.paymentStatus}</td>
              <td>{money(o.total)}</td>
              <td><Link className="btn-outline inline-block" to={`/admin/orders/${o._id}`}>Order Details</Link></td>
            </tr>
          ))}
          {!orders.length && <tr><td className="p-3 text-slate-500" colSpan="5">No orders found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [note, setNote] = useState("");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  async function load() {
    const d = await api.adminOrder(id);
    setData(d);
    setCourier(d.order.courierName || "");
    setTracking(d.order.trackingNumber || "");
  }
  useEffect(() => { load().catch((e) => setErr(e.message)); }, [id]);
  if (!data) return err ? <Alert>{err}</Alert> : <p>Loading…</p>;
  const o = data.order;
  async function setStatus(status) {
    try {
      const r = await api.updateOrder(id, { status, note, courierName: courier, trackingNumber: tracking });
      setMsg(`Updated to ${r.order.status}`);
      setErr("");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{o.orderNumber}</h1>
      {err && <Alert>{err}</Alert>}
      <div className="card p-4 text-sm">
        <p>{o.customer.fullName} · {o.customer.phone} · {o.customer.email}</p>
        <p>{o.customer.address}, {o.customer.city}, {o.customer.province}</p>
        <p>Landmark: {o.customer.landmark || "—"} · Notes: {o.customer.notes || "—"}</p>
        <p className="mt-2">Status: {o.status} · Payment: {o.paymentStatus}</p>
        {o.cancelledAt && <p>Cancelled: {new Date(o.cancelledAt).toLocaleString()} · {o.cancelReason}</p>}
      </div>
      <div className="card p-4 text-sm">
        <h2 className="mb-2 font-bold">Items and pricing</h2>
        {o.items.map((i, idx) => <div key={idx} className="border-b py-2">{i.quantity} × {i.name} · Unit price {money(i.unitPrice)} · Customization: “{i.customText || "—"}” · Line total {money(i.lineTotal)}</div>)}
        <p className="mt-3">Subtotal {money(o.subtotal)} · Delivery charges {money(o.deliveryFee)} · Discount {money(o.discount)} · Total {money(o.total)}</p>
        <p>Advance payment {money(o.advanceAmount)} · Remaining balance (COD) {money(o.remainingCod)}</p>
      </div>
      <div className="card p-4">
        <h2 className="font-bold">Payment submissions</h2>
        {data.payments.map((payment) => (
          <div key={payment._id} className="mt-2 border-t pt-2 text-sm">
            <p>{payment.method} · Ref {payment.transactionRef} · {payment.status}</p>
            <p>Submitted {new Date(payment.createdAt).toLocaleString()}</p>
            {payment.adminNotes && <p>Admin notes: {payment.adminNotes}</p>}
            {payment.screenshotPath && <img className="mt-2 max-h-48 rounded" src={api.paymentShot(payment._id)} alt="Payment proof" />}
          </div>
        ))}
        {!data.payments.length && <p className="mt-2 text-sm text-slate-500">No payment submissions.</p>}
      </div>
      <div className="card p-4 space-y-2">
        <Field label="Courier"><input className="input" value={courier} onChange={(e) => setCourier(e.target.value)} /></Field>
        <Field label="Tracking number"><input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>
        <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-2">
          {["processing", "dispatched", "delivered"].map((s) => (
            <button key={s} className="btn-outline" onClick={() => setStatus(s)}>{s}</button>
          ))}
          <button className="btn-outline" onClick={() => setStatus("cancelled")}>Cancel order</button>
        </div>
        {msg && <Alert kind="ok">{msg}</Alert>}
        <div className="flex flex-wrap gap-2 pt-2">
          <a className="btn" href={data.whatsapp.reminder} target="_blank" rel="noreferrer">WhatsApp payment reminder</a>
          <a className="btn-outline" href={data.whatsapp.cancel} target="_blank" rel="noreferrer">WhatsApp cancellation note</a>
        </div>
        <p className="text-xs text-slate-500">These links open WhatsApp. Nothing is sent until a person presses Send.</p>
      </div>
      <div className="card p-4">
        <h2 className="font-bold">History</h2>
        {o.history?.map((h, i) => <p key={i} className="text-sm">{new Date(h.at).toLocaleString()} · {h.status} · {h.note}</p>)}
      </div>
    </div>
  );
}

export function Payments() {
  const [payments, setPayments] = useState([]);
  const [notes, setNotes] = useState({});
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api.adminPayments().then((d) => setPayments(d.payments));
  }, []);
  async function decide(id, decision) {
    const r = await api.reviewPayment(id, { decision, adminNotes: notes[id] || "" });
    setMsg(`Marked ${decision}. Email: ${r.email.sent ? "sent" : r.email.reason}`);
    api.adminPayments().then((d) => setPayments(d.payments));
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Payment verification</h1>
      <p className="mt-2 text-sm text-slate-600">Compare the screenshot and reference with the money actually received. Do not verify from the screenshot alone.</p>
      {msg && <div className="mt-3"><Alert kind="ok">{msg}</Alert></div>}
      <div className="mt-4 space-y-4">
        {payments.map((p) => (
          <div key={p._id} className="card p-4">
            <div className="font-semibold">{p.order?.orderNumber} · {p.status}</div>
            <p className="text-sm">{p.method} · Ref {p.transactionRef} · Advance {money(p.order?.advanceAmount)}</p>
            <img className="mt-2 max-h-64 rounded border" src={api.paymentShot(p._id)} alt="Payment proof" />
            <textarea className="input mt-2" placeholder="Admin notes" value={notes[p._id] || ""} onChange={(e) => setNotes({ ...notes, [p._id]: e.target.value })} />
            {p.status === "under_review" && (
              <div className="mt-2 flex gap-2">
                <button className="btn" onClick={() => decide(p._id, "verified")}>Verify</button>
                <button className="btn-outline" onClick={() => decide(p._id, "rejected")}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Coupons() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ code: "", type: "percent", value: 10, minOrder: 0, maxDiscount: "", usageLimit: "" });
  useEffect(() => { api.coupons().then((d) => setList(d.coupons)); }, []);
  async function save(e) {
    e.preventDefault();
    await api.saveCoupon(null, form);
    api.coupons().then((d) => setList(d.coupons));
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Coupons</h1>
      <form onSubmit={save} className="mt-4 grid gap-2 md:grid-cols-6">
        <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percent">percent</option>
          <option value="fixed">fixed</option>
        </select>
        <input className="input" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Min order" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} />
        <button className="btn">Add</button>
      </form>
      <ul className="mt-4 space-y-2">
        {list.map((c) => (
          <li key={c._id} className="card flex justify-between p-3">
            <span>{c.code} · {c.type} {c.value} · used {c.usedCount}</span>
            <button className="btn-outline" onClick={async () => { await api.deleteCoupon(c._id); setList(list.filter((x) => x._id !== c._id)); }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [email, setEmail] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    api.settings().then((d) => {
      setSettings(d.settings);
      setEmail(d.email);
    }).catch((e) => setErr(e.message));
  }, []);
  if (!settings) return err ? <Alert>{err}</Alert> : <p>Loading…</p>;
  async function save(e) {
    e.preventDefault();
    try {
      await api.saveSettings(settings);
      setErr("");
      setMsg("Settings saved. Existing orders keep their original totals.");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <form onSubmit={save} className="space-y-6">
      <h1 className="text-2xl font-bold">Store settings</h1>
      <div className="card p-4 text-sm">
        Email notifications: {email?.configured ? `configured (${email.host})` : "not configured — the site still runs, emails are skipped"}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {["storeName", "tagline", "email", "phone", "whatsappNumber", "address"].map((k) => (
          <Field key={k} label={k}>
            <input className="input" value={settings[k] || ""} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
          </Field>
        ))}
      </div>
      <h2 className="font-bold">Delivery</h2>
      <Field label="Nationwide flat fee">
        <input className="input" type="number" value={settings.delivery?.nationwideFlat || 0} onChange={(e) => setSettings({ ...settings, delivery: { ...settings.delivery, nationwideFlat: Number(e.target.value) } })} />
      </Field>
      <textarea
        className="input h-24"
        value={settings.delivery?.cityRates || ""}
        onChange={(e) => setSettings({ ...settings, delivery: { ...settings.delivery, cityRates: e.target.value } })}
      />
      <p className="text-xs text-slate-500">City rates: one per line as city | province | fee. Escape a literal | as \|.</p>
      <h2 className="font-bold">Advance payment</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <select className="input" value={settings.advance?.type} onChange={(e) => setSettings({ ...settings, advance: { ...settings.advance, type: e.target.value } })}>
          <option value="percent">percent</option>
          <option value="fixed">fixed</option>
        </select>
        <input className="input" type="number" value={settings.advance?.amount} onChange={(e) => setSettings({ ...settings, advance: { ...settings.advance, amount: Number(e.target.value) } })} />
        <input className="input" type="number" value={settings.advance?.minAdvance} onChange={(e) => setSettings({ ...settings, advance: { ...settings.advance, minAdvance: Number(e.target.value) } })} />
      </div>
      <h2 className="font-bold">Payment accounts</h2>
      <textarea
        className="input h-40"
        value={settings.paymentAccounts || ""}
        onChange={(e) => setSettings({ ...settings, paymentAccounts: e.target.value })}
      />
      <p className="text-xs text-slate-500">One per line: method | holder | account number | instructions | active (true/false). Use \| for a literal | and \n for a line break.</p>
      <h2 className="font-bold">Deadline</h2>
      <Field label="Hours to pay">
        <input className="input" type="number" value={settings.paymentDeadlineHours} onChange={(e) => setSettings({ ...settings, paymentDeadlineHours: Number(e.target.value) })} />
      </Field>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={!!settings.autoCancelEnabled} onChange={(e) => setSettings({ ...settings, autoCancelEnabled: e.target.checked })} />
        Auto-cancel overdue unpaid orders
      </label>
      <h2 className="font-bold">Banners / FAQs / policies</h2>
      <textarea className="input h-32" value={settings.banners || ""} onChange={(e) => setSettings({ ...settings, banners: e.target.value })} />
      <p className="text-xs text-slate-500">Banners, one per line: title | subtitle | image | button text | button link | active (true/false). Use \| for a literal | and \n for a line break.</p>
      <textarea className="input h-32" value={settings.faqs || ""} onChange={(e) => setSettings({ ...settings, faqs: e.target.value })} />
      <p className="text-xs text-slate-500">FAQs, one per line: question | answer. Use \| for a literal | and \n for a line break.</p>
      <textarea className="input h-32" value={settings.policies || ""} onChange={(e) => setSettings({ ...settings, policies: e.target.value })} />
      <p className="text-xs text-slate-500">Policies, one per line: key | text. Use \| for a literal | and \n for a line break.</p>
      {err && <Alert>{err}</Alert>}
      {msg && <Alert kind="ok">{msg}</Alert>}
      <div className="flex gap-2">
        <button className="btn">Save settings</button>
        <button type="button" className="btn-outline" onClick={async () => {
          try {
            const r = await api.runCancel();
            setErr("");
            setMsg(`Cancel job ran, cancelled ${r.cancelled || 0}`);
          } catch (e) {
            setErr(e.message);
          }
        }}>
          Run overdue cancel job
        </button>
      </div>
    </form>
  );
}

export function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.reports().then(setData); }, []);
  if (!data) return <p>Loading…</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold">Sales report</h1>
      <table className="mt-4 w-full text-left text-sm">
        <thead><tr><th>Day</th><th>Orders</th><th>Sales</th><th>Verified</th></tr></thead>
        <tbody>
          {data.byDay.map((d) => (
            <tr key={d._id} className="border-t">
              <td className="py-2">{d._id}</td>
              <td>{d.orders}</td>
              <td>{money(d.sales)}</td>
              <td>{d.verified}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Profile() {
  const { admin } = useAuth();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  async function save(e) {
    e.preventDefault();
    try {
      await api.adminPassword({ currentPassword, newPassword });
      setMsg("Password updated");
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <form onSubmit={save} className="max-w-md space-y-3">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p>{admin?.name} · {admin?.email}</p>
      <Field label="Current password"><input className="input" type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} /></Field>
      <Field label="New password"><input className="input" type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} /></Field>
      {err && <Alert>{err}</Alert>}
      {msg && <Alert kind="ok">{msg}</Alert>}
      <button className="btn">Change password</button>
    </form>
  );
}
