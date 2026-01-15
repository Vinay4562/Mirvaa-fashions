import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrackingTimeline from '@/components/TrackingTimeline';
import BottomNav from '@/components/BottomNav';
import { apiClient } from '@/utils/api';
import { getImageUrl, onImageError } from '@/utils/imageHelper';
import { toast } from 'sonner';
import Loading from '@/components/Loading';

const formatStatusLabel = (status) => {
  if (!status) return '';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export default function OrderConfirmation({ user, setUser }) {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productImageById, setProductImageById] = useState({});
  const [trackingData, setTrackingData] = useState(null);
  const [reviewRatings, setReviewRatings] = useState({});
  const [reviewComments, setReviewComments] = useState({});
  const [submittingReviewFor, setSubmittingReviewFor] = useState(null);
  const [submittedReviews, setSubmittedReviews] = useState({});

  useEffect(() => {
    if (!user) {
      return;
    }
    fetchOrder();
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      const ord = response.data;
      setOrder(ord);

      // Fetch tracking info
      try {
        const trackRes = await apiClient.get(`/shipping/track/${orderId}`);
        if (trackRes.data.success) {
          setTrackingData(trackRes.data.tracking_data);
        }
      } catch (e) {
        console.log("Tracking info unavailable");
      }

      // Prefetch product images if missing
      const missing = (ord.items || []).filter((it) => !it.product_image && !it.product?.images?.[0]);
      const uniqueIds = [...new Set(missing.map((it) => it.product_id))];
      if (uniqueIds.length) {
        const results = await Promise.allSettled(uniqueIds.map((id) => apiClient.get(`/products/${id}`)));
        const map = {};
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled' && res.value?.data) {
            const imgs = res.value.data.images || [];
            if (imgs.length) map[uniqueIds[idx]] = imgs[0];
          }
        });
        setProductImageById(map);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (productId, rating) => {
    setReviewRatings((prev) => ({
      ...prev,
      [productId]: rating,
    }));
  };

  const handleCommentChange = (productId, value) => {
    setReviewComments((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleSubmitReview = async (productId) => {
    const rating = reviewRatings[productId] || 0;
    const comment = (reviewComments[productId] || '').trim();

    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment) {
      toast.error('Please enter your comments');
      return;
    }

    try {
      setSubmittingReviewFor(productId);
      await apiClient.post('/reviews', {
        product_id: productId,
        rating,
        comment,
      });
      toast.success('Thank you for your review');
      setSubmittedReviews((prev) => ({
        ...prev,
        [productId]: true,
      }));
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReviewFor(null);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} />

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pt-12 md:pb-12">
        {/* Success Message */}
        <div className="text-center mb-8" data-testid="order-success">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Thank you for shopping with Mirvaa</p>
        </div>

        {/* Tracking Timeline */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <TrackingTimeline 
              trackingData={trackingData} 
              orderStatus={order.status}
            />
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6" data-testid="order-details">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Order #{order.order_number}</h2>
                <p className="text-sm text-gray-600">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
                {order.status === 'cancelled' && order.cancellation_reason && (
                  <p className="text-sm text-red-600 mt-1">
                    Reason for cancellation: {order.cancellation_reason}
                  </p>
                )}
              </div>
              <div className="mt-2 md:mt-0">
                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                  {formatStatusLabel(order.status)}
                </span>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Items */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Order Items</h3>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={getImageUrl(item.product_image || productImageById[item.product_id] || item.product?.images?.[0]) || 'https://via.placeholder.com/100'}
                      alt={item.product_title}
                      className="w-full h-full object-cover"
                      onError={onImageError}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product_title}</h4>
                    <p className="text-sm text-gray-600">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' • '}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="mb-6" />

            {/* Pricing */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₹{order.tax.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span data-testid="order-total">₹{order.total.toLocaleString()}</span>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Shipping Address</h3>
              <div className="text-gray-700">
                <p className="font-medium">{order.shipping_address.name}</p>
                <p>{order.shipping_address.address}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </p>
                <p>Phone: {order.shipping_address.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.status === 'delivered' && (
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Review this order</h3>
              <p className="text-sm text-gray-600">
                Share your feedback on the products you received. Your review will appear on the product page.
              </p>
              <div className="space-y-4">
                {[...new Map(order.items.map((item) => [item.product_id, item])).values()].map((item) => {
                  const isSubmitted = submittedReviews[item.product_id];
                  const currentRating = reviewRatings[item.product_id] || 0;
                  const currentComment = reviewComments[item.product_id] || '';
                  const isSubmitting = submittingReviewFor === item.product_id;

                  return (
                    <div
                      key={item.product_id}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={
                              getImageUrl(
                                item.product_image ||
                                  productImageById[item.product_id] ||
                                  item.product?.images?.[0]
                              ) || 'https://via.placeholder.com/100'
                            }
                            alt={item.product_title}
                            className="w-full h-full object-cover"
                            onError={onImageError}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.product_title}</p>
                          <p className="text-xs text-gray-500">
                            {isSubmitted ? 'You have submitted a review for this product' : 'Rate and review this product'}
                          </p>
                        </div>
                      </div>

                      {!isSubmitted && (
                        <>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleRatingChange(item.product_id, value)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={
                                    value <= currentRating
                                      ? 'h-5 w-5 fill-yellow-400 text-yellow-400'
                                      : 'h-5 w-5 text-gray-300'
                                  }
                                />
                              </button>
                            ))}
                          </div>

                          <Textarea
                            value={currentComment}
                            onChange={(e) =>
                              handleCommentChange(item.product_id, e.target.value)
                            }
                            placeholder="Write your comments about this product"
                            rows={3}
                          />

                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              className="btn-hover"
                              onClick={() => handleSubmitReview(item.product_id)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/account">
            <Button size="lg" variant="outline" className="btn-hover">
              <Package className="mr-2 h-5 w-5" />
              View All Orders
            </Button>
          </Link>
          <Link to="/products">
            <Button size="lg" className="btn-hover">Continue Shopping</Button>
          </Link>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
