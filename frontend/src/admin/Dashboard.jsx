import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/api/admin/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading dashboard…</p>;
  const cards = [
    ['Total orders', data.totalOrders],
    ['Pending payments', data.pendingPayments],
    ['Verified payments', data.verifiedPayments],
    ['Cancelled', data.cancelledOrders],
    ['Verified sales', money(data.sales)],
  ];
  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs text-slate-500">{k}</p>
            <p className="mt-1 text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-semibold">Recent orders</h2>
      <div className="mt-3 overflow-x-auto card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="p-3">Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>
          <tbody>
            {data.recent.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-3"><Link className="text-accent" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td>
                <td>{o.customer?.fullName}</td>
                <td>{money(o.pricing?.total)}</td>
                <td>{o.status}</td>
                <td>{o.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
