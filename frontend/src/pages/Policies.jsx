import { useStore } from '../context/StoreContext';

export default function Policies() {
  const { settings } = useStore();
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <h1 className="font-display text-3xl">Store policies</h1>
      <section><h2 className="font-semibold">Shipping</h2><p className="mt-2 text-slate-600">{settings?.policies?.shipping}</p></section>
      <section><h2 className="font-semibold">Returns</h2><p className="mt-2 text-slate-600">{settings?.policies?.returns}</p></section>
      <section><h2 className="font-semibold">Privacy</h2><p className="mt-2 text-slate-600">{settings?.policies?.privacy}</p></section>
    </div>
  );
}
