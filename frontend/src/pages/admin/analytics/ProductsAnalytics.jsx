import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { adminClient } from '@/utils/api';
import { getImageUrl } from '@/utils/imageHelper';

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsData.performanceMetrics.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsData.performanceMetrics.featuredProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently featured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{productsData.performanceMetrics.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsData.performanceMetrics.averageRating || 0}</div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productsData.topSelling?.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/100'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.title}</p>
                    <p className="text-xs text-gray-600">
                      {product.quantitySold} sold • {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productsData.lowStock?.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/100'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress 
                        value={(product.stock / product.maxStock) * 100} 
                        className="w-20 h-2"
                      />
                      <span className="text-xs text-gray-600">{product.stock} left</span>
                    </div>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Avg. Price</TableHead>
                <TableHead>Top Seller</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData.categoryStats?.map((category) => (
                <TableRow key={category.name}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.productCount}</TableCell>
                  <TableCell>{formatCurrency(category.revenue)}</TableCell>
                  <TableCell>{formatCurrency(category.averagePrice)}</TableCell>
                  <TableCell className="truncate max-w-[200px]">
                    {category.topSeller || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Price Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Price Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productsData.priceDistribution?.map((range) => (
              <div key={range.range} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium">{range.range}</div>
                <div className="flex-1">
                  <Progress value={range.percentage} className="h-2" />
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
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
