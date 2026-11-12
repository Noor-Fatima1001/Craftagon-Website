import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';

const links = [
  ['/admin', 'Dashboard'],
  ['/admin/orders', 'Orders'],
  ['/admin/payments', 'Payments'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/coupons', 'Coupons'],
  ['/admin/settings', 'Settings'],
  ['/admin/reports', 'Reports'],
  ['/admin/profile', 'Profile'],
];

export default function AdminLayout() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/auth/me').then(setMe).catch(() => navigate('/admin/login'));
  }, [navigate]);

  if (!me && !error) return <p className="p-8 text-sm text-slate-500">Checking session…</p>;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="flex flex-col bg-slate-900 text-slate-300 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 md:py-6">
          <p className="font-display text-xl tracking-tight text-white">Craftagon <span className="text-slate-400">Admin</span></p>
          <button
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-300 transition-colors hover:bg-white/10 md:hidden"
            onClick={async () => {
              await api.post('/api/auth/logout', {});
              navigate('/admin/login');
            }}
          >
            Log out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-white/10 font-semibold text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-3 pb-5 pt-6 md:mt-auto md:block">
          {me?.smtpConfigured === false && (
            <p className="mb-3 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300">SMTP is not configured. Emails will not send.</p>
          )}
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-300 transition-colors hover:bg-white/10"
            onClick={async () => {
              await api.post('/api/auth/logout', {});
              navigate('/admin/login');
            }}
          >
            Log out
          </button>
        </div>
        {me?.smtpConfigured === false && (
          <p className="mx-4 mb-3 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300 md:hidden">SMTP is not configured. Emails will not send.</p>
        )}
      </aside>
      <div className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}