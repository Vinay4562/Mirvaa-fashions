import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ProductListing from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import LegalPage from "./pages/LegalPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCMS from "./pages/admin/AdminCMS";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    // Check for stored auth
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    if (adminToken && adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home user={user} setUser={setUser} />} />
          <Route path="/products" element={<ProductListing user={user} setUser={setUser} />} />
          <Route path="/products/:id" element={<ProductDetail user={user} setUser={setUser} />} />
          <Route path="/cart" element={<Cart user={user} setUser={setUser} />} />
          <Route path="/wishlist" element={<Wishlist user={user} setUser={setUser} />} />
          <Route path="/checkout" element={<Checkout user={user} setUser={setUser} />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation user={user} setUser={setUser} />} />
          <Route path="/account" element={<Account user={user} setUser={setUser} />} />
          <Route path="/legal/:slug" element={<LegalPage user={user} setUser={setUser} />} />
          
          <Route path="/admin/login" element={<AdminLogin setAdmin={setAdmin} />} />
          <Route 
            path="/admin/dashboard" 
            element={admin ? <AdminDashboard admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/products" 
            element={admin ? <AdminProducts admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/orders" 
            element={admin ? <AdminOrders admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/settings" 
            element={admin ? <AdminSettings admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/cms" 
            element={admin ? <AdminCMS admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
