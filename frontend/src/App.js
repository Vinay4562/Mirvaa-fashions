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
import EditProfile from "./pages/EditProfile";
import AddAddress from "./pages/AddAddress";
import EditAddress from "./pages/EditAddress";
import ReturnRequest from "./pages/ReturnRequest";
import LegalPage from "./pages/LegalPage";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCMS from "./pages/admin/AdminCMS";
import AnalyticsDashboard from "./pages/admin/analytics/AnalyticsDashboard";
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
          <Route path="/contact" element={<Contact user={user} setUser={setUser} />} />
          <Route path="/about" element={<About user={user} setUser={setUser} />} />
          <Route path="/privacy" element={<PrivacyPolicy user={user} setUser={setUser} />} />
          <Route path="/returns" element={<ReturnPolicy user={user} setUser={setUser} />} />
          <Route path="/terms" element={<TermsAndConditions user={user} setUser={setUser} />} />
          <Route path="/account" element={user ? <Account user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/edit-profile" element={user ? <EditProfile user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/add-address" element={user ? <AddAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/account/edit-profile" element={user ? <EditProfile user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/account/add-address" element={user ? <AddAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/edit-address/:index" element={user ? <EditAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/account/edit-address/:index" element={user ? <EditAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/return-request/:orderId" element={user ? <ReturnRequest user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/legal/:page" element={<LegalPage user={user} setUser={setUser} />} />
          
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
          <Route 
            path="/admin/analytics" 
            element={admin ? <AnalyticsDashboard admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/analytics/products" 
            element={admin ? <AnalyticsDashboard admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/analytics/orders" 
            element={admin ? <AnalyticsDashboard admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/analytics/users" 
            element={admin ? <AnalyticsDashboard admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/analytics/revenue" 
            element={admin ? <AnalyticsDashboard admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
