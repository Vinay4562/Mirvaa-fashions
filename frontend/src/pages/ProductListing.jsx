import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, X, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import axios from 'axios';
import { API, apiClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';

export default function ProductListing({ user, setUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sortBy, setSortBy] = useState('');

  const categories = ['Sarees', 'T-Shirts', 'Shirts', 'Hoodies', 'Jewelry', 'Ladies Dresses', 'Kids Wear', "Men's Wear"];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchCounts();
    }
  }, [searchParams, user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const category = searchParams.get('category');
      const search = searchParams.get('search');
      
      const params = new URLSearchParams();
      
      // Handle category from URL or selected categories from filters
      if (category) {
        params.append('category', category);
        // Update selected categories if not already selected
        const formattedCategory = category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        if (!selectedCategories.includes(formattedCategory) && categories.includes(formattedCategory)) {
          setSelectedCategories([formattedCategory]);
        }
      } else if (selectedCategories.length > 0) {
        // If no category in URL but filters are selected
        selectedCategories.forEach(cat => {
          params.append('category', cat.toLowerCase().replace(/[''\s]/g, '-'));
        });
      }
      
      if (search) params.append('search', search);
      if (sortBy) params.append('sort', sortBy);
      if (priceRange[0] > 0) params.append('min_price', priceRange[0]);
      if (priceRange[1] < 10000) params.append('max_price', priceRange[1]);
      
      // Add size filters if selected
      if (selectedSizes.length > 0) {
        selectedSizes.forEach(size => {
          params.append('size', size);
        });
      }

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
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

  const handleAddToWishlist = async (productId, e) => {
    e.preventDefault();
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

  const handleSortChange = (value) => {
    setSortBy(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('sort', value);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams);
  };

  const FilterContent = () => (
    <div className="space-y-6" data-testid="filter-sidebar">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-4">Price Range</h3>
        <Slider
          data-testid="price-slider"
          value={priceRange}
          onValueChange={setPriceRange}
          max={10000}
          step={100}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat}`}
                data-testid={`category-filter-${cat.toLowerCase().replace(/['\\s]/g, '-')}`}
                checked={selectedCategories.includes(cat)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, cat]);
                  } else {
                    setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                  }
                }}
              />
              <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                {cat}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-semibold mb-4">Sizes</h3>
        <div className="space-y-2">
          {sizes.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={`size-${size}`}
                data-testid={`size-filter-${size.toLowerCase()}`}
                checked={selectedSizes.includes(size)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSizes([...selectedSizes, size]);
                  } else {
                    setSelectedSizes(selectedSizes.filter((s) => s !== size));
                  }
                }}
              />
              <Label htmlFor={`size-${size}`} className="text-sm cursor-pointer">
                {size}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Filters */}
      <Button 
        onClick={() => {
          // Update URL params based on selected filters
          const newParams = new URLSearchParams(searchParams);
          
          // Handle categories
          newParams.delete('category');
          if (selectedCategories.length > 0) {
            const categoryParam = selectedCategories[0].toLowerCase().replace(/[''\s]/g, '-');
            newParams.set('category', categoryParam);
          }
          
          // Handle price range
          if (priceRange[0] > 0) {
            newParams.set('min_price', priceRange[0]);
          } else {
            newParams.delete('min_price');
          }
          
          if (priceRange[1] < 10000) {
            newParams.set('max_price', priceRange[1]);
          } else {
            newParams.delete('max_price');
          }
          
          // Handle sizes
          newParams.delete('size');
          selectedSizes.forEach(size => {
            newParams.append('size', size);
          });
          
          // Update URL and trigger fetch
          setSearchParams(newParams);
        }} 
        className="w-full btn-hover" 
        data-testid="apply-filters-button"
      >
        Apply Filters
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner text-4xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="products-heading">
              {searchParams.get('category')
                ? searchParams.get('category').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                : searchParams.get('search')
                ? `Search results for "${searchParams.get('search')}"`
                : 'All Products'}
            </h1>
            <p className="text-gray-600">{products.length} products found</p>
          </div>

          <div className="flex gap-3 items-center w-full md:w-auto">
            {/* Mobile Filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden flex-1" data-testid="mobile-filter-button">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card className="p-6 sticky top-24">
              <FilterContent />
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="products-grid">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="group overflow-hidden card-hover border-0 shadow-lg relative"
                    data-testid={`product-card-${product.id}`}
                  >
                    <Link to={`/products/${product.id}`}>
                      <div className="aspect-[3/4] overflow-hidden image-zoom-container bg-gray-100">
                        <img
                          src={product.images && product.images[0] ? getImageUrl(product.images[0]) : 'https://via.placeholder.com/400x500'}
                          alt={product.title}
                          className="w-full h-full object-cover image-zoom"
                        />
                      </div>
                    </Link>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleAddToWishlist(product.id, e)}
                      className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10"
                      data-testid={`wishlist-button-${product.id}`}
                    >
                      <Heart className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* Discount Badge */}
                    {product.discount_percent > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {product.discount_percent}% OFF
                      </div>
                    )}

                    <CardContent className="p-4">
                      <Link to={`/products/${product.id}`}>
                        <h3 className="font-semibold mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {product.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{product.brand || product.category}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold">₹{product.price.toLocaleString()}</span>
                        {product.mrp > product.price && (
                          <span className="text-sm text-gray-500 line-through">₹{product.mrp.toLocaleString()}</span>
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
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">No products found</p>
                <Link to="/products">
                  <Button className="mt-4 btn-hover">Browse All Products</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
