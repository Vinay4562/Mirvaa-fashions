import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { adminClient } from '@/utils/api';

export default function OrdersAnalytics({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState({
    recentOrders: [],
    statusDistribution: [],
    paymentMethodStats: [],
    orderTrends: [],
    performanceMetrics: {}
  });

  useEffect(() => {
    fetchOrdersData();
  }, [dateRange]);

  const fetchOrdersData = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/orders', {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });
      setOrdersData(response.data);
    } catch (error) {
      console.error('Error fetching orders analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {ordersData.performanceMetrics.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-green-600">
              {ordersData.performanceMetrics.completedOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              {formatCurrency(ordersData.performanceMetrics.averageOrderValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Cancellation Rate</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-red-600">
              {ordersData.performanceMetrics.cancellationRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Orders cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersData.statusDistribution?.map((status) => (
                <div key={status.status} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium capitalize">{status.status}</div>
                  <div className="flex-1">
                    <Progress value={status.percentage} className="h-2 rounded-full" />
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {status.count} ({status.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Statistics */}
        <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersData.paymentMethodStats?.map((method) => (
                <div key={method.method} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <span className="text-sm font-medium capitalize">{method.method}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {method.count} orders ({method.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="text-purple-900 font-semibold">Order #</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Customer</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Status</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Payment</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Total</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData.recentOrders?.slice(0, 10).map((order) => (
                  <TableRow key={order.id} className="hover:bg-purple-50/30 border-b border-gray-50 transition-colors">
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-gray-600">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} rounded-lg`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg border-purple-200 text-purple-700 bg-purple-50">
                        {order.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Trends */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Order Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ordersData.orderTrends?.map((trend) => (
              <div key={trend.period} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:shadow-md transition-all duration-300 hover:border-purple-100 bg-white/50">
                <div>
                  <div className="font-medium text-gray-900">{trend.period}</div>
                  <div className="text-sm text-gray-500">
                    {trend.orders} orders • {formatCurrency(trend.revenue)} revenue
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${trend.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.growth >= 0 ? '+' : ''}{trend.growth}%
                  </div>
                  <div className="text-xs text-gray-400">vs previous</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
