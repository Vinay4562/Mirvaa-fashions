import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';
import { toast } from 'sonner';

export default function Wishlist({ user, setUser }) {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchWishlist();
    fetchCartCount();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const response = await apiClient.get('/wishlist');
      setWishlistItems(response.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate('/');
        return;
      }
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await apiClient.get('/cart');
      setCartCount(response.data.length);
    } catch (error) {
      if (error?.response?.status === 401) return;
      console.error('Error fetching cart:', error);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await apiClient.delete(`/wishlist/${productId}`);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const moveToCart = async (productId) => {
    try {
      await apiClient.post('/cart', {
        product_id: productId,
        quantity: 1,
      });
      await apiClient.delete(`/wishlist/${productId}`);
      toast.success('Moved to cart');
      fetchWishlist();
      fetchCartCount();
    } catch (error) {
      toast.error('Failed to move to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner text-4xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} wishlistCount={wishlistItems.length} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="wishlist-heading">
          My Wishlist ({wishlistItems.length})
        </h1>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="wishlist-items">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-0 shadow-lg relative" data-testid={`wishlist-item-${item.product.id}`}>
                <Link to={`/products/${item.product.id}`}>
                  <div className="aspect-[3/4] overflow-hidden image-zoom-container bg-gray-100">
                    <img
                      src={(item.product.images && item.product.images[0]) ? getImageUrl(item.product.images[0]) : 'https://via.placeholder.com/400x500'}
                      alt={item.product.title}
                      className="w-full h-full object-cover image-zoom"
                    />
                  </div>
                </Link>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromWishlist(item.product.id)}
                  className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors z-10"
                  data-testid={`remove-wishlist-${item.product.id}`}
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>

                <CardContent className="p-4">
                  <Link to={`/products/${item.product.id}`}>
                    <h3 className="font-semibold mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.product.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 mb-2">{item.product.category}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold">₹{item.product.price.toLocaleString()}</span>
                    {item.product.mrp > item.product.price && (
                      <span className="text-sm text-green-600 font-semibold">
                        ({item.product.discount_percent}% OFF)
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => moveToCart(item.product.id)}
                    className="w-full btn-hover"
                    size="sm"
                    data-testid={`move-to-cart-${item.product.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Move to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20" data-testid="empty-wishlist">
            <Heart className="h-24 w-24 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Save items you love for later</p>
            <Link to="/products">
              <Button size="lg" className="btn-hover">Browse Products</Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
