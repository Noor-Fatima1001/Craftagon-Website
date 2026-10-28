import { mediaUrl } from '../api';

export default function PreviewCanvas({ product, text, className = '' }) {
  const preview = product?.preview || {};
  const image = product?.images?.[0];
  const value = (text || '').trim();
  if (!image) {
    return (
      <div className={`flex aspect-[9/7] items-center justify-center rounded-2xl bg-slate-100 ${className}`}>
        <p className="px-6 text-center text-slate-500">
          {value ? `Preview: “${value}”` : 'Add custom text to see a preview'}
        </p>
      </div>
    );
  }
  const align = preview.textAlign || 'center';
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      <img src={mediaUrl(image)} alt={product.name} className="aspect-[9/7] w-full object-cover" />
      {preview.enabled !== false && value && (
        <div
          className="pointer-events-none absolute max-w-[80%] -translate-x-1/2 -translate-y-1/2 px-2"
          style={{
            left: `${preview.textX ?? 50}%`,
            top: `${preview.textY ?? 42}%`,
            fontSize: `${preview.fontSize ?? 22}px`,
            fontFamily: preview.fontFamily || 'Georgia, serif',
            color: preview.color || '#1e3a8a',
            textAlign: align,
            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
