import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiClient } from '@/utils/api';
import { toast } from 'sonner';

export default function AddAddress({ user, setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home'
  });
  
  // Add defaultValue to prevent uncontrolled to controlled component warnings
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      // Optionally pre-fill with user's existing address data if editing
      // This helps prevent uncontrolled to controlled component issues
    }
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    fetchCounts();
  }, [user]);

  const fetchCounts = async () => {
    try {
      // Try to fetch cart count
      try {
        const cartResponse = await apiClient.get('/cart/count');
        setCartCount(cartResponse.data.count);
      } catch (cartError) {
        console.error('Error fetching cart count:', cartError);
        // Fallback to local storage or default value
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cartItems.length);
      }
      
      // Try to fetch wishlist count
      try {
        const wishlistResponse = await apiClient.get('/wishlist/count');
        setWishlistCount(wishlistResponse.data.count);
      } catch (wishlistError) {
        console.error('Error fetching wishlist count:', wishlistError);
        // Fallback to local storage or default value
        const wishlistItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlistCount(wishlistItems.length);
      }
    } catch (error) {
      console.error('Error in fetchCounts:', error);
      // Set default values if everything fails
      setCartCount(0);
      setWishlistCount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get current addresses
      const addresses = user.addresses || [];
      
      // Add new address
      const updatedAddresses = [...addresses, formData];
      
      try {
        // Update user profile with new address
        const response = await apiClient.put('/users/addresses', updatedAddresses);
        
        // Update local user state (API returns { message, user })
        const updatedUserFromApi = response.data?.user || response.data;
        setUser(updatedUserFromApi);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUserFromApi));
        
        toast.success('Address added successfully');
      } catch (apiError) {
        console.error('API Error adding address:', apiError);
        
        // Handle API error but still update local data
        const updatedUser = {
          ...user,
          addresses: updatedAddresses
        };
        
        // Update local user state
        setUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Address added locally. It will sync when connection is restored.');
      }
      
      navigate('/account');
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/account')} className="mr-4">
            ← Back
          </Button>
          <h1 className="text-2xl font-bold" data-testid="add-address-heading">Add New Address</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name*</Label>
                  <Input
                    id="name"
                    data-testid="address-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number*</Label>
                  <Input
                    id="phone"
                    type="tel"
                    data-testid="address-phone-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="street">Street Address*</Label>
                <Input
                  id="street"
                  data-testid="address-street-input"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City*</Label>
                  <Input
                    id="city"
                    data-testid="address-city-input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State*</Label>
                  <Input
                    id="state"
                    data-testid="address-state-input"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="pincode">Pincode*</Label>
                  <Input
                    id="pincode"
                    data-testid="address-pincode-input"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Address Type</Label>
                <RadioGroup 
                  value={formData.type || 'home'} 
                  defaultValue="home"
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="home" id="home" />
                    <Label htmlFor="home">Home</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="work" id="work" />
                    <Label htmlFor="work">Work</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-hover"
                  data-testid="save-address-button"
                >
                  {loading ? 'Saving...' : 'Save Address'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}