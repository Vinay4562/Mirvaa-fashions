import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getImageUrl, onImageError } from '@/utils/imageHelper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminClient } from '@/utils/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminReturns({ admin, setAdmin }) {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await adminClient.get('/admin/returns');
      setReturns(response.data);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (returnId, newStatus) => {
    try {
      if (newStatus === 'approved') {
        const response = await adminClient.post(`/admin/returns/${returnId}/approve`);
        setReturns(prev => 
          prev.map(r => r.id === returnId ? { ...r, status: 'pickup_scheduled', waybill: response.data.waybill } : r)
        );
        toast.success(`Return approved and pickup scheduled! Waybill: ${response.data.waybill || 'Generated'}`);
      } else {
        await adminClient.put(`/admin/returns/${returnId}`, { status: newStatus });
        setReturns(prev => 
          prev.map(r => r.id === returnId ? { ...r, status: newStatus } : r)
        );
        toast.success(`Return status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating return status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'pickup_scheduled':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">Pickup Scheduled</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <AdminLayout admin={admin} setAdmin={setAdmin} title="Return Requests">
      <div className="flex justify-end mb-6">
        <Button 
          onClick={fetchReturns} 
          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {returns.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100">
            No return requests found.
          </div>
        ) : (
          returns.map((request) => (
            <Card 
              key={request.id} 
              className="group relative overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white/90 backdrop-blur-sm"
            >
               {/* Decorative Gradient Border/Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Order #{request.order_number}</p>
                    <p className="text-sm text-gray-400">{new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="transform transition-transform duration-300 group-hover:scale-105">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Product Info */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/80 group-hover:bg-purple-50/50 transition-colors duration-300">
                  {request.product_image && (
                    <img 
                      src={getImageUrl(request.product_image)} 
                      alt="" 
                      className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500" 
                      onError={onImageError} 
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate" title={request.product_name}>{request.product_name}</p>
                    <div className="mt-1">
                      <p className="text-xs text-gray-500 font-medium">Reason:</p>
                      <p className="text-sm text-gray-600 line-clamp-2" title={request.reason}>{request.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-1 px-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Customer</p>
                  <p className="text-sm font-medium text-gray-700">{request.user_name}</p>
                  <p className="text-xs text-gray-500">{request.user_email}</p>
                </div>

                {/* Action */}
                <div className="pt-2">
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">Update Status</label>
                  <Select 
                    value={request.status} 
                    onValueChange={(val) => updateStatus(request.id, val)}
                  >
                    <SelectTrigger className="w-full rounded-xl border-gray-200 hover:border-purple-300 focus:ring-purple-200 transition-all duration-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="pending" className="cursor-pointer">Pending</SelectItem>
                      <SelectItem value="approved" className="cursor-pointer text-green-600">Approve</SelectItem>
                      <SelectItem value="rejected" className="cursor-pointer text-red-600">Reject</SelectItem>
                      <SelectItem value="completed" className="cursor-pointer text-blue-600">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
