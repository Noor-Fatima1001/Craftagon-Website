import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money } from '../api';
import PreviewCanvas from '../components/PreviewCanvas';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [text, setText] = useState('');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/products/${slug}`).then(setProduct).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="mx-auto max-w-6xl px-4 py-16 text-red-600">{error}</p>;
  if (!product) return <p className="mx-auto max-w-6xl px-4 py-16">Loading product…</p>;

  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const max = product.customization?.maxLength || 24;
  const min = product.customization?.minLength || 1;

  function add() {
    setMsg('');
    if (product.customization?.required && !text.trim()) {
      setMsg('Please enter custom text');
      return;
    }
    if (text.trim().length < min || text.trim().length > max) {
      setMsg(`Text must be ${min}–${max} characters`);
      return;
    }
    if (product.stock < 1) {
      setMsg('This product is out of stock');
      return;
    }
    addItem(product, qty, text);
    setMsg('Added to cart');
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <PreviewCanvas product={product} text={text} />
      <div>
        <p className="text-sm text-accent">{product.category?.name}</p>
        <h1 className="mt-1 font-display text-4xl">{product.name}</h1>
        <p className="mt-3 text-xl font-semibold">
          {money(price)}
          {price < product.price && <span className="ml-2 text-base font-normal text-slate-400 line-through">{money(product.price)}</span>}
        </p>
        <p className="mt-2 text-sm text-slate-500">{product.stock > 0 ? `In stock · ${product.stock} available` : 'Out of stock'}</p>
        <p className="mt-4 text-slate-600">{product.description}</p>
        <label className="label mt-6">{product.customization?.label || 'Custom text'}</label>
        <input className="input" maxLength={max} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Ayesha" />
        <p className="mt-1 text-xs text-slate-500">{text.trim().length}/{max} characters. Image uploads are not available.</p>
        <label className="label mt-4">Quantity</label>
        <input className="input w-28" type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <div className="mt-6 flex gap-3">
          <button className="btn-primary" onClick={add} disabled={product.stock < 1}>Add to cart</button>
          <Link to="/cart" className="btn-outline">View cart</Link>
        </div>
        {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
      </div>
    </div>
  );
}
