import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AuthDialog from './AuthDialog';

export default function Navbar({ user, setUser, cartCount = 0, wishlistCount = 0 }) {
  const [showAuth, setShowAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const categories = [
    'Sarees', 'T-Shirts', 'Shirts', 'Hoodies', 
    'Jewelry', 'Ladies Dresses', 'Kids Wear', "Men's Wear"
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

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 py-2 px-4">
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
            <Link to="/" className="text-3xl font-bold gradient-text" data-testid="logo">
              Mirvaa
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
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>

              {/* Wishlist */}
              <Link to="/wishlist" data-testid="wishlist-link">
                <Button variant="ghost" size="icon" className="relative btn-hover">
                  <Heart className="h-6 w-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="wishlist-count">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link to="/cart" data-testid="cart-link">
                <Button variant="ghost" size="icon" className="relative btn-hover">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="cart-count">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="btn-hover" data-testid="user-menu">
                      <User className="h-6 w-6" />
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 animate-fade-in">
            {/* Search - Mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-2 rounded-full"
                  data-testid="mobile-search-input"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  data-testid="mobile-search-button"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>

            {/* Categories - Mobile */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/products?category=${cat.toLowerCase().replace(/[''\s]/g, '-')}`}
                  className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} setUser={setUser} />
    </>
  );
}
