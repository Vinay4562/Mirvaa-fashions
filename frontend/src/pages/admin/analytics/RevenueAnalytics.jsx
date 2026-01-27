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
            <Card key={i} className="rounded-3xl border-0 shadow-lg overflow-hidden">
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {formatCurrency(revenueData.performanceMetrics.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              {formatCurrency(revenueData.performanceMetrics.averageDailyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per day
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-2xl font-bold ${getGrowthColor(revenueData.performanceMetrics.revenueGrowth || 0)}`}>
              {revenueData.performanceMetrics.revenueGrowth >= 0 ? '+' : ''}{revenueData.performanceMetrics.revenueGrowth || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs previous period
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Top Day</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">
              {formatCurrency(revenueData.performanceMetrics.bestDayRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Highest single day
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-gray-800">Daily Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {revenueData.dailyRevenue?.slice(-7).map((day) => (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium text-gray-600">{formatDate(day.date)}</div>
                  <div className="flex-1">
                    <Progress 
                      value={(day.revenue / revenueData.performanceMetrics.bestDayRevenue) * 100} 
                      className="h-2 rounded-full" 
                      indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                  <div className="w-24 text-sm font-medium text-purple-600 text-right">
                    {formatCurrency(day.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Revenue */}
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-gray-800">Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {revenueData.paymentMethodRevenue?.map((method) => (
                <div key={method.method} className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span className="text-sm font-medium capitalize text-gray-700">{method.method}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatCurrency(method.revenue)} <span className="text-gray-400 font-normal">({method.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Revenue */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-purple-100">
                  <TableHead className="font-semibold text-purple-900">Category</TableHead>
                  <TableHead className="font-semibold text-purple-900">Revenue</TableHead>
                  <TableHead className="font-semibold text-purple-900">Orders</TableHead>
                  <TableHead className="font-semibold text-purple-900">Avg. Order Value</TableHead>
                  <TableHead className="font-semibold text-purple-900">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.categoryRevenue?.map((category) => (
                  <TableRow key={category.name} className="hover:bg-purple-50/30 border-b border-gray-50 transition-colors">
                    <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {formatCurrency(category.revenue)}
                    </TableCell>
                    <TableCell className="text-gray-600">{category.orderCount}</TableCell>
                    <TableCell className="text-gray-600">{formatCurrency(category.averageOrderValue)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-bold ${getGrowthColor(category.growth)}`}>
                        {category.growth >= 0 ? '+' : ''}{category.growth}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Comparison */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Monthly Revenue Comparison</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            {revenueData.monthlyRevenue?.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-4 border border-purple-100 rounded-2xl hover:shadow-md transition-all duration-300 hover:border-pink-200 bg-white/50 hover:bg-purple-50/20">
                <div>
                  <div className="font-medium text-gray-900">{month.month}</div>
                  <div className="text-sm text-gray-500">
                    {month.orders} orders • {formatCurrency(month.revenue)} revenue
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${getGrowthColor(month.growth)}`}>
                    {month.growth >= 0 ? '+' : ''}{month.growth}%
                  </div>
                  <div className="text-xs text-gray-400">vs previous month</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-blue-100 bg-blue-50/30 rounded-3xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(revenueData.forecast?.nextWeek || 0)}
                </div>
                <div className="text-sm text-gray-600">Next Week</div>
              </div>
              <div className="text-center p-6 border border-green-100 bg-green-50/30 rounded-3xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatCurrency(revenueData.forecast?.nextMonth || 0)}
                </div>
                <div className="text-sm text-gray-600">Next Month</div>
              </div>
              <div className="text-center p-6 border border-purple-100 bg-purple-50/30 rounded-3xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {formatCurrency(revenueData.forecast?.nextQuarter || 0)}
                </div>
                <div className="text-sm text-gray-600">Next Quarter</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 text-center italic">
              * Forecasts are based on historical trends and may vary
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
