import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, money } from '../api';
import WhatsAppButton from '../components/WhatsAppButton';

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
  if (!data) return <p>{msg || 'Loading…'}</p>;
  const { order, payments, whatsappUrl } = data;

  async function setStatus(status) {
    await api.put(`/api/admin/orders/${order._id}/status`, { status, courier, trackingNumber: tracking });
    await load();
  }

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="font-display text-3xl">{order.orderNumber}</h1>
      <p className="text-sm">{order.status} · payment {order.paymentStatus}</p>
      {order.cancellation?.at && <p className="text-red-600">Cancelled: {order.cancellation.reason} at {new Date(order.cancellation.at).toLocaleString()}</p>}
      <div className="card p-4 text-sm">
        <p className="font-semibold">{order.customer.fullName}</p>
        <p>{order.customer.phone} · {order.customer.email}</p>
        <p>{order.customer.address}, {order.customer.city}, {order.customer.province}</p>
        <p>Landmark: {order.customer.landmark || '—'}</p>
        <p>Notes: {order.customer.notes || '—'}</p>
      </div>
      <div className="card p-4 text-sm">
        {order.items.map((i) => (
          <p key={`${i.name}-${i.customizationText}`}>{i.name} × {i.quantity} — “{i.customizationText}” — {money(i.lineTotal)}</p>
        ))}
        <p className="mt-3">Subtotal {money(order.pricing.subtotal)} · Discount {money(order.pricing.discount)} · Delivery {money(order.pricing.deliveryFee)}</p>
        <p>Advance {money(order.pricing.advanceAmount)} · COD {money(order.pricing.remainingCod)} · Total {money(order.pricing.total)}</p>
      </div>
      <div className="card p-4">
        <p className="font-semibold">Payments</p>
        {payments.map((p) => (
          <div key={p._id} className="mt-3 border-t pt-3 text-sm">
            <p>{p.method} · {p.transactionRef} · {p.status} · claimed {money(p.amountClaimed)}</p>
            {p.screenshotPath && (
              <img alt="Payment proof" className="mt-2 max-h-64 rounded" src={`/api/admin/payment-file/${p.screenshotPath.split('/').pop()}`} />
            )}
            {p.status === 'under_review' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <input className="input" placeholder="Review notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <button className="btn-primary" onClick={async () => { await api.post(`/api/admin/payments/${p._id}/review`, { approve: true, notes }); await load(); }}>Verify (after comparing the real transaction)</button>
                <button className="btn-outline" onClick={async () => { await api.post(`/api/admin/payments/${p._id}/review`, { approve: false, notes }); await load(); }}>Reject</button>
              </div>
            )}
          </div>
        ))}
        {!payments.length && <p className="mt-2 text-sm text-slate-500">No payment proof yet.</p>}
      </div>
      <div className="card space-y-2 p-4">
        <p className="font-semibold">Dispatch</p>
        <input className="input" placeholder="Courier name" value={courier} onChange={(e) => setCourier(e.target.value)} />
        <input className="input" placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={() => setStatus('processing')}>Mark processing</button>
          <button className="btn-primary" onClick={() => setStatus('dispatched')}>Mark dispatched</button>
          <button className="btn-outline" onClick={() => setStatus('delivered')}>Mark delivered</button>
          <button className="btn-outline" onClick={async () => { await api.post(`/api/admin/orders/${order._id}/cancel`, { reason: 'Cancelled by admin' }); await load(); }}>Cancel order</button>
        </div>
      </div>
      <WhatsAppButton url={whatsappUrl}>Open prefilled WhatsApp message</WhatsAppButton>
      <div className="text-xs text-slate-500">
        History:
        {order.history?.map((h, i) => <p key={i}>{new Date(h.at).toLocaleString()} — {h.message} ({h.by})</p>)}
      </div>
    </div>
  );
}
