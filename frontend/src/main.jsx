import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider, CartProvider, StoreProvider } from "./context";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  </React.StrictMode>
);
