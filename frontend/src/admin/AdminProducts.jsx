import { useEffect, useState } from 'react';
import { api, mediaUrl, money } from '../api';

const empty = {
  name: '', description: '', category: '', price: 0, salePrice: '', stock: 0, active: true, featured: false, bestseller: false, images: [],
  customization: { enabled: true, required: true, label: 'Name / Name or Short Message', minLength: 1, maxLength: 24 },
  preview: { enabled: true, textX: 50, textY: 42, fontSize: 22, fontFamily: 'Georgia, serif', color: '#1e3a8a', textAlign: 'center' },
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    setProducts(await api.get('/api/admin/products'));
    setCategories(await api.get('/api/admin/categories'));
  }
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, []);

  function set(path, value) {
    setForm((f) => {
      const next = structuredClone(f);
      const keys = path.split('.');
      let cur = next;
      keys.slice(0, -1).forEach((k) => { cur = cur[k]; });
      cur[keys.at(-1)] = value;
      return next;
    });
  }

  async function upload(e) {
    const files = e.target.files;
    if (!files?.length) return;
    const data = new FormData();
    [...files].forEach((f) => data.append('images', f));
    const res = await api.postForm('/api/admin/uploads/product', data);
    setForm((f) => ({ ...f, images: [...(f.images || []), ...res.urls] }));
  }

  async function save(e) {
    e.preventDefault();
    const payload = { ...form, salePrice: form.salePrice === '' ? null : Number(form.salePrice), price: Number(form.price), stock: Number(form.stock) };
    if (editing) await api.put(`/api/admin/products/${editing}`, payload);
    else await api.post('/api/admin/products', payload);
    setForm(empty);
    setEditing(null);
    setMsg('Product saved');
    await load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-3xl">Products</h1>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
        <div className="mt-4 overflow-x-auto card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left"><tr><th className="p-2">Name</th><th>Price</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-2">{p.name}{!p.active && ' (inactive)'}</td>
                  <td>{money(p.salePrice || p.price)}</td>
                  <td>{p.stock}</td>
                  <td className="space-x-2 p-2">
                    <button className="text-accent" onClick={() => { setEditing(p._id); setForm({ ...empty, ...p, category: p.category?._id || p.category, salePrice: p.salePrice ?? '' }); }}>Edit</button>
                    <button className="text-red-600" onClick={async () => { await api.del(`/api/admin/products/${p._id}`); await load(); }}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form onSubmit={save} className="card space-y-3 p-5">
        <h2 className="font-semibold">{editing ? 'Edit product' : 'Add product'}</h2>
        <input className="input" required placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <select className="input" required value={form.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">Category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input className="input" type="number" placeholder="Price" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <input className="input" type="number" placeholder="Sale price" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} />        
        </div>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Active</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />New Release</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.bestseller} onChange={(e) => set('bestseller', e.target.checked)} /> Bestseller</label>
        <p className="text-sm font-medium">Images</p>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} />
        <div className="flex gap-2">{(form.images || []).map((src) => <img key={src} src={mediaUrl(src)} alt="" className="h-16 w-16 rounded object-cover" />)}</div>
        <p className="text-sm font-medium">Customization</p>
        <input className="input" value={form.customization.label} onChange={(e) => set('customization.label', e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="number" value={form.customization.minLength} onChange={(e) => set('customization.minLength', Number(e.target.value))} />
          <input className="input" type="number" value={form.customization.maxLength} onChange={(e) => set('customization.maxLength', Number(e.target.value))} />
        </div>
        <input className="input" value={form.preview.fontFamily} onChange={(e) => set('preview.fontFamily', e.target.value)} />
        <button className="btn-primary">{editing ? 'Update' : 'Create'}</button>
      </form>
    </div>
  );
}
