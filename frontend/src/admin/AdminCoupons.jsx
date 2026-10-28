import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminCoupons() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, minOrder: 0, maxUses: 0, active: true });
  async function load() { setItems(await api.get('/api/admin/coupons')); }
  useEffect(() => { load(); }, []);
  async function save(e) {
    e.preventDefault();
    await api.post('/api/admin/coupons', form);
    setForm({ code: '', type: 'percent', value: 10, minOrder: 0, maxUses: 0, active: true });
    await load();
  }
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Coupons</h1>
      <form onSubmit={save} className="card mt-4 space-y-3 p-5">
        <input className="input" required placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percent">Percent</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <input className="input" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Min order" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Max uses (0 = unlimited)" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} />
        <button className="btn-primary">Create coupon</button>
      </form>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((c) => (
          <li key={c._id} className="card flex justify-between p-3">
            <span>{c.code} · {c.type} {c.value} · used {c.usedCount}</span>
            <button className="text-accent" onClick={async () => { await api.put(`/api/admin/coupons/${c._id}`, { active: !c.active }); await load(); }}>{c.active ? 'Disable' : 'Enable'}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
