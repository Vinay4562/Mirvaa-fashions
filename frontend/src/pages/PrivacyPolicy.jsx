import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicy({ user, setUser }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="space-y-4 text-gray-700 leading-7">
          <p>At Mirvaa Fashions, your privacy is our priority. This policy explains how we collect, use, and protect your personal information.</p>
          <h2 className="text-xl font-semibold">Information We Collect:</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, email, phone number, shipping/billing address.</li>
            <li>Payment details (processed securely through trusted gateways like Razorpay).</li>
            <li>Browser and device information to improve your shopping experience.</li>
          </ul>
          <h2 className="text-xl font-semibold">How We Use Your Data:</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To process and deliver your orders.</li>
            <li>To send order confirmations, updates, and offers (if opted in).</li>
            <li>To improve our website, services, and user experience.</li>
          </ul>
          <h2 className="text-xl font-semibold">Data Protection:</h2>
          <p>We never sell or rent your personal information. All payments are encrypted and processed through secure channels.</p>
          <h2 className="text-xl font-semibold">Cookies:</h2>
          <p>We use cookies to personalize content and remember your preferences. You can manage cookies through your browser settings.</p>
          <h2 className="text-xl font-semibold">Contact:</h2>
          <p>If you have any privacy-related concerns, email us at privacy@mirvaa.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}


