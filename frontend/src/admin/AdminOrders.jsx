import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';

// UI only: badge colors for status / paymentStatus
const badgeStyles = {
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  payment_submitted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  confirmed: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  processing: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  dispatched: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  unpaid: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

function Badge({ value }) {
  const style = badgeStyles[value] || 'bg-slate-100 text-slate-700 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${style}`}>
      {String(value || '-').replace(/_/g, ' ')}
    </span>
  );
}

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and track all customer orders.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <select className="input w-full sm:w-52" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['pending_payment', 'payment_submitted', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <form onSubmit={search} className="flex w-full gap-2 sm:w-auto">
          <input
            className="input w-full sm:w-80"
            placeholder="Search name, email, phone, order #"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-outline whitespace-nowrap">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Advance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o._id} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-medium">
                    <Link className="text-accent hover:underline" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-900">{o.customer.fullName}</div>
                    <div className="text-xs text-slate-500">{o.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{o.customer.city}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">{money(o.pricing.total)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{money(o.pricing.advanceAmount)}</td>
                  <td className="px-4 py-3.5"><Badge value={o.status} /></td>
                  <td className="px-4 py-3.5"><Badge value={o.paymentStatus} /></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="text-sm font-medium text-slate-700">No orders found</div>
                    <div className="mt-1 text-xs text-slate-500">Try changing the status filter or search again.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}