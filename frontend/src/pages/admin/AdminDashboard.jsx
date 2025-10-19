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
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text" data-testid="admin-dashboard-heading">
            Mirvaa Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {admin.username}</span>
            <Button onClick={handleLogout} variant="outline" className="btn-hover" data-testid="admin-logout">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/admin/analytics/products">
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.products_count}</div>
                <p className="text-xs text-gray-600 mt-1">Click for detailed analytics</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/analytics/orders">
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.orders_count}</div>
                <p className="text-xs text-gray-600 mt-1">Click for detailed analytics</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/analytics/users">
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.users_count}</div>
                <p className="text-xs text-gray-600 mt-1">Click for detailed analytics</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/analytics/revenue">
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? 'Loading...' : `₹${stats.total_revenue.toLocaleString()}`}
                </div>
                <p className="text-xs text-gray-600 mt-1">Click for detailed analytics</p>
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
