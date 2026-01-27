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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/analytics/products">
          <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Total Products</CardTitle>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black tracking-tight text-gray-900 group-hover:scale-105 transition-transform origin-left duration-300">
                {stats.products_count}
              </div>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Active inventory items
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/analytics/orders">
          <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-600 group-hover:text-green-600 transition-colors">Total Orders</CardTitle>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black tracking-tight text-gray-900 group-hover:scale-105 transition-transform origin-left duration-300">
                {stats.orders_count}
              </div>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Processed & Pending
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/analytics/users">
          <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-600 group-hover:text-purple-600 transition-colors">Total Users</CardTitle>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black tracking-tight text-gray-900 group-hover:scale-105 transition-transform origin-left duration-300">
                {stats.users_count}
              </div>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Registered customers
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/analytics/revenue">
          <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-gray-600 group-hover:text-amber-600 transition-colors">Total Revenue</CardTitle>
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black tracking-tight text-gray-900 group-hover:scale-105 transition-transform origin-left duration-300">
                {`₹${stats.total_revenue.toLocaleString()}`}
              </div>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <h3 className="text-2xl font-black tracking-tight text-gray-900 mt-12 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Package className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-6 text-sm">Add, edit, or remove products from your store inventory.</p>
            <Link to="/admin/products">
              <Button className="w-full rounded-full h-12 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300 shadow-lg" data-testid="go-to-products">
                Manage Products
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-6 text-sm">View, process, and track customer orders efficiently.</p>
            <Link to="/admin/orders">
              <Button className="w-full rounded-full h-12 text-base font-bold bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-300 shadow-lg" data-testid="go-to-orders">
                Manage Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <RefreshCcw className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-6 text-sm">Handle return requests and manage refunds seamlessly.</p>
            <Link to="/admin/returns">
              <Button className="w-full rounded-full h-12 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300 shadow-lg" data-testid="go-to-returns">
                Manage Returns
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-6 text-sm">Configure your store settings and admin profile.</p>
            <Link to="/admin/settings">
              <Button className="w-full rounded-full h-12 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300 shadow-lg" data-testid="go-to-settings">
                Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
