import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
      <h1 className="font-display text-3xl">Shop</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <input className="input" placeholder="Search products" defaultValue={q} onKeyDown={(e) => e.key === 'Enter' && update('q', e.target.value)} />
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
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {loading ? <p className="mt-8">Loading products…</p> : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
          {!products.length && <p className="text-slate-500">No products match these filters.</p>}
        </div>
      )}
    </div>
  );
}
