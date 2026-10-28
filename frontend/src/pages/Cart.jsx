import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { useCart } from '../context/CartContext';
import PreviewCanvas from '../components/PreviewCanvas';

export default function Cart() {
  const { items, updateQty, removeItem } = useCart();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      return;
    }
    api
      .post('/api/quote', { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, customizationText: i.customizationText })) })
      .then(setQuote)
      .catch((e) => setError(e.message));
  }, [items]);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link to="/products" className="btn-primary mt-6">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl">Cart</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => {
            const qItem = quote?.items?.find((q) => q.productId === item.productId && q.customizationText === item.customizationText);
            return (
              <div key={`${item.productId}-${item.customizationText}`} className="card grid gap-4 p-4 md:grid-cols-4">
                <PreviewCanvas product={{ ...item, images: [item.image], name: item.name }} text={item.customizationText} />
                <div className="md:col-span-3">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-500">Custom text: {item.customizationText || '—'}</p>
                  <p className="mt-1 text-sm">{qItem ? money(qItem.unitPrice) : '…'}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <input className="input w-20" type="number" min="1" value={item.quantity} onChange={(e) => updateQty(item.productId, item.customizationText, Number(e.target.value))} />
                    <button className="text-sm text-red-600" onClick={() => removeItem(item.productId, item.customizationText)}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <aside className="card h-fit p-5">
          <p className="font-semibold">Summary</p>
          {quote ? (
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex justify-between"><span>Subtotal</span><span>{money(quote.pricing.subtotal)}</span></li>
              <li className="flex justify-between"><span>Delivery</span><span>{money(quote.pricing.deliveryFee)}</span></li>
              <li className="flex justify-between"><span>Advance due</span><span>{money(quote.pricing.advanceAmount)}</span></li>
              <li className="flex justify-between"><span>Remaining COD</span><span>{money(quote.pricing.remainingCod)}</span></li>
              <li className="flex justify-between font-semibold"><span>Total</span><span>{money(quote.pricing.total)}</span></li>
            </ul>
          ) : <p className="mt-3 text-sm">Calculating…</p>}
          <Link to="/checkout" className="btn-primary mt-5 w-full">Checkout</Link>
        </aside>
      </div>
    </div>
  );
}
