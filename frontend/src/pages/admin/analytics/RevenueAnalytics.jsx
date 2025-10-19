import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { adminClient } from '@/utils/api';

export default function RevenueAnalytics({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    dailyRevenue: [],
    monthlyRevenue: [],
    categoryRevenue: [],
    paymentMethodRevenue: [],
    performanceMetrics: {}
  });

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/revenue', {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });
      setRevenueData(response.data);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData.performanceMetrics.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData.performanceMetrics.averageDailyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGrowthColor(revenueData.performanceMetrics.revenueGrowth || 0)}`}>
              {revenueData.performanceMetrics.revenueGrowth >= 0 ? '+' : ''}{revenueData.performanceMetrics.revenueGrowth || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData.performanceMetrics.bestDayRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest single day
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.dailyRevenue?.slice(-7).map((day) => (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium">{formatDate(day.date)}</div>
                  <div className="flex-1">
                    <Progress value={(day.revenue / revenueData.performanceMetrics.bestDayRevenue) * 100} className="h-2" />
                  </div>
                  <div className="w-24 text-sm text-gray-600 text-right">
                    {formatCurrency(day.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.paymentMethodRevenue?.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium capitalize">{method.method}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(method.revenue)} ({method.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Avg. Order Value</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueData.categoryRevenue?.map((category) => (
                <TableRow key={category.name}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(category.revenue)}
                  </TableCell>
                  <TableCell>{category.orderCount}</TableCell>
                  <TableCell>{formatCurrency(category.averageOrderValue)}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${getGrowthColor(category.growth)}`}>
                      {category.growth >= 0 ? '+' : ''}{category.growth}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Revenue Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData.monthlyRevenue?.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{month.month}</div>
                  <div className="text-sm text-gray-600">
                    {month.orders} orders • {formatCurrency(month.revenue)} revenue
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getGrowthColor(month.growth)}`}>
                    {month.growth >= 0 ? '+' : ''}{month.growth}%
                  </div>
                  <div className="text-xs text-gray-600">vs previous month</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(revenueData.forecast?.nextWeek || 0)}
                </div>
                <div className="text-sm text-gray-600">Next Week</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenueData.forecast?.nextMonth || 0)}
                </div>
                <div className="text-sm text-gray-600">Next Month</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(revenueData.forecast?.nextQuarter || 0)}
                </div>
                <div className="text-sm text-gray-600">Next Quarter</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              * Forecasts are based on historical trends and may vary
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
