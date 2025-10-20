import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import axios from 'axios';
import { API, apiClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';

export default function Home({ user, setUser }) {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    if (user) {
      fetchCounts();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [categoriesRes, featuredRes, newRes] = await Promise.all([
        axios.get(`${API}/categories`).catch(() => ({ data: [] })),
        axios.get(`${API}/products/featured`).catch(() => ({ data: [] })),
        axios.get(`${API}/products?sort=newest&limit=8`).catch(() => ({ data: [] })),
      ]);

      setCategories(categoriesRes.data || []);
      setFeaturedProducts(featuredRes.data || []);
      setNewArrivals(newRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set default empty arrays to prevent rendering issues
      setCategories([]);
      setFeaturedProducts([]);
      setNewArrivals([]);
      toast.error('Unable to connect to server. Please try again later.');
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
      if (error?.response?.status === 401) {
        // Not logged in or token expired; keep counts at 0 without noise
        return;
      }
      console.error('Error fetching counts:', error);
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      await apiClient.post(`/wishlist/${productId}`);
      toast.success('Added to wishlist');
      fetchCounts();
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Discover Your
                <span className="gradient-text block">Perfect Style</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600">
                From traditional elegance to modern fashion. Shop the latest trends in clothing, jewelry, and accessories.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <Button size="lg" className="btn-hover rounded-full px-8" data-testid="shop-now-button">
                    Shop Now
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/products?category=sarees">
                  <Button size="lg" variant="outline" className="btn-hover rounded-full px-8" data-testid="explore-sarees-button">
                    Explore Sarees
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-slide-in-right">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl image-zoom-container">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800"
                  alt="Fashion"
                  className="w-full h-full object-cover image-zoom"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 glass">
                <div className="text-sm text-gray-600">Special Offer</div>
                <div className="text-2xl font-bold gradient-text">50% OFF</div>
                <div className="text-sm text-gray-600">On First Order</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Shop by Category</h2>
            <Link to="/products">
              <Button variant="ghost" className="btn-hover" data-testid="view-all-categories">
                View All <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, idx) => (
              <Link
                key={category.slug}
                to={`/products?category=${category.slug}`}
                className="group"
                data-testid={`category-card-${category.slug}`}
              >
                <Card className="overflow-hidden card-hover border-0 shadow-lg">
                  <div className="aspect-square overflow-hidden image-zoom-container">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover image-zoom"
                    />
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Featured Products</h2>
            <Link to="/products">
              <Button variant="ghost" className="btn-hover" data-testid="view-all-featured">
                View All <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden card-hover border-0 shadow-lg" data-testid={`featured-product-${product.id}`}>
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-[3/4] overflow-hidden image-zoom-container bg-gray-100">
                      <img
                        src={product.images && product.images[0] ? getImageUrl(product.images[0]) : 'https://via.placeholder.com/400x500'}
                        alt={product.title}
                        className="w-full h-full object-cover image-zoom"
                      />
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{product.brand || product.category}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold">₹{product.price.toLocaleString()}</span>
                      {product.mrp > product.price && (
                        <>
                          <span className="text-sm text-gray-500 line-through">₹{product.mrp.toLocaleString()}</span>
                          <span className="text-sm text-green-600 font-semibold">({product.discount_percent}% OFF)</span>
                        </>
                      )}
                    </div>
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{product.rating}</span>
                        <span className="text-gray-500">({product.reviews_count})</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Carousel */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">New Arrivals</h2>
            <Link to="/products?sort=newest">
              <Button variant="ghost" className="btn-hover" data-testid="view-all-new">
                View All <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {newArrivals.length > 0 && (
            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {newArrivals.map((product) => (
                  <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                    <Card className="group overflow-hidden card-hover border-0 shadow-lg">
                      <Link to={`/products/${product.id}`}>
                        <div className="aspect-[3/4] overflow-hidden image-zoom-container bg-gray-100">
                          <img
                            src={product.images && product.images[0] ? getImageUrl(product.images[0]) : 'https://via.placeholder.com/400x500'}
                            alt={product.title}
                            className="w-full h-full object-cover image-zoom"
                          />
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <Link to={`/products/${product.id}`}>
                          <h3 className="font-semibold mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{product.category}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">₹{product.price.toLocaleString()}</span>
                          {product.mrp > product.price && (
                            <span className="text-xs text-green-600 font-semibold">({product.discount_percent}% OFF)</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Shop With Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg card-hover">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free delivery on orders above ₹999</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg card-hover">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure payment with Razorpay</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg card-hover">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">↩️</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">Easy Returns</h3>
              <p className="text-gray-600">7-day return policy on all products</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
