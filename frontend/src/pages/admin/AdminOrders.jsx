import { useState, useEffect } from 'react';
import { Package, Download, Truck, CheckCircle, XCircle, Clock, MapPin, Phone, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminClient, BACKEND_URL } from '@/utils/api';
import { getImageUrl, onImageError, PLACEHOLDER_IMAGE } from '@/utils/imageHelper';
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
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      packed: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
      return_requested: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
      returned: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Orders
            </h2>
            <p className="text-gray-500 font-medium">Manage and track your customer orders</p>
          </div>
          <Badge className="text-lg px-4 py-1 rounded-full bg-black text-white shadow-lg">
            {orders.length} Total
          </Badge>
        </div>

        {orders.length > 0 ? (
          <div className="grid gap-6" data-testid="admin-orders-list">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm"
                data-testid={`admin-order-${order.id}`}
                onClick={() => handleOrderClick(order)}
              >
                {/* Decorative Gradient Border/Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="p-6">
                  <div className="grid md:grid-cols-12 gap-6 items-start">
                    
                    {/* Order Details Column */}
                    <div className="md:col-span-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xl group-hover:text-purple-600 transition-colors flex items-center gap-2">
                          #{order.order_number}
                          <Clock className="w-4 h-4 text-gray-400" />
                        </h3>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 pl-1">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 mt-0.5 text-purple-500" />
                          <span className="font-medium">{order.shipping_address.name}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 mt-0.5 text-blue-500" />
                          <span>{order.shipping_address.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 text-pink-500" />
                          <span className="line-clamp-2">
                            {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                          </span>
                        </div>
                      </div>

                      {order.status === 'shipped' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Shipment Details</p>
                          {order.tracking_id && (
                            <p className="text-sm text-gray-700 flex items-center gap-1">
                              <span className="font-medium">ID:</span> {order.tracking_id}
                            </p>
                          )}
                          {order.courier_name && (
                            <p className="text-sm text-gray-700 flex items-center gap-1">
                              <span className="font-medium">Courier:</span> {order.courier_name}
                            </p>
                          )}
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1 font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Track Order <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                      
                      {order.status === 'cancelled' && order.cancellation_reason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-2xl border border-red-100">
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Cancellation Reason</p>
                          <p className="text-sm text-red-600 italic">"{order.cancellation_reason}"</p>
                        </div>
                      )}
                    </div>

                    {/* Items Preview Column */}
                    <div className="md:col-span-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items ({order.items.length})</p>
                      <div className="flex gap-2 flex-wrap">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="group/item relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                            <img
                              src={getImageUrl(item.product_image) || PLACEHOLDER_IMAGE}
                              alt={item.product_title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                              onError={onImageError}
                            />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="text-xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                          ₹{order.total.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="md:col-span-3 flex flex-col justify-between h-full gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusSelect(order, value)}
                          >
                            <SelectTrigger
                              className="w-full rounded-xl border-gray-200 shadow-sm hover:border-purple-300 transition-colors h-10"
                              data-testid={`status-select-${order.id}`}
                            >
                              <SelectValue>
                                <Badge className={`${getStatusColor(order.status)} border px-3 py-1 rounded-full shadow-sm`}>
                                  {formatStatusLabel(order.status)}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl border-gray-100">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="packed">Packed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-500 flex justify-between">
                            Payment: <span className="font-medium text-gray-900">{order.payment_method}</span>
                          </p>
                          <p className="text-xs text-gray-500 flex justify-between">
                            Status: <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{order.payment_status}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-auto">
                        {/* Confirm Order Button */}
                        {(order.status === 'placed' || order.status === 'pending') && (
                          <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmOrder(order.id);
                              }}
                              className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                              size="sm"
                          >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm Order
                          </Button>
                        )}

                        {/* Download PDF Button - visible only for confirmed orders */}
                        {order.status === 'confirmed' && (order.label_url || order.delhivery_waybill) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-full border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50 text-gray-700 font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadLabel(order);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Label
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-3xl bg-white/50 border-2 border-dashed border-gray-200" data-testid="no-orders-admin">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">No orders yet</h2>
            <p className="text-gray-500">Orders will appear here when customers place them</p>
          </div>
        )}
      </div>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="rounded-3xl shadow-2xl border-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {statusDialogStatus === 'shipped' && 'Ship Order'}
              {statusDialogStatus === 'cancelled' && 'Cancel Order'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {statusDialogStatus === 'shipped' && 'Enter the tracking details for this order.'}
              {statusDialogStatus === 'cancelled' && 'Please provide a reason for cancellation.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStatusDialogSubmit} className="space-y-6 pt-4">
            {statusDialogStatus === 'shipped' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tracking-id-input" className="text-gray-700 font-bold">Tracking ID</Label>
                  <Input
                    id="tracking-id-input"
                    value={trackingIdInput}
                    onChange={(e) => setTrackingIdInput(e.target.value)}
                    placeholder="Enter shipment tracking ID"
                    autoFocus
                    className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courier-name-input" className="text-gray-700 font-bold">Courier Name (optional)</Label>
                  <Input
                    id="courier-name-input"
                    value={courierNameInput}
                    onChange={(e) => setCourierNameInput(e.target.value)}
                    placeholder="e.g., Bluedart, Delhivery"
                    className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking-url-input" className="text-gray-700 font-bold">Tracking URL (optional)</Label>
                  <Input
                    id="tracking-url-input"
                    value={trackingUrlInput}
                    onChange={(e) => setTrackingUrlInput(e.target.value)}
                    placeholder="Paste full tracking URL"
                    className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
              </>
            )}

            {statusDialogStatus === 'cancelled' && (
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason-input" className="text-gray-700 font-bold">Cancellation Remarks</Label>
                <Textarea
                  id="cancellation-reason-input"
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  placeholder="Provide a brief reason for cancelling this order"
                  rows={4}
                  className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200 resize-none"
                />
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
                className="rounded-full px-6"
              >
                Close
              </Button>
              <Button type="submit" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 hover:shadow-lg transition-all">
                Save Changes
              </Button>
            </DialogFooter>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {detailsDialogOrder ? `Order #${detailsDialogOrder.order_number}` : 'Order details'}
            </DialogTitle>
          </DialogHeader>
          {detailsDialogOrder && (
            <div className="space-y-8 text-sm pt-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 border-b pb-2">Customer Details</h4>
                  <div className="space-y-2">
                    <p className="text-gray-900 font-semibold text-base">{detailsDialogOrder.shipping_address.name}</p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <p>{detailsDialogOrder.shipping_address.phone}</p>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 mt-1" />
                      <p>
                        {detailsDialogOrder.shipping_address.address}<br />
                        {detailsDialogOrder.shipping_address.city}, {detailsDialogOrder.shipping_address.state} - {detailsDialogOrder.shipping_address.pincode}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 border-b pb-2">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Placed on:</span>
                      <span className="font-medium">{new Date(detailsDialogOrder.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment method:</span>
                      <span className="font-medium">{detailsDialogOrder.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment status:</span>
                      <Badge variant="outline" className={detailsDialogOrder.payment_status === 'paid' ? 'text-green-600 border-green-200 bg-green-50' : 'text-orange-600 border-orange-200 bg-orange-50'}>
                        {detailsDialogOrder.payment_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Order status:</span>
                      <Badge className={getStatusColor(detailsDialogOrder.status)}>
                        {formatStatusLabel(detailsDialogOrder.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  Items ({detailsDialogOrder.items.length})
                </h4>
                <div className="space-y-4">
                  {detailsDialogOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 border border-gray-100 rounded-2xl p-3 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0 border border-gray-100">
                        <img
                          src={getImageUrl(item.product_image) || PLACEHOLDER_IMAGE}
                          alt={item.product_title}
                          className="w-full h-full object-cover"
                          onError={onImageError}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{item.product_title}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                          {item.size && <span className="bg-white px-2 py-1 rounded-md border shadow-sm">Size: <strong>{item.size}</strong></span>}
                          {item.color && <span className="bg-white px-2 py-1 rounded-md border shadow-sm">Color: <strong>{item.color}</strong></span>}
                          {item.age_group && <span className="bg-white px-2 py-1 rounded-md border shadow-sm">Age: <strong>{item.age_group}</strong></span>}
                          <span className="bg-white px-2 py-1 rounded-md border shadow-sm">Qty: <strong>{item.quantity}</strong></span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg text-gray-900">
                          ₹{item.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{detailsDialogOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₹{detailsDialogOrder.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>₹{detailsDialogOrder.shipping.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    ₹{detailsDialogOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
