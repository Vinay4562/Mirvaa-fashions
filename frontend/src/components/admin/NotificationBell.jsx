import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { adminClient } from '@/utils/api';
import { format } from 'date-fns';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupNotification, setPopupNotification] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await adminClient.get('/admin/notifications');
      const newNotifications = response.data.notifications;
      setNotifications(newNotifications);
      setUnreadCount(response.data.unread_count);

      // Check for unread order_placed notifications
      // We prioritize the most recent unread order notification
      const unreadOrder = newNotifications.find(n => !n.is_read && n.type === 'order_placed');
      
      // Only update popup if we don't have one open or if it's a different one
      if (unreadOrder) {
        // If we are already showing this specific notification, don't do anything
        if (showPopup && popupNotification && popupNotification.id === unreadOrder.id) {
          return;
        }
        
        // If we are showing a popup for a DIFFERENT notification, maybe we should switch?
        // Or if no popup is shown, show it.
        // To prevent annoying re-opening if user manually closed it without acknowledging (if we allow that),
        // we might want to track "dismissed" IDs in session state.
        // But for now, let's just show it.
        if (!showPopup) {
           setPopupNotification(unreadOrder);
           setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await adminClient.put(`/admin/notifications/${id}/read`);
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handlePopupOk = async () => {
    if (popupNotification) {
      await handleMarkAsRead(popupNotification.id);
      setShowPopup(false);
      setPopupNotification(null);
      // Immediately fetch to see if there are MORE unread notifications
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminClient.put('/admin/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setShowPopup(false); // Close popup if open
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      case 'payment_completed':
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case 'order_delivered':
        return <div className="h-2 w-2 rounded-full bg-purple-500" />;
      case 'return_requested':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100 w-10 h-10">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full border-2 border-white shadow-sm"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-gray-100" align="end">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h4 className="font-bold">Notifications</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-auto py-1 px-2 rounded-full hover:bg-gray-100">
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm ${!notification.is_read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center text-green-600">New Order Received! 🎉</DialogTitle>
            <DialogDescription className="text-center text-lg text-gray-700 mt-2">
              {popupNotification?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handlePopupOk} className="rounded-full bg-green-600 hover:bg-green-700 text-white font-bold px-8">
              View Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
