import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [smtpConfigured, setSmtp] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/api/admin/settings').then((d) => {
      setSettings(d.settings);
      setSmtp(d.smtpConfigured);
    });
  }, []);

  if (!settings) return <p>Loading settings…</p>;

  function patch(partial) {
    setSettings((s) => ({ ...s, ...partial }));
  }

  async function save(e) {
    e.preventDefault();
    const saved = await api.put('/api/admin/settings', settings);
    setSettings(saved);
    setMsg('Settings saved. Existing orders keep their original prices.');
  }

  async function uploadBanner(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    const res = await api.postForm('/api/admin/uploads/banner', data);
    const banners = [...(settings.banners || [])];
    if (banners[0]) banners[0].image = res.url;
    else banners.push({ image: res.url, title: '', subtitle: '', link: '/products', active: true });
    patch({ banners });
  }

  const accounts = settings.paymentAccounts || [];
  const cityRates = settings.delivery?.cityRates || [];

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <h1 className="font-display text-3xl">Store settings</h1>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Store information</h2>
        <input className="input" value={settings.storeName} onChange={(e) => patch({ storeName: e.target.value })} />
        <input className="input" value={settings.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
        <input className="input" placeholder="Public email" value={settings.email} onChange={(e) => patch({ email: e.target.value })} />
        <input className="input" placeholder="Phone" value={settings.phone} onChange={(e) => patch({ phone: e.target.value })} />
        <input className="input" placeholder="WhatsApp number with country code, e.g. 923000000000" value={settings.whatsappNumber} onChange={(e) => patch({ whatsappNumber: e.target.value })} />
        <textarea className="input" value={settings.address} onChange={(e) => patch({ address: e.target.value })} />
        <textarea className="input" value={settings.about} onChange={(e) => patch({ about: e.target.value })} />
        <p className="text-xs text-slate-500">WhatsApp is click-to-chat only. Messages are never sent automatically.</p>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Homepage banner</h2>
        {(settings.banners || []).map((b, i) => (
          <div key={i} className="space-y-2">
            <input className="input" placeholder="Title" value={b.title || ''} onChange={(e) => {
              const banners = [...settings.banners]; banners[i] = { ...b, title: e.target.value }; patch({ banners });
            }} />
            <textarea className="input" placeholder="Subtitle" value={b.subtitle || ''} onChange={(e) => {
              const banners = [...settings.banners]; banners[i] = { ...b, subtitle: e.target.value }; patch({ banners });
            }} />
          </div>
        ))}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadBanner} />
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Delivery</h2>
        <label className="label">Nationwide fee (PKR)</label>
        <input className="input" type="number" value={settings.delivery?.nationwideFee ?? 0} onChange={(e) => patch({ delivery: { ...settings.delivery, nationwideFee: Number(e.target.value) } })} />
        <p className="text-sm">City rates</p>
        {cityRates.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input className="input" value={r.city} onChange={(e) => {
              const next = [...cityRates]; next[i] = { ...r, city: e.target.value }; patch({ delivery: { ...settings.delivery, cityRates: next } });
            }} />
            <input className="input" type="number" value={r.fee} onChange={(e) => {
              const next = [...cityRates]; next[i] = { ...r, fee: Number(e.target.value) }; patch({ delivery: { ...settings.delivery, cityRates: next } });
            }} />
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => patch({ delivery: { ...settings.delivery, cityRates: [...cityRates, { city: '', fee: 0 }] } })}>Add city rate</button>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Advance payment</h2>
        <select className="input" value={settings.advance?.type} onChange={(e) => patch({ advance: { ...settings.advance, type: e.target.value } })}>
          <option value="percent">Percentage of discounted subtotal</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <input className="input" type="number" value={settings.advance?.amount} onChange={(e) => patch({ advance: { ...settings.advance, amount: Number(e.target.value) } })} />
        <input className="input" type="number" placeholder="Minimum advance" value={settings.advance?.minAmount || 0} onChange={(e) => patch({ advance: { ...settings.advance, minAmount: Number(e.target.value) } })} />
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Payment accounts</h2>
        {accounts.map((a, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <input className="input" value={a.method} onChange={(e) => { const next = [...accounts]; next[i] = { ...a, method: e.target.value }; patch({ paymentAccounts: next }); }} />
            <input className="input" placeholder="Account holder" value={a.holderName} onChange={(e) => { const next = [...accounts]; next[i] = { ...a, holderName: e.target.value }; patch({ paymentAccounts: next }); }} />
            <input className="input" placeholder="Account / IBAN / wallet" value={a.accountNumber} onChange={(e) => { const next = [...accounts]; next[i] = { ...a, accountNumber: e.target.value }; patch({ paymentAccounts: next }); }} />
            <textarea className="input" placeholder="Instructions" value={a.instructions} onChange={(e) => { const next = [...accounts]; next[i] = { ...a, instructions: e.target.value }; patch({ paymentAccounts: next }); }} />
            <label className="text-sm"><input type="checkbox" checked={a.active} onChange={(e) => { const next = [...accounts]; next[i] = { ...a, active: e.target.checked }; patch({ paymentAccounts: next }); }} /> Active</label>
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => patch({ paymentAccounts: [...accounts, { method: 'New method', holderName: '', accountNumber: '', instructions: '', active: true }] })}>Add account</button>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Payment deadline</h2>
        <input className="input" type="number" min="1" value={settings.paymentDeadlineHours} onChange={(e) => patch({ paymentDeadlineHours: Number(e.target.value) })} />
        <label className="text-sm"><input type="checkbox" checked={settings.autoCancelEnabled} onChange={(e) => patch({ autoCancelEnabled: e.target.checked })} /> Automatically cancel unpaid eligible orders after the deadline</label>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Email</h2>
        <p className="text-sm">{smtpConfigured ? 'SMTP environment variables are present.' : 'SMTP is not configured. The site still runs; emails will not send.'}</p>
        <label className="text-sm"><input type="checkbox" checked={settings.emailEnabled} onChange={(e) => patch({ emailEnabled: e.target.checked })} /> Enable email notifications when SMTP is configured</label>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Policies</h2>
        <textarea className="input" rows="3" value={settings.policies?.shipping} onChange={(e) => patch({ policies: { ...settings.policies, shipping: e.target.value } })} />
        <textarea className="input" rows="3" value={settings.policies?.returns} onChange={(e) => patch({ policies: { ...settings.policies, returns: e.target.value } })} />
        <textarea className="input" rows="3" value={settings.policies?.privacy} onChange={(e) => patch({ policies: { ...settings.policies, privacy: e.target.value } })} />
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">FAQs</h2>
        {(settings.faqs || []).map((f, i) => (
          <div key={i} className="space-y-2">
            <input className="input" value={f.question} onChange={(e) => {
              const faqs = [...settings.faqs]; faqs[i] = { ...f, question: e.target.value }; patch({ faqs });
            }} />
            <textarea className="input" value={f.answer} onChange={(e) => {
              const faqs = [...settings.faqs]; faqs[i] = { ...f, answer: e.target.value }; patch({ faqs });
            }} />
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => patch({ faqs: [...(settings.faqs || []), { question: '', answer: '' }] })}>Add FAQ</button>
      </section>
      <button className="btn-primary">Save all settings</button>
    </form>
  );
}
