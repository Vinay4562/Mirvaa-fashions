import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductsAnalytics from './ProductsAnalytics';
import OrdersAnalytics from './OrdersAnalytics';
import UsersAnalytics from './UsersAnalytics';
import RevenueAnalytics from './RevenueAnalytics';
import SiteAnalytics from './SiteAnalytics';
import OrdersTable from './OrdersTable';
import ProductsTable from './ProductsTable';
import UsersTable from './UsersTable';
import RevenueTable from './RevenueTable';
import { adminClient } from '@/utils/api';
import { toast } from 'sonner';

export default function AnalyticsDashboard({ admin, setAdmin }) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('overview');
  const [overviewData, setOverviewData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchOverviewData();
  }, [dateRange]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/overview', {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });
      setOverviewData(response.data);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await adminClient.get(`/admin/analytics/export/${type}`, {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <AdminLayout admin={admin} setAdmin={setAdmin} title="Analytics">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Overview</h2>
          <p className="text-gray-600 mt-2">Comprehensive insights into your business performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal rounded-xl border-gray-200 hover:border-purple-300 transition-all duration-300",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="rounded-2xl bg-white"
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={fetchOverviewData}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <Card 
          className="group cursor-pointer rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm overflow-hidden"
          onClick={() => setCurrentView('products-table')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            <Eye className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-gray-800">{overviewData.totalProducts}</div>
            <p className="text-xs text-gray-500 mt-1">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm overflow-hidden"
          onClick={() => setCurrentView('orders-table')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            <Eye className="h-4 w-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-gray-800">{overviewData.totalOrders}</div>
            <p className="text-xs text-gray-500 mt-1">
              Selected period
            </p>
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm overflow-hidden"
          onClick={() => setCurrentView('users-table')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Eye className="h-4 w-4 text-green-400 group-hover:text-green-600 transition-colors" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-gray-800">{overviewData.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm overflow-hidden"
          onClick={() => setCurrentView('revenue-table')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <Eye className="h-4 w-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">{formatCurrency(overviewData.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Selected period
            </p>
          </CardContent>
        </Card>

        <Card className="group rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{overviewData.recentOrders}</div>
            <p className="text-xs text-gray-500 mt-1">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="group rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{overviewData.conversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Visitors to customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conditional Rendering based on current view */}
      {currentView === 'overview' && (
        <Tabs defaultValue="products" className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-5 gap-2 bg-gray-100/50 p-1.5 rounded-2xl h-auto">
              <TabsTrigger 
                value="products" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
              >
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
              >
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="revenue" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
              >
                Revenue
              </TabsTrigger>
              <TabsTrigger 
                value="site" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
              >
                Site Analytics
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
              <Button
                onClick={() => handleExport('products')}
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <Download className="mr-2 h-4 w-4" />
                Products
              </Button>
              <Button
                onClick={() => handleExport('orders')}
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <Download className="mr-2 h-4 w-4" />
                Orders
              </Button>
              <Button
                onClick={() => handleExport('users')}
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <Download className="mr-2 h-4 w-4" />
                Users
              </Button>
              <Button
                onClick={() => handleExport('revenue')}
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <Download className="mr-2 h-4 w-4" />
                Revenue
              </Button>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-1">
            <TabsContent value="products" className="mt-0">
              <ProductsAnalytics dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <OrdersAnalytics dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <UsersAnalytics dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="revenue" className="mt-0">
              <RevenueAnalytics dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="site" className="mt-0">
              <SiteAnalytics dateRange={dateRange} />
            </TabsContent>
          </div>
        </Tabs>
      )}

      {/* Table Views */}
      {currentView === 'products-table' && (
        <ProductsTable onBack={() => setCurrentView('overview')} />
      )}

      {currentView === 'orders-table' && (
        <OrdersTable onBack={() => setCurrentView('overview')} />
      )}

      {currentView === 'users-table' && (
        <UsersTable onBack={() => setCurrentView('overview')} />
      )}

      {currentView === 'revenue-table' && (
        <RevenueTable onBack={() => setCurrentView('overview')} />
      )}
    </AdminLayout>
  );
}
