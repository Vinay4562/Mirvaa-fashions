import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Menu,
  LogOut,
  User,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import NotificationBell from '@/components/admin/NotificationBell';
import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children, admin, setAdmin, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-purple-500 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 shrink-0 fixed inset-y-0 z-50 shadow-2xl">
        <Sidebar admin={admin} setIsMobileOpen={setIsMobileOpen} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm h-16 transition-all duration-300">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden hover:bg-gray-100 rounded-full">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 bg-black border-r-gray-800 text-white">
                  <Sidebar admin={admin} setIsMobileOpen={setIsMobileOpen} />
                </SheetContent>
              </Sheet>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 hidden sm:block">
                {title || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={admin?.avatar} alt={admin?.username} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {admin?.username?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{admin?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {admin?.email || 'admin@mirvaa.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}