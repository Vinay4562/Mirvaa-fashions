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
import BottomNav from '@/components/BottomNav';
import { apiClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';
import Loading from '@/components/Loading';

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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);
  
  // Suggest a saved address when addresses are loaded
  useEffect(() => {
    if (savedAddresses.length > 0) {
      // Suggest the most recently used address (assuming it's the first in the array)
      handleSelectAddress(savedAddresses[0]);
    }
  }, [savedAddresses]);

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
      
      // Load saved addresses from user object
      if (user && user.addresses && user.addresses.length > 0) {
        setSavedAddresses(user.addresses);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load checkout');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectAddress = (address) => {
    setSelectedSavedAddress(address);
    setShowNewAddressForm(false); // Hide new address form when saved address is selected
    setShippingAddress({
      name: address.name || user?.name || '',
      phone: address.phone || user?.phone || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
    });
  };

  const handleUseNewAddress = () => {
    setSelectedSavedAddress(null);
    setShowNewAddressForm(true);
    setShippingAddress({
      name: user?.name || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Skip validation if a saved address is selected
      if (!selectedSavedAddress && (!shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode)) {
        toast.error('Please select a saved address or fill in all address fields');
        setProcessing(false);
        return;
      }
      
      // Save the address if it's a new one
      if (!selectedSavedAddress && showNewAddressForm) {
        try {
          const updatedUser = {...user};
          if (!updatedUser.addresses) {
            updatedUser.addresses = [];
          }
          
          // Only add if it doesn't already exist
          const addressExists = updatedUser.addresses.some(addr => 
            addr.address === shippingAddress.address && 
            addr.pincode === shippingAddress.pincode
          );
          
          if (!addressExists) {
            updatedUser.addresses.push(shippingAddress);
            await apiClient.put('/users/update-profile', updatedUser);
            setUser(updatedUser);
          }
        } catch (error) {
          console.error('Error saving address:', error);
          // Continue with order even if saving address fails
        }
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
        await loadRazorpay();
        const options = {
          key: order.razorpay_key_id,
          amount: Math.round(order.total * 100),
          currency: 'INR',
          name: 'Mirvaa Fashions',
          description: order.order_number,
          order_id: order.razorpay_order_id,
          prefill: {
            name: shippingAddress.name,
            email: user?.email || '',
            contact: shippingAddress.phone,
          },
          handler: async function (response) {
            try {
              const params = new URLSearchParams({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }).toString();
              await apiClient.post(`/orders/${order.id}/payment-success?${params}`);
              toast.success('Order placed successfully!');
              navigate(`/order-confirmation/${order.id}`);
            } catch {
              toast.error('Payment verification failed');
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
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
    return <Loading />;
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
                  
                  {savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-semibold mb-2">Select from saved addresses:</h3>
                      <div className="grid gap-4 mb-4">
                        {savedAddresses.map((address, index) => (
                          <div 
                            key={index}
                            className={`border rounded-md p-3 cursor-pointer hover:border-primary ${selectedSavedAddress === address ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => handleSelectAddress(address)}
                          >
                            {index === 0 && (
                              <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded mb-2 inline-block">
                                Suggested Address
                              </div>
                            )}
                            {selectedSavedAddress === address && (
                              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded mb-2 inline-block">
                                Selected
                              </div>
                            )}
                            <p className="font-medium">{address.name}</p>
                            <p className="text-sm text-gray-600">{address.address}</p>
                            <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                            <p className="text-sm text-gray-600">{address.phone}</p>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500">Or enter a new address below:</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUseNewAddress}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Use New Address
                        </Button>
                      </div>
                    </div>
                  )}
                  {showNewAddressForm && (
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
                  )}
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
                            src={getImageUrl(item.product.images[0])}
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
      <BottomNav cartCount={cartItems.length} />
    </div>
  );
}
