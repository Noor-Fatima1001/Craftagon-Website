import { useStore } from '../context/StoreContext';

export default function Faq() {
  const { settings } = useStore();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl">FAQ</h1>
      <div className="mt-6 space-y-4">
        {(settings?.faqs || []).map((f, i) => (
          <div key={i} className="card p-5">
            <p className="font-semibold">{f.question}</p>
            <p className="mt-2 text-sm text-slate-600">{f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
