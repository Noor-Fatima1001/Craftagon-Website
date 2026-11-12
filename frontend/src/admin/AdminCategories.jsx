import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0, active: true });
  const [editing, setEditing] = useState(null);
  async function load() { setItems(await api.get('/api/admin/categories')); }
  useEffect(() => { load(); }, []);
  async function save(e) {
    e.preventDefault();
    if (editing) await api.put(`/api/admin/categories/${editing}`, form);
    else await api.post('/api/admin/categories', form);
    setForm({ name: '', description: '', sortOrder: 0, active: true });
    setEditing(null);
    await load();
  }
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-slate-900">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">Organize your products into categories.</p>
      </div>
      <form onSubmit={save} className="card space-y-4 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">{editing ? 'Edit category' : 'New category'}</h2>
        <input className="input" required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="input min-h-[90px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        <button className="btn-primary w-full sm:w-auto sm:px-8">Save</button>
      </form>
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c._id} className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="font-medium text-slate-900">
              {c.name}
              {!c.active && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">inactive</span>}
            </span>
            <span className="flex gap-1">
              <button className="rounded-lg px-2.5 py-1 font-medium text-accent transition-colors hover:bg-slate-100" onClick={() => { setEditing(c._id); setForm(c); }}>Edit</button>
              <button className="rounded-lg px-2.5 py-1 font-medium text-rose-600 transition-colors hover:bg-rose-50" onClick={async () => { await api.del(`/api/admin/categories/${c._id}`); await load(); }}>Delete</button>
            </span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="card px-4 py-10 text-center text-sm text-slate-500">No categories yet.</li>
        )}
      </ul>
    </div>
  );
}