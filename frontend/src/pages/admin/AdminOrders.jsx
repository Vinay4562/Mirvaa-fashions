import { useState, useEffect } from 'react';
import { Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminClient, BACKEND_URL } from '@/utils/api';
import { getImageUrl, onImageError } from '@/utils/imageHelper';
import { toast } from 'sonner';
import Loading from '@/components/Loading';

export default function AdminOrders({ admin, setAdmin }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogOrder, setStatusDialogOrder] = useState(null);
  const [statusDialogStatus, setStatusDialogStatus] = useState('');
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');
  const [courierNameInput, setCourierNameInput] = useState('');
  const [trackingUrlInput, setTrackingUrlInput] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogOrder, setDetailsDialogOrder] = useState(null);

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

  const handleStatusChange = async (orderId, newStatus, extraData = {}) => {
    try {
      await adminClient.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        ...extraData,
      });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleStatusSelect = (order, newStatus) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (newStatus === 'shipped') {
      setStatusDialogOrder(order);
      setStatusDialogStatus(newStatus);
      setTrackingIdInput(order.tracking_id || '');
      setCourierNameInput(order.courier_name || '');
      setTrackingUrlInput(order.tracking_url || '');
      setCancellationReasonInput('');
      setStatusDialogOpen(true);
      return;
    }

    if (newStatus === 'cancelled') {
      setStatusDialogOrder(order);
      setStatusDialogStatus(newStatus);
      setTrackingIdInput('');
      setCancellationReasonInput(order.cancellation_reason || '');
      setCourierNameInput('');
      setTrackingUrlInput('');
      setStatusDialogOpen(true);
      return;
    }

    handleStatusChange(order.id, newStatus);
  };

  const handleOrderClick = (order) => {
    setDetailsDialogOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleStatusDialogSubmit = async (event) => {
    event.preventDefault();
    if (!statusDialogOrder || !statusDialogStatus) {
      setStatusDialogOpen(false);
      return;
    }

    const extraData = {};

    if (statusDialogStatus === 'shipped') {
      if (!trackingIdInput.trim()) {
        toast.error('Please enter a tracking ID');
        return;
      }
      extraData.tracking_id = trackingIdInput.trim();
      if (courierNameInput.trim()) {
        extraData.courier_name = courierNameInput.trim();
      }
      if (trackingUrlInput.trim()) {
        extraData.tracking_url = trackingUrlInput.trim();
      }
    }

    if (statusDialogStatus === 'cancelled') {
      if (!cancellationReasonInput.trim()) {
        toast.error('Please enter cancellation remarks');
        return;
      }
      extraData.cancellation_reason = cancellationReasonInput.trim();
    }

    await handleStatusChange(statusDialogOrder.id, statusDialogStatus, extraData);
    setStatusDialogOpen(false);
    setStatusDialogOrder(null);
    setStatusDialogStatus('');
    setTrackingIdInput('');
    setCancellationReasonInput('');
    setCourierNameInput('');
    setTrackingUrlInput('');
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
      let url;

      const hasInvoice = order.invoice_url || order.label_url;

      if (hasInvoice) {
        url = `${BACKEND_URL}/api/admin/orders/${order.id}/invoice`;
      } else if (order.delhivery_waybill) {
        url = `${BACKEND_URL}/api/admin/orders/${order.id}/label`;
      } else {
        toast.error("No PDF available for this order");
        return;
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
      return_requested: 'bg-orange-100 text-orange-700',
      returned: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatusLabel = (status) => {
    if (!status) return '';
    return status
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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
              <Card
                key={order.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                data-testid={`admin-order-${order.id}`}
                onClick={() => handleOrderClick(order)}
              >
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
                      {order.status === 'shipped' && order.tracking_id && (
                        <p className="text-sm text-gray-700 mt-1">
                          Tracking ID: {order.tracking_id}
                        </p>
                      )}
                      {order.status === 'shipped' && order.courier_name && (
                        <p className="text-sm text-gray-700">
                          Courier: {order.courier_name}
                        </p>
                      )}
                      {order.status === 'shipped' && order.tracking_url && (
                        <p className="text-sm text-blue-600">
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open tracking link
                          </a>
                        </p>
                      )}
                      {order.status === 'cancelled' && order.cancellation_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Cancellation remarks: {order.cancellation_reason}
                        </p>
                      )}
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
                        onValueChange={(value) => handleStatusSelect(order, value)}
                      >
                        <SelectTrigger
                          data-testid={`status-select-${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue>
                            <Badge className={getStatusColor(order.status)}>
                              {formatStatusLabel(order.status)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmOrder(order.id);
                            }}
                            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                        >
                            Confirm Order
                        </Button>
                      )}

                      {/* Download PDF Button - visible only for confirmed orders */}
                      {order.status === 'confirmed' && (order.label_url || order.delhivery_waybill) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadLabel(order);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
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

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialogStatus === 'shipped' && 'Enter Tracking ID'}
              {statusDialogStatus === 'cancelled' && 'Enter Cancellation Remarks'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStatusDialogSubmit} className="space-y-4">
            {statusDialogStatus === 'shipped' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tracking-id-input">Tracking ID</Label>
                  <Input
                    id="tracking-id-input"
                    value={trackingIdInput}
                    onChange={(e) => setTrackingIdInput(e.target.value)}
                    placeholder="Enter shipment tracking ID"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courier-name-input">Courier Name (optional)</Label>
                  <Input
                    id="courier-name-input"
                    value={courierNameInput}
                    onChange={(e) => setCourierNameInput(e.target.value)}
                    placeholder="Enter courier name (e.g., Bluedart, Delhivery)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking-url-input">Tracking URL (optional)</Label>
                  <Input
                    id="tracking-url-input"
                    value={trackingUrlInput}
                    onChange={(e) => setTrackingUrlInput(e.target.value)}
                    placeholder="Paste full tracking URL"
                  />
                </div>
              </>
            )}

            {statusDialogStatus === 'cancelled' && (
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason-input">Cancellation Remarks</Label>
                <Textarea
                  id="cancellation-reason-input"
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  placeholder="Provide a brief reason for cancelling this order"
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
              >
                Close
              </Button>
              <Button type="submit">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsDialogOpen}
        onOpenChange={(open) => {
          setDetailsDialogOpen(open);
          if (!open) {
            setDetailsDialogOrder(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailsDialogOrder ? `Order #${detailsDialogOrder.order_number}` : 'Order details'}
            </DialogTitle>
          </DialogHeader>
          {detailsDialogOrder && (
            <div className="space-y-6 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-1">Customer details</p>
                  <p className="text-gray-700">{detailsDialogOrder.shipping_address.name}</p>
                  <p className="text-gray-700">{detailsDialogOrder.shipping_address.phone}</p>
                  <p className="text-gray-600 mt-1">
                    {detailsDialogOrder.shipping_address.address}
                  </p>
                  <p className="text-gray-600">
                    {detailsDialogOrder.shipping_address.city}, {detailsDialogOrder.shipping_address.state} - {detailsDialogOrder.shipping_address.pincode}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold mb-1">Order summary</p>
                  <p className="text-gray-700">
                    Placed on {new Date(detailsDialogOrder.created_at).toLocaleString()}
                  </p>
                  <p className="text-gray-700">
                    Payment method: {detailsDialogOrder.payment_method}
                  </p>
                  <p className="text-gray-700">
                    Payment status: {detailsDialogOrder.payment_status}
                  </p>
                  <div className="mt-1">
                    <span className="text-gray-700 mr-2">Order status:</span>
                    <Badge className={getStatusColor(detailsDialogOrder.status)}>
                      {formatStatusLabel(detailsDialogOrder.status)}
                    </Badge>
                  </div>
                  {detailsDialogOrder.tracking_id && (
                    <p className="text-gray-700 mt-1">
                      Tracking ID: {detailsDialogOrder.tracking_id}
                    </p>
                  )}
                  {detailsDialogOrder.courier_name && (
                    <p className="text-gray-700">
                      Courier: {detailsDialogOrder.courier_name}
                    </p>
                  )}
                  {detailsDialogOrder.tracking_url && (
                    <p className="text-blue-600">
                      <a
                        href={detailsDialogOrder.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open tracking link
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">
                  Items ({detailsDialogOrder.items.length})
                </p>
                <div className="space-y-3">
                  {detailsDialogOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 border rounded-lg p-2"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={getImageUrl(item.product_image) || 'https://via.placeholder.com/100'}
                          alt={item.product_title}
                          className="w-full h-full object-cover"
                          onError={onImageError}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product_title}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm flex-shrink-0">
                        <p className="font-semibold">
                          ₹{item.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          Line total: ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 flex flex-col items-end gap-1 text-sm">
                <p>
                  Subtotal: <span className="font-semibold">₹{detailsDialogOrder.subtotal.toLocaleString()}</span>
                </p>
                <p>
                  Tax: <span className="font-semibold">₹{detailsDialogOrder.tax.toLocaleString()}</span>
                </p>
                <p>
                  Shipping: <span className="font-semibold">₹{detailsDialogOrder.shipping.toLocaleString()}</span>
                </p>
                <p className="text-base">
                  Total:{' '}
                  <span className="font-bold">
                    ₹{detailsDialogOrder.total.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
