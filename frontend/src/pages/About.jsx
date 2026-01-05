import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

export default function About({ user, setUser }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} setUser={setUser} />
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-24 md:pt-12 md:pb-12">
        <h1 className="text-3xl font-bold mb-6">About Us</h1>
        <div className="space-y-4 text-gray-700 leading-7">
          <p>Mirvaa Fashions is an Indian online fashion store built to bring quality, style, and affordability together.</p>
          <p>We offer a wide range of T-Shirts, Shirts, Sarees, Hoodies, Jewellery, Ladies’ Dresses, and Kids Wear, carefully selected to match every taste and occasion.</p>
          <p>Our mission is simple — to make shopping feel easy, trustworthy, and enjoyable. From casuals to ethnic wear, Mirvaa Fashions celebrates individuality and comfort.</p>
          <p>We’re a growing brand powered by customer trust and feedback, and every product you buy helps us design better collections ahead.</p>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}


