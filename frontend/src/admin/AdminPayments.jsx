import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';

const STATUSES = [
  { value: 'under_review', label: 'Under review' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const BADGE = {
  under_review: 'bg-amber-100 text-amber-800',
  pending: 'bg-slate-100 text-slate-700',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const label = (s) => STATUSES.find((x) => x.value === s)?.label || s;

export default function AdminPayments() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('under_review');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await api.get(`/api/admin/payments?status=${status}`));
    } catch (e) {
      setError('Could not load payments. Check your connection and try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  async function review(p, approve) {
    setBusyId(p._id);
    try {
      await api.post(`/api/admin/payments/${p._id}/review`, {
        approve,
        notes: approve ? 'Verified against received funds' : 'Could not match transaction',
      });
      await load();
    } catch (e) {
      setError(approve ? 'Could not verify this payment.' : 'Could not reject this payment.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl">Payment review</h1>

      <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <span aria-hidden="true" className="mt-0.5 text-base leading-none">!</span>
        <p>
          Never mark a payment verified from a screenshot alone. Match it with the actual bank or wallet transaction first.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Payment status">
        {STATUSES.map((s) => {
          const active = s.value === status;
          return (
            <button
              key={s.value}
              role="tab"
              aria-selected={active}
              onClick={() => setStatus(s.value)}
              className={
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
                (active
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-24 animate-pulse bg-slate-100" />
            ))}
          </>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-medium text-slate-800">No {label(status).toLowerCase()} payments</p>
            <p className="mt-1 text-sm text-slate-500">New payments will show up here as customers submit them.</p>
          </div>
        )}

        {!loading &&
          items.map((p) => (
            <div key={p._id} className="card p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    className="text-base font-semibold text-accent hover:underline"
                    to={`/admin/orders/${p.order?._id}`}
                  >
                    {p.order?.orderNumber || 'Order'}
                  </Link>
                  <p className="mt-1 text-slate-500">
                    Transaction ref: <span className="font-mono text-slate-800">{p.transactionRef || 'Not provided'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">{money(p.amountClaimed)}</p>
                  <span className={'mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ' + (BADGE[p.status] || BADGE.pending)}>
                    {label(p.status)}
                  </span>
                </div>
              </div>

              {p.screenshotPath && (
                <button
                  type="button"
                  onClick={() => setPreview(`/api/admin/payment-file/${p.screenshotPath.split('/').pop()}`)}
                  className="mt-3 block overflow-hidden rounded-lg ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2"
                  aria-label="View payment screenshot full size"
                >
                  <img
                    alt="Payment screenshot"
                    className="max-h-40 w-auto object-cover"
                    src={`/api/admin/payment-file/${p.screenshotPath.split('/').pop()}`}
                  />
                </button>
              )}

              {p.status === 'under_review' && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    className="btn-primary disabled:opacity-50"
                    disabled={busyId === p._id}
                    onClick={() => review(p, true)}
                  >
                    {busyId === p._id ? 'Saving…' : 'Verify payment'}
                  </button>
                  <button
                    className="btn-outline disabled:opacity-50"
                    disabled={busyId === p._id}
                    onClick={() => review(p, false)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <img alt="Payment screenshot" src={preview} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}