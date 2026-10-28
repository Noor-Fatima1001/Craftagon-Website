import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell, Guard, Layout } from "./components";
import {
  CartPage,
  Checkout,
  Faq,
  Home,
  OrderLookup,
  Policies,
  ProductDetail,
  Products,
  ThankYou,
} from "./pages";
import {
  AdminLogin,
  AdminProducts,
  Categories,
  Coupons,
  Dashboard,
  OrderDetail,
  Orders,
  Payments,
  ProductForm,
  Profile,
  Reports,
  SettingsPage,
} from "./adminPages";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thank-you/:orderNumber" element={<ThankYou />} />
          <Route path="/order-lookup" element={<OrderLookup />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/policies" element={<Policies />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <Guard>
              <AdminShell />
            </Guard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
