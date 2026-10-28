import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';

export default function AdminPayments() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('under_review');
  async function load() {
    setItems(await api.get(`/api/admin/payments?status=${status}`));
  }
  useEffect(() => { load(); }, [status]);
  return (
    <div>
      <h1 className="font-display text-3xl">Payment review</h1>
      <p className="mt-2 text-sm text-slate-600">Never mark verified from a screenshot alone. Compare with the actual bank/wallet transaction first.</p>
      <select className="input mt-4 w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
        {['under_review', 'pending', 'verified', 'rejected'].map((s) => <option key={s}>{s}</option>)}
      </select>
      <div className="mt-4 space-y-3">
        {items.map((p) => (
          <div key={p._id} className="card p-4 text-sm">
            <p>
              <Link className="text-accent" to={`/admin/orders/${p.order?._id}`}>{p.order?.orderNumber}</Link>
              {' '}· {p.transactionRef} · claimed {money(p.amountClaimed)} · {p.status}
            </p>
            {p.screenshotPath && <img alt="" className="mt-2 max-h-48 rounded" src={`/api/admin/payment-file/${p.screenshotPath.split('/').pop()}`} />}
            {p.status === 'under_review' && (
              <div className="mt-2 flex gap-2">
                <button className="btn-primary" onClick={async () => { await api.post(`/api/admin/payments/${p._id}/review`, { approve: true, notes: 'Verified against received funds' }); await load(); }}>Verify</button>
                <button className="btn-outline" onClick={async () => { await api.post(`/api/admin/payments/${p._id}/review`, { approve: false, notes: 'Could not match transaction' }); await load(); }}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
