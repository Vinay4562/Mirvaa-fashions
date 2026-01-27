import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  RefreshCcw, 
  BarChart, 
  FileText, 
  Settings 
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Sidebar({ admin, setIsMobileOpen }) {
  const location = useLocation();

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/returns', label: 'Returns', icon: RefreshCcw },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart },
    { href: '/admin/cms', label: 'Content (CMS)', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white relative overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-blue-900/20 pointer-events-none" />
      
      <div className="relative z-10 p-6 border-b border-gray-800">
        <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Mirvaa Admin
        </h1>
      </div>
      <nav className="relative z-10 flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              to={item.href}
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            >
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-black shadow-lg shadow-purple-900/20 scale-105 font-bold' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:pl-5'
              }`}>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="relative z-10 p-4 border-t border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 text-gray-400">
          <Avatar className="h-10 w-10 border-2 border-purple-500/30">
            <AvatarFallback className="bg-gray-800 text-white font-bold">
              {admin?.username?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{admin?.username || 'Admin'}</p>
            <p className="text-xs text-gray-500 truncate">{admin?.role || 'Administrator'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
