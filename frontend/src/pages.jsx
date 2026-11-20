import { useEffect, useMemo, useState,useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import bannerImg from "./assets/banner.jpeg";
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
  FiStar,
  FiHelpCircle,
  FiChevronDown,
  FiMoreHorizontal,
  FiCheck,
FiX,
FiUser,
FiHome,
FiCalendar,
} from "react-icons/fi";
import { FaWhatsapp, FaFacebookF, FaInstagram } from "react-icons/fa";
import { api, asset, money, statusLabel } from "./api";
import { useAuth, useCart, useStore } from "./context";
import { Alert, CustomPreview, Field, ProductCard, ui } from "./components";
import { fetchGoogleFonts, loadGoogleFonts } from "./googleFonts";


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
  {
    icon: FiSearch,
    title: "Choose a Product",
    text: "Browse our Catalogue and choose your desired product.",
  },
  {
    icon: FiEdit3,
    title: "Add your text",
    text: "Type a name or a short message. The product page shows how many characters you can use.",
  },
  {
    icon: FiCreditCard,
    title: "Pay the advance",
    text: "Send Advance Through Easypaisa/Jazzcash or Bank Transfer then upload proof of transaction at given section. Every payment is confirmed manually.",
  },
  {
    icon: FiTruck,
    title: "We print and deliver",
    text: "Once Payment is confirmed, We Print Pack and Deliver at your door step.",
  },
];

const PAYMENT_STEPS = [
  {
    icon: FiCreditCard,
    title: "Payment",
    lines: [
      "Select COD: 50% will be paid in advance & 50% on Delivery.",
      "Select Bank Transfer: Full Payment will be paid in Advance.",
      "Note: Priority will be given to Full Advance Payment.",
    ],
  },
{
  icon: FiMoreHorizontal,
  title: "Payment Options",
  lines: [
    "Bank ~ Click to View Bank Details.",
    "Digital Wallet ~ Click to View Wallet Details.",
  ],
},
  {
    icon: FiUpload,
    title: "Upload Receipt",
    lines: [
      "Once Payment is Done upload your transaction receipt at the given option.",
    ],
  },
  {
    icon: FiShoppingBag,
    title: "Place Order",
    lines: ["Once Payment receipt is uploaded place your order."],
  },
  {
    icon: FiShield,
    title: "Payment Verification",
    lines: ["Our Team Will manually verify your payment."],
  },
  {
    icon: FiCheckCircle,
    title: "Order Complete",
    lines: [
      "Once your payment is Verified, Your order will be placed successfully.",
    ],
  },
];


const WHY = [
  {
    icon: FiStar, // Premium Quality
    title: "Premium Quality",
  },
  {
    icon: FiEdit3, // Personalized for you
    title: "Personalized for you",
  },
  {
    icon: FiEye, // Attention to Detail
    title: "Attention to Detail",
  },
  {
    icon: FiTruck, // Nationwide Delivery
    title: "Nationwide Delivery",
  },
];

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className={ui.pageTitle}>{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function SectionHead({ title, subtitle, to }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#000000] hover:underline"
        >
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
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Row({ label, value, strong, accent }) {
  return (
    <div
      className={`flex justify-between ${strong ? "border-t border-slate-200 pt-3 text-base font-bold text-slate-900" : ""} ${accent ? "font-semibold text-[#000000]" : ""}`}
    >
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
    <div className="">
 
<section className="relative left-1/2 -mt-[25px] w-screen -translate-x-1/2 sm:-mt-[41px] pb-5 sm:pb-8">
  <img
    src={bannerImg}
    alt="Banner"
    className="block h-auto w-full object-cover"
  />
</section>

      {/* Featured */}
      {!!featured?.length && (
        <section className="pb-5 sm:pb-8">
          <SectionHead
            title="New Release"
            subtitle="Hand-picked favourites from our collection."
            to="/products"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="pb-5 sm:pb-8">
        <SectionHead
          title="Shop by category"
          subtitle="Find the right item for every person and occasion."
          to="/products"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories?.map((c) => (
            <Link
              key={c._id}
              to={`/products?category=${c.slug}`}
              className={`${ui.card} group p-4 text-center transition hover:-translate-y-0.5 hover:border-[#000000]/40 hover:shadow-md sm:p-5`}
            >
              <div className="font-semibold text-slate-800 group-hover:text-[#000000]">
                {c.name}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                Shop now <FiArrowRight />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* <section>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500">
            From choosing a product to opening the parcel, ordering takes four
            simple steps.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`${ui.card} relative p-6`}>
              <span className="absolute right-5 top-4 text-4xl font-extrabold text-[#000000]">
                {i + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#000000]/10 text-xl text-[#000000]">
                <Icon />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section> */}

      {/* Bestsellers */}
      {!!bestsellers?.length && (
        <section className="pb-5 sm:pb-8">
          <SectionHead
            title="Bestsellers"
            subtitle="What most customers are ordering."
            to="/products"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

    {/* Why us */}
<section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8 md:p-12 mb-5 sm:mb-8">
  <div className="mb-8 sm:mb-10">
    <h2 className="text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
      Why customers choose us
    </h2>
  </div>
  <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
    {WHY.map(({ icon: Icon, title }) => (
      <div key={title} className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#000000] text-xl text-white">
          <Icon />
        </span>
        <h3 className="font-medium text-slate-900">{title}</h3>
      </div>
    ))}
  </div>
</section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#000000]/10 px-5 py-10 text-center shadow-sm sm:px-6 sm:py-12 md:px-12">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">
          Ready for Personalization?
        </h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link to="/products" className={`${ui.btn} w-full sm:w-auto`}>
            Start shopping <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}



const DIFFERENT_POINTS = [
  {
    title: "Personalization That Matters",
    text: "Make products truly yours with custom names, messages, and designs.",
  },
  {
    title: "Attention to Detail",
    text: "We focus on precision and presentation in every customization.",
  },
  {
    title: "Quality You Can Appreciate",
    text: "We aim to deliver products that look premium and feel special.",
  },
  {
    title: "For Every Occasion",
    text: "A personal gift, a memorable keepsake, or a corporate order, we have something meaningful to offer.",
  },
];


export function About() {
  const { store, featured } = useStore();

  const iconBox =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#000000] text-xl text-white";
  const cardTitle = "mt-4 text-lg font-bold text-slate-900 sm:text-xl";
  const cardText = "mt-2 text-sm leading-relaxed text-slate-600 sm:text-base";

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Intro */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#000000]/10 px-5 py-8 shadow-sm sm:px-6 sm:py-10 md:px-12 md:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#000000]/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl">
            {store?.about?.title || "About Craftagon"}
          </h1>
          <div className="mt-4 h-1 w-14 rounded-full bg-[#000000]" />
          <p className="mt-5 text-base font-semibold text-slate-900 sm:text-lg">
            At Craftagon, we believe that ordinary products can become
            extraordinary when they carry a personal touch.
          </p>
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-600">
              We are a Pakistan-based customization and gifting brand dedicated to turning everyday products into meaningful, personalized pieces. From customized pens and premium tumblers to personalized diaries, wallets, bottles, and corporate gifts, we bring creativity and precision together to make every product special.
          </p>
        </div>
      </section>

          {/* Top: 3 tall cards side by side */}
      <section className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {/* Vision */}
        <div className={`${ui.card} h-full p-5 sm:p-6 md:p-8`}>
          <span className={iconBox}>
            <FiEye />
          </span>
          <h2 className={cardTitle}>Our Vision</h2>
          <p className={cardText}>
            {store?.about?.vision ||
              "Our vision is to become Pakistan’s No. 1 customized printing and engraving brand, a name people remember whenever they think of personalization and gifting."}
          </p>
        </div>

        {/* Promise */}
        <div className={`${ui.card} h-full p-5 sm:p-6 md:p-8`}>
          <span className={iconBox}>
            <FiHeart />
          </span>
          <h2 className={cardTitle}>Our Promise</h2>
          <p className={cardText}>
            {store?.about?.mission ||
              "Every name has a story. Every gift has a meaning. And every detail matters."}
          </p>
        </div>

        {/* Individuals & Businesses */}
        <div className={`${ui.card} h-full p-5 sm:p-6 md:p-8`}>
          <span className={iconBox}>
            <FiGift />
          </span>
          <h2 className={cardTitle}>Individuals & Businesses</h2>
          <p className={cardText}>
            Whether you are looking for a unique gift for someone special or
            customized products for your company, Craftagon makes
            personalization simple and memorable. We proudly serve customers
            across Pakistan.
          </p>
        </div>
      </section>

      <section>
        <div className={`${ui.card} p-5 sm:p-6 md:p-8`}>
          <div className="flex items-center gap-4">
            <span className={iconBox}>
              <FiStar />
            </span>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">
              What Makes Craftagon Different?
            </h2>
          </div>

          <ul className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {DIFFERENT_POINTS.map(({ title, text }) => (
              <li
                key={title}
                className="flex h-full flex-col rounded-md border border-slate-200 bg-slate-50 p-4"
              >
                <span className="text-sm font-semibold text-slate-900 sm:text-base">
                  {title}
                </span>
                <span className="mt-2 text-sm leading-relaxed text-slate-600">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="flex justify-center pb-2 pt-2">
        <Link
          to="/products"
          className={`${ui.btn} w-full px-8 py-3.5 text-base sm:w-auto`}
        >
          Shop Now <FiArrowRight />
        </Link>
      </section>
    </div>
  );
}

export function HowToOrder() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="How to Order"
        subtitle="From choosing a product to opening the parcel, ordering takes four simple steps."
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className={`${ui.card} relative p-5 sm:p-6`}>
            <span className="absolute right-5 top-4 text-4xl font-extrabold text-[#000000]">
              {i + 1}
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#000000]/10 text-xl text-[#000000]">
              <Icon />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowPaymentWorks() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="How Payment Works"
        subtitle="The way your payment is Processed"
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {PAYMENT_STEPS.map(({ icon: Icon, title, lines }, i) => (
          <div key={title} className={`${ui.card} relative p-5 sm:p-6`}>
            <span className="absolute right-5 top-4 text-4xl font-extrabold text-[#000000]">
              {i + 1}
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#000000]/10 text-xl text-[#000000]">
              <Icon />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Help() {
  const { store } = useStore();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={store?.help?.title || "Help & Support"} />
      <p className="whitespace-pre-line text-slate-600">
        Need assistance with your order or payment? Simply enter your Order ID
        and email on the Track Order page, or reach out to us directly via
        Contact Us.
      </p>
      <div className={`${ui.card} space-y-4 p-4 text-sm text-slate-600 sm:p-6`}>
        <p className="flex gap-3">
          <FaWhatsapp className="mt-0.5 shrink-0 text-lg text-[#000000]" />
          Track your order online or contact us for assistance.
        </p>
        <p className="flex gap-3">
          <FiPackage className="mt-0.5 shrink-0 text-lg text-[#000000]" />
          Track an order with the Order ID and the email used at checkout.
        </p>
        <p className="flex gap-3">
          <FiCreditCard className="mt-0.5 shrink-0 text-lg text-[#000000]" />
          JazzCash/Easypaisa and Bank Transfer  need a screenshot and a transaction
          ID. COD is confirmed by staff, not automatically.
        </p>
        <Link className={`${ui.btn} w-full sm:w-auto`} to="/contact">
          <FiMail /> Contact us
        </Link>
      </div>
    </div>
  );
}

export function Contact() {
  const { store } = useStore();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const waNumber = (
    store?.whatsapp ||
    store?.whatsappNumber ||
    store?.phone ||
    ""
  )
    .replace(/\D/g, "")
    .replace(/^0/, "92");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello Craftagon, I have a question.")}`
    : "";

  const socials = [
    {
      icon: FaFacebookF,
      label: "Facebook",
      url: store?.socialLinks?.facebook || store?.facebook,
    },
    {
      icon: FaInstagram,
      label: "Instagram",
      url: store?.socialLinks?.instagram || store?.instagram,
    },
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
        message: form.subject
          ? `Subject: ${form.subject}\n\n${form.message}`
          : form.message,
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
      <PageHeader
        title="Contact Us"
        subtitle="Questions about an order or a custom design? Send us a message or chat with us on WhatsApp."
      />
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="min-w-0 space-y-6">
          {waUrl && (
            <div className={`${ui.card} p-4 sm:p-6`}>
              <h2 className="text-lg font-bold text-slate-900">
                Prefer a quick chat?
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Message us on WhatsApp and we will reply as soon as we can.
              </p>
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

          <div className={`${ui.card} space-y-5 p-4 text-slate-600 sm:p-6`}>
            {[
              { icon: FiMail, label: "Email", v: store?.email },
              { icon: FiPhone, label: "Phone", v: store?.phone },
              { icon: FiMapPin, label: "Address", v: store?.address },
            ]
              .filter((x) => x.v)
              .map(({ icon: Icon, label, v }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#000000]/10 text-[#000000]">
                    <Icon />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </div>
                    <p className="break-words text-slate-700">{v}</p>
                  </div>
                </div>
              ))}

            {!!socials.length && (
              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Follow us
                </div>
                <div className="flex flex-wrap gap-3">
                  {socials.map(({ icon: Icon, label, url }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                      className="flex h-11 w-11 items-center justify-center rounded-md bg-[#000000]/10 text-[#000000] transition hover:bg-[#000000] hover:text-white sm:h-10 sm:w-10"
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
        <form
          onSubmit={send}
          className={`${ui.card} min-w-0 space-y-4 p-4 sm:p-6 md:p-8`}
        >
          <h2 className="text-xl font-bold text-slate-900">
            Send us a message
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className={ui.input}
                required
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className={ui.input}
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone (optional)">
              <input
                className={ui.input}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Subject">
              <input
                className={ui.input}
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Message">
            <textarea
              className={`${ui.input} min-h-[140px] resize-y`}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </Field>
          {err && <Alert>{err}</Alert>}
          {msg && <Alert kind="ok">{msg}</Alert>}
          <button
            className={`${ui.btn} w-full justify-center sm:w-auto`}
            disabled={busy}
          >
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
        <Link to="/" className="hover:text-[#000000]">
          Home
        </Link>{" "}
        › <span className="text-slate-700">{categoryName || "Shop"}</span>
      </nav>
      <PageHeader
        title={categoryName || "Shop"}
        subtitle="Pick a product, add your text, and we print it for you."
      />
      <div className={`${ui.card} flex flex-wrap items-center gap-3 p-3 sm:p-4`}>
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
        <button
          className={`${ui.btn} w-full sm:w-auto`}
          type="button"
          onClick={() => set("q", qInput)}
        >
          <FiSearch /> Search
        </button>
        <select
          className={`${ui.input} w-full sm:w-auto`}
          value={category}
          onChange={(e) => set("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={`${ui.input} w-full sm:w-auto`}
          value={sort}
          onChange={(e) => set("sort", e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
        <button
          className={`${ui.btnOutline} w-full sm:w-auto`}
          type="button"
          onClick={reset}
        >
          <FiRotateCcw /> Reset Filters
        </button>
        <span className="w-full text-sm font-medium text-slate-500 sm:ml-auto sm:w-auto">
          {meta.total} products
        </span>
      </div>
      {err && (
        <div className="mt-4">
          <Alert>{err}</Alert>
        </div>
      )}
      {loading ? (
        <PageLoader text="Loading products…" />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
      {!loading && !products.length && !err && (
        <div
          className={`${ui.card} mt-8 flex flex-col items-center gap-2 p-8 text-center text-slate-500 sm:p-12`}
        >
          <FiSearch className="text-3xl text-slate-300" />
          No products match these filters.
        </div>
      )}
      {meta.pages > 1 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: meta.pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`${n === meta.page ? ui.btn : ui.btnOutline} min-w-[2.75rem] !px-3`}
              onClick={() => set("page", String(n))}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CUSTOM_FONTS = [
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Oswald", value: "'Oswald', sans-serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Roboto Slab", value: "'Roboto Slab', serif" },
  { label: "Cinzel", value: "'Cinzel', serif" },
  { label: "Lobster", value: "'Lobster', cursive" },
  { label: "Pacifico", value: "'Pacifico', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Satisfy", value: "'Satisfy', cursive" },
  { label: "Courgette", value: "'Courgette', cursive" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "Permanent Marker", value: "'Permanent Marker', cursive" },
];

export function ProductDetail() {
  const { slug } = useParams();
  const cart = useCart();

  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviewData, setReviewData] = useState({
    summary: { average: 0, count: 0 },
    reviews: [],
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [text, setText] = useState("");
  const [qty, setQty] = useState(1);
  const [colorVariantId, setColorVariantId] = useState("");
  const [productError, setProductError] = useState("");
  const [customTextError, setCustomTextError] = useState("");
  const [err, setErr] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [fontOpen, setFontOpen] = useState(false);
const fontBoxRef = useRef(null);
  const [fontLabel, setFontLabel] = useState(CUSTOM_FONTS[0].label);

  // Google Fonts (API fail ho to CUSTOM_FONTS fallback chalega)
  const [fonts, setFonts] = useState(CUSTOM_FONTS);

  useEffect(() => {
    api
      .product(slug)
      .then((d) => {
        setProduct(d.product);
        setColorVariantId(d.product.colorVariants?.[0]?._id || "");
      })
      .catch((e) => setProductError(e.message));
  }, [slug]);

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    setReviewsError("");
    setReviewData({ summary: { average: 0, count: 0 }, reviews: [] });
    api
      .productReviews(slug)
      .then((data) => {
        if (active) setReviewData(data);
      })
      .catch((e) => {
        if (active) setReviewsError(e.message);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // Google Fonts list fetch
  useEffect(() => {
    let active = true;
    fetchGoogleFonts()
      .then((list) => {
        if (active && list.length) setFonts(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

useEffect(() => {
  loadGoogleFonts([fontLabel]);
}, [fontLabel]);

useEffect(() => {
  function onClickOutside(e) {
    if (fontBoxRef.current && !fontBoxRef.current.contains(e.target)) {
      setFontOpen(false);
    }
  }
  document.addEventListener("mousedown", onClickOutside);
  return () => document.removeEventListener("mousedown", onClickOutside);
}, []);

  if (productError) return <Alert>{productError}</Alert>;
  if (!product) return <PageLoader />;

  const selectedFont = fonts.find((f) => f.label === fontLabel) || fonts[0];
  const price =
    product.salePrice && product.salePrice < product.price
      ? product.salePrice
      : product.price;
  const max = product.customization?.maxLength || 24;
  const colorVariants = product.colorVariants || [];
  const selectedColor = colorVariants.find(
    (variant) => variant._id === colorVariantId,
  );
  const productImage = selectedColor?.image || product.images?.[0];

  function add() {
    const customText = text.trim();

    setCustomTextError("");
    setErr("");

    if (
      product.customization?.enabled !== false &&
      product.customization?.required !== false &&
      !customText
    ) {
      setCustomTextError("Please enter Name or Short Message");
      return;
    }

    if (customText.length > max) {
      setCustomTextError(`Text must be at most ${max} characters`);
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
      customFont: selectedFont.label,
      notes: product.notes || "",
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
    <div className="space-y-10 sm:space-y-12">
      <div className="grid gap-6 sm:gap-10 md:grid-cols-2">
        <div
          className={`${ui.card} h-fit overflow-hidden p-3 md:sticky md:top-28`}
        >
          <CustomPreview
            product={product}
            image={productImage}
            fontFamily={selectedFont.value}
          />
        </div>
        <div className={`${ui.card} h-fit p-4 sm:p-6 md:p-8`}>
          {product.category?.name && (
            <Badge tone="primary">{product.category.name}</Badge>
          )}
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-[#000000] sm:text-3xl">
              {money(price)}
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-base text-slate-400 line-through sm:text-lg">
                {money(product.price)}
              </span>
            )}
          </div>
          <p className="mt-4 leading-relaxed text-slate-600">
            {product.description}
          </p>
          {product.notes && (
            <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              <p className="mb-1 font-semibold text-slate-900">Product notes</p>
              <p className="whitespace-pre-wrap">{product.notes}</p>
            </div>
          )}
          <div className="my-6" />
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
                      <span
                        className="h-5 w-5 rounded-full border border-slate-300"
                        style={{ backgroundColor: variant.value }}
                      />
                      {variant.name}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <Field label="Name or Short Message">
              <input
                className={`${ui.input} ${
                  customTextError ? "border-red-500 focus:border-red-500" : ""
                }`}
                maxLength={max}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setCustomTextError("");
                }}
              />

              {customTextError && (
                <p className="mt-1.5 text-sm font-medium text-red-600">
                  {customTextError}
                </p>
              )}

              <p className="mt-1.5 text-xs text-slate-500">
                {text.length}/{max} characters · this text will be printed on
                your product
              </p>
            </Field>

            {product.customization?.enabled !== false && (
              <div className="space-y-4">
                {/* Live preview */}
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Text preview
                  </p>
                  <p
                    className="mt-3 min-h-[3rem] break-words text-center text-3xl leading-snug text-slate-900"
                    style={{ fontFamily: selectedFont.value }}
                  >
                    {text || "Your text here"}
                  </p>
                </div>
{/* Font options */}
<div ref={fontBoxRef} className="relative">
  <p className="mb-2 text-sm font-medium text-slate-700">Font style</p>
  <button
    type="button"
    aria-expanded={fontOpen}
    onClick={() => setFontOpen((o) => !o)}
    className={`${ui.input} flex items-center justify-between text-left`}
  >
    <span>{fontLabel}</span>
    <FiChevronDown
      className={`shrink-0 text-slate-500 transition ${fontOpen ? "rotate-180" : ""}`}
    />
  </button>

  {fontOpen && (
    <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
      {fonts.map((f) => (
        <li key={f.label}>
          <button
            type="button"
            onClick={() => {
              setFontLabel(f.label);
              setFontOpen(false);
            }}
            className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 ${
              f.label === fontLabel ? "bg-slate-100 font-semibold" : ""
            }`}
          >
            {f.label}
          </button>
        </li>
      ))}
    </ul>
  )}
</div>
              </div>
            )}

            <Field label="Note (optional)">
              <textarea
                className={ui.input}
                rows={3}
                maxLength={300}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                {customNote.length}/300 characters
              </p>
            </Field>

            <Field label="Quantity">
              <input
                className={`${ui.input} max-w-28`}
                type="number"
                min="1"
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </Field>
          </div>
          {err && (
            <div className="mt-4">
              <Alert>{err}</Alert>
            </div>
          )}
          <button
            className={`${ui.btn} mt-6 w-full py-3.5 text-base`}
            onClick={add}
          >
       Add to cart
          </button>
          <div className="mt-5 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <FiShield className="text-[#000000]" /> Payment confirmed by our
              team
            </span>
            <span className="flex items-center gap-2">
              <FiTruck className="text-[#000000]" /> Delivery across Pakistan
            </span>
          </div>
        </div>
      </div>
      <section aria-labelledby="reviews-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="reviews-heading"
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl"
            >
              Customer reviews
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Feedback from customers who ordered this product.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
            <span className="text-3xl font-bold text-slate-900">
              {reviewData.summary.average.toFixed(1)}
            </span>
            <span>
              <span
                className="flex text-amber-400"
                aria-label={`${reviewData.summary.average} out of 5 stars`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={
                      star <= Math.round(reviewData.summary.average)
                        ? "fill-current"
                        : ""
                    }
                  />
                ))}
              </span>
              <span className="text-xs text-slate-500">
                {reviewData.summary.count}{" "}
                {reviewData.summary.count === 1 ? "review" : "reviews"}
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {reviewsError && <Alert>{reviewsError}</Alert>}
          {reviewsLoading ? (
            <div className={`${ui.card} p-6 text-sm text-slate-500`}>
              Loading reviews…
            </div>
          ) : reviewData.reviews.length ? (
            reviewData.reviews.map((review) => (
              <article key={review._id} className={`${ui.card} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {review.customerName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {review.verifiedPurchase && (
                        <span className="mr-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                          Verified Purchase
                        </span>
                      )}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="flex text-amber-400"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={star <= review.rating ? "fill-current" : ""}
                      />
                    ))}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  {review.title}
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {review.comment}
                </p>
              </article>
            ))
          ) : reviewsError ? null : (
            <div className={`${ui.card} p-6 text-sm text-slate-500`}>
              No reviews yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function ReviewSubmission() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .reviewInvitation(token)
      .then(({ invitation: data }) => {
        if (active) setInvitation(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.submitProductReview(token, { rating, title, comment });
      setMessage(
        "Thank you. Your review has been submitted and is awaiting approval.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error && !invitation)
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Alert>{error}</Alert>
      </div>
    );
  if (!invitation) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Review your purchase"
        subtitle={`Order ${invitation.orderNumber}`}
      />
      <div className={`${ui.card} mb-6 flex items-center gap-4 p-4`}>
        {invitation.product.image && (
          <img
            src={asset(invitation.product.image)}
            alt={invitation.product.name}
            loading="lazy"
            className="h-20 w-20 rounded-lg object-cover"
          />
        )}
        <div>
          <h2 className="font-semibold text-slate-900">
            {invitation.product.name}
          </h2>
          <Link
            className="mt-1 inline-flex text-sm font-medium text-[#000000] hover:underline"
            to={`/products/${invitation.product.slug}`}
          >
            View product
          </Link>
        </div>
      </div>
      {message ? (
        <Alert kind="ok">{message}</Alert>
      ) : (
        <form className={`${ui.card} space-y-5 p-5 sm:p-6`} onSubmit={submit}>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Your rating
            </legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  aria-pressed={rating === star}
                  onClick={() => setRating(star)}
                  className="rounded p-1 text-2xl text-amber-400 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <FiStar className={star <= rating ? "fill-current" : ""} />
                </button>
              ))}
            </div>
          </fieldset>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="review-title"
          >
            Review title
            <input
              id="review-title"
              className={`${ui.input} mt-1.5`}
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="review-comment"
          >
            Your review
            <textarea
              id="review-comment"
              className={`${ui.input} mt-1.5 min-h-32`}
              required
              minLength={10}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think about this product?"
            />
          </label>
          {error && <Alert>{error}</Alert>}
          <button className={`${ui.btn} w-full`} disabled={busy}>
            <FiStar /> {busy ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}

export function CartPage() {
  const cart = useCart();
  useEffect(() => {
    loadGoogleFonts(cart.items.map((i) => i.customFont).filter(Boolean));
  }, [cart.items]);
  return (
    <div>
      <PageHeader title="Cart" />
      {!cart.items.length && (
        <div
          className={`${ui.card} flex flex-col items-center gap-3 p-8 text-center sm:p-12`}
        >
          <FiShoppingBag className="text-4xl text-slate-300" />
          <p className="text-slate-600">Your cart is empty.</p>
          <Link className={ui.btn} to="/products">
            Continue shopping <FiArrowRight />
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {cart.items.map((it, i) => (
          <div
            key={`${it.productId}-${it.customText}-${i}`}
            className={`${ui.card} grid grid-cols-[96px_1fr] items-center gap-4 p-3 sm:p-4 md:grid-cols-[160px_1fr_auto] md:gap-5`}
          >
            <CustomPreview
              product={{
                name: it.name,
                preview: it.preview,
                images: [it.image],
              }}
              image={it.image}
              fontFamily={it.customFont ? `'${it.customFont}', cursive` : undefined}
            />
            <div className="min-w-0 space-y-1">
              <Link
                to={`/products/${it.slug}`}
                className="text-base font-semibold text-slate-900 hover:text-[#000000] sm:text-lg"
              >
                {it.name}
              </Link>
              <p className="break-words text-sm text-slate-500">
                Name or Short Message: {it.customText || "—"}
              </p>
              {it.notes && (
                <p className="whitespace-pre-wrap break-words text-sm text-slate-500">
                  Product notes: {it.notes}
                </p>
              )}
              {it.customNote && (
  <p className="whitespace-pre-wrap break-words text-sm text-slate-500">
    Note: {it.customNote}
  </p>
)}
              {it.customFont && (
                <p className="text-sm text-slate-500">
                  Font:{" "}
                  <span style={{ fontFamily: `'${it.customFont}', cursive` }}>
                    {it.customFont}
                  </span>
                </p>
              )}
              {it.color && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  Color:{" "}
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: it.color.value }}
                  />
                  {it.color.name}
                </p>
              )}
              <p className="font-semibold text-[#000000]">{money(it.price)}</p>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-1">
              <input
                className={`${ui.input} !w-20`}
                type="number"
                min="1"
                value={it.quantity}
                onChange={(e) => cart.update(i, Number(e.target.value))}
              />
              <button
                className={`${ui.btnOutline} !px-3`}
                onClick={() => cart.remove(i)}
                aria-label="Remove item"
                title="Remove"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!!cart.items.length && (
        <div className="mt-8 flex justify-end">
          <Link
            to="/checkout"
            className={`${ui.btn} w-full px-8 py-3.5 text-base sm:w-auto`}
          >
            Checkout <FiArrowRight />
          </Link>
        </div>
      )}
    </div>
  );
}

const isBankAccount = (a) => /bank/i.test(a.method);
const AUTO_HIDE_MS = 5000; 

export function Checkout() {
  const cart = useCart();
  const { customer } = useAuth();
  const { store } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    province: "Punjab",
    city: "",
    address: "",
    landmark: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer"); // "cod" | "bank_transfer"
  const [accountMethod, setAccountMethod] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [couponErr, setCouponErr] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [openGroup, setOpenGroup] = useState("");

  const paymentAccounts = useMemo(
    () =>
      (store?.paymentAccounts || []).filter(
        (a) =>
          a.active !== false &&
          !/^cod$/i.test(a.method) &&
          !/cash on delivery/i.test(a.method),
      ),
    [store],
  );

  const paymentGroups = [
  { key: "bank", label: "Bank", accounts: paymentAccounts.filter(isBankAccount) },
  {
    key: "wallet",
    label: "Digital Wallet",
    accounts: paymentAccounts.filter((a) => !isBankAccount(a)),
  },
].filter((g) => g.accounts.length);

function toggleGroup(g) {
  if (openGroup === g.key) {
    setOpenGroup("");
    return;
  }
  // agar selected account is group ka nahi hai to is group ka pehla account select karo
  if (!g.accounts.some((a) => a.method === accountMethod)) {
    setAccountMethod(g.accounts[0].method);
  }
  setOpenGroup(g.key);
}

  useEffect(() => {
  if (!openGroup) return;
  const t = setTimeout(() => setOpenGroup(""), AUTO_HIDE_MS);
  return () => clearTimeout(t);
}, [openGroup, accountMethod]);
const items = useMemo(
  () =>
    cart.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      customText: i.customText,
      ...(i.customFont ? { customFont: i.customFont } : {}),
      ...(i.customNote ? { customNote: i.customNote } : {}),
      ...(i.colorVariantId ? { colorVariantId: i.colorVariantId } : {}),
    })),
  [cart.items],
);

  useEffect(() => {
    loadGoogleFonts(cart.items.map((i) => i.customFont).filter(Boolean));
  }, [cart.items]);

  useEffect(() => {
    if (customer) {
      const [first = "", ...rest] = (customer.fullName || "").split(" ");
      setForm((f) => ({
        ...f,
        firstName: f.firstName || first,
        lastName: f.lastName || rest.join(" "),
        email: f.email || customer.email || "",
        phone: f.phone || customer.phone || "",
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (paymentAccounts.length && !accountMethod)
      setAccountMethod(paymentAccounts[0].method);
  }, [paymentAccounts, accountMethod]);

  useEffect(() => {
    if (!items.length) return;
    api
      .quote({
        items,
        city: form.city,
        province: form.province,
        couponCode: appliedCode || undefined,
        paymentOption: paymentMethod,
      })
      .then((d) => {
        setQuote(d);
        setErr("");
      })
      .catch((e) => {
        setQuote(null);
        setErr(e.message);
      });
  }, [items, form.city, form.province, appliedCode, paymentMethod]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponErr("");
    try {
      // Check the code first so an invalid code does not break the whole quote
      const quoteResult = await api.quote({
        items,
        city: form.city,
        province: form.province,
        couponCode: code,
        paymentOption: paymentMethod,
      });
      setAppliedCode(quoteResult.couponCode || code.toUpperCase());
    } catch (e) {
      setCouponErr(e.message);
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setAppliedCode("");
    setCouponInput("");
    setCouponErr("");
  }

  async function place(e) {
    e.preventDefault();
    if (busy) return;
    if (paymentAccounts.length && !screenshot) {
      setErr("Please upload your payment screenshot");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const key = crypto.randomUUID();
      const { firstName, lastName, ...rest } = form;
      const data = await api.createOrder({
        idempotencyKey: key,
        items,
        customer: { ...rest, fullName: `${firstName} ${lastName}`.trim() },
        paymentMethod,
        couponCode: appliedCode || undefined,
      });
      const token = data.order.lookupToken;

      if (paymentAccounts.length) {
        try {
          const fd = new FormData();
          fd.append("orderNumber", data.order.orderNumber);
          fd.append("token", token);
          fd.append("method", accountMethod);
          fd.append("transactionRef", txnRef);
          fd.append(
            "customerNote",
            paymentMethod === "bank_transfer"
              ? "Full payment"
              : "Advance payment",
          );
          fd.append("screenshot", screenshot);
          await api.submitPayment(fd);
        } catch {
          // Order is already created. Thank You page will show the payment form as a fallback.
        }
      }

      cart.clear();
      nav(`/thank-you/${data.order.orderNumber}?token=${token}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!cart.items.length)
    return (
      <p className="py-20 text-center text-slate-500">Your cart is empty.</p>
    );

  const isCod = paymentMethod === "cod";
  const advance = quote ? (isCod ? quote.advanceAmount : quote.total) : 0;
  const remaining = quote ? (isCod ? quote.remainingCod : 0) : 0;
  const advancePct =
    quote && quote.total
      ? Math.round((quote.advanceAmount / quote.total) * 100)
      : null;
  const selectedAccount = paymentAccounts.find(
    (a) => a.method === accountMethod,
  );

  // text-base on mobile (16px) stops iOS Safari from zooming on focus
  const inp =
    "w-full rounded-md border border-slate-300 bg-white px-3.5 py-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#000000] focus:outline-none focus:ring-2 focus:ring-[#000000]/20";
  const optionBase =
    "flex cursor-pointer items-center gap-3 px-4 py-4 text-sm font-semibold text-slate-900";

  return (
    <form
      onSubmit={place}
      className="grid items-start gap-6 sm:gap-8 lg:grid-cols-[1.3fr_1fr]"
    >
      <div className={`${ui.card} space-y-6 p-4 sm:p-6 md:p-8`}>
        <h1 className={ui.pageTitle}>Checkout</h1>

        {/* Contact */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
            {!customer && (
              <Link
                to="/login"
                className="text-sm text-slate-700 underline hover:text-[#000000]"
              >
                Sign in
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              className={`${inp} pr-10`}
              type="email"
              required
              placeholder="Email or mobile phone number"
              aria-label="Email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <FiHelpCircle className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
          {/* UI only, backend ko nahi ja raha */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded accent-black"
            />
            Email me with news and offers
          </label>
        </section>

        {/* Delivery */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Shipping</h2>

          <div className="relative rounded-md border border-slate-300 bg-white px-3.5 py-2">
            <div className="text-xs text-slate-500">Country/Region</div>
            <div className="text-sm text-slate-900">Pakistan</div>
            <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={inp}
              required
              placeholder="First name"
              aria-label="First name"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
            <input
              className={inp}
              required
              placeholder="Last name"
              aria-label="Last name"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>

          <input
            className={inp}
            required
            placeholder="Address"
            aria-label="Complete address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />

          <input
            className={inp}
            placeholder="Nearby landmark (optional)"
            aria-label="Nearby landmark"
            value={form.landmark}
            onChange={(e) => set("landmark", e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={inp}
              required
              placeholder="City"
              aria-label="City"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <div className="relative">
              <select
                className={`${inp} appearance-none pr-10`}
                aria-label="Province"
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
              >
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div className="relative">
            <input
              className={`${inp} pr-10`}
              required
              placeholder="Phone (Mobile / WhatsApp)"
              aria-label="Mobile / WhatsApp"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <FiHelpCircle className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          <textarea
            className={inp}
            placeholder="Order notes (optional)"
            aria-label="Order notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />

          {/* UI only, backend ko nahi ja raha */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
            <input type="checkbox" className="h-4 w-4 rounded accent-black" />
            Save this information for next time
          </label>
        </section>

        {/* Shipping method */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Shipping method</h2>
          <div className="flex items-center justify-between rounded-lg border border-[#000000] bg-slate-100 px-4 py-4 text-sm">
            <div>
              <div className="font-semibold text-slate-900">Standard</div>
              <div className="text-slate-600">4 to 6 business days</div>
            </div>
            <div className="font-semibold text-slate-900">
              {quote ? money(quote.deliveryFee) : "—"}
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payment</h2>
            <p className="text-sm text-slate-500">
              All transactions are secure and encrypted.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-300">
            <label
              className={`${optionBase} ${isCod ? "bg-slate-50" : "bg-white"}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                className="h-4 w-4 appearance-none rounded-full border border-slate-400 checked:border-black checked:bg-accent-black checked:bg-[radial-gradient(circle,_#000000_40%,_transparent_50%)]"
                checked={isCod}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on Delivery (COD)
            </label>
            {isCod && (
              <div className="space-y-3 border-t border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <p>
                  As per our criteria {advancePct ? `${advancePct}%` : "an"}  will be paid in 
                  advance and
                  remaining {advancePct ? `${advancePct}%` : "an"}  on delivery.
                </p>
                <p> Note:Priority will be 
                  given to full advance payment.</p>
                {quote && (
                  <div className="space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <Row
                      label="Advance to pay "
                      value={money(advance)}
                      accent
                    />
                    <Row
                      label="on delivery"
                      value={money(remaining)}
                    />
                  </div>
                )}
              </div>
            )}

            <label
              className={`${optionBase} border-t border-slate-200 ${!isCod ? "bg-slate-100" : "bg-white"}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                className="h-4 w-4 appearance-none rounded-full border border-slate-400 checked:border-green-600 checked:bg-[radial-gradient(circle,_#22c55e_40%,_transparent_50%)]"
                checked={!isCod}
                onChange={() => setPaymentMethod("bank_transfer")}
              />
              Bank Transfer
            </label>
            {!isCod && (
              <div className="space-y-3 border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p>
                  As per our criteria full payment will be paid in advance.
                </p>
                {quote && (
                  <div className="space-y-1 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <Row
                      label="Payment to Pay"
                      value={money(advance)}
                      accent
                    />
                    <p className="text-green-600 text-xs">
                      Ya! Your order will get priority.
                    </p>
                    <Row
                      label="Remaining on delivery"
                      value={money(remaining)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment details (advance / full payment proof) */}
       {!!paymentAccounts.length && (
  <div className="space-y-4 rounded-lg border border-slate-200 p-3 sm:p-4">
    <div>
      <h3 className="text-sm font-bold text-slate-900">Payment Options</h3>
      <p className="text-sm text-slate-500">
        Choose your desired Payment Option
      </p>
    </div>

    {/* Bank / Digital Wallet buttons */}
    <div className="grid grid-cols-2 gap-3">
      {paymentGroups.map((g) => {
        const isOpen = openGroup === g.key;
        const isSelected = g.accounts.some((a) => a.method === accountMethod);
        return (
          <button
            key={g.key}
            type="button"
            aria-expanded={isOpen}
            onClick={() => toggleGroup(g)}
            className={`rounded-xl border px-4 py-4 text-sm font-semibold transition ${
              isOpen
                ? "border-[#000000] bg-[#000000] text-white"
                : isSelected
                  ? "border-[#000000] bg-slate-100 text-slate-900"
                  : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
            }`}
          >
            {g.label}
          </button>
        );
      })}
    </div>

    {paymentGroups
      .filter((g) => g.key === openGroup)
      .map((g) => (
        <div key={g.key} className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Send {quote ? money(advance) : "the amount"} to{" "}
            {g.accounts.length > 1 ? "one of these accounts" : "this account"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.accounts.map((a) => (
              <label
                key={a.method}
                className={`cursor-pointer rounded-lg border p-3 text-sm ${
                  accountMethod === a.method
                    ? "border-[#000000] bg-slate-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <input
                    type="radio"
                    name="accountMethod"
                    className="h-4 w-4 appearance-none rounded-full border border-slate-400 checked:border-black checked:bg-accent-black checked:bg-[radial-gradient(circle,_#000000_40%,_transparent_50%)]"
                    checked={accountMethod === a.method}
                    onChange={() => setAccountMethod(a.method)}
                  />
                  {a.method}
                </div>
                <div className="mt-1 text-slate-700">{a.holderName}</div>
                <div className="break-all font-mono text-slate-900">
                  {a.accountNumber}
                </div>
                {a.instructions && (
                  <div className="mt-1 text-xs text-slate-500">
                    {a.instructions}
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}

    <div>
      <label className="mb-0.5 block text-sm font-medium text-slate-700">
        Attach Receipt (JPEG, PNG or WebP, max 5MB)
      </label>
      <p className="text-xs text-slate-500 mb-1.5">
        Upload  your transaction receipt below
      </p>
      <input
        className={`${ui.input} file:mr-3 file:rounded-md file:border-0 file:bg-[#000000]/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-[#000000]`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
      />
    </div>
        <input
      className={inp}
      required
      placeholder="Transaction / reference number"
      aria-label="Transaction reference number"
      value={txnRef}
      onChange={(e) => setTxnRef(e.target.value)}
    />
  </div>
)}
        </section>

        {err && <Alert>{err}</Alert>}

        <div>
          <button
            className={`${ui.btn} w-full py-4 text-base uppercase tracking-wide`}
            disabled={busy}
          >
            {busy ? "Placing order…" : "Place order"}
          </button>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
            <FiShield className="shrink-0" /> Your information is protected
          </p>
        </div>
      </div>

      {/* Right: order summary */}

      <div className="h-fit rounded-md border border-slate-200 bg-white p-4 sm:p-6 lg:sticky lg:top-28">
        <ul className="space-y-4">
          {cart.items.map((i, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <div className="relative h-16 w-16 shrink-0">
                <div className="h-full w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {i.image && (
                    <img
                      src={asset(i.image)}
                      alt={i.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-semibold text-white">
                  {i.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-snug text-slate-900">
                  {i.name}
                </div>
                {i.color && (
                  <div className="text-xs text-slate-500">{i.color.name}</div>
                )}
                {i.customText && (
                  <div className="mt-1 inline-block max-w-full break-words rounded-md bg-white px-2 py-0.5 text-xs text-slate-700 shadow-sm">
                    Text to Print: “{i.customText}”
                  </div>
                )}
                {i.customFont && (
                  <div className="mt-1 text-xs text-slate-600">
                    Font:{" "}
                    <span style={{ fontFamily: `'${i.customFont}', cursive` }}>
                      {i.customFont}
                    </span>
                  </div>
                )}
                {i.notes && (
                  <div className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-600">
                    Product notes: {i.notes}
                  </div>
                )}
                {i.customNote && (
  <div className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-600">
    Note: {i.customNote}
  </div>
)}
              </div>
              <div className="shrink-0 text-slate-900">
                {money(i.price * i.quantity)}
              </div>
            </li>
          ))}
        </ul>

        {/* Discount code */}
        <div className="mt-5">
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              <span className="flex items-center gap-2 font-semibold">
                <FiTag /> {appliedCode} applied
              </span>
              <button
                type="button"
                className="text-xs font-semibold underline"
                onClick={removeCoupon}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                className={`${inp} pr-24`}
                placeholder="Discount code"
                aria-label="Discount code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition enabled:hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={couponBusy || !couponInput.trim()}
                onClick={applyCoupon}
              >
                {couponBusy ? "…" : "Apply"}
              </button>
            </div>
          )}
          {couponErr && (
            <p className="mt-2 text-xs text-red-600">{couponErr}</p>
          )}
        </div>

        {quote && (
          <div className="mt-6 space-y-2 text-sm text-slate-700">
            <Row label="Subtotal" value={money(quote.subtotal)} />
            {quote.discount > 0 && (
              <Row label="Discount" value={`- ${money(quote.discount)}`} />
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                Shipping <FiHelpCircle className="text-slate-500" />
              </span>
              <span>{money(quote.deliveryFee)}</span>
            </div>
                        <div className="flex items-center justify-between pt-3">
              <span className="text-lg font-semibold text-slate-900">
                Total
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500">PKR</span>
                <span className="text-2xl font-semibold text-slate-900">
                  {money(quote.total)}
                </span>
              </span>
            </div>
            {isCod && (
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <Row label="Advance due" value={money(advance)} accent />
                <Row label="Remaining COD" value={money(remaining)} />
              </div>
            )}
          </div>
        )}
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <FiLock className="shrink-0" /> Final totals and shipping calculations
          will be updated securely upon placing your order.
        </p>
      </div>
    </form>
  );
}

function OrderView({
  order,
  whatsappUrl,
  title = "Order",
  showPayment = false,
}) {
  useEffect(() => {
    loadGoogleFonts(order.items.map((i) => i.customFont).filter(Boolean));
  }, [order]);

  return (
    <div className="space-y-6">
      <div className={`${ui.card} p-4 sm:p-6 md:p-8`}>
        <h1 className={ui.pageTitle}>{title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-600">
            Order{" "}
            <strong className="text-slate-900">{order.orderNumber}</strong>
          </span>
          <Badge tone="amber">{statusLabel(order.status)}</Badge>
          <Badge tone={order.paymentStatus === "verified" ? "green" : "slate"}>
            payment {statusLabel(order.paymentStatus)}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-[#000000]/5 p-4">
            <div className="text-xs font-medium text-slate-500">
              {order.paymentMethod === "bank_transfer"
                ? "Full payment due"
                : "Advance due"}
            </div>
            <div className="text-2xl font-bold text-[#000000]">
              {money(order.advanceAmount)}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-500">
              Remaining balance
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {money(order.remainingCod)}
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <div className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
            <FiTruck /> Shipping
          </div>
          {order.courierName || order.trackingNumber ? (
            <p>
              {order.courierName || "Courier entered by store"}{" "}
              {order.trackingNumber ? `· ${order.trackingNumber}` : ""}
            </p>
          ) : (
            <p>
              Your order is currently being prepared with care. Tracking details
              will be updated here as soon as your package is dispatched.
            </p>
          )}
        </div>
        {whatsappUrl && (
          <a
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 sm:w-auto"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp className="text-lg" /> Chat on WhatsApp
          </a>
        )}
      </div>
      <div className={`${ui.card} p-4 sm:p-6 md:p-8`}>
        <h2 className="text-lg font-bold text-slate-900">Items</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {order.items.map((i, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[96px_1fr] gap-4 py-4 first:pt-0 sm:grid-cols-[140px_1fr]"
            >
              <CustomPreview
                product={{
                  name: i.name,
                  preview: i.preview,
                  images: [i.image],
                }}
                image={i.image}
                fontFamily={i.customFont ? `'${i.customFont}', cursive` : undefined}
              />
              <div className="min-w-0 space-y-1 break-words text-sm text-slate-700">
                {i.quantity} × {i.name} — “{i.customText}”

                {i.customFont && (
                  <div className="text-slate-500">
                    Font:{" "}
                    <span
                      className="text-base text-slate-900"
                      style={{
                        fontFamily: `'${i.customFont}', cursive`,
                      }}
                    >
                      {i.customFont}
                    </span>
                  </div>
                )}
                {i.notes && (
                  <div className="whitespace-pre-wrap break-words text-slate-500">
                    Product notes: {i.notes}
                  </div>
                )}
                {i.customNote && (
                  <div className="whitespace-pre-wrap break-words text-slate-500">
                    Your note: {i.customNote}
                  </div>
                )}
                {i.color && (
                  <div className="flex items-center gap-2 text-slate-500">
                    Color:{" "}
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: i.color.value }}
                    />
                    {i.color.name}
                  </div>
                )}
                <div className="font-semibold text-slate-900">
                  {money(i.lineTotal)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex flex-wrap justify-between gap-2">
            <span>Subtotal {money(order.subtotal)}</span>
            {order.discount > 0 && (
              <span>Discount - {money(order.discount)}</span>
            )}
            <span>Delivery {money(order.deliveryFee)}</span>
            <strong className="text-slate-900">
              Total {money(order.total)}
            </strong>
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
    if (paymentAccounts?.[0]?.method && !method)
      setMethod(paymentAccounts[0].method);
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
      setMsg(
        "Payment details submitted. Status is Under Review until a person verifies it. Screenshots are never verified automatically.",
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${ui.card} p-4 sm:p-6 md:p-8`}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <FiCreditCard className="text-[#000000]" /> Pay the advance
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Transfer PKR {order.advanceAmount} via JazzCash or Easypaisa, or select
        Cash on Delivery. Our team will verify your payment receipt shortly.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {paymentAccounts?.map((a) => (
          <div
            key={a.method}
            className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm"
          >
            <div className="font-semibold text-slate-900">{a.method}</div>
            <div>{a.holderName}</div>
            <div className="break-all font-mono">{a.accountNumber}</div>
            <div className="mt-1 text-slate-600">{a.instructions}</div>
          </div>
        ))}
      </div>
      {order.paymentStatus !== "verified" && order.status !== "cancelled" && (
        <form
          onSubmit={submit}
          className="mt-6 space-y-4 border-t border-slate-100 pt-6"
        >
          <Field label="Payment method">
            <select
              className={ui.input}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {paymentAccounts?.map((a) => (
                <option key={a.method}>{a.method}</option>
              ))}
            </select>
          </Field>
          {!isCod && (
            <Field label="Transaction / reference number">
              <input
                className={ui.input}
                required
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
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
            <input
              className={ui.input}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          {err && <Alert>{err}</Alert>}
          {msg && <Alert kind="ok">{msg}</Alert>}
          <button className={`${ui.btn} w-full sm:w-auto`} disabled={busy}>
            {isCod ? <FiCheckCircle /> : <FiUpload />}{" "}
            {busy
              ? "Submitting…"
              : isCod
                ? "Submit COD request"
                : "Submit payment proof"}
          </button>
        </form>
      )}
      {payments?.length > 0 && (
        <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <div className="mb-2 font-semibold text-slate-900">
            Submitted payments
          </div>
          {payments.map((p) => (
            <div key={p._id} className="break-words py-0.5">
              {p.method} · {p.transactionRef} · {statusLabel(p.status)}
              {p.rejectionReason ? ` · ${p.rejectionReason}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PAY_LABEL = {
  pending: "Pending",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
};
const PAY_PILL = {
  pending: "bg-slate-100 text-slate-700",
  under_review: "bg-amber-50 text-amber-700",
  verified: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

// Popup: Submitted -> Under Review -> Verified
function PaymentStatusModal({ paymentStatus, submitted, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const verified = paymentStatus === "verified";
  const rejected = paymentStatus === "rejected";
  const steps = [
    { label: "Submitted", tone: submitted ? "green" : "grey", icon: FiCheck },
    {
      label: "Under Review",
      tone:
        verified || rejected
          ? "green"
          : paymentStatus === "under_review"
            ? "orange"
            : "grey",
      icon: verified || rejected ? FiCheck : FiClock,
    },
    {
      label: rejected ? "Rejected" : "Verified",
      tone: verified ? "green" : rejected ? "red" : "grey",
      icon: rejected ? FiX : FiCheck,
    },
  ];
  const dot = {
    green: "bg-emerald-500 text-white",
    orange: "bg-orange-500 text-white",
    red: "bg-rose-500 text-white",
    grey: "bg-slate-200 text-slate-400",
  };
  const text = {
    green: "text-emerald-700",
    orange: "text-orange-600",
    red: "text-rose-600",
    grey: "text-slate-400",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Payment status"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Payment Status
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <FiX />
          </button>
        </div>

        <div className="mt-6 flex">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="relative flex flex-1 flex-col items-center text-center"
              >
                {i > 0 && (
                  <span
                    className={`absolute right-1/2 top-[18px] h-0.5 w-full -translate-y-1/2 ${
                      steps[i - 1].tone === "green"
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-base ${dot[s.tone]}`}
                >
                  {s.tone === "grey" ? i + 1 : <Icon />}
                </span>
                <span className={`mt-2 text-xs font-semibold sm:text-sm ${text[s.tone]}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 rounded-md bg-slate-50 p-3 text-center text-sm text-slate-600">
          Status:{" "}
          <strong
            className={
              verified
                ? "text-emerald-700"
                : rejected
                  ? "text-rose-600"
                  : "text-slate-900"
            }
          >
            {PAY_LABEL[paymentStatus] || "Pending"}
          </strong>
        </p>
      </div>
    </div>
  );
}

// Order Status tracker
function OrderTracker({ order }) {
  const st = order.status;
  const ps = order.paymentStatus;
  const afterProd = ["dispatched", "delivered", "completed"].includes(st);

  const steps = [
    { key: "placed", label: "Order Placed", icon: FiCheck, state: "done" },
    {
      key: "payment",
      label: "Payment Verification",
      icon: FiShield,
      state:
        ps === "verified"
          ? "done"
          : ps === "under_review" || ps === "rejected"
            ? "current"
            : "upcoming",
      sub:
        ps === "verified"
          ? { text: "Verified", cls: "text-emerald-600" }
          : ps === "under_review"
            ? { text: "Under Review", cls: "text-orange-600" }
            : ps === "rejected"
              ? { text: "Rejected", cls: "text-rose-600" }
              : null,
    },
    {
      key: "custom",
      label: "Customization",
      icon: FiPackage,
      state: afterProd
        ? "done"
        : ["confirmed", "processing"].includes(st)
          ? "current"
          : "upcoming",
    },
    {
      key: "dispatched",
      label: "Dispatched",
      icon: FiTruck,
      state: ["delivered", "completed"].includes(st)
        ? "done"
        : st === "dispatched"
          ? "current"
          : "upcoming",
    },
    // {
    //   key: "completed",
    //   label: "Completed",
    //   icon: FiCheckCircle,
    //   state: st === "completed" ? "done" : st === "delivered" ? "current" : "upcoming",
    // },
  ];

  return (
    <div className="flex">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={s.key}
            className="relative flex flex-1 flex-col items-center text-center"
          >
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${
                  steps[i - 1].state === "done" ? "bg-[#B8862B]" : "bg-slate-200"
                }`}
              />
            )}
            {s.state === "done" && (
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#B8862B] text-lg text-white">
                <FiCheck />
              </span>
            )}
            {s.state === "current" && (
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#B8862B] bg-white">
                <span className="h-5 w-5 rounded-full bg-[#B8862B]" />
              </span>
            )}
            {s.state === "upcoming" && (
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-400">
                <Icon />
              </span>
            )}
            <span
              className={`mt-2 px-1 text-[11px] leading-tight sm:text-sm ${
                s.state === "upcoming"
                  ? "text-slate-500"
                  : "font-semibold text-slate-900"
              }`}
            >
              {s.label}
            </span>
            {s.sub && (
              <span className={`text-[11px] font-medium sm:text-xs ${s.sub.cls}`}>
                {s.sub.text}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ThankYou() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token");
  const { store } = useStore();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    let active = true;
    const url = `orderNumber=${orderNumber}&token=${token || ""}`;
    api
      .lookup(url)
      .then((d) => active && setData(d))
      .catch((e) => active && setErr(e.message));
    // admin status change hone par page khud update ho (har 30 sec)
    const timer = setInterval(() => {
      api
        .lookup(url)
        .then((d) => active && setData(d))
        .catch(() => {});
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderNumber, token]);

  useEffect(() => {
    if (data) {
      loadGoogleFonts(data.order.items.map((i) => i.customFont).filter(Boolean));
    }
  }, [data]);

  if (err) return <Alert>{err}</Alert>;
  if (!data) return <PageLoader text="Loading your order…" />;

  const { order, payments, whatsappUrl } = data;
  const customer = order.customer || {};
  const isBank = order.paymentMethod === "bank_transfer";
  const pct = order.total
    ? Math.round((order.advanceAmount / order.total) * 100)
    : 0;
  const submitted =
    !!payments?.length || ["under_review", "verified", "rejected"].includes(order.paymentStatus);

  // WhatsApp: order number + customer name auto draft
  const waNumber = (store?.whatsappNumber || store?.whatsapp || store?.phone || "")
    .replace(/\D/g, "")
    .replace(/^0/, "92");
  const waMessage = `Hello Craftagon, I need help with my order.\nOrder Number: ${order.orderNumber}\nCustomer Name: ${customer.fullName || ""}`;
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`
    : whatsappUrl;

  const infoRow = "flex items-start gap-3 text-sm text-slate-700";
  const infoIcon = "mt-0.5 shrink-0 text-lg text-[#B8862B]";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-600 text-3xl text-emerald-600">
          <FiCheck />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
          Thank You for Your Order!
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          Your order has been successfully received. We’re getting everything
          ready for you.
        </p>
        <div className="mt-5 inline-block rounded-full bg-stone-100 px-6 py-2.5 text-sm text-slate-800">
          Order Number: <strong>{order.orderNumber}</strong>
        </div>
      </div>

      {order.status === "cancelled" && (
        <Alert>This order was cancelled.{order.cancelReason ? ` ${order.cancelReason}` : ""}</Alert>
      )}

      {/* Amount summary */}
      <div className={`${ui.card} grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>
        <div className="flex flex-col items-center justify-center p-5 text-center sm:p-6">
          <div className="text-sm text-slate-600">Total Amount</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {money(order.total)}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-5 text-center sm:p-6">
          <div className="text-sm text-slate-600">
            {isBank ? "Full Payment" : "Advance Payment"}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {money(order.advanceAmount)}
          </div>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setShowStatus(true)}
            className={`mt-2 rounded-full px-4 py-1 text-xs font-semibold transition hover:brightness-95 ${
              PAY_PILL[order.paymentStatus] || PAY_PILL.pending
            }`}
          >
            {PAY_LABEL[order.paymentStatus] || "Pending"}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center p-5 text-center sm:p-6">
          <div className="text-sm text-slate-600">Remaining Balance</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {money(order.remainingCod)}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {order.remainingCod > 0 ? "Pay upon Delivery" : "Nothing due on delivery"}
          </div>
        </div>
      </div>

      {/* Order status */}
      <div className={`${ui.card} p-4 sm:p-6`}>
        <h2 className="mb-6 font-serif text-xl font-bold text-slate-900">
          Order Status
        </h2>
        <OrderTracker order={order} />
        {(order.courierName || order.trackingNumber) && (
          <p className="mt-6 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            <FiTruck className="mr-2 inline" />
            {order.courierName || "Courier"}
            {order.trackingNumber ? ` · Tracking: ${order.trackingNumber}` : ""}
          </p>
        )}
      </div>

      {/* Items + Delivery */}
      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className={`${ui.card} p-4 sm:p-6`}>
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Order Items
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {order.items.map((i, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[96px_1fr] gap-4 py-4 first:pt-0 sm:grid-cols-[120px_1fr]"
              >
                <CustomPreview
                  product={{ name: i.name, preview: i.preview, images: [i.image] }}
                  image={i.image}
                  fontFamily={i.customFont ? `'${i.customFont}', cursive` : undefined}
                />
                <div className="min-w-0 space-y-1 break-words text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">{i.name}</div>
                  <div>Quantity: {i.quantity}</div>
                  <div>Customization: {i.customText || "—"}</div>
                  {i.customFont && (
                    <div>
                      Font:{" "}
                      <span style={{ fontFamily: `'${i.customFont}', cursive` }}>
                        {i.customFont}
                      </span>
                    </div>
                  )}
                  {i.color && (
                    <div className="flex items-center gap-2">
                      Color:
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: i.color.value }}
                      />
                      {i.color.name}
                    </div>
                  )}
                  {i.notes && (
                    <div className="whitespace-pre-wrap">Product notes: {i.notes}</div>
                  )}
                  {i.customNote && (
                    <div className="whitespace-pre-wrap">Your note: {i.customNote}</div>
                  )}
                  <div className="pt-1 text-base font-semibold text-slate-900">
                    {money(i.lineTotal)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 space-y-1 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>- {money(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{money(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        </div>

        <div className={`${ui.card} h-fit space-y-4 p-4 sm:p-6`}>
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Delivery Information
          </h2>
          <p className={infoRow}>
            <FiUser className={infoIcon} /> {customer.fullName}
          </p>
          <p className={infoRow}>
            <FiPhone className={infoIcon} /> {customer.phone}
          </p>
          <p className={infoRow}>
            <FiHome className={infoIcon} />
            <span className="break-words">
              {customer.address}
              {customer.landmark ? `, ${customer.landmark}` : ""}
            </span>
          </p>
          <p className={infoRow}>
            <FiMapPin className={infoIcon} /> {customer.city}
            {customer.province ? `, ${customer.province}` : ""}
          </p>
          <p className={infoRow}>
            <FiCalendar className={infoIcon} /> Order Date:{" "}
            {new Date(order.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className={infoRow}>
            <FiCreditCard className={infoIcon} /> Payment Method:{" "}
            {isBank ? "Full Advance Payment" : `Cash on Delivery (${pct}% advance)`}
          </p>
        </div>
      </div>

      {/* Payment form (agar abhi payment submit nahi hui) */}
      {!payments?.length && order.paymentStatus !== "verified" && (
        <PaymentSection {...data} token={token} />
      )}

      {/* Help */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-stone-50 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <FaWhatsapp className="shrink-0 text-4xl text-[#B8862B]" />
          <div>
            <div className="font-semibold text-slate-900">
              Need Help With Your Order?
            </div>
            <div className="text-sm text-slate-600">
              Our support team is here to help you anytime.
            </div>
          </div>
        </div>
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black sm:w-auto"
          >
            <FaWhatsapp className="text-lg" /> Chat on WhatsApp
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="font-serif text-xl font-bold text-slate-900 sm:text-2xl">
          Thank You For Shopping at Craftagon!
        </p>
        <p className="mt-2 text-slate-600">Visit us Again...</p>
      </div>

      {showStatus && (
        <PaymentStatusModal
          paymentStatus={order.paymentStatus}
          submitted={submitted}
          onClose={() => setShowStatus(false)}
        />
      )}
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
      const d = await api.lookup(
        `orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`,
      );
      setData(d);
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <div className={`${ui.card} p-4 sm:p-6 md:p-8`}>
        <h1 className={ui.pageTitle}>Track Order</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the Order ID and the email used at checkout.
        </p>
        <form onSubmit={go} className="mt-5 space-y-4">
          <Field label="Order ID">
            <input
              className={ui.input}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className={ui.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {err && <Alert>{err}</Alert>}
          <button className={`${ui.btn} w-full sm:w-auto`}>
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
// Policies aur Faq dono purane functions ko in se replace karo.
// Naye imports ki zaroorat nahi: FiTruck, FiRotateCcw, FiClock, FiCreditCard,
// FiLock, FiShield, FiChevronDown pehle se tumhari file mein import hain.

const BRAND_POLICIES = [
  {
    icon: FiTruck,
    t: "Shipping",
    b: "We deliver across Pakistan. Orders are processed after confirmation, and delivery timelines may vary depending on your location and product availability. Shipping charges are displayed at checkout.",
  },
  {
    icon: FiRotateCcw,
    t: "Return & Refund",
    b: "Customized and personalized products cannot be returned or exchanged unless they arrive damaged, defective, or different from what was ordered. Please contact us with order details and photos of the issue.",
  },
  {
    icon: FiClock,
    t: "Cancellation",
    b: "Orders can only be cancelled before customization or production begins. Once production has started, cancellation may not be possible.",
  },
  {
    icon: FiCreditCard,
    t: "Payment",
    b: "We offer the payment methods displayed at checkout. Any advance payment requirements will be communicated before order confirmation.",
  },
  {
    icon: FiLock,
    t: "Privacy",
    b: "Your personal information is used only to process orders, arrange delivery, and provide customer support. We do not sell your personal information.",
  },
  {
    icon: FiShield,
    t: "Terms & Conditions",
    b: "Customers are responsible for providing accurate names, spellings, logos, and customization details. Please review your customization information carefully before confirming your order.",
  },
];

export function Policies() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Brand Policies" />
      <div className="space-y-4">
        {BRAND_POLICIES.map(({ icon: Icon, t, b }) => (
          <div key={t} className={`${ui.card} p-4 sm:p-6`}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
              <Icon className="shrink-0 text-[#000000]" /> {t}
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
              {b}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQ_SECTIONS = [
  {
    heading: "Orders & Customization",
    items: [
      {
        question: "What is Craftagon?",
        answer:
          "Craftagon is a Pakistan-based customization and gifting brand offering personalized products for individuals and businesses.",
      },
      {
        question: "What products do you offer?",
        answer:
          "We offer customized pens, tumblers, bottles, mugs, diaries, wallets, keychains, desk plates, and much more.",
      },
      {
        question: "Can I customize products with my name or logo?",
        answer:
          "Yes! You can personalize selected products with names, messages, logos, or designs.",
      },
      {
        question: "Can I place bulk or corporate orders?",
        answer:
          "Absolutely! We welcome bulk and corporate orders. Contact us for product options and customized quotations.",
      },
    ],
  },
  {
    heading: "Shipping & Delivery",
    items: [
      {
        question: "Do you deliver across Pakistan?",
        answer: "Yes, we offer nationwide delivery across Pakistan.",
      },
      {
        question: "How long does delivery take?",
        answer:
          "Delivery usually takes 3–6 business days after order confirmation. Customized orders may require additional processing time.",
      },
      {
        question: "Do you offer Express delivery?",
        answer: "Yes! We do offer quick delivery in twin cities.",
      },
    ],
  },
  {
    heading: "Payments",
    items: [
      {
        question: "How does payment work?",
        answer:
          "We require 50% advance payment to confirm your customized order. The remaining 50% can be paid upon delivery. Full advance payment is also available, which is a priority.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept Bank and Digital Wallet Transfer.",
      },
    ],
  },
  {
    heading: "Return and Support",
    items: [
      {
        question: "Can I cancel my order?",
        answer:
          "Orders can only be cancelled before customization or production begins.",
      },
      {
        question: "Can I return or exchange a customized product?",
        answer:
          "Customized products are not eligible for returns or exchanges unless they arrive damaged, defective, or different from what you ordered.",
      },
      {
        question: "How can I track my order?",
        answer:
          "Once your order is dispatched, you can track your order by clicking the tracking logo on our site.",
      },
      {
        question: "How can I contact Craftagon?",
        answer: "You can reach us through our official Email & WhatsApp support.",
      },
      {
        question: "Can I request a special design?",
        answer:
          "Yes! Contact us with your requirements, and our team will help you explore available customization options.",
      },
    ],
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Frequently Asked Questions (FAQs)"
      />
      <div className="space-y-8 border border-gray-300 p-6 sm:p-8 rounded-lg">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">
              {section.heading}
            </h2>
            <div className="space-y-3">
              {section.items.map((f) => (
                <details key={f.question} className={`${ui.card} group p-4 sm:p-5`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <span>{f.question}</span>
                    <FiChevronDown className="shrink-0 text-slate-500 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { customer, setCustomer } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [err, setErr] = useState("");
  if (customer) {
    nav("/account", { replace: true });
  }
  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const d =
        mode === "login" ? await api.login(form) : await api.register(form);
      setCustomer(d.customer);
      nav("/account");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className={`${ui.card} mx-auto max-w-xl p-4 sm:p-6 md:p-8`}>
      <h1 className="text-2xl font-extrabold text-slate-900">
        {mode === "login" ? "Welcome back" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {mode === "login"
          ? "Sign in to see your orders."
          : "Register to track your orders easily."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "register" && (
          <>
            <Field label="Full name">
              <input
                className={ui.input}
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={ui.input}
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </>
        )}
        <Field label="Email">
          <input
            className={ui.input}
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <input
            className={ui.input}
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        {err && <Alert>{err}</Alert>}
        <button className={`${ui.btn} w-full py-3`}>
          {mode === "login" ? <FiLogIn /> : <FiUserPlus />}{" "}
          {mode === "login" ? "Sign in" : "Register"}
        </button>
      </form>
      <button
        className="mt-5 w-full text-center text-sm font-medium text-[#000000] hover:underline"
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "Need an account? Register"
          : "Have an account? Login"}
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
      <div
        className={`${ui.card} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#000000] text-xl font-bold text-white">
            {(customer.fullName || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              My Account
            </h1>
            <p className="break-words text-sm text-slate-600">
              {customer.fullName} · {customer.email}
            </p>
          </div>
        </div>
        <button className={`${ui.btnOutline} w-full sm:w-auto`} onClick={logout}>
          <FiLogOut /> Log out
        </button>
      </div>
      {err && (
        <div className="mt-4">
          <Alert>{err}</Alert>
        </div>
      )}
      <h2 className="mb-3 mt-10 text-xl font-bold text-slate-900">
        Your orders
      </h2>
      {loadingOrders && <PageLoader text="Loading your orders…" />}
      <div className="space-y-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className={`${ui.card} flex flex-wrap items-center justify-between gap-4 p-4 text-sm transition hover:border-[#000000]/40 hover:shadow-md sm:p-5`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                #{o.orderNumber}
                <Badge tone="amber">{statusLabel(o.status)}</Badge>
                <Badge
                  tone={o.paymentStatus === "verified" ? "green" : "slate"}
                >
                  payment {statusLabel(o.paymentStatus)}
                </Badge>
              </div>
              <div className="text-slate-600">
                {money(o.total)} · advance {money(o.advanceAmount)} · remaining{" "}
                {money(o.remainingCod)}
              </div>
            </div>
            <Link
              className="inline-flex items-center gap-1 font-medium text-[#000000] hover:underline"
              to="/order-lookup"
            >
              Track with Order ID {o.orderNumber} and your email{" "}
              <FiArrowRight />
            </Link>
          </div>
        ))}
        {!orders.length && (
          <div
            className={`${ui.card} flex flex-col items-center gap-2 p-8 text-center text-slate-500 sm:p-10`}
          >
            <FiPackage className="text-3xl text-slate-300" />
            No orders on this account yet.
          </div>
        )}
      </div>
    </div>
  );
}