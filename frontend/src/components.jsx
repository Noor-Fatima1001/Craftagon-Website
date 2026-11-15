import { useEffect, useState } from "react";
import logo from "./assets/logo.jpeg";
import blackImage from "./assets/blackImage.png";
import whiteImage from "./assets/whiteImage.png";
import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiBarChart2,
  FiBox,
  FiCheckCircle,
  FiGrid,
  FiImage,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSettings,
  FiShoppingCart,
  FiStar,
  FiTag,
  FiUser,
  FiX,
  FiCreditCard,
} from "react-icons/fi";
import { useCart, useStore, useAuth } from "./context";
import { api, asset, money, subscribeLoading } from "./api";

const ANNOUNCEMENT =
  "Add a name or message on pens, mugs, tumblers & keychains. Delivered across Pakistan.";

export const ui = {
  btn: "inline-flex items-center justify-center gap-2 rounded-md bg-[#000000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
  btnOutline:
    "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#000000] hover:text-[#000000] disabled:opacity-60",
  btnLight:
    "inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#000000] shadow-md transition hover:bg-slate-100",
  card: "rounded-md border border-slate-200 bg-white shadow-sm",
  input:
    "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#000000] focus:outline-none focus:ring-4 focus:ring-[#000000]/15",
  pageTitle:
    "text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl",
};

function overlayStyle(p = {}) {
  const align = p.align || "center";
  const x = p.x ?? 50;
  const y = p.y ?? 50;
  const rot = Number(p.rotation || 0);
  const tx = align === "left" ? "0%" : align === "right" ? "-100%" : "-50%";
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(${tx}, -50%) rotate(${rot}deg)`,
    width: `${p.maxWidth ?? 70}%`,
    textAlign: align,
    fontSize: `${p.fontSize || 22}px`,
    fontFamily: p.fontFamily || "Georgia, serif",
    color: p.color || "#1f2937",
    fontWeight: 600,
    letterSpacing: "0.04em",
    lineHeight: 1.1,
    wordBreak: "break-word",
    textShadow: "0 1px 1px rgba(255,255,255,0.35), 0 0 2px rgba(0,0,0,0.15)",
  };
}

export function TopBar() {
  return (
    <div className="bg-[#000000] px-4 text-center text-xs font-medium tracking-wide text-white sm:text-sm"></div>
  );
}
export function GlobalLoader() {
  const [loading, setLoading] = useState(false);
  useEffect(() => subscribeLoading(setLoading), []);
  if (!loading) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-slate-200">
      <div className="h-full w-1/3 animate-pulse bg-[#000000]" />
    </div>
  );
}

export function Header() {
  const cart = useCart();
  const { store, categories } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const light = scrolled || hovered;

  const { customer } = useAuth();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const mobileLinkClass = ({ isActive }) =>
    `block min-h-[44px] rounded-md px-3 py-3 font-medium transition ${
      isActive
        ? "bg-[#000000]/10 text-[#000000]"
        : "text-slate-700 hover:bg-slate-50"
    }`;

  const iconBtn = `relative inline-flex h-10 w-10 items-center justify-center rounded-md text-xl transition ${
    light ? "text-black hover:bg-black/5" : "text-white hover:bg-white/10"
  }`;

  return (
    <>
      <header
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`sticky top-0 z-40 border-b shadow-sm backdrop-blur-md transition-colors duration-300 ${
          light ? "border-slate-200 bg-white" : "border-black bg-black"
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 sm:py-1">
          {/* Left: Menu */}
          <div
            className={`flex items-center justify-start gap-1 transition-colors ${
              light ? "text-black" : "text-white"
            }`}
          >
            <button
              type="button"
              className={iconBtn}
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <FiMenu />
            </button>
            <span className="hidden sm:inline">Menu</span>
          </div>

          {/* Center: Logo */}
          <div className="flex items-center justify-center">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#000000] sm:text-xl"
            >
              <span className="relative block h-20 w-[150px] sm:h-14 sm:w-[200px]">
                <img
                  src={blackImage}
                  alt={store?.storeName || "Craftagon"}
                  className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                    light ? "opacity-0" : "opacity-100"
                  }`}
                />
                <img
                  src={whiteImage}
                  alt=""
                  aria-hidden="true"
                  className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                    light ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
            </Link>
          </div>

          {/* Right: Cart, Account, Track order (icons only) */}
          <div className="flex items-center justify-end">
            <Link to="/cart" className={iconBtn} aria-label="Cart" title="Cart">
              <FiShoppingCart />
              {cart.count > 0 && (
                <span
                  className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full gap-1 text-xs font-bold ${
                    light ? "bg-black text-white" : "bg-white text-[#000000]"
                  }`}
                >
                  {cart.count}
                </span>
              )}
            </Link>
            <Link
              to={customer ? "/account" : "/login"}
              className={iconBtn}
              aria-label={customer ? "My account" : "Login"}
              title={customer ? "My account" : "Login"}
            >
              <FiUser />
            </Link>
            <Link
              to="/order-lookup"
              className={iconBtn}
              aria-label="Track order"
              title="Track order"
            >
              <FiPackage />
            </Link>
          </div>
        </div>
      </header>

      {/* Drawer (all screen sizes) */}
      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">Menu</span>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center text-lg text-slate-700 hover:bg-slate-100"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <FiX />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 text-base">
            <NavLink
              to="/"
              end
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              Home
            </NavLink>

            <p className="mb-1 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Products
            </p>
            <NavLink
              to="/products"
              end
              className={mobileLinkClass}
              onClick={() => setOpen(false)}
            >
              All Products
            </NavLink>
            {categories?.map((c) => (
              <NavLink
                key={c._id}
                to={`/products?category=${c.slug}`}
                className="block min-h-[44px] rounded-md px-3 py-3 text-slate-600 hover:bg-slate-50 hover:text-[#000000]"
                onClick={() => setOpen(false)}
              >
                {c.name}
              </NavLink>
            ))}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <NavLink
                to="/how-to-order"
                className={mobileLinkClass}
                onClick={() => setOpen(false)}
              >
                How to Order
              </NavLink>
              <NavLink
                to="/about"
                className={mobileLinkClass}
                onClick={() => setOpen(false)}
              >
                About
              </NavLink>
              <NavLink
                to="/faq"
                className={mobileLinkClass}
                onClick={() => setOpen(false)}
              >
                FAQ
              </NavLink>
              <NavLink
                to="/contact"
                className={mobileLinkClass}
                onClick={() => setOpen(false)}
              >
                Contact
              </NavLink>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}

export function Footer() {
  const { store, categories } = useStore();
  const link = "block text-white/75 transition hover:text-white";
  const head = "mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white";
  const occasions = [
    "Birthday",
    "Anniversary",
    "Wedding",
    "Mother's Day",
    "Father's Day",
  ];
  const phone = store?.whatsappNumber || store?.phone;
  return (
    <footer className="mt-20 bg-[#000000] text-white/75">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2 text-2xl font-extrabold text-white">
            <img
              src={logo}
              alt={store?.storeName || "Craftagon"}
              className="h-28 w-28 rounded-md object-cover"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            {store?.tagline ||
              "Personalised gifts, printed with your name or message and delivered across Pakistan."}
          </p>
          {store?.address && (
            <p className="mt-4 text-sm leading-relaxed">
              <span className="font-semibold text-white">Address:</span>{" "}
              {store.address}
            </p>
          )}
          {phone && (
            <p className="mt-4 text-sm">
              <span className="text-white/60">Call / WhatsApp</span>
              <br />
              <a
                href={`tel:${String(phone).replace(/\s+/g, "")}`}
                className="transition hover:text-white"
              >
                {phone}
              </a>
            </p>
          )}
          {store?.email && (
            <p className="mt-2 text-sm">
              <a
                href={`mailto:${store.email}`}
                className="transition hover:text-white"
              >
                {store.email}
              </a>
            </p>
          )}
          <p className="mt-2 text-xs text-white/60">
            Click or tap to start a WhatsApp conversation with our support team
          </p>
        </div>

        <div>
          <div className={head}>Shop</div>
          <div className="space-y-3 text-sm">
            <Link className={link} to="/products">
              All products
            </Link>
            {categories?.slice(0, 8).map((c) => (
              <Link
                key={c._id}
                className={link}
                to={`/products?category=${c.slug}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className={head}>Occasions</div>
          <div className="space-y-3 text-sm">
            {occasions.map((o) => (
              <Link key={o} className={link}>
                {o} gifts
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className={head}>Help</div>
          <div className="space-y-3 text-sm">
            <Link className={link} to="/about">
              About us
            </Link>
            <Link className={link} to="/contact">
              Contact us
            </Link>
            <Link className={link} to="/faq">
              FAQ's
            </Link>
            <Link className={link} to="/help">
              Help & support
            </Link>
            <Link className={link} to="/policies">
              Shipping & returns
            </Link>
            <Link className={link} to="/policies">
              Privacy policy
            </Link>
          </div>
        </div>

        <div>
          <div className={head}>Ordering & Delivery</div>
          <div className="space-y-3 text-sm">
            <Link className={link} to="/order-lookup">
              Track your order
            </Link>
            <Link className={link} to="/help">
              How payment works
            </Link>
            <Link className={link} to="/login">
              Login / Register
            </Link>
            <p className="flex gap-2 pt-1 leading-relaxed text-white/60">
              <FiCreditCard className="mt-1 shrink-0" />
              Pay the advance by JazzCash or Easypaisa, or choose COD. No card
              checkout.
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/15 py-6 text-xs text-white/60 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {store?.storeName || "Craftagon"}. All
            rights reserved.
          </span>
          <span>Payments are confirmed by our team before printing.</span>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 text-slate-900">
      <TopBar />
      <GlobalLoader />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ProductCard({ product }) {
  const price =
    product.salePrice && product.salePrice < product.price
      ? product.salePrice
      : product.price;
  const onSale = product.salePrice && product.salePrice < product.price;
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#000000]/40 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {product.images?.[0] ? (
          <img
            src={asset(product.images[0])}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-slate-300">
            <FiImage />
          </div>
        )}
        {onSale && (
          <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold tracking-wide text-white shadow">
            Sale
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#000000]/70">
          {product.category?.name}
        </div>
        <div className="mt-1 line-clamp-2 font-semibold text-slate-900 group-hover:text-[#000000]">
          {product.name}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-[#000000]">
            {money(price)}
          </span>
          {onSale && (
            <span className="text-sm text-slate-400 line-through">
              {money(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CustomPreview({ product, text, image }) {
  const p = product?.preview || {};
  const img = image || product?.images?.[0];
  const value = text || "";
  if (!img) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        <FiImage className="text-3xl text-slate-300" />
        Add a product photograph to preview the print on the item.
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
      <img
        src={asset(img)}
        alt={product?.name || "Product"}
        className="w-full object-cover"
      />
      {p.enabled !== false && (
        <div
          className="pointer-events-none absolute max-w-full px-1"
          style={overlayStyle(p)}
        >
          {value}
        </div>
      )}
    </div>
  );
}

export function AdminShell() {
  const { admin, setAdmin } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = [
    ["Dashboard", "/admin", FiGrid],
    ["Products", "/admin/products", FiBox],
    ["Categories", "/admin/categories", FiTag],
    ["Orders", "/admin/orders", FiPackage],
    ["Payments", "/admin/payments", FiCreditCard],
    ["Reviews", "/admin/reviews", FiStar],
    ["Coupons", "/admin/coupons", FiTag],
    ["Settings", "/admin/settings", FiSettings],
    ["Reports", "/admin/reports", FiBarChart2],
    ["Profile", "/admin/profile", FiUser],
  ];
  async function logout() {
    await api.adminLogout();
    setAdmin(null);
    nav("/admin/login");
  }
  const menu = (
    <>
      <div className="mb-8 flex items-center gap-2 text-lg font-extrabold">
        <img
          src={logo}
          alt="Craftagon"
          className="h-9 w-9 rounded-md object-cover"
        />
        Craftagon Admin
      </div>
      <nav className="flex flex-col gap-1 text-sm">
        {links.map(([l, t, Icon]) => (
          <NavLink
            key={t}
            to={t}
            end={t === "/admin"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 font-medium transition ${
                isActive
                  ? "bg-white text-[#000000] shadow"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="text-lg" /> {l}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2.5 text-sm font-semibold transition hover:bg-white/20"
      >
        <FiLogOut /> Log out
      </button>
      <p className="mt-4 truncate text-xs text-white/60">{admin?.email}</p>
    </>
  );
  return (
    <div className="flex min-h-screen bg-slate-100">
      <GlobalLoader />
      <aside className="hidden w-64 shrink-0 bg-[#000000] p-5 text-white md:block">
        {menu}
      </aside>
      <div className="flex-1 overflow-x-hidden">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <span className="font-bold text-slate-900">Admin</span>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-lg text-slate-800"
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <FiMenu />
          </button>
        </div>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              className="absolute inset-0 bg-slate-900/50"
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-[#000000] p-5 text-white shadow-2xl">
              {menu}
            </aside>
          </div>
        )}
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function Guard({ children }) {
  const { admin, ready } = useAuth();
  if (!ready)
    return <p className="py-20 text-center text-slate-500">Loading…</p>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Alert({ children, kind = "error" }) {
  const ok = kind === "ok";
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {ok ? (
        <FiCheckCircle className="mt-0.5 shrink-0 text-base" />
      ) : (
        <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
      )}
      <div>{children}</div>
    </div>
  );
}
