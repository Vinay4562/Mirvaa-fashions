import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-between gap-8">
          {/* Brand */}
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-2xl font-bold gradient-text mb-4">Mirvaa</h3>
            <p className="text-gray-600 text-sm mb-4">
              Your trusted destination for quality fashion. From traditional sarees to modern streetwear.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="mailto:hello@mirvaa.com" className="text-gray-400 hover:text-red-600 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="flex-1 min-w-[120px]">
            <h4 className="font-semibold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category=sarees" className="text-gray-600 hover:text-blue-600 transition-colors">Sarees</Link></li>
              <li><Link to="/products?category=t-shirts" className="text-gray-600 hover:text-blue-600 transition-colors">T-Shirts</Link></li>
              <li><Link to="/products?category=hoodies" className="text-gray-600 hover:text-blue-600 transition-colors">Hoodies</Link></li>
              <li><Link to="/products?category=jewelry" className="text-gray-600 hover:text-blue-600 transition-colors">Jewelry</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="flex-1 min-w-[120px]">
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/return-policy" className="text-gray-600 hover:text-blue-600 transition-colors">Return Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="text-gray-600 hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="flex-1 min-w-[120px]">
            <h4 className="font-semibold text-gray-900 mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Track Order</a></li>
              <li><Link to="/return-policy" className="text-gray-600 hover:text-blue-600 transition-colors">Returns & Exchanges</Link></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="flex-1 min-w-[120px]">
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Press</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Mirvaa Fashions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
