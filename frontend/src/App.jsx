import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminShell, Guard, Layout } from "./components";
import {
  About,
  CartPage,
  Checkout,
  Contact,
  Faq,
  Home,
  OrderLookup,
  Policies,
  ProductDetail,
  ReviewSubmission,
  Products,
  ThankYou,
  Help,
  LoginPage,
  AccountPage,
  HowToOrder,
  HowPaymentWorks,
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
  Reviews,
  SettingsPage,
} from "./adminPages";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/review/:token" element={<ReviewSubmission />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thank-you/:orderNumber" element={<ThankYou />} />
          <Route path="/order-lookup" element={<OrderLookup />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-to-order" element={<HowToOrder />} />
          <Route path="/how-payment-works" element={<HowPaymentWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
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
          <Route path="reviews" element={<Reviews />} />
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
