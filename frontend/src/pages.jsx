import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiEdit3,
  FiGift,
  FiLock,
  FiLogIn,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRotateCcw,
  FiSearch,
  FiSend,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiTrash2,
  FiTruck,
  FiUpload,
  FiUserPlus,
  FiHeadphones,
  FiTag,
  FiTarget,
  FiEye,
  FiHeart,
} from "react-icons/fi";
import { FaWhatsapp, FaFacebookF, FaInstagram } from "react-icons/fa";
import { api, asset, money, statusLabel } from "./api";
import { useAuth, useCart, useStore } from "./context";
import { Alert, CustomPreview, Field, ProductCard, ui } from "./components";

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

const STEPS = [
  { icon: FiSearch, title: "Choose a product", text: "Browse pens, mugs, tumblers, diaries and keychains, then pick the one you like." },
  { icon: FiEdit3, title: "Add your text", text: "Type a name or a short message. The product page shows how many characters you can use." },
  { icon: FiCreditCard, title: "Pay the advance", text: "Send the advance by JazzCash or Easypaisa and upload the proof, or choose COD. Our team confirms every payment by hand." },
  { icon: FiTruck, title: "We print and deliver", text: "After your payment is confirmed we print your order and send it to your door. The remaining balance is paid on delivery." },
];

const WHY = [
  { icon: FiGift, title: "Made for one person", text: "Every item carries the name or message you choose, so the gift feels personal and not generic." },
  { icon: FiShield, title: "Payments checked by people", text: "We compare each payment proof with the real transfer before printing. Nothing is verified automatically." },
  { icon: FiTag, title: "Clear pricing", text: "You see the subtotal, delivery fee, advance and remaining COD amount before you place the order." },
  { icon: FiHeadphones, title: "Easy support", text: "Track your order online anytime, reach out via our contact form, or connect with us instantly on WhatsApp for assistance." },
];

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className={ui.pageTitle}>{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
    </div>
  );
}

function SectionHead({ title, subtitle, to }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="hidden items-center gap-1 text-sm font-semibold text-[#000000] hover:underline sm:inline-flex">
          View all <FiArrowRight />
        </Link>
      )}
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    primary: "bg-[#000000]/10 text-[#000000]",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function Row({ label, value, strong, accent }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-slate-200 pt-3 text-base font-bold text-slate-900" : ""} ${accent ? "font-semibold text-[#000000]" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Home() {
  const { store, featured, bestsellers, categories } = useStore();
  const banner = store?.banners?.[0];
  const heroImages = [...(featured || []), ...(bestsellers || [])]
  .filter((p) => p.images?.[0])
  .slice(0, 3);
  return (
    <div className="space-y-20 ">
{/* Hero */}
<section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#000000]/10 px-6 py-2 shadow-sm md:px-10 md:py-5">
  <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#000000]/10 blur-3xl" />
  <div className="relative max-w-3xl">
    <span className="inline-flex items-center gap-2 rounded-full bg-[#000000]/10 px-4 py-1.5 text-sm font-semibold text-[#000000]">
      <FiGift /> Personalized print
    </span>
    <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-4xl">
      {banner?.title || "Gifts they will keep"}
    </h1>
    <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-600">
      {banner?.subtitle || store?.tagline || "Names and short messages printed on pens, mugs, tumblers, diaries and keychains."}
    </p>
    <div className="mt-8 flex flex-wrap gap-3">
      <Link to="/products" className={`${ui.btn} px-7 py-3.5 text-base`}>
       {banner?.ctaText || "Shop now"} <FiArrowRight />
     </Link>
      <Link to="/order-lookup" className={`${ui.btnOutline} px-7 py-3.5 text-base`}>
        <FiPackage /> Track order
      </Link>
    </div>
    <div className="mt-10 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
      {[
        { icon: FiEdit3, t: "Your name crafted" },
        { icon: FiCreditCard, t: "Advance + COD" },
        { icon: FiTruck, t: "Delivery across Pakistan" },
      ].map(({ icon: Icon, t }) => (
        <div key={t} className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-[#000000] shadow-sm ring-1 ring-slate-200">
            <Icon />
          </span>
          {t}
        </div>
      ))}
    </div>
  </div>
</section>

      <section>
        <SectionHead title="Shop by category" subtitle="Find the right item for every person and occasion." to="/products" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories?.map((c) => (
            <Link key={c._id} to={`/products?category=${c.slug}`} className={`${ui.card} group p-5 text-center transition hover:-translate-y-0.5 hover:border-[#000000]/40 hover:shadow-md`}>
              <div className="font-semibold text-slate-800 group-hover:text-[#000000]">{c.name}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                Shop now <FiArrowRight />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {!!featured?.length && (
        <section>
          <SectionHead title="Featured" subtitle="Hand-picked favourites from our collection." to="/products" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500">From choosing a product to opening the parcel, ordering takes four simple steps.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`${ui.card} relative p-6`}>
              <span className="absolute right-5 top-4 text-4xl font-extrabold text-[#000000]">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#000000]/10 text-xl text-[#000000]">
                <Icon />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      {!!bestsellers?.length && (
        <section>
          <SectionHead title="Bestsellers" subtitle="What most customers are ordering." to="/products" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Why customers choose us</h2>
          <p className="mt-2 text-slate-500">We keep ordering simple, honest and easy to follow, from the first click to delivery.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {WHY.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#000000] text-xl text-white">
                <Icon />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#000000]/10 px-6 py-12 text-center shadow-sm md:px-12">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Ready to make a gift personal?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Pick a product, add the name or message, and we will take care of the rest.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/products" className={ui.btn}>
            Start shopping <FiArrowRight />
          </Link>
          <Link to="/contact" className={ui.btnOutline}>
            <FiMail /> Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}

export function About() {
  const { store } = useStore();

  const VALUES = [
    { icon: FiHeart, title: "Made with care", text: "Every name and message is checked and printed carefully, so your gift looks the way you imagined." },
    { icon: FiShield, title: "Honest process", text: "We confirm every advance payment by hand and show clear pricing before you order." },
    { icon: FiGift, title: "Personal by design", text: "From pens to dairies, each item is made for one person, not for everyone." },
  ];

  return (
    <div className="space-y-16">
      {/* Intro */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#000000]/10 px-6 py-10 shadow-sm md:px-12 md:py-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#000000]/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#000000]/10 px-4 py-1 text-sm font-semibold text-[#000000]">
            <FiGift /> Personalized Gifts
          </span>
          <h1 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl">
            {store?.about?.title || "About Craftagon"}
          </h1>
          <div className="mt-4 h-1 w-14 rounded-full bg-[#000000]" />
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-slate-600">
            {store?.about?.body ||
              "Craftagon prints names and short messages onto pens, mugs, tumblers, diaries and keychains. We confirm advance payments before we print."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className={`${ui.btn} px-7 py-3.5 text-base`}>
              Shop now <FiArrowRight />
            </Link>
            <Link to="/contact" className={`${ui.btnOutline} px-7 py-3.5 text-base`}>
              <FiMail /> Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className={`${ui.card} p-6 md:p-8`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#000000] text-xl text-white">
            <FiTarget />
          </span>
          <h2 className="mt-5 text-xl font-bold text-slate-900">Our mission</h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            {store?.about?.mission ||
              "To make personalized gifting simple, affordable and trustworthy for everyone in Pakistan, from the first click to delivery."}
          </p>
        </div>
        <div className={`${ui.card} p-6 md:p-8`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#000000] text-xl text-white">
            <FiEye />
          </span>
          <h2 className="mt-5 text-xl font-bold text-slate-900">Our vision</h2>
          <p className="mt-2 leading-relaxed text-slate-600">
            {store?.about?.vision ||
              "To become the most trusted name for custom printed gifts, where every item feels personal and every order is handled with care."}
          </p>
        </div>
      </section>

      {/* What we do */}
      <section>
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">What we do</h2>
          <p className="mt-2 text-slate-500">We print your name or message on everyday products and deliver them to your door.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {["Pens", "Mugs", "Tumblers", "Diaries", "Keychains"].map((item) => (
            <div key={item} className={`${ui.card} p-5 text-center font-semibold text-slate-800`}>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">What we stand for</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#000000]/10 text-xl text-[#000000]">
                <Icon />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
    {/* CTA */}
<section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#000000]/10 px-6 py-12 text-center shadow-sm md:px-12">
  <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Ready to make a gift personal?</h2>
  <p className="mx-auto mt-3 max-w-xl text-slate-600">Pick a product, add the name or message, and we will take care of the rest.</p>
  <div className="mt-6 flex justify-center">
    <Link to="/products" className={ui.btn}>
      Start shopping <FiArrowRight />
    </Link>
  </div>
</section>
    </div>
  );
}

export function Help() {
  const { store } = useStore();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={store?.help?.title || "Help & Support"} />
      <p className="whitespace-pre-line text-slate-600">Need assistance with your order or payment? Simply enter your order number and email on the Track Order page, or reach out to us directly via Contact Us.</p>
      <div className={`${ui.card} space-y-4 p-6 text-sm text-slate-600`}>
        <p className="flex gap-3">
          <FaWhatsapp className="mt-0.5 shrink-0 text-lg text-[#000000]" />
          Track your order online or contact us for assistance.  
        </p>
        <p className="flex gap-3">
          <FiPackage className="mt-0.5 shrink-0 text-lg text-[#000000]" />
          Track an order with the order number and the email used at checkout.
           </p>
        <p className="flex gap-3">
          <FiCreditCard className="mt-0.5 shrink-0 text-lg text-[#000000]" />
          JazzCash and Easypaisa transfers need a screenshot and a transaction ID. COD is confirmed by staff, never automatically.
        </p>
        <Link className={ui.btn} to="/contact">
          <FiMail /> Contact us
        </Link>
      </div>
    </div>
  );
}

export function Contact() {
  const { store } = useStore();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", subject: "", message: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const waNumber = (store?.whatsapp || store?.whatsappNumber || store?.phone || "")
    .replace(/\D/g, "")
    .replace(/^0/, "92");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello Craftagon, I have a question.")}`
    : "";

  const socials = [
    { icon: FaFacebookF, label: "Facebook", url: store?.socialLinks?.facebook || store?.facebook },
    { icon: FaInstagram, label: "Instagram", url: store?.socialLinks?.instagram || store?.instagram },
  ].filter((s) => s.url);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await api.contact({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        message: form.subject ? `Subject: ${form.subject}\n\n${form.message}` : form.message,
      });
      setMsg(r.message);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Contact Us" subtitle="Questions about an order or a custom design? Send us a message or chat with us on WhatsApp." />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          {waUrl && (
            <div className={`${ui.card} p-6`}>
              <h2 className="text-lg font-bold text-slate-900">Prefer a quick chat?</h2>
              <p className="mt-1 text-sm text-slate-600">Message us on WhatsApp and we will reply as soon as we can.</p>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95"
              >
                <FaWhatsapp className="text-lg" /> Chat on WhatsApp
              </a>
            </div>
          )}

          <div className={`${ui.card} space-y-5 p-6 text-slate-600`}>
            {[
              { icon: FiMail, label: "Email", v: store?.email },
              { icon: FiPhone, label: "Phone", v: store?.phone },
              { icon: FiMapPin, label: "Address", v: store?.address },
            ]
              .filter((x) => x.v)
              .map(({ icon: Icon, label, v }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#000000]/10 text-[#000000]">
                    <Icon />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                    <p className="break-words text-slate-700">{v}</p>
                  </div>
                </div>
              ))}

            {!!socials.length && (
              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Follow us</div>
                <div className="flex gap-3">
                  {socials.map(({ icon: Icon, label, url }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#000000]/10 text-[#000000] transition hover:bg-[#000000] hover:text-white"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: form */}
        <form onSubmit={send} className={`${ui.card} space-y-4 p-6 md:p-8`}>
          <h2 className="text-xl font-bold text-slate-900">Send us a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className={ui.input} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className={ui.input} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone (optional)">
              <input className={ui.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Subject">
              <input className={ui.input} required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </Field>
          </div>
          <Field label="Message">
            <textarea className={`${ui.input} min-h-[140px]`} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </Field>
          {err && <Alert>{err}</Alert>}
          {msg && <Alert kind="ok">{msg}</Alert>}
          <button className={`${ui.btn} w-full sm:w-auto`} disabled={busy}>
            <FiSend /> {busy ? "Sending…" : "Send message"}
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
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
api
  .products(`?${qs}`)
  .then((d) => {
    setProducts(d.products);
    setMeta({ page: d.page, pages: d.pages, total: d.total });
  })
  .catch((e) => setErr(e.message))
  .finally(() => setLoading(false));
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

  const categoryName = categories?.find((c) => c.slug === category)?.name;

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:text-[#000000]">Home</Link> › <span className="text-slate-700">{categoryName || "Shop"}</span>
      </nav>
      <PageHeader title={categoryName || "Shop"} subtitle="Pick a product, add your text, and we print it for you." />
      <div className={`${ui.card} flex flex-wrap items-center gap-3 p-4`}>
        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${ui.input} pl-9`}
            placeholder="Search products"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && set("q", qInput)}
          />
        </div>
        <button className={ui.btn} type="button" onClick={() => set("q", qInput)}>
          <FiSearch /> Search
        </button>
        <select className={`${ui.input} w-full sm:w-auto`} value={category} onChange={(e) => set("category", e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select className={`${ui.input} w-full sm:w-auto`} value={sort} onChange={(e) => set("sort", e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
        <button className={ui.btnOutline} type="button" onClick={reset}>
          <FiRotateCcw /> Reset Filters
        </button>
        <span className="ml-auto text-sm font-medium text-slate-500">{meta.total} products</span>
      </div>
      {err && (
        <div className="mt-4">
          <Alert>{err}</Alert>
        </div>
      )}
      {loading ? (
  <PageLoader text="Loading products…" />
) : (
  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {products.map((p) => (
      <ProductCard key={p._id} product={p} />
    ))}
  </div>
)}
     {!loading && !products.length && !err && (
        <div className={`${ui.card} mt-8 flex flex-col items-center gap-2 p-12 text-center text-slate-500`}>
          <FiSearch className="text-3xl text-slate-300" />
          No products match these filters.
        </div>
      )}
      {meta.pages > 1 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: meta.pages }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" className={`${n === meta.page ? ui.btn : ui.btnOutline} min-w-[2.75rem] !px-3`} onClick={() => set("page", String(n))}>
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
  const [customNote, setCustomNote] = useState("");
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
 if (!product) return <PageLoader />;
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
      customNote: customNote.trim(),
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
      <div className={`${ui.card} h-fit overflow-hidden p-3 md:sticky md:top-28`}>
        <CustomPreview product={product} image={productImage} />
      </div>
      <div className={`${ui.card} h-fit p-6 md:p-8`}>
        {product.category?.name && <Badge tone="primary">{product.category.name}</Badge>}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">{product.name}</h1>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-[#000000]">{money(price)}</span>
          {product.salePrice && product.salePrice < product.price && (
            <span className="text-lg text-slate-400 line-through">{money(product.price)}</span>
          )}
        </div>
        <p className="mt-4 leading-relaxed text-slate-600">{product.description}</p>
        <div className="my-6 border-t border-slate-100" />
        <div className="space-y-5">
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
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      variant._id === colorVariantId
                        ? "border-[#000000] bg-[#000000]/5 text-[#000000] ring-2 ring-[#000000]/25"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
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
            <input className={ui.input} maxLength={max} value={text} onChange={(e) => setText(e.target.value)} />
            <p className="mt-1.5 text-xs text-slate-500">
              {text.length}/{max} characters · this text will be printed on your product
            </p>
          </Field>
          <Field label="Note (optional)">
  <textarea
    className={ui.input}
    rows={3}
    maxLength={300}
    value={customNote}
    onChange={(e) => setCustomNote(e.target.value)}
  />
  <p className="mt-1.5 text-xs text-slate-500">{customNote.length}/300 characters</p>
</Field>
          
          <Field label="Quantity">
            <input className={`${ui.input} max-w-28`} type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
        </div>
        {err && (
          <div className="mt-4">
            <Alert>{err}</Alert>
          </div>
        )}
        <button className={`${ui.btn} mt-6 w-full py-3.5 text-base`} onClick={add}>
          <FiShoppingCart /> Add to cart
        </button>
        <div className="mt-5 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <span className="flex items-center gap-2"><FiShield className="text-[#000000]" /> Payment confirmed by our team</span>
          <span className="flex items-center gap-2"><FiTruck className="text-[#000000]" /> Delivery across Pakistan</span>
        </div>
      </div>
    </div>
  );
}

export function CartPage() {
  const cart = useCart();
  return (
    <div>
      <PageHeader title="Cart" />
      {!cart.items.length && (
        <div className={`${ui.card} flex flex-col items-center gap-3 p-12 text-center`}>
          <FiShoppingBag className="text-4xl text-slate-300" />
          <p className="text-slate-600">Your cart is empty.</p>
          <Link className={ui.btn} to="/products">
            Continue shopping <FiArrowRight />
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {cart.items.map((it, i) => (
          <div key={`${it.productId}-${it.customText}-${i}`} className={`${ui.card} grid items-center gap-5 p-4 md:grid-cols-[160px_1fr_auto]`}>
            <CustomPreview product={{ name: it.name, preview: it.preview, images: [it.image] }} image={it.image} />
            <div className="space-y-1">
              <Link to={`/products/${it.slug}`} className="text-lg font-semibold text-slate-900 hover:text-[#000000]">
                {it.name}
              </Link>
              <p className="text-sm text-slate-500">Custom text: {it.customText || "—"}</p>
              {it.color && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  Color: <span className="inline-block h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: it.color.value }} />
                  {it.color.name}
                </p>
              )}
              <p className="font-semibold text-[#000000]">{money(it.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className={`${ui.input}`}
                type="number"
                min="1"
                value={it.quantity}
                onChange={(e) => cart.update(i, Number(e.target.value))}
              />
              <button className={`${ui.btnOutline} !px-3`} onClick={() => cart.remove(i)} aria-label="Remove item" title="Remove">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!!cart.items.length && (
        <div className="mt-8 flex justify-end">
          <Link to="/checkout" className={`${ui.btn} px-8 py-3.5 text-base`}>
            Checkout <FiArrowRight />
          </Link>
        </div>
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

  if (!cart.items.length) return <p className="py-20 text-center text-slate-500">Your cart is empty.</p>;

  return (
    <form onSubmit={place} className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className={`${ui.card} space-y-4 p-6 md:p-8`}>
        <h1 className={ui.pageTitle}>Checkout</h1>
        <p className="text-sm text-slate-500">Tell us where to deliver your order.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className={ui.input} required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </Field>
          <Field label="Mobile / WhatsApp">
            <input className={ui.input} required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <input className={ui.input} type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Province">
            <select className={ui.input} value={form.province} onChange={(e) => set("province", e.target.value)}>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <input className={ui.input} required value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
        </div>
        <Field label="Complete address">
          <textarea className={ui.input} required value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Nearby landmark">
          <input className={ui.input} value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
        </Field>
        <Field label="Order notes (optional)">
          <textarea className={ui.input} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
      <div className={`${ui.card} h-fit p-6 lg:sticky lg:top-28`}>
        <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {cart.items.map((i, idx) => (
            <li key={idx} className="py-3 text-slate-700">
              {i.quantity} × {i.name} — “{i.customText}”
              {i.color && <div className="text-slate-500">Color: {i.color.name}</div>}
            </li>
          ))}
        </ul>
        {quote && (
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-2 text-sm text-slate-600">
            <Row label="Subtotal" value={money(quote.subtotal)} />
            <Row label="Delivery" value={money(quote.deliveryFee)} />
            <Row label="Total" value={money(quote.total)} strong />
            <Row label="Advance due" value={money(quote.advanceAmount)} accent />
            <Row label="Remaining COD" value={money(quote.remainingCod)} />
          </div>
        )}
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <FiLock className="shrink-0" /> Final totals and shipping calculations will be updated securely upon placing your order.
        </p>
        {err && (
          <div className="mt-3">
            <Alert>{err}</Alert>
          </div>
        )}
        <button className={`${ui.btn} mt-5 w-full py-3.5 text-base`} disabled={busy}>
          <FiCheckCircle /> {busy ? "Placing order…" : "Place order"}
        </button>
      </div>
    </form>
  );
}

function OrderView({ order, whatsappUrl, title = "Order", showPayment = false }) {
  return (
    <div className="space-y-6">
      <div className={`${ui.card} p-6 md:p-8`}>
        <h1 className={ui.pageTitle}>{title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-600">
            Order <strong className="text-slate-900">{order.orderNumber}</strong>
          </span>
          <Badge tone="amber">{statusLabel(order.status)}</Badge>
          <Badge tone={order.paymentStatus === "verified" ? "green" : "slate"}>payment {statusLabel(order.paymentStatus)}</Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#000000]/5 p-4">
            <div className="text-xs font-medium text-slate-500">Advance due</div>
            <div className="text-2xl font-bold text-[#000000]">{money(order.advanceAmount)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">Remaining balance</div>
            <div className="text-2xl font-bold text-slate-900">{money(order.remainingCod)}</div>
          </div>
        </div>
        {showPayment && order.paymentDeadlineAt && order.paymentStatus !== "verified" && (
          <p className="mt-4 flex gap-2 text-sm text-slate-500">
            <FiClock className="mt-0.5 shrink-0" />
            <span>
              Pay before {new Date(order.paymentDeadlineAt).toLocaleString()}. Unpaid orders may be cancelled after the deadline. Verified or under-review payments are not auto-cancelled.
            </span>
          </p>
        )}
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
            <FiTruck /> Shipping
          </div>
          {order.courierName || order.trackingNumber ? (
            <p>
              {order.courierName || "Courier entered by store"} {order.trackingNumber ? `· ${order.trackingNumber}` : ""}
            </p>
          ) : (
            <p>Your order is currently being prepared with care. Tracking details will be updated here as soon as your package is dispatched.</p>
          )}
        </div>
        {whatsappUrl && (
          <a
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp className="text-lg" /> Chat on WhatsApp
          </a>
        )}
      </div>
      <div className={`${ui.card} p-6 md:p-8`}>
        <h2 className="text-lg font-bold text-slate-900">Items</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {order.items.map((i, idx) => (
            <div key={idx} className="grid gap-4 py-4 first:pt-0 sm:grid-cols-[140px_1fr]">
              <CustomPreview product={{ name: i.name, preview: i.preview, images: [i.image] }} image={i.image} />
              <div className="space-y-1 text-sm text-slate-700">
                {i.quantity} × {i.name} — “{i.customText}”
                {i.color && (
                  <div className="flex items-center gap-2 text-slate-500">
                    Color: <span className="inline-block h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: i.color.value }} />
                    {i.color.name}
                  </div>
                )}
                <div className="font-semibold text-slate-900">{money(i.lineTotal)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex flex-wrap justify-between gap-2">
            <span>Subtotal {money(order.subtotal)}</span>
            <span>Delivery {money(order.deliveryFee)}</span>
            <strong className="text-slate-900">Total {money(order.total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentSection({ order, payments, paymentAccounts, token }) {
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
    <div className={`${ui.card} p-6 md:p-8`}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <FiCreditCard className="text-[#000000]" /> Pay the advance
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Transfer PKR {order.advanceAmount} via JazzCash or Easypaisa, or select Cash on Delivery. Our team will verify your payment receipt shortly.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {paymentAccounts?.map((a) => (
          <div key={a.method} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="font-semibold text-slate-900">{a.method}</div>
            <div>{a.holderName}</div>
            <div className="font-mono">{a.accountNumber}</div>
            <div className="mt-1 text-slate-600">{a.instructions}</div>
          </div>
        ))}
      </div>
      {order.paymentStatus !== "verified" && order.status !== "cancelled" && (
        <form onSubmit={submit} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <Field label="Payment method">
            <select className={ui.input} value={method} onChange={(e) => setMethod(e.target.value)}>
              {paymentAccounts?.map((a) => (
                <option key={a.method}>{a.method}</option>
              ))}
            </select>
          </Field>
          {!isCod && (
            <Field label="Transaction / reference number">
              <input className={ui.input} required value={ref} onChange={(e) => setRef(e.target.value)} />
            </Field>
          )}
          {!isCod && (
            <Field label="Screenshot (JPEG, PNG or WebP, max 5MB)">
              <input
                className={`${ui.input} file:mr-3 file:rounded-md file:border-0 file:bg-[#000000]/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-[#000000]`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) => setFile(e.target.files?.[0])}
              />
            </Field>
          )}
          <Field label="Note (optional)">
            <input className={ui.input} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {err && <Alert>{err}</Alert>}
          {msg && <Alert kind="ok">{msg}</Alert>}
          <button className={ui.btn} disabled={busy}>
            {isCod ? <FiCheckCircle /> : <FiUpload />} {busy ? "Submitting…" : isCod ? "Submit COD request" : "Submit payment proof"}
          </button>
        </form>
      )}
      {payments?.length > 0 && (
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="mb-2 font-semibold text-slate-900">Submitted payments</div>
          {payments.map((p) => (
            <div key={p._id} className="py-0.5">
              {p.method} · {p.transactionRef} · {statusLabel(p.status)}
              {p.rejectionReason ? ` · ${p.rejectionReason}` : ""}
            </div>
          ))}
        </div>
      )}
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
  if (!data) return <PageLoader text="Loading your order…" />;
  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <OrderView {...data} title="Thank you" showPayment />
      <PaymentSection {...data} token={token} />
    </div>
  );
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
    <div className="mx-auto max-w-6xl">
      <div className={`${ui.card} p-6 md:p-8`}>
        <h1 className={ui.pageTitle}>Track Order</h1>
        <p className="mt-2 text-sm text-slate-600">Enter the order number and the email used at checkout.</p>
        <form onSubmit={go} className="mt-5 space-y-4">
          <Field label="Order number">
            <input className={ui.input} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={ui.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {err && <Alert>{err}</Alert>}
          <button className={ui.btn}>
            <FiSearch /> Look up
          </button>
        </form>
      </div>
      {data && (
        <div className="mt-8">
          <OrderView {...data} title="Your order" />
        </div>
      )}
    </div>
  );
}
export function Faq() {
  const { store } = useStore();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="FAQ" subtitle="Quick answers to common questions." />
      <div className="space-y-3">
        {store?.faqs?.map((f, i) => (
          <div key={i} className={`${ui.card} p-5`}>
            <div className="font-semibold text-slate-900">{f.question}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Policies() {
  const { store } = useStore();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Policies" />
      <div className="space-y-4">
        {[
          { icon: FiTruck, t: "Shipping", b: store?.policies?.shipping },
          { icon: FiRotateCcw, t: "Returns", b: store?.policies?.returns },
          { icon: FiShield, t: "Privacy", b: store?.policies?.privacy },
        ].map(({ icon: Icon, t, b }) => (
          <div key={t} className={`${ui.card} p-6`}>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Icon className="text-[#000000]" /> {t}
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{b}</p>
          </div>
        ))}
      </div>
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
    <div className={`${ui.card} mx-auto max-w-xl p-6 md:p-8`}>
      <h1 className="text-2xl font-extrabold text-slate-900">{mode === "login" ? "Welcome back" : "Create account"}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {mode === "login" ? "Sign in to see your orders." : "Register to track your orders easily."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "register" && (
          <>
            <Field label="Full name">
              <input className={ui.input} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className={ui.input} required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </>
        )}
        <Field label="Email">
          <input className={ui.input} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className={ui.input} type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        {err && <Alert>{err}</Alert>}
        <button className={`${ui.btn} w-full py-3`}>
          {mode === "login" ? <FiLogIn /> : <FiUserPlus />} {mode === "login" ? "Sign in" : "Register"}
        </button>
      </form>
      <button className="mt-5 w-full text-center text-sm font-medium text-[#000000] hover:underline" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
      </button>
    </div>
  );
}

function Spinner({ className = "h-5 w-5" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-[#000000]/20 border-t-[#000000] ${className}`}
    />
  );
}

function PageLoader({ text = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function AccountPage() {
  const { customer, setCustomer, ready } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true); 
  useEffect(() => {
    if (!ready) return;
    if (!customer) {
      nav("/login");
      return;
    }
   api
  .myOrders()
  .then((d) => setOrders(d.orders))
  .catch((e) => setErr(e.message))
  .finally(() => setLoadingOrders(false));
  }, [customer, ready, nav]);
  async function logout() {
    await api.logout();
    setCustomer(null);
    nav("/");
  }
  if (!customer) return <PageLoader />;
  return (
    <div className="mx-auto max-w-4xl">
      <div className={`${ui.card} flex flex-wrap items-center justify-between gap-4 p-6`}>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#000000] text-xl font-bold text-white">
            {(customer.fullName || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
            <p className="text-sm text-slate-600">
              {customer.fullName} · {customer.email}
            </p>
          </div>
        </div>
        <button className={ui.btnOutline} onClick={logout}>
          <FiLogOut /> Log out
        </button>
      </div>
      {err && (
        <div className="mt-4">
          <Alert>{err}</Alert>
        </div>
      )}
      <h2 className="mb-3 mt-10 text-xl font-bold text-slate-900">Your orders</h2>
{loadingOrders && <PageLoader text="Loading your orders…" />}
<div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className={`${ui.card} flex flex-wrap items-center justify-between gap-4 p-5 text-sm transition hover:border-[#000000]/40 hover:shadow-md`}>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                #{o.orderNumber}
                <Badge tone="amber">{statusLabel(o.status)}</Badge>
                <Badge tone={o.paymentStatus === "verified" ? "green" : "slate"}>payment {statusLabel(o.paymentStatus)}</Badge>
              </div>
              <div className="text-slate-600">
                {money(o.total)} · advance {money(o.advanceAmount)} · remaining {money(o.remainingCod)}
              </div>
            </div>
            <Link className="inline-flex items-center gap-1 font-medium text-[#000000] hover:underline" to="/order-lookup">
              Track with order number {o.orderNumber} and your email <FiArrowRight />
            </Link>
          </div>
        ))}
        {!orders.length && (
          <div className={`${ui.card} flex flex-col items-center gap-2 p-10 text-center text-slate-500`}>
            <FiPackage className="text-3xl text-slate-300" />
            No orders on this account yet.
          </div>
        )}
      </div>
    </div>
  );
}