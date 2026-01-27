import { useState, useEffect } from 'react';
import { Save, FileText, Code, Globe, LayoutTemplate } from 'lucide-react';
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
      <div className="space-y-8 pb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Content Editor
          </h2>
          <p className="text-gray-500 font-medium">Manage legal pages and site content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar for Pages */}
          <div className="md:col-span-1 space-y-4">
            <Card className="rounded-3xl border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <LayoutTemplate className="w-5 h-5 text-purple-500" />
                  Pages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-1">
                  {pages.map((page) => (
                    <Button
                      key={page.slug}
                      variant="ghost"
                      className={`w-full justify-start rounded-xl transition-all duration-300 ${
                        selectedPage === page.slug 
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md font-bold hover:from-purple-600 hover:to-pink-600 hover:text-white" 
                          : "hover:bg-purple-50 text-gray-600 font-medium"
                      }`}
                      onClick={() => handlePageSelect(page.slug)}
                    >
                      <FileText className={`mr-2 h-4 w-4 ${selectedPage === page.slug ? "text-white" : "text-gray-400"}`} />
                      {page.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor Area */}
          <div className="md:col-span-3">
            <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-purple-500">Edit:</span> {pageData.title}
                  </CardTitle>
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-md hover:shadow-lg transition-all hover:scale-105"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-700 font-bold ml-1">Page Title</Label>
                    <Input
                      id="title"
                      value={pageData.title}
                      onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                      required
                      className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200 h-11 text-lg font-semibold"
                    />
                  </div>

                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="w-full justify-start bg-gray-100 p-1 rounded-2xl mb-4">
                      <TabsTrigger 
                        value="content" 
                        className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm font-bold px-6"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Content (HTML)
                      </TabsTrigger>
                      <TabsTrigger 
                        value="meta"
                        className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm font-bold px-6"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        SEO / Meta
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="content" className="text-gray-700 font-bold ml-1">HTML Content</Label>
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                          <Textarea
                            id="content"
                            value={pageData.content}
                            onChange={(e) => setPageData({ ...pageData, content: e.target.value })}
                            className="min-h-[500px] font-mono text-sm bg-gray-900 text-gray-100 p-4 border-0 focus:ring-0 resize-y"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-2 ml-1">
                          <Code className="w-3 h-3" />
                          Use HTML tags for formatting. Content is rendered directly.
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="meta" className="mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="meta_description" className="text-gray-700 font-bold ml-1">Meta Description</Label>
                        <Textarea
                          id="meta_description"
                          value={pageData.meta_description}
                          onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
                          rows={6}
                          className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-200 resize-none text-base"
                          placeholder="Brief description for search engines..."
                        />
                        <p className="text-xs text-gray-500 mt-2 ml-1">
                          This text appears in search engine results. Keep it under 160 characters for best results.
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
