import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminClient } from '@/utils/api';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '@/utils/api';
import Loading from '@/components/Loading';

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
    return <Loading />;
  }

  return (
    <AdminLayout admin={admin} setAdmin={setAdmin} title="Content Management">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar for Pages */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {pages.map((page) => (
                    <Button
                      key={page.slug}
                      variant={selectedPage === page.slug ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handlePageSelect(page.slug)}
                    >
                      {page.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor Area */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Edit Page Content</CardTitle>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Page Title</Label>
                    <Input
                      id="title"
                      value={pageData.title}
                      onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                      required
                    />
                  </div>

                  <Tabs defaultValue="content" className="w-full">
                    <TabsList>
                      <TabsTrigger value="content">Content (HTML)</TabsTrigger>
                      <TabsTrigger value="meta">SEO / Meta</TabsTrigger>
                    </TabsList>
                    <TabsContent value="content" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="content">Page Content</Label>
                        <Textarea
                          id="content"
                          value={pageData.content}
                          onChange={(e) => setPageData({ ...pageData, content: e.target.value })}
                          className="min-h-[400px] font-mono text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Supports HTML tags for formatting. Be careful with syntax.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="meta" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="meta_description">Meta Description</Label>
                        <Textarea
                          id="meta_description"
                          value={pageData.meta_description}
                          onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
                          rows={4}
                        />
                        <p className="text-xs text-gray-500">
                          Brief description for search engines (SEO).
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
