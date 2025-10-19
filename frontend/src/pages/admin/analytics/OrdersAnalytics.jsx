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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData.performanceMetrics.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {ordersData.performanceMetrics.completedOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(ordersData.performanceMetrics.averageOrderValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {ordersData.performanceMetrics.cancellationRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Orders cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersData.statusDistribution?.map((status) => (
                <div key={status.status} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium capitalize">{status.status}</div>
                  <div className="flex-1">
                    <Progress value={status.percentage} className="h-2" />
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
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersData.paymentMethodStats?.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersData.recentOrders?.slice(0, 10).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-600">{order.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
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
        </CardContent>
      </Card>

      {/* Order Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Order Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ordersData.orderTrends?.map((trend) => (
              <div key={trend.period} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{trend.period}</div>
                  <div className="text-sm text-gray-600">
                    {trend.orders} orders • {formatCurrency(trend.revenue)} revenue
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${trend.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.growth >= 0 ? '+' : ''}{trend.growth}%
                  </div>
                  <div className="text-xs text-gray-600">vs previous</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
