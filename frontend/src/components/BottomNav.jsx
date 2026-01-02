import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, Heart } from 'lucide-react';

export default function BottomNav({ cartCount }) {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-4 py-2">
      <div className="flex justify-between items-center">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-pink-600' : 'text-gray-500'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link to="/categories" className={`flex flex-col items-center gap-1 ${isActive('/categories') ? 'text-pink-600' : 'text-gray-500'}`}>
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Categories</span>
        </Link>
        
        <Link to="/wishlist" className={`flex flex-col items-center gap-1 ${isActive('/wishlist') ? 'text-pink-600' : 'text-gray-500'}`}>
          <Heart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Wishlist</span>
        </Link>
        
        <Link to="/account" className={`flex flex-col items-center gap-1 ${isActive('/account') ? 'text-pink-600' : 'text-gray-500'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Account</span>
        </Link>
        
        <Link to="/cart" className={`flex flex-col items-center gap-1 ${isActive('/cart') ? 'text-pink-600' : 'text-gray-500'}`}>
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cart</span>
        </Link>
      </div>
    </div>
  );
}
