import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  async function load() {
    const qs = status ? `?status=${status}` : '';
    setOrders(await api.get(`/api/admin/orders${qs}`));
  }
  useEffect(() => { load(); }, [status]);
  async function search(e) {
    e.preventDefault();
    if (q.length >= 3) setOrders(await api.get(`/api/admin/lookup?q=${encodeURIComponent(q)}`));
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['pending_payment', 'payment_submitted', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <form onSubmit={search} className="flex gap-2">
          <input className="input" placeholder="Search name, email, phone, order #" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-outline">Search</button>
        </form>
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="p-3">Order</th><th>Customer</th><th>City</th><th>Total</th><th>Advance</th><th>Status</th><th>Payment</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-3"><Link className="text-accent" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td>
                <td>{o.customer.fullName}<br /><span className="text-xs text-slate-500">{o.customer.phone}</span></td>
                <td>{o.customer.city}</td>
                <td>{money(o.pricing.total)}</td>
                <td>{money(o.pricing.advanceAmount)}</td>
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
