import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ReturnPolicy({ user, setUser }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Return Policy</h1>
        <div className="space-y-4 text-gray-700 leading-7">
          <p>We want you to love what you buy from Mirvaa Fashions. If you’re not completely satisfied, here’s how returns work:</p>
          <h2 className="text-xl font-semibold">Eligibility:</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Returns accepted within 7 days of delivery.</li>
            <li>Item must be unused, unwashed, and in original packaging with all tags intact.</li>
            <li>Certain products like jewellery, innerwear, or customized items are not returnable.</li>
          </ul>
          <h2 className="text-xl font-semibold">Return Process:</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Go to “My Orders” → Select the item → Click “Return Request.”</li>
            <li>Choose a reason for return and submit.</li>
            <li>Our delivery partner will pick up the item from your address.</li>
            <li>Refund will be processed within 5–7 business days after quality check.</li>
          </ul>
          <h2 className="text-xl font-semibold">Refunds:</h2>
          <p>Refunds are made to your original payment method. For COD orders, refunds will be issued via bank transfer.</p>
          <p>For any help, contact returns@mirvaa.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}


