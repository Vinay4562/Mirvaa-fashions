import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
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
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category=sarees" className="text-gray-600 hover:text-blue-600 transition-colors">Sarees</Link></li>
              <li><Link to="/products?category=t-shirts" className="text-gray-600 hover:text-blue-600 transition-colors">T-Shirts</Link></li>
              <li><Link to="/products?category=hoodies" className="text-gray-600 hover:text-blue-600 transition-colors">Hoodies</Link></li>
              <li><Link to="/products?category=jewelry" className="text-gray-600 hover:text-blue-600 transition-colors">Jewelry</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Track Order</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">About Mirvaa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Our Story</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Careers</a></li>
              <li><Link to="/legal/privacy-policy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/return-policy" className="text-gray-600 hover:text-blue-600 transition-colors">Return Policy</Link></li>
              <li><Link to="/legal/terms-conditions" className="text-gray-600 hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Mirvaa Fashions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
