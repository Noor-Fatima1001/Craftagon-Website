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

  if (!me && !error) return <p className="p-8">Checking session…</p>;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="border-b bg-white md:min-h-screen md:w-56 md:border-b-0 md:border-r">
        <p className="px-4 py-4 font-display text-xl">Craftagon Admin</p>
        <nav className="flex flex-wrap md:flex-col">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) => `px-4 py-2 text-sm ${isActive ? 'text-accent font-semibold' : 'text-slate-600'}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="m-4 text-sm text-red-600"
          onClick={async () => {
            await api.post('/api/auth/logout', {});
            navigate('/admin/login');
          }}
        >
          Log out
        </button>
        {me?.smtpConfigured === false && <p className="px-4 pb-4 text-xs text-amber-700">SMTP is not configured. Emails will not send.</p>}
      </aside>
      <div className="flex-1 p-4 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
