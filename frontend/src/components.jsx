import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useCart, useStore, useAuth } from "./context";
import { api, asset, money } from "./api";

export function Header() {
  const cart = useCart();
  const { store, categories } = useStore();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">
          {store?.storeName || "Craftagon"}
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          <NavLink to="/products">Shop</NavLink>
          {categories?.slice(0, 5).map((c) => (
            <NavLink key={c._id} to={`/products?category=${c.slug}`}>
              {c.name}
            </NavLink>
          ))}
          <NavLink to="/faq">Help</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/order-lookup" className="text-sm text-slate-600">
            Track order
          </Link>
          <Link to="/cart" className="relative rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold">
            Cart
            {cart.count > 0 && (
              <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-white">{cart.count}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { store } = useStore();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="text-lg font-bold">{store?.storeName || "Craftagon"}</div>
          <p className="mt-2 text-sm text-slate-600">{store?.tagline}</p>
        </div>
        <div>
          <div className="font-semibold">Shop</div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
            <Link to="/products">All products</Link>
            <Link to="/faq">FAQs</Link>
            <Link to="/policies">Policies</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold">Orders</div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
            <Link to="/order-lookup">Find an order</Link>
            <p>Advance payment by bank, Easypaisa or JazzCash. No card checkout.</p>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          <div className="font-semibold text-slate-900">Contact</div>
          <p className="mt-2">{store?.email}</p>
          <p>WhatsApp: {store?.whatsappNumber} (you send the message yourself)</p>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen">
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

export function CustomPreview({ product, text }) {
  const p = product?.preview || {};
  const img = product?.images?.[0];
  if (!p.enabled || !img) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Preview: {text || "Your custom text will appear here"}
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-100">
      <img src={asset(img)} alt={product.name} className="w-full" />
      <div
        className="pointer-events-none absolute max-w-full px-2"
        style={{
          left: `${p.x ?? 50}%`,
          top: `${p.y ?? 50}%`,
          transform: "translate(-50%, -50%)",
          width: `${p.maxWidth ?? 70}%`,
          textAlign: p.align || "center",
          fontSize: `${p.fontSize || 22}px`,
          fontFamily: p.fontFamily || "Georgia, serif",
          color: p.color || "#1f2937",
          fontWeight: 600,
          wordBreak: "break-word",
        }}
      >
        {text || "Your text"}
      </div>
    </div>
  );
}

export function AdminShell() {
  const { admin, setAdmin } = useAuth();
  const nav = useNavigate();
  const links = [
    ["Dashboard", "/admin"],
    ["Products", "/admin/products"],
    ["Categories", "/admin/categories"],
    ["Orders", "/admin/orders"],
    ["Payments", "/admin/payments"],
    ["Coupons", "/admin/coupons"],
    ["Settings", "/admin/settings"],
    ["Reports", "/admin/reports"],
    ["Profile", "/admin/profile"],
  ];
  async function logout() {
    await api.adminLogout();
    setAdmin(null);
    nav("/admin/login");
  }
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 bg-slate-900 p-4 text-white md:block">
        <div className="mb-8 text-lg font-bold">Craftagon Admin</div>
        <nav className="flex flex-col gap-1 text-sm">
          {links.map(([l, t]) => (
            <NavLink
              key={t}
              to={t}
              end={t === "/admin"}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 ${isActive ? "bg-accent" : "text-slate-300 hover:bg-slate-800"}`
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
      </aside>
      <div className="flex-1">
        <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
          <span className="font-bold">Admin</span>
          <select className="input w-auto" onChange={(e) => nav(e.target.value)} defaultValue="">
            <option value="" disabled>
              Go to
            </option>
            {links.map(([l, t]) => (
              <option key={t} value={t}>
                {l}
              </option>
            ))}
          </select>
        </div>
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
