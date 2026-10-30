import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useCart, useStore, useAuth } from "./context";
import { api, asset, money } from "./api";

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

export function Header() {
  const cart = useCart();
  const { store, categories } = useStore();
  const { customer } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    ["/", "Home"],
    ["/about", "About Us"],
    ["/products", "All Products"],
    ["/faq", "FAQ"],
    ["/help", "Help & Support"],
    ["/contact", "Contact Us"],
    ["/cart", "Cart"],
    ["/order-lookup", "Track Order"],
    [customer ? "/account" : "/login", customer ? "My Account" : "Login"],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-black">
          {store?.storeName || "Craftagon"}
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
          <NavLink to="/products">Shop</NavLink>
          {categories?.slice(0, 4).map((c) => (
            <NavLink key={c._id} to={`/products?category=${c.slug}`}>
              {c.name}
            </NavLink>
          ))}
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/order-lookup"
            className="hidden min-h-[44px] items-center px-2 text-sm text-slate-600 sm:inline-flex"
          >
            Track order
          </Link>
          <Link to="/cart" className="relative min-h-[44px] rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold">
            Cart
            {cart.count > 0 && (
              <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-white">{cart.count}</span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-slate-200 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-black" />
              <span className="block h-0.5 w-5 bg-black" />
              <span className="block h-0.5 w-5 bg-black" />
            </span>
          </button>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-bold">Menu</span>
            <button type="button" className="btn-outline px-3" onClick={() => setOpen(false)} aria-label="Close menu">
              Close
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 text-base">
            {links.map(([to, label]) => (
              <NavLink
                key={label}
                to={to.trim()}
                className="block min-h-[44px] border-b border-slate-100 py-3 font-medium"
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
            {categories?.map((c) => (
              <NavLink
                key={c._id}
                to={`/products?category=${c.slug}`}
                className="block min-h-[44px] py-3 text-slate-700"
                onClick={() => setOpen(false)}
              >
                {c.name}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    </header>
  );
}

export function Footer() {
  const { store } = useStore();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="text-lg font-bold">{store?.storeName || "Craftagon"}</div>
          <p className="mt-2 text-sm text-slate-600">{store?.tagline}</p>
        </div>
        <div>
          <div className="font-semibold">Shop</div>
          <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
            <Link to="/products">All products</Link>
            <Link to="/about">About us</Link>
            <Link to="/faq">FAQs</Link>
            <Link to="/help">Help & support</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold">Orders</div>
          <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600">
            <Link to="/order-lookup">Track order</Link>
            <Link to="/policies">Policies</Link>
            <p>Pay advance by JazzCash, Easypaisa, or choose COD. No card checkout.</p>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          <div className="font-semibold text-black">Contact</div>
          <p className="mt-2">{store?.email}</p>
          <p>{store?.phone}</p>
          <p>WhatsApp: {store?.whatsappNumber} (you send the message yourself)</p>
          <Link className="mt-2 inline-block text-accent" to="/contact">
            Contact form
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-black">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ProductCard({ product }) {
  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  return (
    <Link to={`/products/${product.slug}`} className="card overflow-hidden hover:shadow-md">
      <div className="aspect-square bg-slate-100">
        {product.images?.[0] && (
          <img src={asset(product.images[0])} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">{product.category?.name}</div>
        <div className="mt-1 font-semibold">{product.name}</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-bold text-accent">{money(price)}</span>
          {product.salePrice && product.salePrice < product.price && (
            <span className="text-sm text-slate-400 line-through">{money(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CustomPreview({ product, text, image }) {
  const p = product?.preview || {};
  const img = image || product?.images?.[0];
  const value = text || "Your text";
  if (!img) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Add a product photograph to preview the print on the item.
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-100">
      <img src={asset(img)} alt={product?.name || "Product"} className="w-full object-cover" />
      {p.enabled !== false && (
        <div className="pointer-events-none absolute max-w-full px-1" style={overlayStyle(p)}>
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
    ["Dashboard", "/admin"],
    ["Products", "/admin/products"],
    ["Categories", "/admin/categories"],
    ["Orders", "/admin/orders"],
    ["Payments", "/admin/payments"],
    ["Settings", "/admin/settings"],
    ["Reports", "/admin/reports"],
    ["Profile", "/admin/profile"],
  ];
  async function logout() {
    await api.adminLogout();
    setAdmin(null);
    nav("/admin/login");
  }
  const menu = (
    <>
      <div className="mb-8 text-lg font-bold">Craftagon Admin</div>
      <nav className="flex flex-col gap-1 text-sm">
        {links.map(([l, t]) => (
          <NavLink
            key={t}
            to={t}
            end={t === "/admin"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `min-h-[44px] rounded-md px-3 py-2 ${isActive ? "bg-accent text-white" : "text-slate-300 hover:bg-slate-800"}`
            }
          >
            {l}
          </NavLink>
        ))}
      </nav>
      <button onClick={logout} className="mt-8 w-full rounded-md bg-slate-800 px-3 py-2 text-sm">
        Log out
      </button>
      <p className="mt-4 text-xs text-slate-400">{admin?.email}</p>
    </>
  );
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 bg-slate-900 p-4 text-white md:block">{menu}</aside>
      <div className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
          <span className="font-bold">Admin</span>
          <button className="btn-outline" type="button" onClick={() => setOpen(true)}>
            Menu
          </button>
        </div>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button className="absolute inset-0 bg-black/40" type="button" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 p-4 text-white">{menu}</aside>
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
  if (!ready) return <p>Loading…</p>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Alert({ children, kind = "error" }) {
  const cls = kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800";
  return <div className={`rounded-md px-3 py-2 text-sm ${cls}`}>{children}</div>;
}
