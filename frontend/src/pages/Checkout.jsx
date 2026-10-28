import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useCart } from '../context/CartContext';

const PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir'];

export default function Checkout() {
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', province: 'Punjab', city: '', address: '', landmark: '', notes: '', couponCode: '',
  });
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useMemo(() => {
    const existing = sessionStorage.getItem('craftagon-order-key');
    if (existing) return existing;
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem('craftagon-order-key', key);
    return key;
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  useEffect(() => {
    if (!items.length) return;
    api
      .post('/api/quote', {
        city: form.city,
        couponCode: form.couponCode,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, customizationText: i.customizationText })),
      })
      .then(setQuote)
      .catch((e) => setError(e.message));
  }, [items, form.city, form.couponCode]);

  if (!items.length) {
    return <p className="mx-auto max-w-3xl px-4 py-16">Your cart is empty. <Link className="text-accent" to="/products">Shop now</Link></p>;
  }

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.post('/api/orders', {
        ...form,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, customizationText: i.customizationText })),
        idempotencyKey,
      });
      sessionStorage.removeItem('craftagon-order-key');
      clear();
      navigate(`/order/${result.order.orderNumber}?token=${result.order.lookupToken}`, { state: result });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
      <div className="md:col-span-2 space-y-3">
        <h1 className="font-display text-3xl">Checkout</h1>
        {['fullName', 'phone', 'email', 'city', 'address', 'landmark'].map((k) => (
          <div key={k}>
            <label className="label capitalize">{k === 'fullName' ? 'Full name' : k === 'phone' ? 'Mobile / WhatsApp' : k === 'landmark' ? 'Nearby landmark (optional)' : k}</label>
            <input className="input" required={k !== 'landmark'} value={form[k]} onChange={(e) => set(k, e.target.value)} />
          </div>
        ))}
        <div>
          <label className="label">Province</label>
          <select className="input" value={form.province} onChange={(e) => set('province', e.target.value)}>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Order notes (optional)</label>
          <textarea className="input" rows="3" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
        <div>
          <label className="label">Coupon code</label>
          <input className="input" value={form.couponCode} onChange={(e) => set('couponCode', e.target.value)} />
        </div>
        {error && <p className="text-red-600">{error}</p>}
      </div>
      <aside className="card h-fit p-5">
        <p className="font-semibold">Order summary</p>
        <ul className="mt-3 space-y-2 text-sm">
          {quote?.items?.map((i) => (
            <li key={`${i.productId}-${i.customizationText}`}>
              {i.name} × {i.quantity}
              <div className="text-slate-500">“{i.customizationText}” · {money(i.lineTotal)}</div>
            </li>
          ))}
        </ul>
        {quote && (
          <ul className="mt-4 space-y-1 border-t pt-3 text-sm">
            <li className="flex justify-between"><span>Subtotal</span><span>{money(quote.pricing.subtotal)}</span></li>
            <li className="flex justify-between"><span>Discount</span><span>{money(quote.pricing.discount)}</span></li>
            <li className="flex justify-between"><span>Delivery</span><span>{money(quote.pricing.deliveryFee)}</span></li>
            <li className="flex justify-between"><span>Advance due now</span><span>{money(quote.pricing.advanceAmount)}</span></li>
            <li className="flex justify-between"><span>Remaining COD</span><span>{money(quote.pricing.remainingCod)}</span></li>
            <li className="flex justify-between font-semibold"><span>Total</span><span>{money(quote.pricing.total)}</span></li>
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">Prices are recalculated on the server. Totals shown here are estimates until the order is created.</p>
        <button className="btn-primary mt-5 w-full" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'}</button>
      </aside>
    </form>
  );
}
