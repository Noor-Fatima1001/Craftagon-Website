import { useEffect, useState } from 'react';
import { api, asset } from '../api';

/* ---------- small UI helpers ---------- */

function Section({ title, hint, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, help, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

function RemoveButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-red-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
    >
      {label}
    </button>
  );
}

/* ---------- page ---------- */

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [smtpConfigured, setSmtp] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api
      .get('/api/admin/settings')
      .then((d) => {
        setSettings(d.settings);
        setSmtp(d.smtpConfigured);
      })
      .catch(() => setError('Could not load settings. Refresh the page to try again.'));
  }, []);

  if (!settings) {
    return error ? (
      <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
    ) : (
      <div className="max-w-3xl space-y-4">
        {[0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse bg-slate-100" />)}
      </div>
    );
  }

  function patch(partial) {
    setMsg('');
    setSettings((s) => ({ ...s, ...partial }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const saved = await api.put('/api/admin/settings', settings);
      setSettings(saved);
      setMsg('Settings saved. Existing orders keep their original prices.');
    } catch (err) {
      setError('Could not save settings. Check the fields and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadBanner(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await api.postForm('/api/admin/uploads/banner', data);
      const banners = [...(settings.banners || [])];
      if (banners[0]) banners[0] = { ...banners[0], image: res.url };
      else banners.push({ image: res.url, title: '', subtitle: '', link: '/products', active: true });
      patch({ banners });
    } catch (err) {
      setError('Banner upload failed. Use a JPG, PNG or WebP image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const accounts = settings.paymentAccounts || [];
  const cityRates = settings.delivery?.cityRates || [];
  const banners = settings.banners || [];
  const faqs = settings.faqs || [];

  const setAccount = (i, change) => {
    const next = [...accounts];
    next[i] = { ...accounts[i], ...change };
    patch({ paymentAccounts: next });
  };
  const setCity = (i, change) => {
    const next = [...cityRates];
    next[i] = { ...cityRates[i], ...change };
    patch({ delivery: { ...settings.delivery, cityRates: next } });
  };
  const setBanner = (i, change) => {
    const next = [...banners];
    next[i] = { ...banners[i], ...change };
    patch({ banners: next });
  };
  const setFaq = (i, change) => {
    const next = [...faqs];
    next[i] = { ...faqs[i], ...change };
    patch({ faqs: next });
  };

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-6 pb-24">
      <div>
        <h1 className="font-display text-3xl">Store settings</h1>
        <p className="mt-1 text-sm text-slate-500">Changes apply to new orders only. Click Save all settings when you are done.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {msg && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</p>}

      {/* Store information */}
      <Section title="Store information" hint="Shown to customers on the storefront and in the footer.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name">
            <input className="input" value={settings.storeName || ''} onChange={(e) => patch({ storeName: e.target.value })} />
          </Field>
          <Field label="Tagline">
            <input className="input" value={settings.tagline || ''} onChange={(e) => patch({ tagline: e.target.value })} />
          </Field>
          <Field label="Public email">
            <input className="input" type="email" value={settings.email || ''} onChange={(e) => patch({ email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="input" value={settings.phone || ''} onChange={(e) => patch({ phone: e.target.value })} />
          </Field>
        </div>
        <Field label="WhatsApp number" help="Include the country code, for example 923000000000. WhatsApp is click-to-chat only. Messages are never sent automatically.">
          <input className="input" value={settings.whatsappNumber || ''} onChange={(e) => patch({ whatsappNumber: e.target.value })} />
        </Field>
        <Field label="Address">
          <textarea className="input" rows="2" value={settings.address || ''} onChange={(e) => patch({ address: e.target.value })} />
        </Field>
        <Field label="About the store">
          <textarea className="input" rows="4" value={settings.about || ''} onChange={(e) => patch({ about: e.target.value })} />
        </Field>
      </Section>

      {/* Banner */}
      <Section title="Homepage banner" hint="The first banner appears at the top of the homepage.">
        {banners[0]?.image && (
          <img alt="Current banner" src={asset(banners[0].image)} className="max-h-48 w-full rounded-lg object-cover ring-1 ring-slate-200" />
        )}
        {banners.map((b, i) => (
          <div key={i} className="space-y-4">
            <Field label="Banner title">
              <input className="input" value={b.title || ''} onChange={(e) => setBanner(i, { title: e.target.value })} />
            </Field>
            <Field label="Banner subtitle">
              <textarea className="input" rows="2" value={b.subtitle || ''} onChange={(e) => setBanner(i, { subtitle: e.target.value })} />
            </Field>
          </div>
        ))}
        <Field label={banners[0]?.image ? 'Replace banner image' : 'Upload banner image'} help="JPG, PNG or WebP.">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadBanner}
            disabled={uploading}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </Field>
        {uploading && <p className="text-sm text-slate-500">Uploading…</p>}
      </Section>

      {/* Delivery */}
      <Section title="Delivery" hint="The nationwide fee applies to any city without its own rate.">
        <div className="sm:w-1/2">
          <Field label="Nationwide fee (PKR)">
            <input
              className="input"
              type="number"
              min="0"
              value={settings.delivery?.nationwideFee ?? 0}
              onChange={(e) => patch({ delivery: { ...settings.delivery, nationwideFee: Number(e.target.value) } })}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">City rates</p>
          {cityRates.length === 0 && <p className="text-sm text-slate-500">No city rates yet.</p>}
          <div className="space-y-2">
            {cityRates.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_8rem_auto] items-center gap-2">
                <input className="input" placeholder="City" aria-label="City" value={r.city} onChange={(e) => setCity(i, { city: e.target.value })} />
                <input className="input" type="number" min="0" placeholder="Fee" aria-label="Fee in PKR" value={r.fee} onChange={(e) => setCity(i, { fee: Number(e.target.value) })} />
                <RemoveButton label="Remove" onClick={() => patch({ delivery: { ...settings.delivery, cityRates: cityRates.filter((_, n) => n !== i) } })} />
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="btn-outline" onClick={() => patch({ delivery: { ...settings.delivery, cityRates: [...cityRates, { city: '', fee: 0 }] } })}>
          Add city rate
        </button>
      </Section>

      {/* Advance payment */}
      <Section title="Advance payment" hint="How much a customer pays up front when placing an order.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <select className="input" value={settings.advance?.type} onChange={(e) => patch({ advance: { ...settings.advance, type: e.target.value } })}>
              <option value="percent">Percentage of discounted subtotal</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </Field>
          <Field label={settings.advance?.type === 'percent' ? 'Percentage (%)' : 'Amount (PKR)'}>
            <input className="input" type="number" min="0" value={settings.advance?.amount} onChange={(e) => patch({ advance: { ...settings.advance, amount: Number(e.target.value) } })} />
          </Field>
          <Field label="Minimum advance (PKR)">
            <input className="input" type="number" min="0" value={settings.advance?.minAmount || 0} onChange={(e) => patch({ advance: { ...settings.advance, minAmount: Number(e.target.value) } })} />
          </Field>
        </div>
      </Section>

      {/* Payment accounts */}
      <Section title="Payment accounts" hint="Customers see active accounts at checkout.">
        {accounts.length === 0 && <p className="text-sm text-slate-500">No payment accounts yet.</p>}
        {accounts.map((a, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{a.method || 'Payment method'}</p>
              <RemoveButton label="Remove account" onClick={() => patch({ paymentAccounts: accounts.filter((_, n) => n !== i) })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Method">
                <input className="input" placeholder="e.g. Easypaisa, JazzCash, Bank" value={a.method} onChange={(e) => setAccount(i, { method: e.target.value })} />
              </Field>
              <Field label="Account holder">
                <input className="input" value={a.holderName} onChange={(e) => setAccount(i, { holderName: e.target.value })} />
              </Field>
            </div>
            <Field label="Account number, IBAN or wallet">
              <input className="input font-mono" value={a.accountNumber} onChange={(e) => setAccount(i, { accountNumber: e.target.value })} />
            </Field>
            <Field label="Instructions for the customer">
              <textarea className="input" rows="2" value={a.instructions} onChange={(e) => setAccount(i, { instructions: e.target.value })} />
            </Field>
            <Check checked={a.active} onChange={(v) => setAccount(i, { active: v })}>Active at checkout</Check>
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => patch({ paymentAccounts: [...accounts, { method: 'New method', holderName: '', accountNumber: '', instructions: '', active: true }] })}>
          Add account
        </button>
      </Section>

      {/* Deadline */}
      <Section title="Payment deadline" hint="How long a customer has to pay after placing an order.">
        <div className="sm:w-1/2">
          <Field label="Deadline (hours)">
            <input className="input" type="number" min="1" value={settings.paymentDeadlineHours} onChange={(e) => patch({ paymentDeadlineHours: Number(e.target.value) })} />
          </Field>
        </div>
        <Check checked={settings.autoCancelEnabled} onChange={(v) => patch({ autoCancelEnabled: v })}>
          Automatically cancel unpaid eligible orders after the deadline
        </Check>
      </Section>

      {/* Email */}
      <Section title="Email notifications">
        <div className={'flex items-center gap-2 rounded-lg p-3 text-sm ' + (smtpConfigured ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900')}>
          <span aria-hidden="true" className={'h-2 w-2 rounded-full ' + (smtpConfigured ? 'bg-emerald-500' : 'bg-amber-500')} />
          {smtpConfigured ? 'SMTP environment variables are present.' : 'SMTP is not configured. The site still runs, but emails will not send.'}
        </div>
        <Check checked={settings.emailEnabled} onChange={(v) => patch({ emailEnabled: v })}>
          Send email notifications when SMTP is configured
        </Check>
      </Section>

      {/* Policies */}
      <Section title="Policies" hint="Shown on the policy pages of your store.">
        <Field label="Shipping policy">
          <textarea className="input" rows="4" value={settings.policies?.shipping || ''} onChange={(e) => patch({ policies: { ...settings.policies, shipping: e.target.value } })} />
        </Field>
        <Field label="Returns policy">
          <textarea className="input" rows="4" value={settings.policies?.returns || ''} onChange={(e) => patch({ policies: { ...settings.policies, returns: e.target.value } })} />
        </Field>
        <Field label="Privacy policy">
          <textarea className="input" rows="4" value={settings.policies?.privacy || ''} onChange={(e) => patch({ policies: { ...settings.policies, privacy: e.target.value } })} />
        </Field>
      </Section>

      {/* FAQs */}
      <Section title="FAQs">
        {faqs.length === 0 && <p className="text-sm text-slate-500">No FAQs yet.</p>}
        {faqs.map((f, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <Field label="Question">
              <input className="input" value={f.question} onChange={(e) => setFaq(i, { question: e.target.value })} />
            </Field>
            <Field label="Answer">
              <textarea className="input" rows="3" value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} />
            </Field>
            <RemoveButton label="Remove FAQ" onClick={() => patch({ faqs: faqs.filter((_, n) => n !== i) })} />
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => patch({ faqs: [...faqs, { question: '', answer: '' }] })}>
          Add FAQ
        </button>
      </Section>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm text-slate-500" aria-live="polite">{msg || error || 'Unsaved changes are lost if you leave this page.'}</p>
          <button type="submit" className="btn-primary disabled:opacity-50" disabled={saving}>
            {saving ? 'Saving…' : 'Save all settings'}
          </button>
        </div>
      </div>
    </form>
  );
}