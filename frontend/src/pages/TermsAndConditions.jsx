import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

export default function TermsAndConditions({ user, setUser }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
        <div className="space-y-4 text-gray-700 leading-7">
          <p>Welcome to Mirvaa Fashions. By accessing and using our website, you agree to the following terms:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <strong>Use of Website</strong><br />
              You agree to use the site only for lawful purposes and not to misuse its features or content.
            </li>
            <li>
              <strong>Product Information</strong><br />
              We make every effort to display products accurately, but slight variations in color or design may occur due to lighting or screen resolution.
            </li>
            <li>
              <strong>Pricing and Payments</strong><br />
              All prices are listed in INR and inclusive of applicable taxes. We reserve the right to update prices or offers without prior notice.
            </li>
            <li>
              <strong>Orders and Cancellations</strong><br />
              Orders may be canceled before shipment. Once shipped, cancellation requests will not be accepted.
            </li>
            <li>
              <strong>Returns and Refunds</strong><br />
              Refer to our Return Policy for full details.
            </li>
            <li>
              <strong>Intellectual Property</strong><br />
              All logos, images, and content belong to Mirvaa Fashions. Unauthorized use is prohibited.
            </li>
            <li>
              <strong>Limitation of Liability</strong><br />
              Mirvaa Fashions is not liable for indirect or consequential losses arising from the use of our website or products.
            </li>
            <li>
              <strong>Governing Law</strong><br />
              These terms are governed by the laws of India, and any disputes will be subject to Hyderabad jurisdiction.
            </li>
          </ol>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}


