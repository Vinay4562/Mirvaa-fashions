import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiClient } from '@/utils/api';
import { toast } from 'sonner';

export default function Checkout({ user, setUser }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        apiClient.get('/cart'),
        apiClient.get('/wishlist'),
      ]);
      
      if (cartRes.data.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }

      setCartItems(cartRes.data);
      setWishlistCount(wishlistRes.data.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load checkout');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.18);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Validate address
      if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
        toast.error('Please fill in all address fields');
        setProcessing(false);
        return;
      }

      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          product_title: item.product.title,
          product_image: item.product.images[0],
          price: item.product.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        shipping: 0,
        total: calculateTotal(),
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
      };

      const response = await apiClient.post('/orders/create', orderData);
      const order = response.data;

      if (paymentMethod === 'razorpay') {
        // Mock Razorpay payment success
        await apiClient.post(`/orders/${order.id}/payment-success?razorpay_payment_id=mock_payment_${Date.now()}`);
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order.id}`);
      } else if (paymentMethod === 'cod') {
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order.id}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setProcessing(false);
    }
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
        <h1 className="text-3xl font-bold mb-8" data-testid="checkout-heading">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card data-testid="shipping-address-section">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name*</Label>
                      <Input
                        id="name"
                        data-testid="shipping-name"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number*</Label>
                      <Input
                        id="phone"
                        data-testid="shipping-phone"
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address*</Label>
                      <Textarea
                        id="address"
                        data-testid="shipping-address"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        required
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City*</Label>
                      <Input
                        id="city"
                        data-testid="shipping-city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State*</Label>
                      <Input
                        id="state"
                        data-testid="shipping-state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode*</Label>
                      <Input
                        id="pincode"
                        data-testid="shipping-pincode"
                        value={shippingAddress.pincode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card data-testid="payment-method-section">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="razorpay" id="razorpay" data-testid="payment-razorpay" />
                      <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Razorpay (UPI, Cards, Wallets)</div>
                        <div className="text-sm text-gray-600">Secure payment via Razorpay</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="cod" id="cod" data-testid="payment-cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Cash on Delivery</div>
                        <div className="text-sm text-gray-600">Pay when you receive</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24" data-testid="order-summary-checkout">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  <Separator />

                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={item.product.images[0] || 'https://via.placeholder.com/100'}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-1">{item.product.title}</h4>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{calculateSubtotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (18% GST)</span>
                      <span>₹{calculateTax().toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span data-testid="checkout-total">₹{calculateTotal().toLocaleString()}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-hover"
                    size="lg"
                    disabled={processing}
                    data-testid="place-order-button"
                  >
                    {processing ? 'Processing...' : 'Place Order'}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    ✓ Secure Checkout • ✓ Safe Payment
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
