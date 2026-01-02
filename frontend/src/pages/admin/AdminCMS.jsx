import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import NotificationBell from '@/components/admin/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminClient } from '@/utils/api';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '@/utils/api';

export default function AdminCMS({ admin, setAdmin }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageData, setPageData] = useState({
    title: '',
    content: '',
    meta_description: ''
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await axios.get(`${API}/cms`);
      setPages(response.data);
      
      if (response.data.length > 0) {
        setSelectedPage(response.data[0].slug);
        setPageData({
          title: response.data[0].title,
          content: response.data[0].content,
          meta_description: response.data[0].meta_description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
  };

  const handlePageSelect = (slug) => {
    const page = pages.find(p => p.slug === slug);
    if (page) {
      setSelectedPage(slug);
      setPageData({
        title: page.title,
        content: page.content,
        meta_description: page.meta_description || ''
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminClient.put(`/admin/cms/${selectedPage}`, pageData);
      toast.success('Page updated successfully');
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner text-4xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon" data-testid="back-to-dashboard-cms">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">CMS - Content Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-gray-600">Welcome, {admin.username}</span>
            <Button onClick={handleLogout} variant="outline" className="btn-hover">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Page List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pages.map((page) => (
                  <button
                    key={page.slug}
                    onClick={() => handlePageSelect(page.slug)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedPage === page.slug
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                    data-testid={`page-selector-${page.slug}`}
                  >
                    {page.title}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Edit Page Content</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label htmlFor="page-title">Page Title</Label>
                    <Input
                      id="page-title"
                      data-testid="cms-page-title"
                      value={pageData.title}
                      onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="page-meta">Meta Description</Label>
                    <Input
                      id="page-meta"
                      data-testid="cms-page-meta"
                      value={pageData.meta_description}
                      onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
                      placeholder="SEO description for this page"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="page-content">Page Content (Markdown)</Label>
                      <a
                        href="https://www.markdownguide.org/basic-syntax/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Markdown Guide
                      </a>
                    </div>
                    <Textarea
                      id="page-content"
                      data-testid="cms-page-content"
                      value={pageData.content}
                      onChange={(e) => setPageData({ ...pageData, content: e.target.value })}
                      rows={20}
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use Markdown formatting. Preview the page on the website to see the final output.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="btn-hover"
                      data-testid="save-cms-page"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <a
                      href={`/legal/${selectedPage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" variant="outline" className="btn-hover">
                        Preview Page
                      </Button>
                    </a>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
