import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { adminClient } from '@/utils/api';
import { Eye, MousePointerClick, Activity, ArrowUpRight } from 'lucide-react';

export default function SiteAnalytics({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalVisits: 0,
      totalProductViews: 0,
      totalClicks: 0
    },
    trafficOverTime: [],
    productVisits: [],
    mostViewedProducts: [],
    pageViews: []
  });

  useEffect(() => {
    fetchSiteAnalytics();
  }, [dateRange]);

  const fetchSiteAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminClient.get('/admin/analytics/site', {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching site analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-3xl border-0 shadow-lg overflow-hidden">
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

  const maxVisits = Math.max(...analyticsData.trafficOverTime.map(d => d.visits), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Page Visits</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {analyticsData.summary.totalVisits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total page loads
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Product Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              {analyticsData.summary.totalProductViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Product detail page views
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-600">Total Interactions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
              {analyticsData.summary.totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clicks and other events
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Viewed Products */}
        <Card className="rounded-3xl border-0 shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Most Viewed Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="w-[100px]">Interest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.mostViewedProducts.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell className="text-right">{product.visits}</TableCell>
                    <TableCell>
                      <Progress value={(product.visits / Math.max(...analyticsData.mostViewedProducts.map(p => p.visits), 1)) * 100} className="h-2" />
                    </TableCell>
                  </TableRow>
                ))}
                {analyticsData.mostViewedProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No product views recorded in this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="rounded-3xl border-0 shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Top Visited Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Path</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.pageViews.map((page) => (
                  <TableRow key={page.page}>
                    <TableCell className="font-medium font-mono text-xs">{page.page}</TableCell>
                    <TableCell className="text-right">{page.visits}</TableCell>
                  </TableRow>
                ))}
                {analyticsData.pageViews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No page views recorded in this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart (Simulated with Bars) */}
      <Card className="rounded-3xl border-0 shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Traffic Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-end gap-1 pt-4">
            {analyticsData.trafficOverTime.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                 <div 
                  className="w-full bg-purple-100 hover:bg-purple-300 transition-all rounded-t-sm"
                  style={{ height: `${(day.visits / maxVisits) * 100}%` }}
                ></div>
                <div className="absolute bottom-0 mb-full opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded py-1 px-2 pointer-events-none z-10 whitespace-nowrap mb-1">
                  {day.period}: {day.visits} visits
                </div>
              </div>
            ))}
             {analyticsData.trafficOverTime.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No traffic data available
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
