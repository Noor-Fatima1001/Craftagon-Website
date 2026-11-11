import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { api } from '../api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';

  useEffect(() => {
    api.get('/api/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ q, category, sort });
    api
      .get(`/api/products?${qs}`)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, category, sort]);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Shop</h1>
      <p className="mt-2 text-slate-600">Pick a product and add your own text.</p>
      <div className="card mt-6 grid gap-3 p-4 md:grid-cols-3">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search products (press Enter)" defaultValue={q} onKeyDown={(e) => e.key === 'Enter' && update('q', e.target.value)} />
        </div>
        <select className="input" value={category} onChange={(e) => update('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input" value={sort} onChange={(e) => update('sort', e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>
      {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-red-600">{error}</p>}
      {loading ? <p className="mt-10 text-center text-slate-500">Loading products…</p> : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
          {!products.length && (
            <div className="card col-span-full flex flex-col items-center gap-2 p-12 text-center text-slate-500">
              <FiSearch className="text-3xl text-slate-300" />
              No products match these filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}