import { useEffect, useState } from 'react';
import { api, money } from '../api';

export default function AdminReports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/api/admin/reports').then(setData); }, []);
  if (!data) return <p>Loading reports…</p>;
  return (
    <div>
      <h1 className="font-display text-3xl">Sales reports</h1>
      <p className="mt-2 text-sm text-slate-500">Last 30 days unless you change the API query.</p>
      <h2 className="mt-6 font-semibold">By status</h2>
      <ul className="mt-2 text-sm">{data.byStatus.map((r) => <li key={r._id}>{r._id}: {r.count} orders · {money(r.total)}</li>)}</ul>
      <h2 className="mt-6 font-semibold">Daily verified sales</h2>
      <ul className="mt-2 text-sm">{data.daily.map((r) => <li key={r._id}>{r._id}: {r.orders} · {money(r.sales)}</li>)}</ul>
    </div>
  );
}
