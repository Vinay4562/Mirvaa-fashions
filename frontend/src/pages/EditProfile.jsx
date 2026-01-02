import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { apiClient } from '@/utils/api';
import { toast } from 'sonner';

export default function EditProfile({ user, setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
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
    
    // Validate password fields if attempting to change password
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error('Current password is required to set a new password');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Prepare data for API
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      
      // Only include password fields if attempting to change password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await apiClient.put('/users/profile', updateData);
      
      // Update local user state
      setUser(response.data);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      
      toast.success('Profile updated successfully');
      navigate('/account');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.status === 401) {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
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
          <h1 className="text-2xl font-bold" data-testid="edit-profile-heading">Edit Profile</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  data-testid="phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div className="border-t pt-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                <p className="text-sm text-gray-500 mb-4">Leave blank if you don't want to change your password</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      data-testid="current-password-input"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      data-testid="new-password-input"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      data-testid="confirm-password-input"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-hover"
                  data-testid="save-profile-button"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
      <BottomNav cartCount={cartCount} />
    </div>
  );
}