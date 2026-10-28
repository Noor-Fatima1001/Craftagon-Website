import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

export default function Layout() {
  const { count } = useCart();
  const { settings } = useStore();
  const name = settings?.storeName || 'Craftagon';
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-display text-2xl text-slate-900">
            {name}
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>Home</NavLink>
            <NavLink to="/products" className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>Shop</NavLink>
            <NavLink to="/faq" className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>FAQ</NavLink>
            <NavLink to="/lookup" className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>Track order</NavLink>
          </nav>
          <Link to="/cart" className="btn-outline relative">
            Cart
            {count > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">{count}</span>
            )}
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
          <div>
            <p className="font-display text-xl">{name}</p>
            <p className="mt-2 text-sm text-slate-600">{settings?.tagline}</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Shop</p>
            <Link className="mt-2 block hover:text-accent" to="/products">All products</Link>
            <Link className="mt-1 block hover:text-accent" to="/lookup">Track an order</Link>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Help</p>
            <Link className="mt-2 block hover:text-accent" to="/faq">FAQ</Link>
            <Link className="mt-1 block hover:text-accent" to="/policies">Policies</Link>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Contact</p>
            <p className="mt-2 text-slate-600">{settings?.email || 'Set store email in admin'}</p>
            <p className="text-slate-600">{settings?.address}</p>
            <p className="mt-3 text-xs text-slate-500">WhatsApp links open a chat. Messages are not sent automatically.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
