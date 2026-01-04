import { useState, useEffect } from 'react';
import { Bell, Package, Tag, Clock, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '@/utils/api';

export default function NotificationPopover({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let orders = [];
      if (user) {
        // Fetch orders only if user is logged in
        try {
          const ordersRes = await api.get('/orders');
          orders = ordersRes.data || [];
        } catch (err) {
          console.log("Error fetching orders", err);
        }
      }

      // Fetch offers (featured products)
      const offersRes = await api.get('/products/featured');
      const offers = offersRes.data || [];

      // Transform into notifications
      const orderNotifs = orders.map(order => ({
        id: `order-${order.id}`,
        type: 'order',
        title: `Order Update: ${order.order_number}`,
        message: `Status: ${order.status}. ${order.items.length} items. Total: ₹${order.total}`,
        date: new Date(order.updated_at || order.created_at),
        data: order,
        read: false
      }));

      const offerNotifs = offers.map(offer => ({
        id: `offer-${offer.id}`,
        type: 'offer',
        title: 'Special Offer!',
        message: `${offer.title} is now available at ${offer.discount_percent}% OFF!`,
        date: new Date(offer.created_at), // or just now
        data: offer,
        read: false
      }));

      // Combine and sort by date
      const allNotifs = [...orderNotifs, ...offerNotifs].sort((a, b) => b.date - a.date);
      setNotifications(allNotifs);

    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleNotificationClick = (notif) => {
      setOpen(false);
      if (notif.type === 'order') {
          navigate('/account'); 
      } else if (notif.type === 'offer') {
          navigate(`/products/${notif.data.id}`);
      }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative md:hidden btn-hover">
           <Bell className="h-6 w-6" />
           {notifications.length > 0 && (
             <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-600 rounded-full border border-white"></span>
           )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50">
            <h4 className="font-semibold text-sm">Notifications</h4>
            <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
            </Button>
        </div>
        <ScrollArea className="h-[300px]">
            {loading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                    <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                    Loading updates...
                </div>
            ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 text-gray-300" />
                    <p>No new notifications</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <div className="flex gap-3">
                                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                    {notif.type === 'order' ? <Package className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {format(notif.date, 'MMM d, h:mm a')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
