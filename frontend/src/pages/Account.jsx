import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User as UserIcon, PencilIcon, PlusIcon, TrashIcon, HomeIcon, BriefcaseIcon, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';
import { API, apiClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';
import AuthDialog from '@/components/AuthDialog';

export default function Account({ user, setUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [productImageById, setProductImageById] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowAuth(true);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [ordersRes, cartRes, wishlistRes] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/cart'),
        apiClient.get('/wishlist'),
      ]);
      setOrders(ordersRes.data);
      // Prefetch product images for orders that are missing product_image
      const allItems = ordersRes.data.flatMap((o) => o.items || []);
      const missingIds = Array.from(new Set(
        allItems
          .filter((it) => !it.product_image && it.product_id)
          .map((it) => it.product_id)
      ));
      if (missingIds.length > 0) {
        try {
          const responses = await Promise.all(
            missingIds.map((id) => axios.get(`${API}/products/${id}`).catch(() => null))
          );
          const map = {};
          responses.forEach((res, idx) => {
            if (res && res.data) {
              const firstImage = (res.data.images && res.data.images[0]) ? res.data.images[0] : '';
              map[missingIds[idx]] = firstImage;
            }
          });
          if (Object.keys(map).length > 0) setProductImageById(map);
        } catch {}
      }
      setCartCount(cartRes.data.length);
      setWishlistCount(wishlistRes.data.length);
    } catch (error) {
      if (error?.response?.status === 401) {
        setShowAuth(true);
        return;
      }
      console.error('Error fetching data:', error);
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      packed: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (e) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner text-4xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8" data-testid="account-heading">My Account</h1>
        </div>
        <Footer />
        <BottomNav cartCount={cartCount} />
        <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} setUser={setUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="md:hidden flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {user && (
            <Button variant="outline" size="sm" onClick={handleLogout} className="btn-hover" aria-label="Logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-8" data-testid="account-heading">My Account</h1>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList>
            <TabsTrigger value="orders" data-testid="orders-tab">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="profile-tab">
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            {orders.length > 0 ? (
              <div className="space-y-4" data-testid="orders-list">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden" data-testid={`order-${order.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <h3 className="font-bold text-lg mb-1">Order #{order.order_number}</h3>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={getImageUrl(productImageById[item.product_id] || item.product_image || 'https://via.placeholder.com/100')}
                              alt={item.product_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-600 flex-shrink-0">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-xl font-bold">₹{order.total.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          {/* Check if order is delivered and within 3 days */}
                          {order.status === 'delivered' && 
                            (new Date() - new Date(order.delivered_at || order.updated_at || order.created_at)) / (1000 * 60 * 60 * 24) <= 3 && (
                            <Button
                              onClick={() => navigate(`/return-request/${order.id}`)}
                              variant="outline"
                              className="btn-hover"
                              data-testid={`return-order-${order.id}`}
                            >
                              Return
                            </Button>
                          )}
                          <Button
                            onClick={() => navigate(`/order-confirmation/${order.id}`)}
                            variant="outline"
                            className="btn-hover"
                            data-testid={`view-order-${order.id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20" data-testid="no-orders">
                <Package className="h-24 w-24 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
                <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                <Button onClick={() => navigate('/products')} size="lg" className="btn-hover">
                  Browse Products
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Information */}
              <Card data-testid="profile-section">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{user.email}</p>
                    </div>
                    {user.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">{user.phone}</p>
                      </div>
                    )}
                    <Button 
                      onClick={() => navigate('/account/edit-profile')} 
                      className="mt-4 btn-hover"
                      data-testid="edit-profile-button"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Saved Addresses */}
              <Card data-testid="addresses-section">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Saved Addresses</h2>
                  {user.addresses && user.addresses.length > 0 ? (
                    <div className="space-y-4">
                      {user.addresses.map((address, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold">{address.name}</div>
                            <Badge>{address.type || 'Home'}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {address.street}, {address.city}, {address.state} {address.pincode}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Phone: {address.phone}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/account/edit-address/${index}`)}>
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={async () => {
                                try {
                                  const newAddresses = (user.addresses || []).filter((_, i) => i !== index);
                                  const resp = await apiClient.put('/users/addresses', newAddresses);
                                  const updatedUserFromApi = resp.data?.user || resp.data;
                                  setUser(updatedUserFromApi);
                                  localStorage.setItem('user', JSON.stringify(updatedUserFromApi));
                                  toast.success('Address deleted');
                                } catch (err) {
                                  console.error('Delete address failed', err);
                                  toast.error('Failed to delete address');
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No addresses saved yet</p>
                    </div>
                  )}
                  <Button 
                    onClick={() => navigate('/account/add-address')} 
                    className="mt-4 w-full btn-hover"
                    data-testid="add-address-button"
                  >
                    Add New Address
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
      <BottomNav cartCount={cartCount} />

      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} setUser={setUser} />
    </div>
  );
}
