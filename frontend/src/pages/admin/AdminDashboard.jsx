import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, TrendingUp, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { adminClient } from '@/utils/api';
import Loading from '@/components/Loading';
import AdminLayout from '@/components/admin/AdminLayout';

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

  if (loading) {
    return <Loading />;
  }

  return (
    <AdminLayout admin={admin} setAdmin={setAdmin} title="Dashboard">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="text-2xl font-bold">{stats.products_count}</div>
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
              <div className="text-2xl font-bold">{stats.orders_count}</div>
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
              <div className="text-2xl font-bold">{stats.users_count}</div>
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
                {`₹${stats.total_revenue.toLocaleString()}`}
              </div>
              <p className="text-xs text-gray-600">
                Lifetime revenue
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-4">Quick Actions</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">Add, edit, or remove products from your store</p>
            <Link to="/admin/products">
              <Button className="w-full bg-slate-800 hover:bg-slate-700" data-testid="go-to-products">
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">View and manage customer orders</p>
            <Link to="/admin/orders">
              <Button className="w-full bg-slate-800 hover:bg-slate-700" data-testid="go-to-orders">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Manage Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Return Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">Review and update return requests</p>
            <Link to="/admin/returns">
              <Button className="w-full bg-slate-800 hover:bg-slate-700" data-testid="go-to-returns">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Manage Returns
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">Manage admin profile and store settings</p>
            <Link to="/admin/settings">
              <Button className="w-full bg-slate-800 hover:bg-slate-700" data-testid="go-to-settings">
                <Users className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
