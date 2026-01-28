import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { API } from '@/utils/api';
import { toast } from 'sonner';

export default function AdminLogin({ setAdmin }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      const { token, username, role } = response.data;

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify({ username, role }));
      setAdmin({ username, role });

      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-pink-300/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-blue-300/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <Card className="w-full max-w-md shadow-2xl rounded-3xl border-0 bg-white/80 backdrop-blur-xl relative z-10 overflow-hidden" data-testid="admin-login-form">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="h-10 w-10 text-purple-600 drop-shadow-sm" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Admin Access
          </CardTitle>
          <p className="text-gray-500 font-medium mt-2">Secure entry for Mirvaa staff</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-bold ml-1">Username</Label>
              <Input
                id="username"
                data-testid="admin-username"
                type="text"
                placeholder="Enter admin username"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                className="rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-purple-200 transition-all h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-bold ml-1">Password</Label>
              <Input
                id="password"
                data-testid="admin-password"
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                className="rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-purple-200 transition-all h-11"
              />
            </div>
            <Button
              data-testid="admin-login-submit"
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-11 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Login to Dashboard
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="absolute bottom-6 text-center text-xs text-gray-400 font-medium">
        © 2024 Mirvaa Fashions. Secured System.
      </p>
    </div>
  );
}
