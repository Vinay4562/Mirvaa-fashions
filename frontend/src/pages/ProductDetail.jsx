import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import axios from 'axios';
import { API, apiClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchProduct();
    if (user) {
      fetchCounts();
    }
  }, [id, user]);

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

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner text-4xl">Loading...</div>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images.map(img => getImageUrl(img)) : [getImageUrl()];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          {' / '}
          <Link to="/products" className="hover:text-blue-600">Products</Link>
          {' / '}
          <Link to={`/products?category=${product.category.toLowerCase()}`} className="hover:text-blue-600">
            {product.category}
          </Link>
          {' / '}
          <span className="text-gray-900">{product.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4" data-testid="product-images">
            <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-lg">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
                data-testid="main-product-image"
              />
              {product.discount_percent > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                  {product.discount_percent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-blue-500 shadow-md' : 'border-gray-200'
                    }`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6" data-testid="product-info">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="product-title">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                {product.brand && (
                  <span className="text-gray-600" data-testid="product-brand">Brand: {product.brand}</span>
                )}
                {product.rating > 0 && (
                  <div className="flex items-center gap-1" data-testid="product-rating">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{product.rating}</span>
                    <span className="text-gray-600">({product.reviews_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2" data-testid="product-pricing">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">₹{product.price.toLocaleString()}</span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">₹{product.mrp.toLocaleString()}</span>
                    <span className="text-xl text-green-600 font-semibold">({product.discount_percent}% OFF)</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">Inclusive of all taxes</p>
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

            {/* Action Buttons */}
            <div className="flex gap-4">
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
                        src={getImageUrl(relProduct.images[0])}
                        alt={relProduct.title}
                        className="w-full h-full object-cover image-zoom"
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
    </div>
  );
}
