import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Minus, Plus, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';
import { API, apiClient } from '@/utils/api';
import { getImageUrl, getOptimizedImageUrl, getThumbnailUrl, getMediumImageUrl, getLargeImageUrl, onImageError } from '@/utils/imageHelper';
import { toast } from 'sonner';
import Loading from '@/components/Loading';

export default function ProductDetail({ user, setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);
  const [pinchStart, setPinchStart] = useState(null);
  const [pinchStartZoom, setPinchStartZoom] = useState(100);
  const [hoverZone, setHoverZone] = useState(null);

  useEffect(() => {
    fetchProduct();
    if (user) {
      fetchCounts();
    }
  }, [id, user]);

  useEffect(() => {
    if (!product) return;
    const map = product.color_images || {};
    if (selectedColor && map[selectedColor] && map[selectedColor].length > 0) {
      setSelectedImage(0);
    }
  }, [selectedColor, product]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const [productRes, reviewsRes] = await Promise.all([
        axios.get(`${API}/products/${id}`),
        axios.get(`${API}/products/${id}/reviews`),
      ]);

      setProduct(productRes.data);
      setReviews(reviewsRes.data);

      // Set default selections
      if (productRes.data.sizes.length > 0) {
        setSelectedSize(productRes.data.sizes[0]);
      }
      if (productRes.data.colors.length > 0) {
        setSelectedColor(productRes.data.colors[0]);
      }

      // Fetch related products
      const relatedRes = await axios.get(`${API}/products?category=${productRes.data.category}&limit=4`);
      setRelatedProducts(relatedRes.data.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        apiClient.get('/cart'),
        apiClient.get('/wishlist'),
      ]);
      setCartCount(cartRes.data.length);
      setWishlistCount(wishlistRes.data.length);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add to cart');
      return;
    }

    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    try {
      await apiClient.post('/cart', {
        product_id: product.id,
        quantity,
        size: selectedSize,
        color: selectedColor,
      });
      toast.success('Added to cart');
      fetchCounts();
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/checkout');
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      await apiClient.post(`/wishlist/${product.id}`);
      toast.success('Added to wishlist');
      fetchCounts();
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  const handleImageClick = () => {
    setZoomLevel(100);
    setIsImageModalOpen(true);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
    setZoomLevel(100);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleNextImage = () => {
    if (images.length > 0) {
      setSelectedImage((prev) => (prev + 1) % images.length);
      setImagePosition({ x: 0, y: 0 });
      setZoomLevel(100);
    }
  };

  const handlePreviousImage = () => {
    if (images.length > 0) {
      setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
      setImagePosition({ x: 0, y: 0 });
      setZoomLevel(100);
    }
  };

  const handleImageHover = (e) => {
    if (images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const leftThreshold = width * 0.33;
    const rightThreshold = width * 0.67;

    let currentZone = null;
    if (x < leftThreshold) {
      currentZone = 'left';
    } else if (x > rightThreshold) {
      currentZone = 'right';
    } else {
      currentZone = 'center';
    }

    // Only switch image when entering a new zone
    if (currentZone !== hoverZone) {
      setHoverZone(currentZone);
      if (currentZone === 'left' && selectedImage > 0) {
        setSelectedImage(selectedImage - 1);
      } else if (currentZone === 'right' && selectedImage < images.length - 1) {
        setSelectedImage(selectedImage + 1);
      }
    }
  };

  const handleImageHoverLeave = () => {
    setHoverZone(null);
  };

  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (zoomLevel === 100) {
        setZoomLevel(200);
      } else {
        setZoomLevel(100);
        setImagePosition({ x: 0, y: 0 });
      }
    }
    setLastTap(currentTime);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setPinchStart(distance);
      setPinchStartZoom(zoomLevel);
    } else if (e.touches.length === 1 && zoomLevel > 100) {
      // Single touch drag when zoomed
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - imagePosition.x,
        y: e.touches[0].clientY - imagePosition.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStart !== null) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scale = distance / pinchStart;
      const newZoom = Math.max(100, Math.min(300, pinchStartZoom * scale));
      setZoomLevel(newZoom);
    } else if (isDragging && e.touches.length === 1) {
      // Drag when zoomed
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setPinchStart(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 100) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };


  useEffect(() => {
    if (!isImageModalOpen || zoomLevel <= 100) return;

    const mouseMoveHandler = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setImagePosition({ x: newX, y: newY });
      }
    };
    const mouseUpHandler = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
  }, [isImageModalOpen, isDragging, zoomLevel, dragStart]);

  if (loading || !product) {
    return <Loading />;
  }

  const colorImagesMap = product.color_images || {};
  const images = (selectedColor && colorImagesMap[selectedColor] && colorImagesMap[selectedColor].length > 0)
    ? colorImagesMap[selectedColor]
    : (product.images.length > 0 ? product.images : []);
  const colorDetailsMap = product.color_details || {};
  const mergedDetails = {
    ...(product.product_details || {}),
    ...(selectedColor && colorDetailsMap[selectedColor] ? colorDetailsMap[selectedColor] : {})
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-24 md:pt-8 md:pb-8">

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4 w-full min-w-0" data-testid="product-images">
            <div 
              className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-lg w-full cursor-pointer"
              onClick={handleImageClick}
              onMouseMove={handleImageHover}
              onMouseLeave={handleImageHoverLeave}
            >
              <img
                src={getMediumImageUrl(images[selectedImage])}
                srcSet={[
                  `${getThumbnailUrl(images[selectedImage])} 160w`,
                  `${getMediumImageUrl(images[selectedImage])} 768w`,
                  `${getLargeImageUrl(images[selectedImage])} 1600w`,
                ].join(', ')}
                sizes="(max-width: 768px) calc(100vw - 2rem), 50vw"
                alt={product.title}
                className="w-full h-full object-contain md:object-cover transition-all duration-200"
                data-testid="main-product-image"
                loading="eager"
                onError={onImageError}
              />
              {product.discount_percent > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs md:text-sm font-bold px-2 py-1 md:px-3 md:py-1 rounded z-10">
                  {product.discount_percent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-blue-500 shadow-md' : 'border-gray-200'
                    }`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img
                      src={getThumbnailUrl(img)}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={onImageError}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 md:space-y-6" data-testid="product-info">
            <div>
              <h1 className="text-lg md:text-3xl font-bold mb-2 leading-tight" data-testid="product-title">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                {product.brand && (
                  <span className="text-sm md:text-base text-gray-600" data-testid="product-brand">Brand: {product.brand}</span>
                )}
                {product.rating > 0 && (
                  <div className="flex items-center gap-1" data-testid="product-rating">
                    <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm md:text-base">{product.rating}</span>
                    <span className="text-xs md:text-sm text-gray-600">({product.reviews_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2" data-testid="product-pricing">
              <div className="flex items-baseline gap-2 md:gap-3">
                <span className="text-xl md:text-4xl font-bold">₹{product.price.toLocaleString()}</span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm md:text-xl text-gray-500 line-through">₹{product.mrp.toLocaleString()}</span>
                    <span className="text-sm md:text-xl text-green-600 font-semibold">({product.discount_percent}% OFF)</span>
                  </>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-600">Inclusive of all taxes</p>
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-2 rounded-lg border-2 transition-all ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`size-${size.toLowerCase()}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Select Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-6 py-2 rounded-lg border-2 transition-all capitalize ${
                        selectedColor === color
                          ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`color-${color.toLowerCase()}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="decrease-quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center" data-testid="quantity-display">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="increase-quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stock Status - Only showing if in stock or not */}
            {product.stock > 0 ? (
              <Badge variant="outline" className="text-green-600 border-green-600" data-testid="stock-status">
                In Stock
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600" data-testid="stock-status">
                Out of Stock
              </Badge>
            )}

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1 btn-hover"
                size="lg"
                disabled={product.stock === 0}
                data-testid="add-to-cart-button"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                variant="default"
                className="flex-1 btn-hover bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={product.stock === 0}
                data-testid="buy-now-button"
              >
                Buy Now
              </Button>
              <Button
                onClick={handleAddToWishlist}
                variant="outline"
                size="icon"
                className="btn-hover"
                data-testid="add-to-wishlist-button"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
              <p>✓ Free delivery on orders above ₹999</p>
              <p>✓ 7-day return policy</p>
              <p>✓ 100% secure payment</p>
            </div>
          </div>
        </div>

        {/* Tabs: Description & Reviews */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description" data-testid="description-tab">Description</TabsTrigger>
              <TabsTrigger value="reviews" data-testid="reviews-tab">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {mergedDetails && Object.keys(mergedDetails).length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-4">Product Details</h3>
                      <div className="grid grid-cols-1 gap-y-3 text-sm">
                        {Object.entries(mergedDetails).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-2 gap-4">
                            <span className="text-gray-500 font-medium">{key}</span>
                            <span className="font-semibold text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line" data-testid="product-description">
                    {product.description}
                  </p>
                  {product.sku && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {reviews.length > 0 ? (
                    <div className="space-y-6" data-testid="reviews-list">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarFallback>{review.user_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{review.user_name || 'Anonymous'}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <Link key={relProduct.id} to={`/products/${relProduct.id}`}>
                  <Card className="group overflow-hidden card-hover border-0 shadow-lg">
                    <div className="aspect-[3/4] overflow-hidden image-zoom-container bg-gray-100">
                      <img
                        src={getMediumImageUrl(relProduct.images[0])}
                        srcSet={[
                          `${getThumbnailUrl(relProduct.images[0])} 160w`,
                          `${getMediumImageUrl(relProduct.images[0])} 768w`,
                          `${getLargeImageUrl(relProduct.images[0])} 1600w`,
                        ].join(', ')}
                        sizes="(max-width: 768px) 50vw, 25vw"
                        alt={relProduct.title}
                        className="w-full h-full object-cover image-zoom"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {relProduct.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">₹{relProduct.price.toLocaleString()}</span>
                        {relProduct.mrp > relProduct.price && (
                          <span className="text-xs text-green-600 font-semibold">
                            ({relProduct.discount_percent}% OFF)
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
      {/* Mobile Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-50 flex gap-2">
        <Button
          onClick={handleAddToCart}
          variant="outline"
          className="flex-1 border-black text-black"
          disabled={product.stock === 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
        <Button
          onClick={handleBuyNow}
          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
          disabled={product.stock === 0}
        >
          Buy Now
        </Button>
      </div>

      {/* Image Modal Viewer */}
      <Dialog open={isImageModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
              onClick={handleCloseModal}
              aria-label="Close image viewer"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={handlePreviousImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2 bg-black/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 300}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Zoom Level Display */}
            {zoomLevel !== 100 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {Math.round(zoomLevel)}%
              </div>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {selectedImage + 1} / {images.length}
              </div>
            )}

            {/* Image Container with Zoom and Pan */}
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            >
              <div 
                className="flex items-center justify-center p-4"
                style={{
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  cursor: zoomLevel > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                }}
              >
                <img
                  src={getLargeImageUrl(images[selectedImage])}
                  alt={product.title}
                  className="object-contain select-none transition-transform duration-200 ease-out"
                  style={{ 
                    width: `${zoomLevel}%`,
                    maxWidth: 'none',
                    height: 'auto',
                    transform: zoomLevel > 100 ? 'none' : 'scale(1)',
                  }}
                  onError={onImageError}
                  onDoubleClick={handleDoubleTap}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
