import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { adminClient } from '@/utils/api';

export default function RevenueTable({ onBack }) {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('daily');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchRevenueData();
  }, [currentPage, periodFilter, categoryFilter]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/revenue');
      const dailyRevenue = response.data.dailyRevenue || [];
      const categoryRevenue = response.data.categoryRevenue || [];
      
      let data = [];
      if (periodFilter === 'daily') {
        data = dailyRevenue.map(day => ({
          period: day.date,
          revenue: day.revenue,
          orders: 0, // This would need to be fetched separately
          type: 'Daily'
        }));
      } else if (periodFilter === 'category') {
        data = categoryRevenue.map(cat => ({
          period: cat.name,
          revenue: cat.revenue,
          orders: cat.orderCount,
          type: 'Category'
        }));
      }
      
      setRevenueData(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredData = revenueData.filter(item => {
    const matchesSearch = item.period.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const handleExport = async () => {
    try {
      const response = await adminClient.get('/admin/analytics/export/revenue', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting revenue data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Loading revenue data...</div>
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
            <h1 className="text-2xl font-bold">Revenue Data</h1>
            <p className="text-gray-600">Detailed revenue breakdown and analysis</p>
          </div>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by period or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Revenue</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Revenue Data ({filteredData.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Avg Order Value</TableHead>
                  <TableHead>Growth</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => {
                  const previousItem = index > 0 ? filteredData[index - 1] : null;
                  const growth = previousItem ? calculateGrowth(item.revenue, previousItem.revenue) : 0;
                  const avgOrderValue = item.orders > 0 ? item.revenue / item.orders : 0;
                  
                  return (
                    <TableRow key={`${item.period}-${item.type}`}>
                      <TableCell className="font-medium">
                        {periodFilter === 'daily' ? formatDate(item.period) : item.period}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell>
                        {item.orders || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {item.orders > 0 ? formatCurrency(avgOrderValue) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {growth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : growth < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : null}
                          <span className={`text-sm font-medium ${
                            growth > 0 ? 'text-green-600' : 
                            growth < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          item.revenue > 10000 ? 'bg-green-100 text-green-800' :
                          item.revenue > 5000 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {item.revenue > 10000 ? 'High' :
                           item.revenue > 5000 ? 'Medium' : 'Low'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(filteredData.reduce((sum, item) => sum + item.revenue, 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + (item.orders || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Average Order Value</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    filteredData.reduce((sum, item) => sum + item.revenue, 0) / 
                    Math.max(filteredData.reduce((sum, item) => sum + (item.orders || 0), 0), 1)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Best Day/Category</div>
                <div className="text-lg font-bold">
                  {filteredData.length > 0 ? 
                    filteredData.reduce((best, item) => 
                      item.revenue > best.revenue ? item : best
                    ).period : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
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
