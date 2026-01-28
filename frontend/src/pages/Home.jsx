import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, Truck, ShieldCheck, Clock, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import AuthDialog from '@/components/AuthDialog';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { apiClient } from '@/utils/api';
import { getImageUrl, getSrcSet, onImageError } from '@/utils/imageHelper';
import { toast } from 'sonner';

export default function Home({ user, setUser }) {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showKidsWearSelection, setShowKidsWearSelection] = useState(false);

  useEffect(() => {
    // Load cached home data for instant paint
    const cached = localStorage.getItem('homeData');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        // Filter cached categories to only show allowed ones
        const allowedCategories = ['shirts', 'jeans', 'ladies-dresses', 'sarees', 'kids-wear'];
        const cachedCategories = Array.isArray(data.categories) ? data.categories : [];
        const filteredCached = cachedCategories
          .map(cat => {
            if (cat.slug === 'mens-wear' || cat.name === "Men's Wear") {
              return { ...cat, name: 'Jeans', slug: 'jeans' };
            }
            return cat;
          })
          .filter(cat => allowedCategories.includes(cat.slug));
        setCategories(filteredCached);
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
      const [categoriesRes, featuredRes, newRes] = await Promise.all([
        apiClient.get('/categories').catch(() => ({ data: [] })),
        apiClient.get('/products/featured').catch(() => ({ data: [] })),
        apiClient.get('/products/new-arrivals').catch(() => ({ data: [] })),
      ]);

      const categoriesData = categoriesRes.data || [];
      const featuredData = featuredRes.data || [];
      const newData = newRes.data || [];

      // Filter to show only: Shirts, Jeans, Ladies Dresses, Sarees, Kids Wear
      // Replace "Men's Wear" or "mens-wear" with "Jeans"
      const allowedCategories = ['shirts', 'jeans', 'ladies-dresses', 'sarees', 'kids-wear'];
      const filteredCategories = categoriesData
        .map(cat => {
          // Replace Men's Wear with Jeans
          if (cat.slug === 'mens-wear' || cat.name === "Men's Wear") {
            return { ...cat, name: 'Jeans', slug: 'jeans' };
          }
          return cat;
        })
        .filter(cat => allowedCategories.includes(cat.slug));

      setCategories(filteredCategories);
      setFeaturedProducts(featuredData);
      setNewArrivals(newData);

      try {
        localStorage.setItem('homeData', JSON.stringify({
          categories: filteredCategories,
          featuredProducts: featuredData,
          newArrivals: newData,
        }));
      } catch {}
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchCounts = async () => {
    // Cart Count
    try {
      const cartRes = await apiClient.get('/cart/count');
      setCartCount(cartRes.data.count);
    } catch (error) {
      if (error?.response?.status !== 401) {
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cartItems.length);
      }
    }

    // Wishlist Count
    try {
      const wishlistRes = await apiClient.get('/wishlist/count');
      setWishlistCount(wishlistRes.data.count);
    } catch (error) {
      if (error?.response?.status !== 401) {
        const wishlistItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlistCount(wishlistItems.length);
      }
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
    <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />

      {/* Hero Section - Full Screen & Immersive */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gray-900 pb-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Fashion" 
            className="w-full h-full object-cover opacity-60 scale-105 animate-slow-zoom"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white space-y-8">
          <div className="inline-block animate-fade-in-up">
            <span className="py-2 px-4 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-sm font-medium tracking-wider uppercase">
              New Collection 2026
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter animate-fade-in-up delay-100">
            DEFINE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">SIGNATURE</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300 font-light leading-relaxed animate-fade-in-up delay-200">
            Experience the fusion of traditional elegance and contemporary fashion. 
            Curated styles that speak to your individuality.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 animate-fade-in-up delay-300">
            <Link to="/products" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto min-h-[3.5rem] h-auto px-8 rounded-full text-lg bg-white text-black hover:bg-gray-200 transition-all duration-300 hover:scale-105 whitespace-normal py-2">
                Shop The Collection
              </Button>
            </Link>
            <Link to="/products?sort=newest" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto min-h-[3.5rem] h-auto px-8 rounded-full text-lg border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-300 backdrop-blur-sm whitespace-normal py-2">
                View Lookbook
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Banner - Floating */}
      <div className="relative z-20 -mt-12 md:-mt-16 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On all orders over ₹499" },
            { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected transactions" },
            { icon: Clock, title: "Fast Delivery", desc: "Receive within 3-5 days" }
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="p-3 bg-black text-white rounded-full">
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="pt-6 pb-4 px-4 md:pt-20 md:px-6 bg-white md:bg-gray-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-6 md:mb-12">
            <div>
              <h2 className="text-xl md:text-4xl font-black tracking-tight mb-2">SHOP BY CATEGORY</h2>
              <p className="text-sm md:text-base text-gray-500">Explore our wide range of collections</p>
            </div>
            <Link to="/products" className="hidden md:flex items-center gap-2 text-sm font-semibold hover:text-purple-600 transition-colors">
              VIEW ALL <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Categories - Circles */}
          <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {categories.map((category, idx) => (
              <Link 
                key={idx} 
                to={category.slug === 'kids-wear' ? '#' : `/products?category=${category.slug}`}
                onClick={(e) => {
                  if (category.slug === 'kids-wear') {
                    e.preventDefault();
                    setShowKidsWearSelection(true);
                  }
                }}
                className="flex flex-col items-center min-w-[80px]"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 mb-2 shadow-sm">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs text-center font-medium leading-tight text-gray-800">{category.name}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Categories - Bento Grid */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[280px]">
            {categories.slice(0, 5).map((category, idx) => (
              <Link 
                key={idx} 
                to={category.slug === 'kids-wear' ? '#' : `/products?category=${category.slug}`}
                onClick={(e) => {
                  if (category.slug === 'kids-wear') {
                    e.preventDefault();
                    setShowKidsWearSelection(true);
                  }
                }}
                className={`relative group overflow-hidden rounded-3xl ${idx === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}
              >
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 text-white transform transition-transform duration-500 group-hover:translate-x-2">
                  <h3 className={`font-bold ${idx === 0 ? 'text-3xl' : 'text-xl'}`}>{category.name}</h3>
                  <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 mt-2">
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={showKidsWearSelection} onOpenChange={setShowKidsWearSelection}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Shop for Kids</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Link 
              to="/products?category=kids-wear&subcategory=Boys" 
              className="flex flex-col items-center justify-center p-6 border rounded-xl hover:bg-gray-50 transition-colors gap-3"
              onClick={() => setShowKidsWearSelection(false)}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <span className="font-bold text-lg">B</span>
              </div>
              <span className="font-medium text-lg">Boys</span>
            </Link>
            <Link 
              to="/products?category=kids-wear&subcategory=Girls" 
              className="flex flex-col items-center justify-center p-6 border rounded-xl hover:bg-gray-50 transition-colors gap-3"
              onClick={() => setShowKidsWearSelection(false)}
            >
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                <span className="font-bold text-lg">G</span>
              </div>
              <span className="font-medium text-lg">Girls</span>
            </Link>
          </div>
          <div className="text-center">
            <Link 
              to="/products?category=kids-wear"
              className="text-sm text-gray-500 hover:text-black hover:underline"
              onClick={() => setShowKidsWearSelection(false)}
            >
              View All Kids Wear
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Arrivals */}
      <section className="pt-4 pb-4 px-4 md:px-6 bg-white overflow-hidden">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-6 md:mb-12">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-xl md:text-4xl font-black tracking-tight">NEW ARRIVALS</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:flex md:gap-6 md:overflow-x-auto md:pb-8 md:snap-x md:scrollbar-hide md:-mx-6 md:px-6 md:mx-0 md:px-0">
            {newArrivals.map((product) => (
              <div key={product.id} className="w-full md:min-w-[280px] md:w-[320px] md:snap-start">
                <Link to={`/products/${product.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-2 md:mb-4">
                    <img 
                      src={getImageUrl(product.images?.[0])} 
                      srcSet={getSrcSet(product.images?.[0])}
                      sizes="(max-width: 768px) 160px, 320px"
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={onImageError}
                      loading="lazy"
                    />
                    {/* Quick Action Overlay - Desktop only */}
                    <div className="hidden md:block absolute inset-x-4 bottom-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Button className="w-full bg-white text-black hover:bg-gray-100 shadow-lg rounded-xl">
                        View Details
                      </Button>
                    </div>
                    {/* Tags */}
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 md:gap-2 items-start z-10">
                      {product.is_new && (
                        <span className="bg-black text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-sm">
                          NEW
                        </span>
                      )}
                    </div>

                  </div>
                  <h3 className="font-bold text-sm md:text-lg truncate pr-1">{product.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-500 text-xs md:text-sm truncate max-w-[80px]">{product.category}</p>
                    <span className="font-bold text-sm md:text-lg">₹{product.price}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="pt-4 pb-12 px-4 md:px-6 bg-gray-50 overflow-hidden">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-6 md:mb-12">
            <div className="p-2 bg-black text-white rounded-lg">
              <Star className="w-6 h-6" />
            </div>
            <h2 className="text-xl md:text-4xl font-black tracking-tight">FEATURED COLLECTION</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:flex md:gap-6 md:overflow-x-auto md:pb-8 md:snap-x md:scrollbar-hide md:-mx-6 md:px-6 md:mx-0 md:px-0">
            {featuredProducts.map((product) => (
              <div key={product.id} className="w-full md:min-w-[280px] md:w-[320px] md:snap-start">
                <Link to={`/products/${product.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white mb-2 md:mb-4 shadow-sm">
                    <img 
                      src={getImageUrl(product.images?.[0])} 
                      srcSet={getSrcSet(product.images?.[0])}
                      sizes="(max-width: 768px) 160px, 320px"
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={onImageError}
                      loading="lazy"
                    />

                    {/* Quick Action Overlay - Desktop only */}
                    <div className="hidden md:block absolute inset-x-4 bottom-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Button className="w-full bg-black text-white hover:bg-gray-800 shadow-lg rounded-xl">
                        View Details
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm md:text-lg truncate pr-1">{product.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-500 text-xs md:text-sm truncate max-w-[80px]">{product.category}</p>
                    <span className="font-bold text-sm md:text-lg">₹{product.price}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional / CTA Section */}
      <section className="py-24 px-6 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-gradient-to-r from-purple-900 to-transparent transform -skew-x-12" />
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-gradient-to-l from-blue-900 to-transparent transform -skew-x-12" />
        </div>
        
        <div className="container mx-auto relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            ELEVATE YOUR WARDROBE
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have found their unique style with Mirvaa Fashions.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-h-[3.5rem] h-auto px-10 rounded-full bg-white text-black hover:bg-gray-200 text-lg font-bold whitespace-normal py-2"
              onClick={() => user ? navigate('/products') : setShowAuth(true)}
            >
              Join Now
            </Button>
            <Link to="/products" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[3.5rem] h-auto px-10 rounded-full border-gray-700 text-white hover:bg-gray-900 text-lg whitespace-normal py-2">
                Explore All
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav cartCount={cartCount} />
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} setUser={setUser} defaultTab="register" />
    </div>
  );
}
