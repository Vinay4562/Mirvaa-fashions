import { useState, useEffect, useRef } from 'react';
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
  // Removed blocking loading state to allow instant render


  useEffect(() => {
    // Load cached home data for instant paint
    const cached = localStorage.getItem('homeData');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setFeaturedProducts(Array.isArray(data.featuredProducts) ? data.featuredProducts : []);
        setNewArrivals(Array.isArray(data.newArrivals) ? data.newArrivals : []);
      } catch {}
    }

    fetchData();
    if (user) {
      fetchCounts();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Use apiClient with timeout to avoid long hangs
      const [categoriesRes, featuredRes, newRes] = await Promise.all([
        apiClient.get('/categories').catch(() => ({ data: [] })),
        apiClient.get('/products/featured').catch(() => ({ data: [] })),
        apiClient.get('/products?sort=newest&limit=16').catch(() => ({ data: [] })),
      ]);

      const categoriesData = categoriesRes.data || [];
      const featuredData = featuredRes.data || [];
      const newData = newRes.data || [];

      setCategories(categoriesData);
      setFeaturedProducts(featuredData);
      setNewArrivals(newData);

      // Cache for fast subsequent loads
      try {
        localStorage.setItem('homeData', JSON.stringify({
          categories: categoriesData,
          featuredProducts: featuredData,
          newArrivals: newData,
        }));
      } catch {}
    } catch (error) {
      console.error('Error fetching data:', error);
      // Graceful fallback: keep current state, avoid noisy toast on startup
      setCategories((prev) => Array.isArray(prev) ? prev : []);
      setFeaturedProducts((prev) => Array.isArray(prev) ? prev : []);
      setNewArrivals((prev) => Array.isArray(prev) ? prev : []);
    } finally {
      // no loading gate; render remains instant and data hydrates
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
                key={category.slug || idx}
                to={`/products?category=${category.slug}`}
                className="group"
                data-testid={`category-card-${category.slug || idx}`}
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
            <FeaturedCarousel products={featuredProducts} />
          ) : (
            // If empty, render nothing (instant paint), data will hydrate when available
            <div className="text-sm text-gray-500">No featured products yet.</div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">New Arrivals</h2>
            <Link to="/products">
              <Button variant="ghost" className="btn-hover" data-testid="view-all-new">
                View All <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {newArrivals.length > 0 ? (
            <Carousel>
              <CarouselContent>
                {newArrivals.slice(0, 8).map((product) => (
                  <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
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
                          <h3 className="font-semibold text-base mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {product.title}
                          </h3>
                        </Link>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">₹{product.price.toLocaleString()}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm">{(product.rating || 4.5).toFixed(1)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className="text-sm text-gray-500">No new arrivals yet.</div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// In fetchData, remove setLoading(false) calls

function FeaturedCarousel({ products }) {
  const [api, setApi] = useState(null);
  const [hover, setHover] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!api) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!hover) {
      intervalRef.current = setInterval(() => {
        api.scrollNext();
      }, 2500);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [api, hover]);

  return (
    <Carousel
      opts={{ loop: true, align: 'start' }}
      setApi={setApi}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <CarouselContent>
        {products.map((product) => (
          <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
            <Card className="group overflow-hidden card-hover border-0 shadow-lg" data-testid={`featured-product-${product.id}`}>
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
                  <h3 className="font-semibold text-base mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{product.brand || product.category}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold">₹{product.price.toLocaleString()}</span>
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
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
