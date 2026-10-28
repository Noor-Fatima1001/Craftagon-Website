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
  useEffect(() => {
    api.adminProducts().then((d) => setProducts(d.products));
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link className="btn" to="/admin/products/new">Add product</Link>
      </div>
      <table className="mt-4 w-full text-left text-sm">
        <thead><tr className="text-slate-500"><th>Name</th><th>Price</th><th>Stock</th><th>Active</th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-t">
              <td className="py-2"><Link className="text-accent" to={`/admin/products/${p._id}`}>{p.name}</Link></td>
              <td>{money(p.salePrice || p.price)}</td>
              <td>{p.stock}</td>
              <td>{p.active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    api.adminCategories().then((d) => setCats(d.categories));
    if (id && id !== "new") {
      api.adminProducts().then((d) => {
        const p = d.products.find((x) => x._id === id);
        if (p) setForm({ ...form, ...p, category: p.category?._id || p.category, salePrice: p.salePrice || "" });
      });
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
        <Field label="Replace / add images"><input className="input" type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} /></Field>
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
        {id && id !== "new" && (
          <button type="button" className="btn-outline ml-2" onClick={async () => { await api.deactivateProduct(id); nav("/admin/products"); }}>
            Deactivate
          </button>
        )}
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
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  useEffect(() => {
    api.adminCategories().then((d) => setList(d.categories));
  }, []);
  async function save(e) {
    e.preventDefault();
    await api.saveCategory(null, form);
    setForm({ name: "", slug: "", description: "" });
    api.adminCategories().then((d) => setList(d.categories));
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <form onSubmit={save} className="mt-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input max-w-xs" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <button className="btn">Add</button>
      </form>
      <ul className="mt-6 space-y-2">
        {list.map((c) => (
          <li key={c._id} className="card flex items-center justify-between p-3">
            <span>{c.name} ({c.slug})</span>
            <button className="btn-outline" onClick={async () => { await api.deleteCategory(c._id); setList(list.filter((x) => x._id !== c._id)); }}>Delete</button>
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
  function load() {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    api.adminOrders(`?${qs}`).then((d) => setOrders(d.orders));
  }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search name, email, phone, order #" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["pending_payment", "payment_submitted", "confirmed", "processing", "dispatched", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <table className="mt-4 w-full text-left text-sm">
        <thead><tr className="text-slate-500"><th>Order</th><th>Customer</th><th>Payment</th><th>Total</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} className="border-t">
              <td className="py-2"><Link className="text-accent" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link><div className="text-xs">{o.status}</div></td>
              <td>{o.customer?.fullName}<div className="text-xs">{o.customer?.city}</div></td>
              <td>{o.paymentStatus}</td>
              <td>{money(o.total)}</td>
            </tr>
          ))}
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
  async function load() {
    const d = await api.adminOrder(id);
    setData(d);
    setCourier(d.order.courierName || "");
    setTracking(d.order.trackingNumber || "");
  }
  useEffect(() => { load(); }, [id]);
  if (!data) return <p>Loading…</p>;
  const o = data.order;
  async function setStatus(status) {
    const r = await api.updateOrder(id, { status, note, courierName: courier, trackingNumber: tracking });
    setMsg(`Updated to ${r.order.status}`);
    load();
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{o.orderNumber}</h1>
      <div className="card p-4 text-sm">
        <p>{o.customer.fullName} · {o.customer.phone} · {o.customer.email}</p>
        <p>{o.customer.address}, {o.customer.city}, {o.customer.province}</p>
        <p>Landmark: {o.customer.landmark || "—"} · Notes: {o.customer.notes || "—"}</p>
        <p className="mt-2">Status: {o.status} · Payment: {o.paymentStatus}</p>
        {o.cancelledAt && <p>Cancelled: {new Date(o.cancelledAt).toLocaleString()} · {o.cancelReason}</p>}
      </div>
      <div className="card p-4 text-sm">
        {o.items.map((i, idx) => <div key={idx}>{i.quantity} × {i.name} — “{i.customText}” · {money(i.lineTotal)}</div>)}
        <p className="mt-2">Subtotal {money(o.subtotal)} · Delivery {money(o.deliveryFee)} · Discount {money(o.discount)} · Total {money(o.total)}</p>
        <p>Advance {money(o.advanceAmount)} · COD {money(o.remainingCod)}</p>
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
  useEffect(() => {
    api.settings().then((d) => {
      setSettings(d.settings);
      setEmail(d.email);
    });
  }, []);
  if (!settings) return <p>Loading…</p>;
  async function save(e) {
    e.preventDefault();
    await api.saveSettings(settings);
    setMsg("Settings saved. Existing orders keep their original totals.");
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
        value={JSON.stringify(settings.delivery?.cityRates || [], null, 2)}
        onChange={(e) => setSettings({ ...settings, delivery: { ...settings.delivery, cityRates: JSON.parse(e.target.value) } })}
      />
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
        value={JSON.stringify(settings.paymentAccounts || [], null, 2)}
        onChange={(e) => setSettings({ ...settings, paymentAccounts: JSON.parse(e.target.value) })}
      />
      <h2 className="font-bold">Deadline</h2>
      <Field label="Hours to pay">
        <input className="input" type="number" value={settings.paymentDeadlineHours} onChange={(e) => setSettings({ ...settings, paymentDeadlineHours: Number(e.target.value) })} />
      </Field>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={!!settings.autoCancelEnabled} onChange={(e) => setSettings({ ...settings, autoCancelEnabled: e.target.checked })} />
        Auto-cancel overdue unpaid orders
      </label>
      <h2 className="font-bold">Banners / FAQs / policies</h2>
      <textarea className="input h-32" value={JSON.stringify(settings.banners || [], null, 2)} onChange={(e) => setSettings({ ...settings, banners: JSON.parse(e.target.value) })} />
      <textarea className="input h-32" value={JSON.stringify(settings.faqs || [], null, 2)} onChange={(e) => setSettings({ ...settings, faqs: JSON.parse(e.target.value) })} />
      <textarea className="input h-32" value={JSON.stringify(settings.policies || {}, null, 2)} onChange={(e) => setSettings({ ...settings, policies: JSON.parse(e.target.value) })} />
      {msg && <Alert kind="ok">{msg}</Alert>}
      <div className="flex gap-2">
        <button className="btn">Save settings</button>
        <button type="button" className="btn-outline" onClick={async () => { const r = await api.runCancel(); setMsg(`Cancel job ran, cancelled ${r.cancelled || 0}`); }}>
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
