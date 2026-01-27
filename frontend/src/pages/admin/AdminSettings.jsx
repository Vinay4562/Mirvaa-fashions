import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { adminClient } from '@/utils/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminSettings({ admin, setAdmin }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Username change state
  const [usernameData, setUsernameData] = useState({
    current_password: '',
    new_username: ''
  });

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    business_address: '',
    customer_care_email: '',
    customer_support_phone: '',
    return_address: '',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    logo_url: '',
    favicon_url: '',
    maintenance_mode: false,
    theme: 'light'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, storeRes] = await Promise.all([
        adminClient.get('/admin/profile'),
        adminClient.get('/settings/store')
      ]);
      
      console.log('Profile data:', profileRes.data);
      console.log('Store settings data:', storeRes.data);
      
      // Set profile data with defaults
      setProfile({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        phone: profileRes.data.phone || '',
        address: profileRes.data.address || ''
      });
      
      // Set store settings with defaults
      setStoreSettings({
        store_name: storeRes.data.store_name || '',
        business_address: storeRes.data.business_address || '',
        customer_care_email: storeRes.data.customer_care_email || '',
        customer_support_phone: storeRes.data.customer_support_phone || '',
        return_address: storeRes.data.return_address || '',
        social_facebook: storeRes.data.social_facebook || '',
        social_instagram: storeRes.data.social_instagram || '',
        social_twitter: storeRes.data.social_twitter || '',
        logo_url: storeRes.data.logo_url || '',
        favicon_url: storeRes.data.favicon_url || '',
        maintenance_mode: storeRes.data.maintenance_mode || false,
        theme: storeRes.data.theme || 'light'
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('Updating profile:', profile);
      const response = await adminClient.put('/admin/profile', profile);
      console.log('Profile update response:', response.data);
      toast.success('Profile updated successfully');
      
      // Refresh data to show updated values
      fetchData();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);

    try {
      console.log('Changing password...');
      const response = await adminClient.post('/admin/change-password', passwordData);
      console.log('Password change response:', response.data);
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('Changing username:', usernameData);
      const response = await adminClient.post('/admin/change-username', usernameData);
      console.log('Username change response:', response.data);
      
      // Update local storage with new token and username
      localStorage.setItem('adminToken', response.data.token);
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      adminData.username = response.data.username;
      localStorage.setItem('adminData', JSON.stringify(adminData));
      
      setAdmin(adminData);
      toast.success('Username changed successfully');
      setUsernameData({ current_password: '', new_username: '' });
    } catch (error) {
      console.error('Username change error:', error);
      toast.error(error.response?.data?.detail || 'Failed to change username');
    } finally {
      setSaving(false);
    }
  };

  const handleStoreSettingsUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('Updating store settings:', storeSettings);
      const response = await adminClient.put('/settings/store', storeSettings);
      console.log('Store settings update response:', response.data);
      toast.success('Store settings updated successfully');
      
      // Refresh data to show updated values
      fetchData();
    } catch (error) {
      console.error('Store settings update error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <AdminLayout admin={admin} setAdmin={setAdmin} title="Settings">
      <div className="max-w-5xl mx-auto pb-10">
        <Tabs defaultValue="profile" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100/50 p-1.5 rounded-2xl h-auto">
            <TabsTrigger 
              value="profile" 
              data-testid="profile-settings-tab"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              data-testid="security-settings-tab"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
            >
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="store" 
              data-testid="store-settings-tab"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
            >
              Store Info
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              data-testid="advanced-settings-tab"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
            >
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <Card className="rounded-3xl border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-6">
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Admin Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="username" className="text-gray-600 mb-1.5 block">Username</Label>
                      <Input
                        id="username"
                        value={admin.username}
                        disabled
                        className="bg-gray-50 border-gray-200 rounded-xl"
                      />
                      <p className="text-xs text-gray-400 mt-1.5">Change in Security tab</p>
                    </div>
                    <div>
                      <Label htmlFor="name" className="text-gray-600 mb-1.5 block">Full Name</Label>
                      <Input
                        id="name"
                        data-testid="profile-name-input"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="email" className="text-gray-600 mb-1.5 block">Email</Label>
                      <Input
                        id="email"
                        data-testid="profile-email-input"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-600 mb-1.5 block">Phone</Label>
                      <Input
                        id="phone"
                        data-testid="profile-phone-input"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-gray-600 mb-1.5 block">Address</Label>
                    <Textarea
                      id="address"
                      data-testid="profile-address-input"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      rows={3}
                      className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200 resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto"
                    data-testid="save-profile-button"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <div className="space-y-6">
              {/* Change Username */}
              <Card className="rounded-3xl border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-6">
                  <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                    Change Username
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleUsernameChange} className="space-y-4">
                    <div>
                      <Label htmlFor="new-username" className="text-gray-600 mb-1.5 block">New Username</Label>
                      <Input
                        id="new-username"
                        data-testid="new-username-input"
                        value={usernameData.new_username}
                        onChange={(e) => setUsernameData({ ...usernameData, new_username: e.target.value })}
                        required
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username-current-password" className="text-gray-600 mb-1.5 block">Current Password</Label>
                      <Input
                        id="username-current-password"
                        data-testid="username-current-password-input"
                        type="password"
                        value={usernameData.current_password}
                        onChange={(e) => setUsernameData({ ...usernameData, current_password: e.target.value })}
                        required
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={saving} 
                      className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto"
                      data-testid="change-username-button"
                    >
                      {saving ? 'Changing...' : 'Change Username'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="rounded-3xl border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-6">
                  <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password" className="text-gray-600 mb-1.5 block">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          data-testid="current-password-input"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                          required
                          className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password" className="text-gray-600 mb-1.5 block">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          data-testid="new-password-input"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          required
                          className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 ml-1">Minimum 8 characters</p>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password" className="text-gray-600 mb-1.5 block">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        data-testid="confirm-password-input"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        required
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={saving} 
                      className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto"
                      data-testid="change-password-button"
                    >
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Store Settings Tab */}
          <TabsContent value="store" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <Card className="rounded-3xl border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-6">
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleStoreSettingsUpdate} className="space-y-5">
                  <div>
                    <Label htmlFor="store-name" className="text-gray-600 mb-1.5 block">Store Name</Label>
                    <Input
                      id="store-name"
                      data-testid="store-name-input"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                      required
                      className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-address" className="text-gray-600 mb-1.5 block">Business Address</Label>
                    <Textarea
                      id="business-address"
                      data-testid="business-address-input"
                      value={storeSettings.business_address}
                      onChange={(e) => setStoreSettings({ ...storeSettings, business_address: e.target.value })}
                      rows={3}
                      className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200 resize-none"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="customer-care-email" className="text-gray-600 mb-1.5 block">Customer Care Email</Label>
                      <Input
                        id="customer-care-email"
                        data-testid="customer-care-email-input"
                        type="email"
                        value={storeSettings.customer_care_email}
                        onChange={(e) => setStoreSettings({ ...storeSettings, customer_care_email: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-support-phone" className="text-gray-600 mb-1.5 block">Customer Support Phone</Label>
                      <Input
                        id="customer-support-phone"
                        data-testid="customer-support-phone-input"
                        type="tel"
                        value={storeSettings.customer_support_phone}
                        onChange={(e) => setStoreSettings({ ...storeSettings, customer_support_phone: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="return-address" className="text-gray-600 mb-1.5 block">Return Address</Label>
                    <Textarea
                      id="return-address"
                      data-testid="return-address-input"
                      value={storeSettings.return_address}
                      onChange={(e) => setStoreSettings({ ...storeSettings, return_address: e.target.value })}
                      rows={3}
                      className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200 resize-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-gray-600 mb-1.5 block">Social Media Links</Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        placeholder="Facebook URL"
                        value={storeSettings.social_facebook}
                        onChange={(e) => setStoreSettings({ ...storeSettings, social_facebook: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <Input
                        placeholder="Instagram URL"
                        value={storeSettings.social_instagram}
                        onChange={(e) => setStoreSettings({ ...storeSettings, social_instagram: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <Input
                        placeholder="Twitter URL"
                        value={storeSettings.social_twitter}
                        onChange={(e) => setStoreSettings({ ...storeSettings, social_twitter: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600 mb-1.5 block">Branding</Label>
                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                      <Input
                        placeholder="Logo URL"
                        value={storeSettings.logo_url}
                        onChange={(e) => setStoreSettings({ ...storeSettings, logo_url: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <Input
                        placeholder="Favicon URL"
                        value={storeSettings.favicon_url}
                        onChange={(e) => setStoreSettings({ ...storeSettings, favicon_url: e.target.value })}
                        className="rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                    <Switch
                      checked={storeSettings.maintenance_mode}
                      onCheckedChange={(checked) => setStoreSettings({ ...storeSettings, maintenance_mode: checked })}
                    />
                    <Label className="text-gray-700">Maintenance Mode</Label>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto"
                    data-testid="save-store-button"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <Card className="rounded-3xl border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-6">
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500 mb-4">
                  Configure advanced system parameters. Use with caution.
                </p>
                {/* Add advanced settings here */}
                <div className="p-6 bg-yellow-50/50 border border-yellow-200/50 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-yellow-800">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <p className="font-medium">No advanced settings available yet.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
