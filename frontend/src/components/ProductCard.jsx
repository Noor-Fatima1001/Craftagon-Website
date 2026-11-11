import { Link } from 'react-router-dom';
import { FiImage } from 'react-icons/fi';
import { mediaUrl, money } from '../api';

export default function ProductCard({ product }) {
  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const onSale = price < product.price;
  return (
    <Link to={`/products/${product.slug}`} className="group card card-hover relative overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {product.images?.[0] ? (
          <img src={mediaUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
            <FiImage className="text-2xl" />
            <span className="text-sm">No image</span>
          </div>
        )}
        {onSale && <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow">Sale</span>}
        {product.stock < 1 && <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-accent">{product.category?.name}</p>
        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900 group-hover:text-accent">{product.name}</h3>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">{money(price)}</span>
          {onSale && <span className="text-sm text-slate-400 line-through">{money(product.price)}</span>}
        </p>
        <p className={`mt-1 text-xs ${product.stock > 0 ? 'text-slate-500' : 'text-red-500'}`}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
      </div>
    </Link>
  );
}