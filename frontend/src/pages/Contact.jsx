import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Contact({ user, setUser }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <div className="space-y-4 text-gray-700 leading-7">
          <p>We’d love to hear from you. If you have any questions about your orders, returns, or our products, reach out to us through the details below.</p>
          <p><strong>Email:</strong> support@mirvaa.com</p>
          <p><strong>Phone:</strong> +91 98765 43210</p>
          <p><strong>Working Hours:</strong> Monday to Saturday, 10 AM – 7 PM</p>
          <div>
            <p><strong>Address:</strong></p>
            <p>Mirvaa Fashions</p>
            <p>#24, Fashion Street, Banjara Hills, Hyderabad, Telangana – 500034</p>
          </div>
          <p>You can also message us through the “Help” option in your account for quick assistance.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}


