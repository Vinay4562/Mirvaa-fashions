import { useState, useEffect, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Loading from "./components/Loading";
import { Toaster } from "@/components/ui/sonner";
import { apiClient } from "@/utils/api";

import Home from "./pages/Home";
import IntroSplash from "./components/IntroSplash";

// Lazy load pages
const ProductListing = lazy(() => import("./pages/ProductListing"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Account = lazy(() => import("./pages/Account"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const AddAddress = lazy(() => import("./pages/AddAddress"));
const EditAddress = lazy(() => import("./pages/EditAddress"));
const ReturnRequest = lazy(() => import("./pages/ReturnRequest"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCMS = lazy(() => import("./pages/admin/AdminCMS"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/analytics/AnalyticsDashboard"));

function App() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem("mirvaa_skip_intro");
    } catch {
      return true;
    }
  });

  useEffect(() => {
    // Check for stored auth and refresh user from backend
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token) {
      // Seed from localStorage first for fast paint
      if (userData) {
        setUser(JSON.parse(userData));
      }
      // Then fetch authoritative user (with latest addresses) from API
      apiClient
        .get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          // ignore; fallback to local storage user
        });
    }

    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    if (adminToken && adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, []);

  return (
    <div className="App">
      {showIntro && <IntroSplash onFinish={() => setShowIntro(false)} />}
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
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
            <Route path="/account" element={<Account user={user} setUser={setUser} />} />
            <Route path="/edit-profile" element={user ? <EditProfile user={user} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/add-address" element={user ? <AddAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/account/edit-profile" element={user ? <EditProfile user={user} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/account/add-address" element={user ? <AddAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/edit-address/:index" element={user ? <EditAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/account/edit-address/:index" element={user ? <EditAddress user={user} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/return-request/:orderId" element={user ? <ReturnRequest user={user} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/legal/:page" element={<LegalPage user={user} setUser={setUser} />} />
            
            <Route path="/admin/login" element={<AdminLogin setAdmin={setAdmin} />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
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
              path="/admin/returns" 
              element={admin ? <AdminReturns admin={admin} setAdmin={setAdmin} /> : <Navigate to="/admin/login" />} 
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
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
