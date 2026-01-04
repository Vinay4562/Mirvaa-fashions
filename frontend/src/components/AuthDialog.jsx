import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { API } from '@/utils/api';
import { toast } from 'sonner';

export default function AuthDialog({ open, onClose, setUser, defaultTab = "login" }) {
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Login successful!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Registration successful!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!registerData.phone) {
      toast.error('Enter phone to send OTP');
      return;
    }
    setOtpSending(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { phone: registerData.phone });
      setOtpSent(true);
      toast.success('OTP sent');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    try {
      await axios.post(`${API}/auth/verify-otp`, { phone: registerData.phone, code: otpCode });
      setOtpVerified(true);
      toast.success('Phone verified');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
      toast.success('Reset link sent to your email');
      setForgotMode(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">Welcome to Mirvaa</DialogTitle>
        </DialogHeader>

        {!forgotMode ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
            <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  data-testid="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  data-testid="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button
                data-testid="login-submit"
                type="submit"
                className="w-full btn-hover"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              <div className="text-center">
                <button type="button" className="text-sm text-blue-600 hover:underline mt-2" onClick={() => setForgotMode(true)}>
                  Forgot password?
                </button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  data-testid="register-name"
                  type="text"
                  placeholder="Your Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  data-testid="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-phone">Phone (Optional)</Label>
                <Input
                  id="register-phone"
                  data-testid="register-phone"
                  type="tel"
                  placeholder="9876543210"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={sendOtp} disabled={otpSending}>
                    {otpSending ? 'Sending...' : 'Send OTP'}
                  </Button>
                  {otpSent && !otpVerified && (
                    <>
                      <Input
                        type="text"
                        placeholder="Enter OTP"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="h-9"
                      />
                      <Button type="button" size="sm" onClick={verifyOtp}>
                        Verify
                      </Button>
                    </>
                  )}
                  {otpVerified && <span className="text-xs text-green-600">Verified</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  data-testid="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>
              <Button
                data-testid="register-submit"
                type="submit"
                className="w-full btn-hover"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full btn-hover" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
            <div className="text-center">
              <button type="button" className="text-sm text-gray-600 hover:underline mt-2" onClick={() => setForgotMode(false)}>
                Back to login
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
