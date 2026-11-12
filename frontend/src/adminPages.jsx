import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, asset, money, request } from "./api";
import { useAuth } from "./context";
import { Alert, CustomPreview, Field } from "./components";


const badgeStyles = {
  pending_payment: "bg-amber-50 text-amber-700 ring-amber-600/20",
  payment_submitted: "bg-blue-50 text-blue-700 ring-blue-600/20",
  confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  processing: "bg-violet-50 text-violet-700 ring-violet-600/20",
  dispatched: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  unpaid: "bg-rose-50 text-rose-700 ring-rose-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  under_review: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

function Badge({ value }) {
  const style = badgeStyles[value] || "bg-slate-100 text-slate-700 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${style}`}>
      {String(value || "-").replace(/_/g, " ")}
    </span>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-bold text-3xl tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Section({ title, hint, children, className = "" }) {
  return (
    <div className={`card space-y-4 p-5 sm:p-6 ${className}`}>
      {(title || hint) && (
        <div>
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Loading({ text = "Loading…" }) {
  return <p className="py-10 text-center text-sm text-slate-500">{text}</p>;
}

const thClass = "px-4 py-3 text-left";
const tdClass = "px-4 py-3.5";
const theadClass = "border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500";
const checkboxClass = "h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent";
const checkLabelClass = "flex items-center gap-2.5 text-sm font-medium text-slate-700";
const linkBtn = "rounded-lg px-2.5 py-1 text-sm font-medium text-accent transition-colors hover:bg-slate-100";
const dangerBtn = "rounded-lg px-2.5 py-1 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50";
const helpText = "text-xs text-slate-500";

function prettyLabel(k) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/* ---------------- Pages ---------------- */

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
    <div className="mx-auto mt-20 max-w-md card p-8 shadow-xl shadow-slate-200/60">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl tracking-tight text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your credentials to manage your store.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <Alert>{err}</Alert>}
        <button className="btn w-full py-2.5">Sign in</button>
      </form>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.dashboard().then(setData);
  }, []);
  if (!data) return <Loading />;
  const s = data.stats;
  const cards = [
    ["Orders", s.totalOrders, "border-t-slate-800"],
    ["Pending payments", s.pendingPayments, "border-t-amber-500"],
    ["Verified payments", s.verifiedPayments, "border-t-emerald-500"],
    ["Cancelled", s.cancelledOrders, "border-t-rose-500"],
    ["Verified sales", money(s.sales), "border-t-indigo-500"],
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="A quick overview of your store." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([l, v, accent]) => (
          <div key={l} className={`card border-t-4 p-5 ${accent}`}>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{l}</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{v}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className={theadClass}>
              <tr><th className={thClass}>Order</th><th className={thClass}>Customer</th><th className={thClass}>Status</th><th className={`${thClass} text-right`}>Total</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent.map((o) => (
                <tr key={o._id} className="transition-colors hover:bg-slate-50/80">
                  <td className={`${tdClass} font-medium`}><Link className="text-accent hover:underline" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td>
                  <td className={`${tdClass} text-slate-700`}>{o.customer?.fullName}</td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1.5"><Badge value={o.status} /><Badge value={o.paymentStatus} /></div>
                  </td>
                  <td className={`${tdClass} text-right font-semibold tabular-nums text-slate-900`}>{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage your catalog, pricing and stock."
        action={<Link className="btn" to="/admin/products/new">Add product</Link>}
      />
      {err && <Alert>{err}</Alert>}
      {loading ? <Loading text="Loading products…" /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>Name</th>
                  <th className={`${thClass} text-right`}>Price</th>
                  <th className={`${thClass} text-right`}>Stock</th>
                  <th className={thClass}>Active</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="transition-colors hover:bg-slate-50/80">
                    <td className={`${tdClass} font-medium text-slate-900`}>{p.name}</td>
                    <td className={`${tdClass} text-right font-semibold tabular-nums text-slate-900`}>{money(p.salePrice || p.price)}</td>
                    <td className={`${tdClass} text-right tabular-nums text-slate-600`}>{p.stock}</td>
                    <td className={tdClass}>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${p.active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>
                        {p.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex justify-end gap-1">
                        <Link className={linkBtn} to={`/admin/products/${p._id}`}>Edit</Link>
                        <button className={dangerBtn} type="button" onClick={() => remove(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!products.length && (
                  <tr><td className="px-4 py-16 text-center text-sm text-slate-500" colSpan="5">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
    colorVariants: [],
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
    fd.append("colorVariants", JSON.stringify(form.colorVariants || []));
    [...files].forEach((f) => fd.append("images", f));
    try {
      await api.saveProduct(id && id !== "new" ? id : null, fd);
      nav("/admin/products");
    } catch (e) {
      setErr(e.message);
    }
  }

  function updateColorVariant(index, key, value) {
    setForm((current) => ({
      ...current,
      colorVariants: (current.colorVariants || []).map((variant, i) =>
        i === index ? { ...variant, [key]: value } : variant
      ),
    }));
  }

  async function uploadColorImage(index, file) {
    if (!file) return;
    const data = new FormData();
    data.append("images", file);
    try {
      const result = await request("/api/admin/uploads/product", { method: "POST", body: data });
      updateColorVariant(index, "image", result.urls[0]);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <form onSubmit={save} className="grid items-start gap-6 ">
      <div className="space-y-6">
        <PageHeader title={id === "new" ? "New product" : "Edit product"} subtitle="Fill in the product details below." />

        <Section title="Basic information">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Slug"><input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
          <Field label="Description"><textarea className="input min-h-[100px]" value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Select</option>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Pricing & visibility">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Price"><input className="input" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
            <Field label="Sale price"><input className="input" type="number" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} /></Field>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <label className={checkLabelClass}><input className={checkboxClass} type="checkbox" checked={!!form.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
            <label className={checkLabelClass}><input className={checkboxClass} type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
            <label className={checkLabelClass}><input className={checkboxClass} type="checkbox" checked={!!form.bestseller} onChange={(e) => set("bestseller", e.target.checked)} /> Bestseller</label>
          </div>
        </Section>

        <Section title="Images">
          <Field label="Add images"><input className="input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setFiles([...e.target.files])} /></Field>
          {!!form.images?.length && (
            <div className="flex flex-wrap gap-3">
              {form.images.map((image) => (
                <div key={image} className="relative">
                  <img className="h-20 w-20 rounded-lg border border-slate-200 object-cover" src={asset(image)} alt="" />
                  <button
                    type="button"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-rose-600 shadow ring-1 ring-slate-200 hover:bg-rose-50"
                    aria-label="Remove image"
                    onClick={() => set("images", form.images.filter((item) => item !== image))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Product colors</h2>
            <button
              type="button"
              className="btn-outline"
              onClick={() => set("colorVariants", [...(form.colorVariants || []), { name: "", value: "#000000", image: "" }])}
            >
              Add color
            </button>
          </div>
          <p className={helpText}>Choose a color image or use one of the product images. Customers will see the matching image when they select a color.</p>
          {(form.colorVariants || []).map((variant, index) => (
            <div key={variant._id || `color-${index}`} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[1fr_auto_auto]">
              <Field label="Color name">
                <input className="input" required value={variant.name} onChange={(e) => updateColorVariant(index, "name", e.target.value)} />
              </Field>
              <Field label="Swatch">
                <input className="h-10 w-14 cursor-pointer rounded-md border border-slate-200 bg-white p-1" type="color" value={variant.value || "#000000"} onChange={(e) => updateColorVariant(index, "value", e.target.value)} />
              </Field>
              <button type="button" className={`self-end ${dangerBtn}`} onClick={() => set("colorVariants", form.colorVariants.filter((_, i) => i !== index))}>
                Remove
              </button>
              <Field label="Display image">
                <select className="input" value={variant.image || ""} onChange={(e) => updateColorVariant(index, "image", e.target.value)}>
                  <option value="">Use primary product image</option>
                  {(form.images || []).map((image) => <option key={image} value={image}>Product image {form.images.indexOf(image) + 1}</option>)}
                </select>
              </Field>
              <Field label="Upload color image">
                <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadColorImage(index, e.target.files?.[0])} />
              </Field>
              {variant.image && <img className="h-16 w-16 rounded-lg border border-slate-200 object-cover" src={asset(variant.image)} alt={`${variant.name} product`} />}
            </div>
          ))}
        </Section>

        {err && <Alert>{err}</Alert>}
        <button className="btn w-full py-2.5 sm:w-auto sm:px-8">Save</button>
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
    <div className="space-y-6">
      <PageHeader title="Categories" subtitle="Organize your products into categories." />
      {err && <Alert>{err}</Alert>}
      <form onSubmit={save} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Slug (optional)"><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
        <label className={checkLabelClass}><input className={checkboxClass} type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
        <div className="flex gap-2 sm:justify-end">
          <button className="btn">{editing ? "Update category" : "Add category"}</button>
          {editing && <button className="btn-outline" type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
      <ul className="space-y-3">
        {list.map((c) => (
          <li key={c._id} className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="text-sm font-medium text-slate-900">
              {c.name} <span className="font-normal text-slate-500">({c.slug})</span>
              {!c.active && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">inactive</span>}
            </span>
            <span className="flex gap-1">
              <button className={linkBtn} type="button" onClick={() => {
                setEditing(c._id);
                setForm({ ...emptyForm, ...c });
              }}>Edit</button>
              <button className={dangerBtn} type="button" onClick={() => remove(c)}>Delete</button>
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
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage and track all customer orders."
        action={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>}
      />
      {err && <Alert>{err}</Alert>}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input className="input w-full sm:max-w-xs" placeholder="Search name, email, phone, order #" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-full sm:max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["pending_payment", "payment_submitted", "confirmed", "processing", "dispatched", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Order</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Payment</th>
                <th className={`${thClass} text-right`}>Total</th>
                <th className={`${thClass} text-right`}>Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o._id} className="transition-colors hover:bg-slate-50/80">
                  <td className={tdClass}>
                    <div className="font-medium text-slate-900">{o.orderNumber}</div>
                    <div className="mt-1"><Badge value={o.status} /></div>
                  </td>
                  <td className={tdClass}>
                    <div className="font-medium text-slate-900">{o.customer?.fullName}</div>
                    <div className="text-xs text-slate-500">{o.customer?.city}</div>
                  </td>
                  <td className={tdClass}><Badge value={o.paymentStatus} /></td>
                  <td className={`${tdClass} text-right font-semibold tabular-nums text-slate-900`}>{money(o.total)}</td>
                  <td className={`${tdClass} text-right`}><Link className="btn-outline inline-block whitespace-nowrap" to={`/admin/orders/${o._id}`}>Order Details</Link></td>
                </tr>
              ))}
              {!orders.length && (
                <tr><td className="px-4 py-16 text-center text-sm text-slate-500" colSpan="5">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
  if (!data) return err ? <Alert>{err}</Alert> : <Loading />;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl tracking-tight text-slate-900">{o.orderNumber}</h1>
        <Badge value={o.status} />
        <Badge value={o.paymentStatus} />
      </div>
      {err && <Alert>{err}</Alert>}

      <Section title="Customer">
        <div className="space-y-1.5 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{o.customer.fullName} · {o.customer.phone} · {o.customer.email}</p>
          <p>{o.customer.address}, {o.customer.city}, {o.customer.province}</p>
          <p className="text-slate-600">Landmark: {o.customer.landmark || "—"} · Notes: {o.customer.notes || "—"}</p>
          <p className="pt-1 text-slate-600">Status: {o.status} · Payment: {o.paymentStatus}</p>
          {o.cancelledAt && <p className="text-rose-600">Cancelled: {new Date(o.cancelledAt).toLocaleString()} · {o.cancelReason}</p>}
        </div>
      </Section>

      <Section title="Items and pricing">
        <div className="divide-y divide-slate-100 text-sm text-slate-700">
          {o.items.map((i, idx) => (
            <div key={idx} className="py-3 first:pt-0">
              {i.quantity} × <span className="font-medium text-slate-900">{i.name}</span> · Unit price {money(i.unitPrice)} · Customization: “{i.customText || "—"}”{i.color ? ` · Color: ${i.color.name} (${i.color.value})` : ""} · Line total <span className="font-semibold text-slate-900">{money(i.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
          <p>Subtotal {money(o.subtotal)} · Delivery charges {money(o.deliveryFee)} · Discount {money(o.discount)} · <span className="font-semibold text-slate-900">Total {money(o.total)}</span></p>
          <p>Advance payment {money(o.advanceAmount)} · Remaining balance (COD) {money(o.remainingCod)}</p>
        </div>
      </Section>

      <Section title="Payment submissions">
        {data.payments.map((payment) => (
          <div key={payment._id} className="space-y-1 rounded-md border border-slate-200 p-4 text-sm text-slate-700">
            <p className="flex flex-wrap items-center gap-2">{payment.method} · Ref {payment.transactionRef} · <Badge value={payment.status} /></p>
            <p className="text-slate-500">Submitted {new Date(payment.createdAt).toLocaleString()}</p>
            {payment.adminNotes && <p>Admin notes: {payment.adminNotes}</p>}
            {payment.screenshotPath && <img className="mt-2 max-h-48 rounded-lg border border-slate-200" src={api.paymentShot(payment._id)} alt="Payment proof" />}
          </div>
        ))}
        {!data.payments.length && <p className="text-sm text-slate-500">No payment submissions.</p>}
      </Section>

      <Section title="Fulfilment">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Courier"><input className="input" value={courier} onChange={(e) => setCourier(e.target.value)} /></Field>
          <Field label="Tracking number"><input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>
          <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {["processing", "dispatched", "delivered"].map((s) => (
            <button key={s} className="btn-outline capitalize" onClick={() => setStatus(s)}>{s}</button>
          ))}
          <button className="btn-outline !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={() => setStatus("cancelled")}>Cancel order</button>
        </div>
        {msg && <Alert kind="ok">{msg}</Alert>}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <a className="btn" href={data.whatsapp.reminder} target="_blank" rel="noreferrer">WhatsApp payment reminder</a>
          <a className="btn-outline" href={data.whatsapp.cancel} target="_blank" rel="noreferrer">WhatsApp cancellation note</a>
        </div>
        <p className={helpText}>These links open WhatsApp. Nothing is sent until a person presses Send.</p>
      </Section>

      <Section title="History">
        <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
          {o.history?.map((h, i) => (
            <li key={i} className="text-sm text-slate-700">
              <span className="text-slate-500">{new Date(h.at).toLocaleString()}</span> · <span className="font-medium text-slate-900">{h.status}</span> · {h.note}
            </li>
          ))}
        </ol>
      </Section>
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
    <div className="space-y-6">
      <PageHeader title="Payment verification" />
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Compare the screenshot and reference with the money actually received. Do not verify from the screenshot alone.
      </div>
      {msg && <Alert kind="ok">{msg}</Alert>}
      <div className="grid gap-4 xl:grid-cols-2">
        {payments.map((p) => (
          <div key={p._id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-slate-900">{p.order?.orderNumber}</div>
              <Badge value={p.status} />
            </div>
            <p className="text-sm text-slate-600">{p.method} · Ref {p.transactionRef} · Advance {money(p.order?.advanceAmount)}</p>
            <img className="max-h-64 rounded-lg border border-slate-200" src={api.paymentShot(p._id)} alt="Payment proof" />
            <textarea className="input" placeholder="Admin notes" value={notes[p._id] || ""} onChange={(e) => setNotes({ ...notes, [p._id]: e.target.value })} />
            {p.status === "under_review" && (
              <div className="flex gap-2">
                <button className="btn" onClick={() => decide(p._id, "verified")}>Verify</button>
                <button className="btn-outline !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={() => decide(p._id, "rejected")}>Reject</button>
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
    <div className="space-y-6">
      <PageHeader title="Coupons" subtitle="Create and manage discount codes." />
      <form onSubmit={save} className="card grid gap-3 p-4 md:grid-cols-5">
        <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percent">percent</option>
          <option value="fixed">fixed</option>
        </select>
        <input className="input" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Min order" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} />
        <button className="btn">Add</button>
      </form>
      <ul className="space-y-3">
        {list.map((c) => (
          <li key={c._id} className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="text-sm text-slate-700">
              <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-900">{c.code}</span>
              <span className="ml-3">{c.type} {c.value} · used {c.usedCount}</span>
            </span>
            <button className="btn-outline !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={async () => { await api.deleteCoupon(c._id); setList(list.filter((x) => x._id !== c._id)); }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [savedOrderNotificationEmail, setSavedOrderNotificationEmail] = useState("");
  const [email, setEmail] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [testingOrderEmail, setTestingOrderEmail] = useState(false);
  useEffect(() => {
    api.settings().then((d) => {
      setSettings(d.settings);
      setSavedOrderNotificationEmail((d.settings.orderNotificationEmail || "").trim());
      setEmail(d.email);
    }).catch((e) => setErr(e.message));
  }, []);
  if (!settings) return err ? <Alert>{err}</Alert> : <Loading />;
  async function save(e) {
    e.preventDefault();
    try {
      await api.saveSettings(settings);
      setSavedOrderNotificationEmail((settings.orderNotificationEmail || "").trim());
      setErr("");
      setMsg("Settings saved. Existing orders keep their original totals.");
    } catch (e) {
      setErr(e.message);
    }
  }
  async function sendTestOrderEmail() {
    setTestingOrderEmail(true);
    setErr("");
    setMsg("");
    try {
      await api.testOrderEmail();
      setMsg("Test order notification email sent.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setTestingOrderEmail(false);
    }
  }
  return (
    <form onSubmit={save} className="space-y-6">
      <PageHeader title="Store settings" subtitle="Configure your store, delivery, payments and content." />

      <div className={`rounded-md border px-4 py-3 text-sm ${email?.configured ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        Email notifications: {email?.configured ? `configured (${email.host})` : "not configured — the site still runs, emails are skipped"}
      </div>

      <Section title="Store details">
        <div className="grid gap-4 md:grid-cols-2">
          {["storeName", "tagline", "email", "phone", "whatsappNumber", "address"].map((k) => (
            <Field key={k} label={prettyLabel(k)}>
              <input className="input" value={settings[k] || ""} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Order Email Notification" hint="Send complete details for each new order to this address. Leave blank to disable order notifications.">
        <Field label="Notification email address">
          <input
            className="input"
            type="email"
            maxLength="254"
            autoComplete="email"
            value={settings.orderNotificationEmail || ""}
            onChange={(e) => setSettings({ ...settings, orderNotificationEmail: e.target.value })}
          />
        </Field>
        <p className={helpText}>
          {email?.configured ? `Email delivery is ready (${email.host}).` : "Email delivery requires SMTP configuration on the server."}
        </p>
        {settings.orderNotificationEmail?.trim() !== savedOrderNotificationEmail && (
          <p className={helpText}>Save settings before sending a test email.</p>
        )}
        <button
          type="button"
          className="btn-outline"
          onClick={sendTestOrderEmail}
          disabled={
            !settings.orderNotificationEmail?.trim() ||
            settings.orderNotificationEmail.trim() !== savedOrderNotificationEmail ||
            !email?.configured ||
            testingOrderEmail
          }
        >
          {testingOrderEmail ? "Sending test email…" : "Send test email"}
        </button>
      </Section>

      <Section title="Delivery">
        <Field label="Nationwide flat fee">
          <input className="input" type="number" value={settings.delivery?.nationwideFlat || 0} onChange={(e) => setSettings({ ...settings, delivery: { ...settings.delivery, nationwideFlat: Number(e.target.value) } })} />
        </Field>
        <textarea
          className="input h-24"
          value={settings.delivery?.cityRates || ""}
          onChange={(e) => setSettings({ ...settings, delivery: { ...settings.delivery, cityRates: e.target.value } })}
        />
        <p className={helpText}>City rates: one per line as city | province | fee. Escape a literal | as \|.</p>
      </Section>

      <Section title="Advance payment">
        <div className="grid gap-3 md:grid-cols-3">
          <select className="input" value={settings.advance?.type} onChange={(e) => setSettings({ ...settings, advance: { ...settings.advance, type: e.target.value } })}>
            <option value="percent">percent</option>
            <option value="fixed">fixed</option>
          </select>
          <input className="input" type="number" value={settings.advance?.amount} onChange={(e) => setSettings({ ...settings, advance: { ...settings.advance, amount: Number(e.target.value) } })} />
          <input className="input" type="number" value={settings.advance?.minAdvance} onChange={(e) => setSettings({ ...settings, advance: { ...settings.advance, minAdvance: Number(e.target.value) } })} />
        </div>
      </Section>

      <Section title="Payment accounts">
        <textarea
          className="input h-40 font-mono text-xs"
          value={settings.paymentAccounts || ""}
          onChange={(e) => setSettings({ ...settings, paymentAccounts: e.target.value })}
        />
        <p className={helpText}>One per line: method | holder | account number | instructions | active (true/false). Use \| for a literal | and \n for a line break.</p>
      </Section>

      <Section title="Deadline">
        <Field label="Hours to pay">
          <input className="input" type="number" value={settings.paymentDeadlineHours} onChange={(e) => setSettings({ ...settings, paymentDeadlineHours: Number(e.target.value) })} />
        </Field>
        <label className={checkLabelClass}>
          <input className={checkboxClass} type="checkbox" checked={!!settings.autoCancelEnabled} onChange={(e) => setSettings({ ...settings, autoCancelEnabled: e.target.checked })} />
          Auto-cancel overdue unpaid orders
        </label>
      </Section>

      <Section title="Banners / FAQs / policies">
        <textarea className="input h-32 font-mono text-xs" value={settings.banners || ""} onChange={(e) => setSettings({ ...settings, banners: e.target.value })} />
        <p className={helpText}>Banners, one per line: title | subtitle | image | button text | button link | active (true/false). Use \| for a literal | and \n for a line break.</p>
        <textarea className="input h-32 font-mono text-xs" value={settings.faqs || ""} onChange={(e) => setSettings({ ...settings, faqs: e.target.value })} />
        <p className={helpText}>FAQs, one per line: question | answer. Use \| for a literal | and \n for a line break.</p>
        <textarea className="input h-32 font-mono text-xs" value={settings.policies || ""} onChange={(e) => setSettings({ ...settings, policies: e.target.value })} />
        <p className={helpText}>Policies, one per line: key | text. Use \| for a literal | and \n for a line break.</p>
      </Section>

      {err && <Alert>{err}</Alert>}
      {msg && <Alert kind="ok">{msg}</Alert>}
      <div className="flex flex-wrap gap-2">
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
  if (!data) return <Loading />;
  return (
    <div className="space-y-6">
      <PageHeader title="Sales report" subtitle="Daily orders and sales summary." />
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Day</th>
                <th className={`${thClass} text-right`}>Orders</th>
                <th className={`${thClass} text-right`}>Sales</th>
                <th className={`${thClass} text-right`}>Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.byDay.map((d) => (
                <tr key={d._id} className="transition-colors hover:bg-slate-50/80">
                  <td className={`${tdClass} font-medium text-slate-900`}>{d._id}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{d.orders}</td>
                  <td className={`${tdClass} text-right font-semibold tabular-nums text-slate-900`}>{money(d.sales)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{d.verified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
    <form onSubmit={save} className="max-w-md space-y-6">
      <PageHeader title="Profile" />
      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
          {(admin?.name || "A").charAt(0).toUpperCase()}
        </div>
        <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">{admin?.name}</span> · {admin?.email}</p>
      </div>
      <Section title="Change password">
        <Field label="Current password"><input className="input" type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="New password"><input className="input" type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} /></Field>
        {err && <Alert>{err}</Alert>}
        {msg && <Alert kind="ok">{msg}</Alert>}
        <button className="btn">Change password</button>
      </Section>
    </form>
  );
}