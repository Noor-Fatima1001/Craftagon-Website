import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, money } from "./api";
import { useCart, useStore } from "./context";
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
      <section className="overflow-hidden rounded-2xl bg-slate-900 px-8 py-16 text-white md:px-16">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-300">Personalized print</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold md:text-5xl">{banner?.title || "Gifts they will keep"}</h1>
        <p className="mt-4 max-w-xl text-slate-300">
          {banner?.subtitle || store?.tagline || "Names and short messages on pens, mugs, tumblers, diaries and gift sets."}
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

export function Products() {
  const [params, setParams] = useSearchParams();
  const { categories } = useStore();
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState("");
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";

  useEffect(() => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (category) qs.set("category", category);
    if (sort) qs.set("sort", sort);
    api
      .products(`?${qs}`)
      .then((d) => setProducts(d.products))
      .catch((e) => setErr(e.message));
  }, [q, category, sort]);

  function set(k, v) {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    setParams(n);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Shop</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search" defaultValue={q} onBlur={(e) => set("q", e.target.value)} />
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
      </div>
      {err && <div className="mt-4"><Alert>{err}</Alert></div>}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
      {!products.length && !err && <p className="mt-8 text-slate-500">No products match these filters.</p>}
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
  const [err, setErr] = useState("");
  useEffect(() => {
    api.product(slug).then((d) => setProduct(d.product)).catch((e) => setErr(e.message));
  }, [slug]);
  if (err) return <Alert>{err}</Alert>;
  if (!product) return <p>Loading…</p>;
  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const max = product.customization?.maxLength || 24;
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
    cart.add({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0],
      price,
      quantity: qty,
      customText,
      maxLength: max,
    });
    nav("/cart");
  }
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <CustomPreview product={product} text={text} />
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
        <p className="mt-2 text-sm">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
        <Field label={product.customization?.label || "Custom text"}>
          <input className="input" maxLength={max} value={text} onChange={(e) => setText(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">{text.length}/{max}</p>
        </Field>
        <Field label="Quantity">
          <input className="input max-w-24" type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </Field>
        {err && <div className="mt-3"><Alert>{err}</Alert></div>}
        <button className="btn mt-4" disabled={product.stock < 1} onClick={add}>
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
      {!cart.items.length && <p className="mt-6">Your cart is empty. <Link className="text-accent" to="/products">Continue shopping</Link></p>}
      <div className="mt-6 space-y-4">
        {cart.items.map((it, i) => (
          <div key={`${it.productId}-${it.customText}-${i}`} className="card flex flex-wrap items-center gap-4 p-4">
            <div className="flex-1">
              <Link to={`/products/${it.slug}`} className="font-semibold">{it.name}</Link>
              <p className="text-sm text-slate-500">Custom text: {it.customText || "—"}</p>
              <p className="text-sm">{money(it.price)}</p>
            </div>
            <input
              className="input w-20"
              type="number"
              min="1"
              value={it.quantity}
              onChange={(e) => cart.update(i, Number(e.target.value))}
            />
            <button className="btn-outline" onClick={() => cart.remove(i)}>Remove</button>
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
    couponCode: "",
  });
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const items = useMemo(
    () => cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, customText: i.customText })),
    [cart.items]
  );

  useEffect(() => {
    if (!items.length) return;
    api
      .quote({ items, city: form.city, province: form.province, couponCode: form.couponCode })
      .then(setQuote)
      .catch((e) => setQuote(null) || setErr(e.message));
  }, [items, form.city, form.province, form.couponCode]);

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
      sessionStorage.setItem("craftagon_idem", key);
      const data = await api.createOrder({
        idempotencyKey: key,
        items,
        couponCode: form.couponCode,
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
        <Field label="Full name"><input className="input" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
        <Field label="Mobile / WhatsApp"><input className="input" required value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Province">
          <select className="input" value={form.province} onChange={(e) => set("province", e.target.value)}>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="City"><input className="input" required value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="Complete address"><textarea className="input" required value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Nearby landmark"><input className="input" value={form.landmark} onChange={(e) => set("landmark", e.target.value)} /></Field>
        <Field label="Order notes (optional)"><textarea className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        <Field label="Coupon"><input className="input" value={form.couponCode} onChange={(e) => set("couponCode", e.target.value)} /></Field>
      </div>
      <div className="card h-fit p-5">
        <h2 className="font-bold">Order summary</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {cart.items.map((i, idx) => (
            <li key={idx}>
              {i.quantity} × {i.name} — “{i.customText}”
            </li>
          ))}
        </ul>
        {quote && (
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(quote.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{money(quote.deliveryFee)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{money(quote.discount)}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span>{money(quote.total)}</span></div>
            <div className="flex justify-between text-accent"><span>Advance due</span><span>{money(quote.advanceAmount)}</span></div>
            <div className="flex justify-between"><span>Remaining COD</span><span>{money(quote.remainingCod)}</span></div>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">Totals are calculated on the server. Prices shown here are a quote and will be confirmed when you place the order.</p>
        {err && <div className="mt-3"><Alert>{err}</Alert></div>}
        <button className="btn mt-4 w-full" disabled={busy}>{busy ? "Placing order…" : "Place order"}</button>
      </div>
    </form>
  );
}

function OrderView({ order, payments, paymentAccounts, whatsappUrl, token }) {
  const [method, setMethod] = useState(paymentAccounts?.[0]?.method || "");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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
      fd.append("transactionRef", ref);
      fd.append("customerNote", note);
      fd.append("screenshot", file);
      await api.submitPayment(fd);
      setMsg("Payment proof submitted. Status is Under Review until a person verifies it. Screenshots are never verified automatically.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-bold">Thank you</h1>
        <p className="mt-2 text-slate-600">Order <strong>{order.orderNumber}</strong> · {order.status.replaceAll("_", " ")} · payment {order.paymentStatus.replaceAll("_", " ")}</p>
        <p className="mt-2 text-sm">Advance due: <strong>{money(order.advanceAmount)}</strong> · Remaining COD: {money(order.remainingCod)}</p>
        {order.paymentDeadlineAt && (
          <p className="text-sm text-slate-500">Pay before {new Date(order.paymentDeadlineAt).toLocaleString()}. Unpaid orders may be cancelled after the deadline. Orders with verified or under-review payments are not auto-cancelled.</p>
        )}
        <a className="btn mt-4" href={whatsappUrl} target="_blank" rel="noreferrer">
          Open WhatsApp with order details
        </a>
        <p className="mt-2 text-xs text-slate-500">WhatsApp will not send this message until you press Send.</p>
      </div>
      <div className="card p-6">
        <h2 className="font-bold">Items</h2>
        <ul className="mt-2 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx}>{i.quantity} × {i.name} — “{i.customText}” · {money(i.lineTotal)}</li>
          ))}
        </ul>
        <div className="mt-3 text-sm">
          Subtotal {money(order.subtotal)} · Delivery {money(order.deliveryFee)} · Discount {money(order.discount)} · Total {money(order.total)}
        </div>
      </div>
      <div className="card p-6">
        <h2 className="font-bold">Pay the advance</h2>
        <p className="mt-1 text-sm text-slate-600">Transfer {money(order.advanceAmount)} using one of these accounts, then upload a screenshot. Staff compare this with the actual transfer before marking it verified.</p>
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
                {paymentAccounts?.map((a) => <option key={a.method}>{a.method}</option>)}
              </select>
            </Field>
            <Field label="Transaction / reference number"><input className="input" required value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
            <Field label="Screenshot (JPEG, PNG or WebP, max 5MB)">
              <input className="input" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => setFile(e.target.files?.[0])} />
            </Field>
            <Field label="Note (optional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            {err && <Alert>{err}</Alert>}
            {msg && <Alert kind="ok">{msg}</Alert>}
            <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit payment proof"}</button>
          </form>
        )}
        {payments?.length > 0 && (
          <div className="mt-4 text-sm">
            <div className="font-semibold">Submitted proofs</div>
            {payments.map((p) => (
              <div key={p._id}>{p.method} · {p.transactionRef} · {p.status.replaceAll("_", " ")}</div>
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
    api.lookup(`orderNumber=${orderNumber}&token=${token || ""}`).then(setData).catch((e) => setErr(e.message));
  }, [orderNumber, token]);
  if (err) return <Alert>{err}</Alert>;
  if (!data) return <p>Loading…</p>;
  return <OrderView {...data} token={token} />;
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
      <h1 className="text-3xl font-bold">Find your order</h1>
      <p className="mt-2 text-sm text-slate-600">Enter the order number and the email used at checkout. Order numbers alone are not enough.</p>
      <form onSubmit={go} className="mt-4 space-y-3">
        <Field label="Order number"><input className="input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} /></Field>
        <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        {err && <Alert>{err}</Alert>}
        <button className="btn">Look up</button>
      </form>
      {data && <div className="mt-8"><OrderView {...data} token={data.order.lookupToken} /></div>}
    </div>
  );
}

export function Faq() {
  const { store } = useStore();
  return (
    <div>
      <h1 className="text-3xl font-bold">Help</h1>
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
