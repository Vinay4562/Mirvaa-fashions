import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { adminClient } from '@/utils/api';

export default function UsersAnalytics({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState({
    recentUsers: [],
    userSegments: [],
    registrationTrends: [],
    userActivity: [],
    performanceMetrics: {}
  });

  useEffect(() => {
    fetchUsersData();
  }, [dateRange]);

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/users', {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });
      setUsersData(response.data);
    } catch (error) {
      console.error('Error fetching users analytics:', error);
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

  const getCustomerTier = (totalSpent) => {
    if (totalSpent >= 50000) return { tier: 'VIP', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (totalSpent >= 25000) return { tier: 'Gold', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (totalSpent >= 10000) return { tier: 'Silver', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    return { tier: 'Bronze', color: 'bg-orange-100 text-orange-800 border-orange-200' };
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {usersData.performanceMetrics.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">New Users</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-green-600">
              {usersData.performanceMetrics.newUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-600">
              {usersData.performanceMetrics.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Made purchases
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {formatCurrency(usersData.performanceMetrics.averageOrderValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per customer
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments */}
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-gray-800">Customer Segments</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {usersData.userSegments?.map((segment) => (
                <div key={segment.segment} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium text-gray-600">{segment.segment}</div>
                  <div className="flex-1">
                    <Progress value={segment.percentage} className="h-2 rounded-full" indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500" />
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {segment.count} ({segment.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-gray-800">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {usersData.userActivity?.map((activity) => (
                <div key={activity.type} className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span className="text-sm font-medium capitalize text-gray-700">{activity.type}</span>
                  </div>
                  <div className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                    {activity.count} users
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Recent Users</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-purple-100">
                  <TableHead className="font-semibold text-purple-900">Name</TableHead>
                  <TableHead className="font-semibold text-purple-900">Email</TableHead>
                  <TableHead className="font-semibold text-purple-900">Phone</TableHead>
                  <TableHead className="font-semibold text-purple-900">Orders</TableHead>
                  <TableHead className="font-semibold text-purple-900">Total Spent</TableHead>
                  <TableHead className="font-semibold text-purple-900">Tier</TableHead>
                  <TableHead className="font-semibold text-purple-900">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData.recentUsers?.slice(0, 10).map((user) => {
                  const tier = getCustomerTier(user.totalSpent);
                  return (
                    <TableRow key={user.id} className="hover:bg-purple-50/30 border-b border-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell className="text-gray-600">{user.phone || 'N/A'}</TableCell>
                      <TableCell className="text-gray-600">{user.orderCount}</TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(user.totalSpent)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${tier.color} border shadow-sm`}>
                          {tier.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Registration Trends */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Registration Trends</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            {usersData.registrationTrends?.map((trend) => (
              <div key={trend.period} className="flex items-center justify-between p-4 border border-purple-100 rounded-xl hover:border-pink-200 hover:bg-purple-50/30 transition-all duration-300">
                <div>
                  <div className="font-medium text-gray-900">{trend.period}</div>
                  <div className="text-sm text-gray-500">
                    {trend.newUsers} new users registered
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${trend.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.growth >= 0 ? '+' : ''}{trend.growth}%
                  </div>
                  <div className="text-xs text-gray-500">vs previous</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Top Customers</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-purple-100">
                  <TableHead className="font-semibold text-purple-900">Rank</TableHead>
                  <TableHead className="font-semibold text-purple-900">Customer</TableHead>
                  <TableHead className="font-semibold text-purple-900">Orders</TableHead>
                  <TableHead className="font-semibold text-purple-900">Total Spent</TableHead>
                  <TableHead className="font-semibold text-purple-900">Last Order</TableHead>
                  <TableHead className="font-semibold text-purple-900">Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData.topCustomers?.slice(0, 10).map((customer, index) => {
                  const tier = getCustomerTier(customer.totalSpent);
                  return (
                    <TableRow key={customer.id} className="hover:bg-purple-50/30 border-b border-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">#{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{customer.orderCount}</TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${tier.color} border shadow-sm`}>
                          {tier.tier}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
