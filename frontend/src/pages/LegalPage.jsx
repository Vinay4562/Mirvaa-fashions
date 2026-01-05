import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';
import { API } from '@/utils/api';
import { Helmet } from 'react-helmet';
import ReactMarkdown from 'react-markdown';
import Loading from '@/components/Loading';

export default function LegalPage({ user, setUser }) {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/cms/${slug}`);
      setPage(response.data);
    } catch (error) {
      console.error('Error fetching page:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} setUser={setUser} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="text-gray-600">The page you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{page.title} - Mirvaa Fashions</title>
        <meta name="description" content={page.meta_description || page.title} />
      </Helmet>

      <Navbar user={user} setUser={setUser} />

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pt-12 md:pb-12">
        <Card data-testid="legal-page-content">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{page.content}</ReactMarkdown>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <p>Last updated: {new Date(page.updated_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
