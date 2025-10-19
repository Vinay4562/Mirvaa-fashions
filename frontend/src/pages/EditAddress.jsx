import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiClient } from '@/utils/api';
import { toast } from 'sonner';

export default function EditAddress({ user, setUser }) {
  const navigate = useNavigate();
  const { index } = useParams();
  const addressIndex = parseInt(index);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home'
  });
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    fetchCounts();
    
    // Load address data
    if (user.addresses && user.addresses[addressIndex]) {
      setFormData(user.addresses[addressIndex]);
    } else {
      toast.error('Address not found');
      navigate('/account');
    }
  }, [user, addressIndex]);

  const fetchCounts = async () => {
    try {
      const cartResponse = await apiClient.get('/cart/count');
      setCartCount(cartResponse.data.count);
      
      const wishlistResponse = await apiClient.get('/wishlist/count');
      setWishlistCount(wishlistResponse.data.count);
    } catch (error) {
      console.error('Error fetching counts:', error);
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
      const addresses = [...user.addresses];
      
      // Update address at index
      addresses[addressIndex] = formData;
      
      // Update user profile with updated addresses
      const response = await apiClient.put('/users/addresses', {
        addresses: addresses
      });
      
      // Update local user state
      setUser(response.data);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      
      toast.success('Address updated successfully');
      navigate('/account');
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Failed to update address. Please try again.');
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
          <h1 className="text-2xl font-bold" data-testid="edit-address-heading">Edit Address</h1>
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
                  value={formData.type} 
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
                  data-testid="update-address-button"
                >
                  {loading ? 'Updating...' : 'Update Address'}
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