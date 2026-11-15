import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/api/home').then(setData).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="mx-auto max-w-6xl px-4 py-16 text-red-600">{error}</p>;
  if (!data) return <p className="mx-auto max-w-6xl px-4 py-16">Loading store…</p>;
  const banner = data.settings.banners?.[0];
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Custom print gifts</p>
            <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              {banner?.title || data.settings.storeName}
            </h1>
            <p className="mt-4 max-w-lg text-slate-600">{banner?.subtitle || data.settings.tagline}</p>
            <Link to="/products" className="btn-primary mt-6">Shop products</Link>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="font-display text-2xl">How it works</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li>1. Choose a pen, mug, tumbler, diary, or gift.</li>
              <li>2. Type a name or short line and watch the live preview.</li>
              <li>3. Pay the advance by bank, Easypaisa, or JazzCash.</li>
              <li>4. Upload the screenshot. We verify it by hand before dispatch.</li>
            </ol>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-3xl">Categories</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {data.categories.map((c) => (
            <Link key={c._id} to={`/products?category=${c._id}`} className="card p-5 hover:border-accent">
              <p className="font-semibold">{c.name}</p>
              <p className="mt-1 text-sm text-slate-500">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-3xl">New Release</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {data.featured.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 pb-16">
        <h2 className="font-display text-3xl">Bestsellers</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {data.bestsellers.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
