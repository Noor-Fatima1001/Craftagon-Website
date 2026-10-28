import { useEffect, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api, money } from '../api';
import WhatsAppButton from '../components/WhatsAppButton';
import { useStore } from '../context/StoreContext';

export default function OrderPage() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const token = params.get('token') || location.state?.order?.lookupToken;
  const { settings } = useStore();
  const [data, setData] = useState(location.state ? { order: location.state.order, whatsappUrl: location.state.whatsappUrl, payments: [] } : null);
  const [error, setError] = useState('');
  const [refNo, setRefNo] = useState('');
  const [method, setMethod] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('This order link is incomplete. Use the Track order page with your private token.');
      return;
    }
    api.get(`/api/orders/${orderNumber}?token=${encodeURIComponent(token)}`).then(setData).catch((e) => setError(e.message));
  }, [orderNumber, token]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-16 text-red-600">{error}</p>;
  if (!data?.order) return <p className="mx-auto max-w-3xl px-4 py-16">Loading order…</p>;
  const order = data.order;
  const thankYou = location.state?.order;

  async function submitProof(e) {
    e.preventDefault();
    if (uploading) return;
    setUploading(true);
    setMsg('');
    try {
      const form = new FormData();
      form.append('token', token);
      form.append('transactionRef', refNo);
      form.append('method', method);
      form.append('screenshot', file);
      const res = await api.postForm(`/api/orders/${orderNumber}/payment`, form);
      setMsg(res.message);
      const fresh = await api.get(`/api/orders/${orderNumber}?token=${encodeURIComponent(token)}`);
      setData(fresh);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {thankYou && <h1 className="font-display text-4xl">Thank you</h1>}
      <p className="mt-2 text-slate-600">Order <strong>{order.orderNumber}</strong> · {order.status.replace('_', ' ')} · payment {order.paymentStatus.replace('_', ' ')}</p>
      {order.paymentDeadlineAt && order.status !== 'cancelled' && (
        <p className="mt-1 text-sm">Pay the advance before {new Date(order.paymentDeadlineAt).toLocaleString()} or the order may be cancelled.</p>
      )}
      <div className="card mt-6 p-5 text-sm">
        {order.items.map((i) => (
          <div key={`${i.name}-${i.customizationText}`} className="flex justify-between border-b py-2">
            <span>{i.name} × {i.quantity}<br /><span className="text-slate-500">“{i.customizationText}”</span></span>
            <span>{money(i.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-3 space-y-1">
          <p className="flex justify-between"><span>Subtotal</span><span>{money(order.pricing.subtotal)}</span></p>
          <p className="flex justify-between"><span>Discount</span><span>{money(order.pricing.discount)}</span></p>
          <p className="flex justify-between"><span>Delivery</span><span>{money(order.pricing.deliveryFee)}</span></p>
          <p className="flex justify-between"><span>Advance due</span><span>{money(order.pricing.advanceAmount)}</span></p>
          <p className="flex justify-between"><span>Remaining COD</span><span>{money(order.pricing.remainingCod)}</span></p>
          <p className="flex justify-between font-semibold"><span>Total</span><span>{money(order.pricing.total)}</span></p>
        </div>
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-semibold">Pay the advance manually</h2>
        <p className="mt-1 text-sm text-slate-600">Transfer {money(order.pricing.advanceAmount)} using one of these accounts, then upload a screenshot. We compare this with the actual received transaction before marking it verified.</p>
        <ul className="mt-3 space-y-3 text-sm">
          {(settings?.paymentAccounts || []).map((a) => (
            <li key={a.method} className="rounded-lg bg-slate-50 p-3">
              <strong>{a.method}</strong> — {a.holderName}<br />
              {a.accountNumber}<br />
              {a.instructions}
            </li>
          ))}
        </ul>
      </div>
      {order.status !== 'cancelled' && order.paymentStatus !== 'verified' && (
        <form onSubmit={submitProof} className="card mt-6 space-y-3 p-5">
          <h2 className="font-semibold">Submit payment proof</h2>
          <select className="input" required value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">Payment method used</option>
            {(settings?.paymentAccounts || []).map((a) => <option key={a.method}>{a.method}</option>)}
          </select>
          <input className="input" required placeholder="Transaction / reference number" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
          <input className="input" required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0])} />
          <p className="text-xs text-slate-500">JPEG, PNG or WebP, max 2MB. Screenshots do not auto-verify payment.</p>
          <button className="btn-primary" disabled={uploading}>{uploading ? 'Uploading…' : 'Submit proof'}</button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <WhatsAppButton url={data.whatsappUrl}>WhatsApp the store about this order</WhatsAppButton>
      </div>
      <p className="mt-3 text-xs text-slate-500">Save this page URL. It includes a private token so others cannot guess your order.</p>
      {location.state?.emailSent === false && (
        <p className="mt-2 text-sm text-amber-700">Email was not sent{location.state.emailReason ? `: ${location.state.emailReason}` : '. SMTP may be unconfigured'}.</p>
      )}
    </div>
  );
}
