import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Filter, Download, Edit, Trash2 } from 'lucide-react';
import { adminClient } from '@/utils/api';
import { getImageUrl, onImageError } from '@/utils/imageHelper';

export default function ProductsTable({ onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter, stockFilter, featuredFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/products?limit=1000');
      setProducts(response.data);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'in-stock' && product.stock > 0) ||
                        (stockFilter === 'low-stock' && product.stock > 0 && product.stock < 10) ||
                        (stockFilter === 'out-of-stock' && product.stock === 0);
    const matchesFeatured = featuredFilter === 'all' || 
                           (featuredFilter === 'featured' && product.is_featured) ||
                           (featuredFilter === 'not-featured' && !product.is_featured);
    return matchesSearch && matchesCategory && matchesStock && matchesFeatured;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = [...new Set(products.map(p => p.category))];

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on products:`, selectedProducts);
    // Implement bulk actions here
  };

  const handleExport = async () => {
    try {
      const response = await adminClient.get('/admin/analytics/export/products', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting products:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-purple-600 animate-pulse">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 hover:bg-purple-50 text-purple-600 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">All Products</h1>
            <p className="text-gray-600">Complete product catalog and management</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <Select onValueChange={handleBulkAction}>
              <SelectTrigger className="w-40 rounded-xl border-purple-100 focus:ring-purple-500">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">Mark as Featured</SelectItem>
                <SelectItem value="unfeature">Remove Featured</SelectItem>
                <SelectItem value="delete">Delete Selected</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleExport} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Search by title, description, brand, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-purple-100 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 rounded-xl border-purple-100 focus:ring-purple-500">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-40 rounded-xl border-purple-100 focus:ring-purple-500">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-40 rounded-xl border-purple-100 focus:ring-purple-500">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="not-featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="rounded-3xl border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-purple-100 bg-purple-50/30">
          <CardTitle className="text-purple-900">
            Products ({filteredProducts.length} total)
            {selectedProducts.length > 0 && (
              <span className="text-sm font-normal text-purple-600 ml-2">
                ({selectedProducts.length} selected)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-purple-100">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-purple-900">Image</TableHead>
                  <TableHead className="font-semibold text-purple-900">Product</TableHead>
                  <TableHead className="font-semibold text-purple-900">Category</TableHead>
                  <TableHead className="font-semibold text-purple-900">Price</TableHead>
                  <TableHead className="font-semibold text-purple-900">Available Stock</TableHead>
                  <TableHead className="font-semibold text-purple-900">Sold Stock</TableHead>
                  <TableHead className="font-semibold text-purple-900">Rating</TableHead>
                  <TableHead className="font-semibold text-purple-900">Status</TableHead>
                  <TableHead className="font-semibold text-purple-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-purple-50/30 border-b border-gray-50 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                        className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={onImageError}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium line-clamp-1 text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.brand || 'No Brand'}</div>
                        <div className="text-sm text-gray-400">SKU: {product.sku || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{formatCurrency(product.price)}</div>
                        {product.mrp > product.price && (
                          <div className="text-sm text-gray-400 line-through">
                            {formatCurrency(product.mrp)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${
                        product.stock === 0 ? 'text-red-600' : 
                        product.stock < 10 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {product.stock}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-purple-600">
                        {product.sold_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.reviews_count})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {product.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 shadow-none">Featured</Badge>
                        )}
                        {product.returnable && (
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">Returnable</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="rounded-lg border-purple-200 hover:bg-purple-50 text-purple-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-purple-100 bg-purple-50/10">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-purple-200 hover:bg-purple-50 text-purple-600 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-purple-200 hover:bg-purple-50 text-purple-600 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
