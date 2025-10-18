import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { adminClient } from '@/utils/api';
import { toast } from 'sonner';

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
      
      setProfile(profileRes.data);
      setStoreSettings(storeRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminClient.put('/admin/profile', profile);
      toast.success('Profile updated successfully');
    } catch (error) {
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
      await adminClient.post('/admin/change-password', passwordData);
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await adminClient.post('/admin/change-username', usernameData);
      
      // Update local storage with new token and username
      localStorage.setItem('adminToken', response.data.token);
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      adminData.username = response.data.username;
      localStorage.setItem('adminData', JSON.stringify(adminData));
      
      setAdmin(adminData);
      toast.success('Username changed successfully');
      setUsernameData({ current_password: '', new_username: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change username');
    } finally {
      setSaving(false);
    }
  };

  const handleStoreSettingsUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminClient.put('/admin/settings/store', storeSettings);
      toast.success('Store settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update store settings');
    } finally {
      setSaving(false);
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
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon" data-testid="back-to-dashboard-settings">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {admin.username}</span>
            <Button onClick={handleLogout} variant="outline" className="btn-hover">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" data-testid="profile-settings-tab">Profile</TabsTrigger>
            <TabsTrigger value="security" data-testid="security-settings-tab">Security</TabsTrigger>
            <TabsTrigger value="store" data-testid="store-settings-tab">Store Info</TabsTrigger>
            <TabsTrigger value="advanced" data-testid="advanced-settings-tab">Advanced</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Admin Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={admin.username}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Change in Security tab</p>
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        data-testid="profile-name-input"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        data-testid="profile-email-input"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        data-testid="profile-phone-input"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      data-testid="profile-address-input"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="btn-hover" data-testid="save-profile-button">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Change Username */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Username</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUsernameChange} className="space-y-4">
                    <div>
                      <Label htmlFor="new-username">New Username</Label>
                      <Input
                        id="new-username"
                        data-testid="new-username-input"
                        value={usernameData.new_username}
                        onChange={(e) => setUsernameData({ ...usernameData, new_username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="username-current-password">Current Password</Label>
                      <Input
                        id="username-current-password"
                        data-testid="username-current-password-input"
                        type="password"
                        value={usernameData.current_password}
                        onChange={(e) => setUsernameData({ ...usernameData, current_password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={saving} className="btn-hover" data-testid="change-username-button">
                      {saving ? 'Changing...' : 'Change Username'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          data-testid="current-password-input"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          data-testid="new-password-input"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        data-testid="confirm-password-input"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={saving} className="btn-hover" data-testid="change-password-button">
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Store Settings Tab */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStoreSettingsUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input
                      id="store-name"
                      data-testid="store-name-input"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-address">Business Address</Label>
                    <Textarea
                      id="business-address"
                      data-testid="business-address-input"
                      value={storeSettings.business_address}
                      onChange={(e) => setStoreSettings({ ...storeSettings, business_address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer-care-email">Customer Care Email</Label>
                      <Input
                        id="customer-care-email"
                        data-testid="customer-care-email-input"
                        type="email"
                        value={storeSettings.customer_care_email}
                        onChange={(e) => setStoreSettings({ ...storeSettings, customer_care_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-support-phone">Customer Support Phone</Label>
                      <Input
                        id="customer-support-phone"
                        data-testid="customer-support-phone-input"
                        type="tel"
                        value={storeSettings.customer_support_phone}
                        onChange={(e) => setStoreSettings({ ...storeSettings, customer_support_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="return-address">Return Address</Label>
                    <Textarea
                      id="return-address"
                      data-testid="return-address-input"
                      value={storeSettings.return_address}
                      onChange={(e) => setStoreSettings({ ...storeSettings, return_address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Social Media Links</Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        placeholder="Facebook URL"
                        value={storeSettings.social_facebook}
                        onChange={(e) => setStoreSettings({ ...storeSettings, social_facebook: e.target.value })}
                      />
                      <Input
                        placeholder="Instagram URL"
                        value={storeSettings.social_instagram}
                        onChange={(e) => setStoreSettings({ ...storeSettings, social_instagram: e.target.value })}
                      />
                      <Input
                        placeholder="Twitter URL"
                        value={storeSettings.social_twitter}
                        onChange={(e) => setStoreSettings({ ...storeSettings, social_twitter: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} className="btn-hover" data-testid="save-store-settings-button">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStoreSettingsUpdate} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Enable this to show a maintenance page to visitors</p>
                    </div>
                    <Switch
                      id="maintenance-mode"
                      data-testid="maintenance-mode-switch"
                      checked={storeSettings.maintenance_mode}
                      onCheckedChange={(checked) => setStoreSettings({ ...storeSettings, maintenance_mode: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-logo">Store Logo URL</Label>
                    <Input
                      id="store-logo"
                      data-testid="store-logo-input"
                      placeholder="https://example.com/logo.png"
                      value={storeSettings.store_logo_url}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_logo_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="favicon">Favicon URL</Label>
                    <Input
                      id="favicon"
                      data-testid="favicon-input"
                      placeholder="https://example.com/favicon.ico"
                      value={storeSettings.favicon_url}
                      onChange={(e) => setStoreSettings({ ...storeSettings, favicon_url: e.target.value })}
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="btn-hover" data-testid="save-advanced-settings-button">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
