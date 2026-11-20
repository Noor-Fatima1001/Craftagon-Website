import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiShoppingCart } from 'react-icons/fi';
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
  if (!product) return <p className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-500">Loading product…</p>;

  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const max = product.customization?.maxLength || 24;
  const min = product.customization?.minLength || 1;

  function add() {
    setMsg('');
    if (product.customization?.required && !text.trim()) {
      setMsg('Please enter Name or Short Message');
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

  const inStock = product.stock > 0;
  const added = msg === 'Added to cart';

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <div className="card h-full overflow-hidden md:sticky md:top-24">
        <PreviewCanvas product={product} />
      </div>
      <div className="card h-fit p-6 md:p-8">
        {product.category?.name && (
          <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{product.category.name}</span>
        )}
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{product.name}</h1>
        <p className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-accent">{money(price)}</span>
          {price < product.price && <span className="text-lg text-slate-400 line-through">{money(product.price)}</span>}
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">{product.description}</p>

        <div className="my-6" />

        <label className="label">Name or Short Message</label>
        <input className="input" maxLength={max} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Ayesha" />
        <p className="mt-1.5 text-xs text-slate-500">{text.trim().length}/{max} characters. Image uploads are not available.</p>

        <label className="label mt-5">Quantity</label>
        <input className="input w-28" type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} />

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="btn-primary flex-1 py-3 text-base" onClick={add} disabled={product.stock < 1}>
            <FiShoppingCart /> Add to cart
          </button>
          <Link to="/cart" className="btn-outline py-3">View cart</Link>
        </div>
        {msg && (
          <p className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${added ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {added ? <FiCheckCircle className="shrink-0" /> : <FiAlertCircle className="shrink-0" />}
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}