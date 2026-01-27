import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { adminClient } from '@/utils/api';
import { getImageUrl, onImageError } from '@/utils/imageHelper';

export default function ProductsAnalytics({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState({
    topSelling: [],
    lowStock: [],
    categoryStats: [],
    priceDistribution: [],
    performanceMetrics: {}
  });

  useEffect(() => {
    fetchProductsData();
  }, [dateRange]);

  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/products', {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });
      setProductsData(response.data);
    } catch (error) {
      console.error('Error fetching products analytics:', error);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {productsData.performanceMetrics.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Featured Products</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-amber-600">
              {productsData.performanceMetrics.featuredProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently featured
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-orange-600">
              {productsData.performanceMetrics.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Rating</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-600">
              {productsData.performanceMetrics.averageRating || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-gray-800">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {productsData.topSelling?.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4 p-2 rounded-xl hover:bg-purple-50/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                    <img
                      src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/100'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={onImageError}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">{product.title}</p>
                    <p className="text-xs text-gray-600">
                      {product.quantitySold} sold • <span className="text-purple-600 font-medium">{formatCurrency(product.totalRevenue)}</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-gray-800">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {productsData.lowStock?.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center space-x-4 p-2 rounded-xl hover:bg-red-50/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                    <img
                      src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/100'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={onImageError}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">{product.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress 
                        value={(product.stock / product.maxStock) * 100} 
                        className="w-20 h-2 rounded-full bg-red-100"
                        indicatorClassName="bg-gradient-to-r from-red-500 to-orange-500"
                      />
                      <span className="text-xs text-red-600 font-medium">{product.stock} left</span>
                    </div>
                  </div>
                  <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Statistics */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Category Performance</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-purple-100">
                <TableHead className="text-purple-900 font-semibold">Category</TableHead>
                <TableHead className="text-purple-900 font-semibold">Products</TableHead>
                <TableHead className="text-purple-900 font-semibold">Revenue</TableHead>
                <TableHead className="text-purple-900 font-semibold">Avg. Price</TableHead>
                <TableHead className="text-purple-900 font-semibold">Top Seller</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData.categoryStats?.map((category) => (
                <TableRow key={category.name} className="hover:bg-purple-50/30 border-b border-gray-50 transition-colors">
                  <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                  <TableCell className="text-gray-600">{category.productCount}</TableCell>
                  <TableCell className="font-medium text-purple-600">{formatCurrency(category.revenue)}</TableCell>
                  <TableCell className="text-gray-600">{formatCurrency(category.averagePrice)}</TableCell>
                  <TableCell className="truncate max-w-[200px] text-gray-600">
                    {category.topSeller || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Price Distribution */}
      <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-gray-800">Price Distribution</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            {productsData.priceDistribution?.map((range) => (
              <div key={range.range} className="flex items-center space-x-4 p-2 rounded-xl hover:bg-purple-50/30 transition-colors">
                <div className="w-24 text-sm font-medium text-gray-700">{range.range}</div>
                <div className="flex-1">
                  <Progress 
                    value={range.percentage} 
                    className="h-2 rounded-full" 
                    indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
                <div className="w-24 text-sm text-gray-600 text-right font-medium">
                  {range.count} products
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
