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
        <div className="text-lg text-purple-600 animate-pulse">Loading revenue data...</div>
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
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Revenue Data</h1>
            <p className="text-gray-600">Detailed revenue breakdown and analysis</p>
          </div>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Search by period or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-purple-100 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40 rounded-xl border-purple-100 focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="daily">Daily Revenue</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Table */}
      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-purple-100 bg-purple-50/30">
          <CardTitle className="text-purple-900">
            Revenue Data ({filteredData.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-purple-100">
                  <TableHead className="text-purple-900 font-semibold">Period</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Type</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Revenue</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Orders</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Avg Order Value</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Growth</TableHead>
                  <TableHead className="text-purple-900 font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => {
                  const previousItem = index > 0 ? filteredData[index - 1] : null;
                  const growth = previousItem ? calculateGrowth(item.revenue, previousItem.revenue) : 0;
                  const avgOrderValue = item.orders > 0 ? item.revenue / item.orders : 0;
                  
                  return (
                    <TableRow key={`${item.period}-${item.type}`} className="hover:bg-purple-50/30 border-b border-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {periodFilter === 'daily' ? formatDate(item.period) : item.period}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg border-purple-200 text-purple-700 bg-purple-50">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {item.orders || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600">
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
                        <Badge className={`rounded-lg ${
                          item.revenue > 10000 ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' :
                          item.revenue > 5000 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200' :
                          'bg-red-100 text-red-800 hover:bg-red-200 border-red-200'
                        }`}>
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
          <div className="p-4 bg-purple-50/10 border-t border-purple-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-purple-100 bg-purple-50/20 shadow-none">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-xl font-bold text-purple-700">
                    {formatCurrency(filteredData.reduce((sum, item) => sum + item.revenue, 0))}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-purple-100 bg-purple-50/20 shadow-none">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Total Orders</div>
                  <div className="text-xl font-bold text-purple-700">
                    {filteredData.reduce((sum, item) => sum + (item.orders || 0), 0)}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-purple-100 bg-purple-50/20 shadow-none">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Average Order Value</div>
                  <div className="text-xl font-bold text-purple-700">
                    {formatCurrency(
                      filteredData.reduce((sum, item) => sum + item.revenue, 0) / 
                      Math.max(filteredData.reduce((sum, item) => sum + (item.orders || 0), 0), 1)
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-purple-100 bg-purple-50/20 shadow-none">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Best Performance</div>
                  <div className="text-lg font-bold text-purple-700 truncate">
                    {filteredData.length > 0 ? 
                      filteredData.reduce((best, item) => 
                        item.revenue > best.revenue ? item : best
                      ).period : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-purple-100 bg-purple-50/10">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
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
