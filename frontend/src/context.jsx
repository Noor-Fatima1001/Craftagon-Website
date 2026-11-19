import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const CartCtx = createContext(null);
const StoreCtx = createContext(null);
const AuthCtx = createContext(null);

function sameItem(a, b) {
  return (
    a.productId === b.productId &&
    (a.customText || "") === (b.customText || "") &&
    (a.customFont || "") === (b.customFont || "") &&   // <-- new
    (a.colorVariantId || "") === (b.colorVariantId || "")
  );
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("craftagon_cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("craftagon_cart", JSON.stringify(items));
  }, [items]);

  const apiCart = useMemo(
    () => ({
      items,
      count: items.reduce((s, i) => s + Number(i.quantity || 0), 0),
      add(item) {
        setItems((prev) => {
          const i = prev.findIndex((p) => sameItem(p, item));
          if (i >= 0) {
            const next = [...prev];
            next[i] = { ...next[i], ...item, quantity: next[i].quantity + item.quantity };
            return next;
          }
          return [...prev, item];
        });
      },
      update(index, quantity) {
        setItems((prev) =>
          prev.map((it, i) => (i === index ? { ...it, quantity } : it)).filter((it) => it.quantity > 0)
        );
      },
      remove(index) {
        setItems((prev) => prev.filter((_, i) => i !== index));
      },
      clear() {
        setItems([]);
      },
    }),
    [items]
  );

  return <CartCtx.Provider value={apiCart}>{children}</CartCtx.Provider>;
}

export function StoreProvider({ children }) {
  const [data, setData] = useState({ store: null, featured: [], bestsellers: [], categories: [] });
  function refresh() {
    return Promise.all([api.store(), api.categories()])
      .then(([s, c]) => setData({ ...s, categories: c.categories }))
      .catch(() => {});
  }
  useEffect(() => {
    refresh();
  }, []);
  return <StoreCtx.Provider value={{ ...data, refresh }}>{children}</StoreCtx.Provider>;
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.allSettled([api.adminMe(), api.me()]).then(([a, c]) => {
      if (a.status === "fulfilled") setAdmin(a.value.admin);
      if (c.status === "fulfilled") setCustomer(c.value.customer);
      setReady(true);
    });
  }, []);
  return <AuthCtx.Provider value={{ admin, setAdmin, customer, setCustomer, ready }}>{children}</AuthCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
export const useStore = () => useContext(StoreCtx);
export const useAuth = () => useContext(AuthCtx);
