import { useState, useEffect } from 'react';
import { Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminClient, BACKEND_URL } from '@/utils/api';
import { getImageUrl, onImageError } from '@/utils/imageHelper';
import { toast } from 'sonner';
import Loading from '@/components/Loading';

export default function AdminOrders({ admin, setAdmin }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminClient.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminClient.put(`/admin/orders/${orderId}/status?status=${newStatus}`);
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      setLoading(true);
      await adminClient.post(`/admin/orders/${orderId}/confirm-shipping`);
      toast.success("Order confirmed and pickup scheduled!");
      fetchOrders();
    } catch (error) {
      console.error("Error confirming order:", error);
      toast.error(error.response?.data?.detail || "Failed to confirm order");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLabel = async (order) => {
    try {
      // Construct full URL to ensure we hit the correct endpoint
      // If label_url is relative (starts with /), append it to BACKEND_URL
      // Note: label_url from DB usually includes /api prefix (e.g. /api/admin/orders/...)
      let url;
      if (order.label_url) {
        if (order.label_url.startsWith('http')) {
           url = order.label_url;
        } else {
           url = `${BACKEND_URL}${order.label_url}`;
        }
      } else {
        // Fallback if label_url is missing
        url = `${BACKEND_URL}/api/admin/orders/${order.id}/label`;
      }
          
      // If it's an external URL (not our backend), just open it
      if (url.startsWith('http') && !url.includes(BACKEND_URL)) {
          window.open(url, '_blank');
          return;
      }

      console.log("Downloading label from:", url);

      // Fetch blob with auth headers
      // We use axios directly or adminClient with full URL (axios handles full URLs by ignoring baseURL)
      const response = await adminClient.get(url, { responseType: 'blob' });
      
      // Create object URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(objectUrl, '_blank');
      
      // Clean up after a minute
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
      
    } catch (error) {
      console.error("Error downloading label:", error);
      toast.error("Failed to download label");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      packed: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <AdminLayout admin={admin} setAdmin={setAdmin} title="Order Management">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-6">Orders ({orders.length})</h2>

        {orders.length > 0 ? (
          <div className="space-y-4" data-testid="admin-orders-list">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden" data-testid={`admin-order-${order.id}`}>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    {/* Order Info */}
                    <div className="md:col-span-2">
                      <h3 className="font-bold text-lg mb-2">Order #{order.order_number}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Customer: {order.shipping_address.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: {order.shipping_address.phone}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Address: {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                      </p>
                    </div>

                    {/* Order Items Preview */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Items ({order.items.length})</p>
                      <div className="flex gap-2 flex-wrap">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={getImageUrl(item.product_image) || 'https://via.placeholder.com/100'}
                              alt={item.product_title}
                              className="w-full h-full object-cover"
                              onError={onImageError}
                            />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-bold mt-2">₹{order.total.toLocaleString()}</p>
                    </div>

                    {/* Status Management */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Update Status</p>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger data-testid={`status-select-${order.id}`}>
                          <SelectValue>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="packed">Packed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-2">
                        Payment: {order.payment_method}
                      </p>
                      <p className="text-xs text-gray-500">
                        Status: {order.payment_status}
                      </p>
                      
                      {/* Confirm Order Button */}
                      {(order.status === 'placed' || order.status === 'pending') && (
                        <Button 
                            onClick={() => handleConfirmOrder(order.id)}
                            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                        >
                            Confirm Order
                        </Button>
                      )}

                      {/* Download Label Button */}
                      {(order.label_url || order.delhivery_waybill) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleDownloadLabel(order)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Label
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20" data-testid="no-orders-admin">
            <Package className="h-24 w-24 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-gray-600">Orders will appear here when customers place them</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
