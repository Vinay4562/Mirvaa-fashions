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
    if (totalSpent >= 50000) return { tier: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (totalSpent >= 25000) return { tier: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (totalSpent >= 10000) return { tier: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { tier: 'Bronze', color: 'bg-orange-100 text-orange-800' };
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData.performanceMetrics.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usersData.performanceMetrics.newUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {usersData.performanceMetrics.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Made purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(usersData.performanceMetrics.averageOrderValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersData.userSegments?.map((segment) => (
                <div key={segment.segment} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium">{segment.segment}</div>
                  <div className="flex-1">
                    <Progress value={segment.percentage} className="h-2" />
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
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersData.userActivity?.map((activity) => (
                <div key={activity.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium capitalize">{activity.type}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {activity.count} users
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData.recentUsers?.slice(0, 10).map((user) => {
                const tier = getCustomerTier(user.totalSpent);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>{user.orderCount}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(user.totalSpent)}
                    </TableCell>
                    <TableCell>
                      <Badge className={tier.color}>
                        {tier.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Registration Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersData.registrationTrends?.map((trend) => (
              <div key={trend.period} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{trend.period}</div>
                  <div className="text-sm text-gray-600">
                    {trend.newUsers} new users registered
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

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData.topCustomers?.slice(0, 10).map((customer, index) => {
                const tier = getCustomerTier(customer.totalSpent);
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Badge className={tier.color}>
                        {tier.tier}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
