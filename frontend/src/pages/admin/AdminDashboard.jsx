import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { adminClient } from '@/utils/api';

export default function AdminDashboard({ admin, setAdmin }) {
  const [stats, setStats] = useState({
    products_count: 0,
    orders_count: 0,
    users_count: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await adminClient.get('/admin/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500" data-testid="admin-dashboard-heading">
            Mirvaa Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Welcome, {admin.username}</span>
            <Button onClick={handleLogout} variant="outline" className="hover:bg-blue-50 transition-colors border-blue-200" data-testid="admin-logout">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h2>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/admin/analytics/products">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] border-0 shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <div className="p-2 rounded-full bg-blue-50">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.products_count}</div>
                <p className="text-xs text-gray-600">
                  Products in inventory
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/analytics/orders">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] border-0 shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <div className="p-2 rounded-full bg-green-50">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.orders_count}</div>
                <p className="text-xs text-gray-600">
                  Orders processed
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/analytics/users">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] border-0 shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <div className="p-2 rounded-full bg-purple-50">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.users_count}</div>
                <p className="text-xs text-gray-600">
                  Registered customers
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/analytics/revenue">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] border-0 shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <div className="p-2 rounded-full bg-amber-50">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : `₹${stats.total_revenue.toLocaleString()}`}
                </div>
                <p className="text-xs text-gray-600">
                  Lifetime revenue
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Add, edit, or remove products from your store</p>
              <Link to="/admin/products">
                <Button className="btn-hover" data-testid="go-to-products">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Products
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View and manage customer orders</p>
              <Link to="/admin/orders">
                <Button className="btn-hover" data-testid="go-to-orders">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Manage Orders
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage admin profile and store settings</p>
              <Link to="/admin/settings">
                <Button className="btn-hover" data-testid="go-to-settings">
                  <Users className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
