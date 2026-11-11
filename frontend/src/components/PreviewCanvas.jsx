import { mediaUrl } from '../api';

export default function PreviewCanvas({ product, text, className = '' }) {
  const preview = product?.preview || {};
  const image = product?.images?.[0];
  const value = (text || '').trim();

  if (!image) {
    return (
      <div className={`flex h-80 w-full items-center justify-center rounded-2xl bg-slate-100 ${className}`}>
        <p className="px-6 text-center text-slate-500">
          {value ? `Preview: “${value}”` : 'Add custom text to see a preview'}
        </p>
      </div>
    );
  }

  const align = preview.textAlign || 'center';

  return (
  <div className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      <img
        src={mediaUrl(image)}
        alt={product.name}
        className="h-full w-full object-cover"
      />
    </div>
  );
}