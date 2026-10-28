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
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Categories</h1>
      <form onSubmit={save} className="card mt-4 space-y-3 p-5">
        <input className="input" required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        <button className="btn-primary">Save</button>
      </form>
      <ul className="mt-6 space-y-2">
        {items.map((c) => (
          <li key={c._id} className="card flex items-center justify-between p-3 text-sm">
            <span>{c.name} {!c.active && '(inactive)'}</span>
            <span className="space-x-3">
              <button className="text-accent" onClick={() => { setEditing(c._id); setForm(c); }}>Edit</button>
              <button className="text-red-600" onClick={async () => { await api.del(`/api/admin/categories/${c._id}`); await load(); }}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
