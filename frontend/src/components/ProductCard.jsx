import { Link } from 'react-router-dom';
import { mediaUrl, money } from '../api';

export default function ProductCard({ product }) {
  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const onSale = price < product.price;
  return (
    <Link to={`/products/${product.slug}`} className="group card overflow-hidden">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {product.images?.[0] ? (
          <img src={mediaUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-accent">{product.category?.name}</p>
        <h3 className="mt-1 font-medium">{product.name}</h3>
        <p className="mt-2 text-sm">
          <span className="font-semibold">{money(price)}</span>
          {onSale && <span className="ml-2 text-slate-400 line-through">{money(product.price)}</span>}
        </p>
        <p className="mt-1 text-xs text-slate-500">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
      </div>
    </Link>
  );
}
