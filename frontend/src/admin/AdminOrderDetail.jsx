import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, money } from '../api';
import WhatsAppButton from '../components/WhatsAppButton';

// UI only: status badge colors
const badgeStyles = {
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  payment_submitted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  confirmed: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  processing: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  dispatched: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  unpaid: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  under_review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

function Badge({ value }) {
  const style = badgeStyles[value] || 'bg-slate-100 text-slate-700 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${style}`}>
      {String(value || '-').replace(/_/g, ' ')}
    </span>
  );
}

function Section({ title, children, className = '' }) {
  return (
    <div className={`card space-y-4 p-5 sm:p-6 ${className}`}>
      {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
      {children}
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');

  async function load() {
    const res = await api.get(`/api/admin/orders/${id}`);
    setData(res);
    setCourier(res.order.tracking?.courier || '');
    setTracking(res.order.tracking?.trackingNumber || '');
  }
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, [id]);
  if (!data) return <p className="py-10 text-center text-sm text-slate-500">{msg || 'Loading…'}</p>;
  const { order, payments, whatsappUrl } = data;

  async function setStatus(status) {
    await api.put(`/api/admin/orders/${order._id}/status`, { status, courier, trackingNumber: tracking });
    await load();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl tracking-tight text-slate-900">{order.orderNumber}</h1>
          <Badge value={order.status} />
          <Badge value={order.paymentStatus} />
        </div>
        <p className="mt-1 text-sm text-slate-500">{order.status} · payment {order.paymentStatus}</p>
      </div>

      {order.cancellation?.at && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Cancelled: {order.cancellation.reason} at {new Date(order.cancellation.at).toLocaleString()}
        </p>
      )}

      <Section title="Customer">
        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{order.customer.fullName}</p>
          <p>{order.customer.phone} · {order.customer.email}</p>
          <p>{order.customer.address}, {order.customer.city}, {order.customer.province}</p>
          <p className="text-slate-600">Landmark: {order.customer.landmark || '—'}</p>
          <p className="text-slate-600">Notes: {order.customer.notes || '—'}</p>
        </div>
      </Section>

      <Section title="Items and pricing">
        <div className="divide-y divide-slate-100 text-sm text-slate-700">
          {order.items.map((i) => (
            <p key={`${i.name}-${i.customizationText}`} className="py-3 first:pt-0">
              <span className="font-medium text-slate-900">{i.name}</span> × {i.quantity} — “{i.customizationText}” — <span className="font-semibold text-slate-900">{money(i.lineTotal)}</span>
            </p>
          ))}
        </div>
        <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p>Subtotal {money(order.pricing.subtotal)} · Discount {money(order.pricing.discount)} · Delivery {money(order.pricing.deliveryFee)}</p>
          <p>Advance {money(order.pricing.advanceAmount)} · COD {money(order.pricing.remainingCod)} · <span className="font-semibold text-slate-900">Total {money(order.pricing.total)}</span></p>
        </div>
      </Section>

      <Section title="Payments">
        {payments.map((p) => (
          <div key={p._id} className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
            <p className="flex flex-wrap items-center gap-2">{p.method} · {p.transactionRef} · <Badge value={p.status} /> · claimed {money(p.amountClaimed)}</p>
            {p.screenshotPath && (
              <img alt="Payment proof" className="mt-2 max-h-64 rounded-lg border border-slate-200" src={api.paymentShot(p._id)} />
            )}
            {p.status === 'under_review' && (
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
                <input className="input w-full sm:w-64" placeholder="Review notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <button className="btn-primary" onClick={async () => { await api.post(`/api/admin/payments/${p._id}/review`, { approve: true, notes }); await load(); }}>Verify (after comparing the real transaction)</button>
                <button className="btn-outline !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={async () => { await api.post(`/api/admin/payments/${p._id}/review`, { approve: false, notes }); await load(); }}>Reject</button>
              </div>
            )}
          </div>
        ))}
        {!payments.length && <p className="text-sm text-slate-500">No payment proof yet.</p>}
      </Section>

      <Section title="Dispatch">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Courier name" value={courier} onChange={(e) => setCourier(e.target.value)} />
          <input className="input" placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={() => setStatus('processing')}>Mark processing</button>
          <button className="btn-primary" onClick={() => setStatus('dispatched')}>Mark dispatched</button>
          <button className="btn-outline" onClick={() => setStatus('delivered')}>Mark delivered</button>
          <button className="btn-outline !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={async () => { await api.post(`/api/admin/orders/${order._id}/cancel`, { reason: 'Cancelled by admin' }); await load(); }}>Cancel order</button>
        </div>
      </Section>

      <WhatsAppButton url={whatsappUrl}>Open prefilled WhatsApp message</WhatsAppButton>

      <Section title="History">
        <ol className="space-y-2 border-l-2 border-slate-200 pl-4 text-xs text-slate-600">
          {order.history?.map((h, i) => <li key={i}>{new Date(h.at).toLocaleString()} — {h.message} ({h.by})</li>)}
        </ol>
      </Section>
    </div>
  );
}