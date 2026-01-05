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
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Button>
          <div>
            <h1 className="text-2xl font-bold">All Products</h1>
            <p className="text-gray-600">Complete product catalog and management</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <Select onValueChange={handleBulkAction}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">Mark as Featured</SelectItem>
                <SelectItem value="unfeature">Remove Featured</SelectItem>
                <SelectItem value="delete">Delete Selected</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, description, brand, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-40">
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
      <Card>
        <CardHeader>
          <CardTitle>
            Products ({filteredProducts.length} total)
            {selectedProducts.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({selectedProducts.length} selected)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available Stock</TableHead>
                  <TableHead>Sold Stock</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
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
                        <div className="font-medium line-clamp-1">{product.title}</div>
                        <div className="text-sm text-gray-600">{product.brand || 'No Brand'}</div>
                        <div className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatCurrency(product.price)}</div>
                        {product.mrp > product.price && (
                          <div className="text-sm text-gray-500 line-through">
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
                      <div className="font-medium text-blue-600">
                        {product.sold_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-xs text-gray-600">({product.reviews_count})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {product.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                        )}
                        {product.returnable && (
                          <Badge variant="outline" className="text-xs">Returnable</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
