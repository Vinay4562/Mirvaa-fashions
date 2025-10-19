import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ProductsAnalytics from './ProductsAnalytics';
import OrdersAnalytics from './OrdersAnalytics';
import UsersAnalytics from './UsersAnalytics';
import RevenueAnalytics from './RevenueAnalytics';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into your business performance</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={fetchOverviewData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentView('products-table')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Eye className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active products in catalog
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentView('orders-table')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Eye className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Orders in selected period
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentView('users-table')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Eye className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered customers
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentView('revenue-table')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Eye className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overviewData.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Revenue in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.recentOrders}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Visitors to customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conditional Rendering based on current view */}
        {currentView === 'overview' && (
          <Tabs defaultValue="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
              </TabsList>

              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button
                  onClick={() => handleExport('products')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Products
                </Button>
                <Button
                  onClick={() => handleExport('orders')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Orders
                </Button>
                <Button
                  onClick={() => handleExport('users')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Users
                </Button>
                <Button
                  onClick={() => handleExport('revenue')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Revenue
                </Button>
              </div>
            </div>

            <TabsContent value="products">
              <ProductsAnalytics dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersAnalytics dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="users">
              <UsersAnalytics dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="revenue">
              <RevenueAnalytics dateRange={dateRange} />
            </TabsContent>
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
      </div>
    </div>
  );
}
