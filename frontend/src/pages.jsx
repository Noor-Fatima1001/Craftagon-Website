import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, money, statusLabel } from "./api";
import { useAuth, useCart, useStore } from "./context";
import { Alert, CustomPreview, Field, ProductCard } from "./components";

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

export function Home() {
  const { store, featured, bestsellers, categories } = useStore();
  const banner = store?.banners?.[0];
  return (
    <div className="space-y-14">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-14 md:px-16">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Personalized print</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold text-black md:text-5xl">
          {banner?.title || "Gifts they will keep"}
        </h1>
        <p className="mt-4 max-w-xl text-slate-600">
          {banner?.subtitle || store?.tagline || "Names and short messages printed on pens, mugs, tumblers, diaries and gift sets."}
        </p>
        <Link to={banner?.ctaLink || "/products"} className="btn mt-8">
          {banner?.ctaText || "Shop now"}
        </Link>
      </section>
      <section>
        <h2 className="mb-6 text-2xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories?.map((c) => (
            <Link key={c._id} to={`/products?category=${c.slug}`} className="card p-4 text-center hover:border-accent">
              <div className="font-semibold">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-6 text-2xl font-bold">Featured</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured?.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-6 text-2xl font-bold">Bestsellers</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers?.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function About() {
  const { store } = useStore();
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">{store?.about?.title || "About Us"}</h1>
      <p className="mt-4 whitespace-pre-line text-slate-600">
        {store?.about?.body ||
          "Craftagon prints names and short messages onto pens, mugs, tumblers, diaries and gift sets. We confirm advance payments by hand before we print."}
      </p>
    </div>
  );
}

export function Help() {
  const { store } = useStore();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{store?.help?.title || "Help & Support"}</h1>
      <p className="whitespace-pre-line text-slate-600">{store?.help?.body}</p>
      <div className="card space-y-2 p-4 text-sm">
        <p>Track an order with the order number and the email used at checkout.</p>
        <p>JazzCash and Easypaisa transfers need a screenshot and a transaction ID. COD is confirmed by staff, never automatically.</p>
        <p>WhatsApp buttons only open a chat. Nothing is sent until you press Send.</p>
        <Link className="btn mt-2" to="/contact">
          Contact us
        </Link>
      </div>
    </div>
  );
}

export function Contact() {
  const { store } = useStore();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", message: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await api.contact(form);
      setMsg(r.message);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-2 text-slate-600">{store?.email}</p>
        <p className="text-slate-600">{store?.phone}</p>
        <p className="text-slate-600">{store?.address}</p>
        <form onSubmit={send} className="mt-6 space-y-3">
          <Field label="Name">
            <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Message">
            <textarea className="input min-h-[120px]" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </Field>
          {err && <Alert>{err}</Alert>}
          {msg && <Alert kind="ok">{msg}</Alert>}
          <button className="btn" disabled={busy}>
            {busy ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function Products() {
  const [params, setParams] = useSearchParams();
  const { categories } = useStore();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [err, setErr] = useState("");
  const [qInput, setQInput] = useState(params.get("q") || "");
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page") || 1);

  useEffect(() => {
    setQInput(q);
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (category) qs.set("category", category);
    if (sort) qs.set("sort", sort);
    qs.set("page", String(page));
    qs.set("limit", "12");
    api
      .products(`?${qs}`)
      .then((d) => {
        setProducts(d.products);
        setMeta({ page: d.page, pages: d.pages, total: d.total });
      })
      .catch((e) => setErr(e.message));
  }, [q, category, sort, page]);

  function set(k, v) {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== "page") n.delete("page");
    setParams(n);
  }

  function reset() {
    setQInput("");
    setParams({});
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Shop</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && set("q", qInput)}
        />
        <button className="btn-outline" type="button" onClick={() => set("q", qInput)}>
          Search
        </button>
        <select className="input max-w-xs" value={category} onChange={(e) => set("category", e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input max-w-xs" value={sort} onChange={(e) => set("sort", e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
        <button className="btn-outline" type="button" onClick={reset}>
          Reset Filters
        </button>
      </div>
      {err && (
        <div className="mt-4">
          <Alert>{err}</Alert>
        </div>
      )}
      <p className="mt-4 text-sm text-slate-500">{meta.total} products</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
      {!products.length && !err && <p className="mt-8 text-slate-500">No products match these filters.</p>}
      {meta.pages > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: meta.pages }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" className={n === meta.page ? "btn" : "btn-outline"} onClick={() => set("page", String(n))}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const cart = useCart();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [text, setText] = useState("");
  const [qty, setQty] = useState(1);
  const [colorVariantId, setColorVariantId] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    api
      .product(slug)
      .then((d) => {
        setProduct(d.product);
        setColorVariantId(d.product.colorVariants?.[0]?._id || "");
      })
      .catch((e) => setErr(e.message));
  }, [slug]);
  if (err) return <Alert>{err}</Alert>;
  if (!product) return <p>Loading…</p>;
  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const max = product.customization?.maxLength || 24;
  const colorVariants = product.colorVariants || [];
  const selectedColor = colorVariants.find((variant) => variant._id === colorVariantId);
  const productImage = selectedColor?.image || product.images?.[0];
  function add() {
    const customText = text.trim();
    if (product.customization?.enabled !== false && product.customization?.required !== false && !customText) {
      setErr("Please enter custom text");
      return;
    }
    if (customText.length > max) {
      setErr(`Text must be at most ${max} characters`);
      return;
    }
    if (colorVariants.length && !selectedColor) {
      setErr("Please select a color");
      return;
    }
    cart.add({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: productImage,
      price,
      quantity: qty,
      customText,
      colorVariantId: selectedColor?._id || "",
      color: selectedColor
        ? { name: selectedColor.name, value: selectedColor.value }
        : null,
      maxLength: max,
      preview: product.preview,
    });
    nav("/cart");
  }
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <CustomPreview product={product} text={text} image={productImage} />
      <div>
        <div className="text-sm text-slate-500">{product.category?.name}</div>
        <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-2xl font-bold text-accent">{money(price)}</span>
          {product.salePrice && product.salePrice < product.price && (
            <span className="text-slate-400 line-through">{money(product.price)}</span>
          )}
        </div>
        <p className="mt-4 text-slate-600">{product.description}</p>
        {!!colorVariants.length && (
          <Field label="Color">
            <div className="mt-2 flex flex-wrap gap-2">
              {colorVariants.map((variant) => (
                <button
                  key={variant._id}
                  type="button"
                  title={variant.name}
                  aria-label={`Select ${variant.name}`}
                  aria-pressed={variant._id === colorVariantId}
                  onClick={() => {
                    setColorVariantId(variant._id);
                    setErr("");
                  }}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    variant._id === colorVariantId ? "border-accent ring-2 ring-accent/30" : "border-slate-200"
                  }`}
                >
                  <span className="h-5 w-5 rounded-full border border-slate-300" style={{ backgroundColor: variant.value }} />
                  {variant.name}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label={product.customization?.label || "Custom text"}>
          <input className="input" maxLength={max} value={text} onChange={(e) => setText(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">
            {text.length}/{max} · the name appears on the product photo as you type
          </p>
        </Field>
        <Field label="Quantity">
          <input className="input max-w-24" type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
        {err && (
          <div className="mt-3">
            <Alert>{err}</Alert>
          </div>
        )}
        <button className="btn mt-4" onClick={add}>
          Add to cart
        </button>
      </div>
    </div>
  );
}

export function CartPage() {
  const cart = useCart();
  return (
    <div>
      <h1 className="text-3xl font-bold">Cart</h1>
      {!cart.items.length && (
        <p className="mt-6">
          Your cart is empty.{" "}
          <Link className="text-accent" to="/products">
            Continue shopping
          </Link>
        </p>
      )}
      <div className="mt-6 space-y-4">
        {cart.items.map((it, i) => (
          <div key={`${it.productId}-${it.customText}-${i}`} className="card grid gap-4 p-4 md:grid-cols-[160px_1fr_auto]">
            <CustomPreview product={{ name: it.name, preview: it.preview, images: [it.image] }} text={it.customText} image={it.image} />
            <div>
              <Link to={`/products/${it.slug}`} className="font-semibold">
                {it.name}
              </Link>
              <p className="text-sm text-slate-500">Custom text: {it.customText || "—"}</p>
              {it.color && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  Color: <span className="inline-block h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: it.color.value }} />
                  {it.color.name}
                </p>
              )}
              <p className="text-sm">{money(it.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input w-20"
                type="number"
                min="1"
                value={it.quantity}
                onChange={(e) => cart.update(i, Number(e.target.value))}
              />
              <button className="btn-outline" onClick={() => cart.remove(i)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      {!!cart.items.length && (
        <Link to="/checkout" className="btn mt-8">
          Checkout
        </Link>
      )}
    </div>
  );
}

export function Checkout() {
  const cart = useCart();
  const { customer } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    province: "Punjab",
    city: "",
    address: "",
    landmark: "",
    notes: "",
  });
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const items = useMemo(
    () =>
      cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        customText: i.customText,
        ...(i.colorVariantId ? { colorVariantId: i.colorVariantId } : {}),
      })),
    [cart.items]
  );

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || customer.fullName || "",
        email: f.email || customer.email || "",
        phone: f.phone || customer.phone || "",
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (!items.length) return;
    api
      .quote({ items, city: form.city, province: form.province })
      .then((d) => {
        setQuote(d);
        setErr("");
      })
      .catch((e) => {
        setQuote(null);
        setErr(e.message);
      });
  }, [items, form.city, form.province]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function place(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const key = crypto.randomUUID();
      const data = await api.createOrder({
        idempotencyKey: key,
        items,
        customer: form,
      });
      cart.clear();
      nav(`/thank-you/${data.order.orderNumber}?token=${data.order.lookupToken}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!cart.items.length) return <p>Your cart is empty.</p>;

  return (
    <form onSubmit={place} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <Field label="Full name">
          <input className="input" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field label="Mobile / WhatsApp">
          <input className="input" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Province">
          <select className="input" value={form.province} onChange={(e) => set("province", e.target.value)}>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <input className="input" required value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Complete address">
          <textarea className="input" required value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Nearby landmark">
          <input className="input" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
        </Field>
        <Field label="Order notes (optional)">
          <textarea className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
      <div className="card h-fit p-5">
        <h2 className="font-bold">Order summary</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {cart.items.map((i, idx) => (
            <li key={idx}>
              {i.quantity} × {i.name} — “{i.customText}”
              {i.color && <div className="text-slate-500">Color: {i.color.name}</div>}
            </li>
          ))}
        </ul>
        {quote && (
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{money(quote.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{money(quote.total)}</span>
            </div>
            <div className="flex justify-between text-accent">
              <span>Advance due</span>
              <span>{money(quote.advanceAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining COD</span>
              <span>{money(quote.remainingCod)}</span>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">Totals are calculated on the server when you place the order.</p>
        {err && (
          <div className="mt-3">
            <Alert>{err}</Alert>
          </div>
        )}
        <button className="btn mt-4 w-full" disabled={busy}>
          {busy ? "Placing order…" : "Place order"}
        </button>
      </div>
    </form>
  );
}

function OrderView({ order, payments, paymentAccounts, whatsappUrl, token, title = "Order" }) {
  const [method, setMethod] = useState(paymentAccounts?.[0]?.method || "");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isCod = /^cod$/i.test(method) || /cash on delivery/i.test(method);

  useEffect(() => {
    if (paymentAccounts?.[0]?.method && !method) setMethod(paymentAccounts[0].method);
  }, [paymentAccounts, method]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("orderNumber", order.orderNumber);
      fd.append("token", token);
      fd.append("method", method);
      fd.append("transactionRef", isCod ? "COD" : ref);
      fd.append("customerNote", note);
      if (file) fd.append("screenshot", file);
      await api.submitPayment(fd);
      setMsg("Payment details submitted. Status is Under Review until a person verifies it. Screenshots are never verified automatically.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-slate-600">
          Order <strong>{order.orderNumber}</strong> · {statusLabel(order.status)} · payment {statusLabel(order.paymentStatus)}
        </p>
        <p className="mt-2 text-sm">
          Advance due: <strong>{money(order.advanceAmount)}</strong> · Remaining balance: {money(order.remainingCod)}
        </p>
        {order.paymentDeadlineAt && order.paymentStatus !== "verified" && (
          <p className="text-sm text-slate-500">
            Pay before {new Date(order.paymentDeadlineAt).toLocaleString()}. Unpaid orders may be cancelled after the deadline. Verified or under-review payments are not auto-cancelled.
          </p>
        )}
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
          <div className="font-semibold">Shipping</div>
          {order.courierName || order.trackingNumber ? (
            <p>
              {order.courierName || "Courier entered by store"} {order.trackingNumber ? `· ${order.trackingNumber}` : ""}
            </p>
          ) : (
            <p>No courier details yet. This store does not have an automatic courier integration — tracking numbers appear here only after staff enter them.</p>
          )}
        </div>
        {whatsappUrl && (
          <>
            <a className="btn mt-4" href={whatsappUrl} target="_blank" rel="noreferrer">
              Open WhatsApp with order details
            </a>
            <p className="mt-2 text-xs text-slate-500">WhatsApp will not send this message until you press Send.</p>
          </>
        )}
      </div>
      <div className="card p-6">
        <h2 className="font-bold">Items</h2>
        <div className="mt-3 space-y-4">
          {order.items.map((i, idx) => (
            <div key={idx} className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <CustomPreview product={{ name: i.name, preview: i.preview, images: [i.image] }} text={i.customText} image={i.image} />
              <div className="text-sm">
                {i.quantity} × {i.name} — “{i.customText}”
                {i.color && (
                  <div className="flex items-center gap-2 text-slate-500">
                    Color: <span className="inline-block h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: i.color.value }} />
                    {i.color.name}
                  </div>
                )}
                <div>{money(i.lineTotal)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm">
          Subtotal {money(order.subtotal)} · Delivery {money(order.deliveryFee)} · Total {money(order.total)}
        </div>
      </div>
      <div className="card p-6">
        <h2 className="font-bold">Pay the advance</h2>
        <p className="mt-1 text-sm text-slate-600">
          Transfer {money(order.advanceAmount)} using JazzCash or Easypaisa, or choose COD. Staff compare proof with the actual transfer before marking it verified.
        </p>
        <div className="mt-4 space-y-3">
          {paymentAccounts?.map((a) => (
            <div key={a.method} className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="font-semibold">{a.method}</div>
              <div>{a.holderName}</div>
              <div>{a.accountNumber}</div>
              <div className="text-slate-600">{a.instructions}</div>
            </div>
          ))}
        </div>
        {order.paymentStatus !== "verified" && order.status !== "cancelled" && (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <Field label="Payment method">
              <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                {paymentAccounts?.map((a) => (
                  <option key={a.method}>{a.method}</option>
                ))}
              </select>
            </Field>
            {!isCod && (
              <Field label="Transaction / reference number">
                <input className="input" required value={ref} onChange={(e) => setRef(e.target.value)} />
              </Field>
            )}
            {!isCod && (
              <Field label="Screenshot (JPEG, PNG or WebP, max 5MB)">
                <input className="input" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => setFile(e.target.files?.[0])} />
              </Field>
            )}
            <Field label="Note (optional)">
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {err && <Alert>{err}</Alert>}
            {msg && <Alert kind="ok">{msg}</Alert>}
            <button className="btn" disabled={busy}>
              {busy ? "Submitting…" : isCod ? "Submit COD request" : "Submit payment proof"}
            </button>
          </form>
        )}
        {payments?.length > 0 && (
          <div className="mt-4 text-sm">
            <div className="font-semibold">Submitted payments</div>
            {payments.map((p) => (
              <div key={p._id}>
                {p.method} · {p.transactionRef} · {statusLabel(p.status)}
                {p.rejectionReason ? ` · ${p.rejectionReason}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ThankYou() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api
      .lookup(`orderNumber=${orderNumber}&token=${token || ""}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [orderNumber, token]);
  if (err) return <Alert>{err}</Alert>;
  if (!data) return <p>Loading…</p>;
  return <OrderView {...data} token={token} title="Thank you" />;
}

export function OrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  async function go(e) {
    e.preventDefault();
    setErr("");
    try {
      const d = await api.lookup(`orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
      setData(d);
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold">Track Order</h1>
      <p className="mt-2 text-sm text-slate-600">Enter the order number and the email used at checkout.</p>
      <form onSubmit={go} className="mt-4 space-y-3">
        <Field label="Order number">
          <input className="input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {err && <Alert>{err}</Alert>}
        <button className="btn">Look up</button>
      </form>
      {data && (
        <div className="mt-8">
          <OrderView {...data} token={data.order.lookupToken} title="Your order" />
        </div>
      )}
    </div>
  );
}

export function Faq() {
  const { store } = useStore();
  return (
    <div>
      <h1 className="text-3xl font-bold">FAQ</h1>
      <div className="mt-6 space-y-4">
        {store?.faqs?.map((f, i) => (
          <div key={i} className="card p-4">
            <div className="font-semibold">{f.question}</div>
            <p className="mt-1 text-sm text-slate-600">{f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Policies() {
  const { store } = useStore();
  return (
    <div className="prose max-w-3xl">
      <h1 className="text-3xl font-bold">Policies</h1>
      <h2 className="mt-6 text-xl font-semibold">Shipping</h2>
      <p>{store?.policies?.shipping}</p>
      <h2 className="mt-6 text-xl font-semibold">Returns</h2>
      <p>{store?.policies?.returns}</p>
      <h2 className="mt-6 text-xl font-semibold">Privacy</h2>
      <p>{store?.policies?.privacy}</p>
    </div>
  );
}

export function LoginPage() {
  const { customer, setCustomer } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  if (customer) {
    nav("/account", { replace: true });
  }
  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const d = mode === "login" ? await api.login(form) : await api.register(form);
      setCustomer(d.customer);
      nav("/account");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="mx-auto max-w-md card p-6">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : "Create account"}</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === "register" && (
          <>
            <Field label="Full name">
              <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </>
        )}
        <Field label="Email">
          <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        {err && <Alert>{err}</Alert>}
        <button className="btn w-full">{mode === "login" ? "Sign in" : "Register"}</button>
      </form>
      <button className="mt-4 text-sm text-accent" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
      </button>
    </div>
  );
}

export function AccountPage() {
  const { customer, setCustomer, ready } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!ready) return;
    if (!customer) {
      nav("/login");
      return;
    }
    api
      .myOrders()
      .then((d) => setOrders(d.orders))
      .catch((e) => setErr(e.message));
  }, [customer, ready, nav]);
  async function logout() {
    await api.logout();
    setCustomer(null);
    nav("/");
  }
  if (!customer) return <p>Loading…</p>;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-slate-600">
            {customer.fullName} · {customer.email}
          </p>
        </div>
        <button className="btn-outline" onClick={logout}>
          Log out
        </button>
      </div>
      {err && (
        <div className="mt-4">
          <Alert>{err}</Alert>
        </div>
      )}
      <h2 className="mt-8 font-bold">Your orders</h2>
      <div className="mt-3 space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="card p-4 text-sm">
            <div className="font-semibold">
              #{o.orderNumber} · {statusLabel(o.status)} · payment {statusLabel(o.paymentStatus)}
            </div>
            <div>
              {money(o.total)} · advance {money(o.advanceAmount)} · remaining {money(o.remainingCod)}
            </div>
            <Link className="text-accent" to="/order-lookup">
              Track with order number {o.orderNumber} and your email
            </Link>
          </div>
        ))}
        {!orders.length && <p className="text-slate-500">No orders on this account yet.</p>}
      </div>
    </div>
  );
}
