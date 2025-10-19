import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Download, Eye } from 'lucide-react';
import { adminClient } from '@/utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UsersTable({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userOrders, setUserOrders] = useState({});
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, tierFilter, orderFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/users');
      setUsers(response.data.recentUsers || []);
      setTotalPages(Math.ceil((response.data.recentUsers || []).length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async (userId) => {
    if (userOrders[userId]) return userOrders[userId];
    try {
      const response = await adminClient.get(`/admin/orders?user_id=${userId}`);
      const data = response.data;
      const ordersArray = Array.isArray(data) ? data : (data.orders || []);
      const orders = ordersArray.filter(order => order.user_id === userId);
      setUserOrders(prev => ({ ...prev, [userId]: orders }));
      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.phone?.includes(searchTerm);
    
    const tier = getCustomerTier(user.totalSpent || 0);
    const matchesTier = tierFilter === 'all' || tier.tier === tierFilter;
    
    const matchesOrder = orderFilter === 'all' || 
                        (orderFilter === 'has-orders' && (user.orderCount || 0) > 0) ||
                        (orderFilter === 'no-orders' && (user.orderCount || 0) === 0);
    
    return matchesSearch && matchesTier && matchesOrder;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewOrders = async (user) => {
    setSelectedUser(user);
    setOrdersModalOpen(true);
    setOrdersLoading(true);
    await fetchUserOrders(user.id);
    setOrdersLoading(false);
  };

  const handleExport = async () => {
    try {
      const response = await adminClient.get('/admin/analytics/export/users', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting users:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Button>
          <div>
            <h1 className="text-2xl font-bold">All Users</h1>
            <p className="text-gray-600">Registered customers and their order history</p>
          </div>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Customer Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="VIP">VIP (₹50k+)</SelectItem>
                <SelectItem value="Gold">Gold (₹25k-50k)</SelectItem>
                <SelectItem value="Silver">Silver (₹10k-25k)</SelectItem>
                <SelectItem value="Bronze">Bronze (Under ₹10k)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="has-orders">Has Orders</SelectItem>
                <SelectItem value="no-orders">No Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users ({filteredUsers.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => {
                  const tier = getCustomerTier(user.totalSpent || 0);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{user.email}</div>
                          <div className="text-sm text-gray-600">{user.phone || 'No phone'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{user.orderCount || 0}</div>
                          <div className="text-xs text-gray-600">orders</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(user.totalSpent || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={tier.color}>
                          {tier.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {user.lastOrderDate ? formatDate(user.lastOrderDate) : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrders(user)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Orders
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Orders Modal */}
      <Dialog open={ordersModalOpen} onOpenChange={setOrdersModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? `Orders for ${selectedUser.name}` : 'Orders'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="py-8 text-center text-gray-600">Loading orders...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedUser && userOrders[selectedUser.id] ? userOrders[selectedUser.id] : []).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>{order.payment_method}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(order.created_at)}</TableCell>
                      </TableRow>
                    ))}
                    {selectedUser && (!userOrders[selectedUser.id] || userOrders[selectedUser.id].length === 0) && !ordersLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-600">No orders found for this user.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setOrdersModalOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
