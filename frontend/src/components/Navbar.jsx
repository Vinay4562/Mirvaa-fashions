import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AuthDialog from './AuthDialog';
import NotificationPopover from './NotificationPopover';

export default function Navbar({ user, setUser, cartCount = 0, wishlistCount = 0 }) {
  const [showAuth, setShowAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    'Shirts', 'Jeans', 'Ladies Dresses', 'Sarees'
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const hideMobileSearch = 
    location.pathname.startsWith('/products/') || 
    location.pathname === '/cart' || 
    location.pathname === '/wishlist' || 
    location.pathname.startsWith('/account');

  const isProductDetail = location.pathname.startsWith('/products/') && location.pathname !== '/products';
  const shouldHideMobileSearch = 
    location.pathname === '/cart' || 
    location.pathname === '/wishlist' || 
    location.pathname.startsWith('/account') || 
    isProductDetail;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        {/* Top bar */}
        <div className="hidden md:block bg-gradient-to-r from-blue-50 to-green-50 py-2 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
            <span className="text-gray-700">Free Shipping on Orders Above ₹999</span>
            <div className="flex gap-4">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Track Order</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Help</a>
            </div>
          </div>
        </div>

        {/* Main navbar */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            {location.pathname !== '/' && location.pathname !== '/account' && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => navigate(-1)}
                aria-label="Back"
                data-testid="mobile-back-button"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-3 group" data-testid="logo">
              <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg group-hover:bg-gray-800 transition-colors">
                <span className="text-white text-xl font-bold font-sans">M</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors">
                Mirvaa Fashions
              </span>
            </Link>

            {/* Search bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Search for products, brands and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-2 rounded-full border-2 border-gray-200 focus:border-blue-400 transition-colors"
                />
                <Button
                  data-testid="search-button"
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <Search className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              
              {/* Home button - only show when not on home page - Desktop only */}
              {location.pathname !== '/' && (
                <Link to="/" data-testid="home-link" className="hidden md:flex">
                  <Button variant="ghost" size="icon" className="btn-hover">
                    <Home className="h-6 w-6" />
                  </Button>
                </Link>
              )}

              {/* Wishlist - Desktop only */}
              <Link to="/wishlist" data-testid="wishlist-link" className="hidden md:flex">
                <Button variant="ghost" size="icon" className="relative btn-hover">
                  <Heart className="h-6 w-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="wishlist-count">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Notification - Mobile only */}
              <NotificationPopover user={user} />

              {/* Cart - Mobile only */}
              <Link to="/cart" className="md:hidden relative" data-testid="mobile-cart-link">
                <Button variant="ghost" size="icon" className="relative btn-hover">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="mobile-cart-count">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart - Desktop only */}
              <Link to="/cart" data-testid="cart-link" className="hidden md:flex">
                <Button variant="ghost" size="icon" className="relative btn-hover">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="cart-count">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User - Desktop only */}
              <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="btn-hover flex items-center gap-2" data-testid="user-menu">
                      <User className="h-6 w-6" />
                      <span className="hidden md:inline text-sm font-medium">{user.name.split(' ')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/account')} data-testid="account-link">
                      My Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account')} data-testid="orders-link">
                      Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setShowAuth(true)} className="btn-hover" data-testid="login-button">
                  Login
                </Button>
              )}
              </div>
            </div>
          </div>

          {/* Categories - Desktop */}
          <div className="hidden md:flex gap-6 mt-4 pt-4 border-t border-gray-100">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${cat.toLowerCase().replace(/[''\s]/g, '-')}`}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
                data-testid={`category-${cat.toLowerCase().replace(/[''\s]/g, '-')}`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Search Bar - Always visible on mobile unless on specific pages */}
        {!shouldHideMobileSearch && (
          <div className="md:hidden px-4 pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by Keyword or Product ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm"
                  data-testid="mobile-search-input-main"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </form>
          </div>
        )}

      </nav>

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} setUser={setUser} />
    </>
  );
}
