import React from 'react';
import { CheckCircle, Truck, Package, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TrackingTimeline = ({ trackingData, orderStatus }) => {
  // Normalize tracking data from different providers (Shiprocket, Delhivery, etc.)
  // This is a simplified normalization. You might need to adjust based on actual API response structure.
  let activities = [];
  let currentStatus = '';

  if (trackingData) {
    if (trackingData.tracking_data?.track_status === 1 || trackingData.tracking_data?.shipment_track_activities) {
      // Shiprocket structure
      activities = trackingData.tracking_data.shipment_track_activities || [];
      currentStatus = trackingData.tracking_data.current_status;
    } else if (trackingData.ShipmentData) {
        // Delhivery structure
        activities = trackingData.ShipmentData[0]?.Shipment?.Scans?.map(scan => ({
            'activity': scan.ScanDetail.Scan,
            'date': scan.ScanDetail.ScanDateTime,
            'location': scan.ScanDetail.ScannedLocation
        })) || [];
        currentStatus = trackingData.ShipmentData[0]?.Shipment?.Status?.Status;
    } else if (Array.isArray(trackingData)) {
        // Generic array
        activities = trackingData;
    }
  }

  // Sort activities by date if needed
  // activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  const steps = [
    { status: 'Ordered', label: 'Order Placed', icon: ShoppingBag },
    { status: 'Packed', label: 'Packed', icon: Package },
    { status: 'Shipped', label: 'Shipped', icon: Truck },
    { status: 'Delivered', label: 'Delivered', icon: CheckCircle },
    { status: 'Cancelled', label: 'Cancelled', icon: X },
  ];

  // Determine active step index based on current status
  const statusMap = {
    'new': 0,
    'placed': 0,
    'confirmed': 0,
    'processing': 0,
    'packed': 1,
    'manifested': 1,
    'shipped': 2,
    'intransit': 2,
    'out for delivery': 2,
    'delivered': 3,
    'cancelled': 4
  };

  const trackingStepIndex = statusMap[currentStatus?.toLowerCase()] ?? 0;
  const orderStepIndex = statusMap[orderStatus?.toLowerCase()] ?? 0;
  const activeStepIndex = Math.max(trackingStepIndex, orderStepIndex);
  const isCancelled = orderStatus?.toLowerCase() === 'cancelled' || currentStatus?.toLowerCase() === 'cancelled';

  const maxProgressIndex = 3;
  const progressIndex = Math.min(activeStepIndex, maxProgressIndex);
 
  return (
    <div className="w-full py-6">
      <h3 className="text-lg font-semibold mb-4">Order Status</h3>
      {isCancelled && (
        <p className="text-sm text-red-600 mb-4">
          This order has been cancelled.
        </p>
      )}
      
      {(trackingData?.tracking_id || trackingData?.courier_name || trackingData?.tracking_url) && (
        <div className="mb-4 text-sm text-gray-700 space-y-1">
          {trackingData.tracking_id && (
            <p>
              Tracking ID: <span className="font-medium">{trackingData.tracking_id}</span>
            </p>
          )}
          {trackingData.courier_name && (
            <p>
              Courier: <span className="font-medium">{trackingData.courier_name}</span>
            </p>
          )}
          {trackingData.tracking_url && (
            <p>
              <a
                href={trackingData.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                View detailed tracking
              </a>
            </p>
          )}
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="relative flex justify-between mb-8">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-green-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(progressIndex / maxProgressIndex) * 100}%` }}
        />
        
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCancelledStep = step.status === 'Cancelled';
          const isActive = isCancelled
            ? isCancelledStep
            : index <= activeStepIndex && !isCancelledStep;

          return (
            <div key={index} className="flex flex-col items-center bg-white px-2">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                  isCancelledStep && isCancelled
                    ? "border-red-600 bg-red-50 text-red-600"
                    : isActive
                      ? "border-green-600 bg-green-50 text-green-600"
                      : "border-gray-300 text-gray-400"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs font-medium mt-2",
                isActive ? "text-green-700" : "text-gray-500"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Activity Log */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
        <h4 className="text-sm font-semibold mb-3">Tracking Details</h4>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />
                  {index < activities.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{activity['activity'] || activity['status']}</p>
                  <p className="text-xs text-gray-500">
                    {activity['date'] && new Date(activity['date']).toLocaleString()}
                    {activity['location'] && ` • ${activity['location']}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tracking updates available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;
