import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { apiClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';

export default function Cart({ user, setUser }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchCart();
    fetchWishlistCount();
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await apiClient.get('/cart');
      setCartItems(response.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        // Redirect to home if unauthenticated
        navigate('/');
        return;
      }
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await apiClient.get('/wishlist');
      setWishlistCount(response.data.length);
    } catch (error) {
      if (error?.response?.status === 401) return;
      console.error('Error fetching wishlist:', error);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      await apiClient.put(`/cart/${itemId}?quantity=${newQuantity}`);
      fetchCart();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await apiClient.delete(`/cart/${itemId}`);
      toast.success('Removed from cart');
      fetchCart();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner text-4xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} cartCount={cartItems.length} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="cart-heading">Shopping Cart</h1>

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items-list">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden" data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-3 md:gap-4">
                      <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.product.id}`}>
                          <h3 className="font-semibold text-lg mb-1 hover:text-blue-600 transition-colors line-clamp-1">
                            {item.product.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && ' • '}
                          {item.color && `Color: ${item.color}`}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold">₹{item.product.price.toLocaleString()}</span>
                          {item.product.mrp > item.product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{item.product.mrp.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          data-testid={`remove-item-${item.id}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-2 border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            data-testid={`decrease-qty-${item.id}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium" data-testid={`qty-${item.id}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                            data-testid={`increase-qty-${item.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24" data-testid="order-summary">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>₹{calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (18% GST)</span>
                      <span>₹{Math.round(calculateTotal() * 0.18).toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span data-testid="cart-total">₹{Math.round(calculateTotal() * 1.18).toLocaleString()}</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full btn-hover"
                    size="lg"
                    data-testid="proceed-to-checkout"
                  >
                    Proceed to Checkout
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    Secure Checkout • Safe Payment
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-20" data-testid="empty-cart">
            <ShoppingBag className="h-24 w-24 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started</p>
            <Link to="/products">
              <Button size="lg" className="btn-hover">Continue Shopping</Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
      {/* Mobile Checkout Bar */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div>
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-lg font-bold">₹{calculateTotal().toLocaleString()}</p>
          </div>
          <Button onClick={handleCheckout} className="bg-pink-600 hover:bg-pink-700 px-8">
            Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
