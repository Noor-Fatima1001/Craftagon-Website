import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'craftagon-cart';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo(() => {
    function addItem(product, quantity, customizationText) {
      const text = (customizationText || '').trim();
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === product._id && i.customizationText === text
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: Math.min(99, next[idx].quantity + quantity) };
          return next;
        }
        return [
          ...prev,
          {
            productId: product._id,
            slug: product.slug,
            name: product.name,
            image: product.images?.[0] || '',
            quantity,
            customizationText: text,
            preview: product.preview,
          },
        ];
      });
    }
    function updateQty(productId, customizationText, quantity) {
      setItems((prev) =>
        prev
          .map((i) =>
            i.productId === productId && i.customizationText === customizationText
              ? { ...i, quantity }
              : i
          )
          .filter((i) => i.quantity > 0)
      );
    }
    function removeItem(productId, customizationText) {
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.customizationText === customizationText)));
    }
    function clear() {
      setItems([]);
    }
    return { items, addItem, updateQty, removeItem, clear, count: items.reduce((s, i) => s + i.quantity, 0) };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
