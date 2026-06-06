import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Users, Calendar, Activity, TrendingUp, MoreVertical, Beaker } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { api } from '../shared/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const metrics = [
  {
    title: "Today's Patients",
    value: '0',
    change: '',
    icon: Users,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Total Appointments',
    value: '0',
    change: '',
    icon: Calendar,
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    title: 'Doctors Available',
    value: '0',
    change: '',
    icon: Activity,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Appointment Utilization',
    value: '0%',
    change: '',
    icon: TrendingUp,
    gradient: 'from-rose-500 to-pink-500',
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metricsList, setMetricsList] = useState(metrics);
  const [users, setUsers] = useState<any[]>([]);
  const [systemEvents, setSystemEvents] = useState<any[]>([]);
  const [inventoryForecast, setInventoryForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleViewDetails = async (user: any) => {
    setSelectedUser(user);
    try {
      const response = await api.get(`/staff/${user.id}/documents`);
      setUserDocuments(response.data);
      setIsDocumentModalOpen(true);
    } catch (error) {
      toast.error('Failed to load user documents');
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      await api.post(`/staff/${userId}/approve`);
      setUsers(users.map(u => u.id === userId ? { ...u, verification_status: 'APPROVED' } : u));
      toast.success('User approved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to approve user');
      console.error('Failed to approve user', err);
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/staff/${selectedUser.id}/reject`, { reason: rejectReason });
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, verification_status: 'REJECTED' } : u));
      toast.success('User rejected successfully');
      setIsRejectModalOpen(false);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reject user');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/staff/${user.id}`);
      setUsers(users.filter(u => u.id !== user.id));
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const fetchDashboard = async (isBackground = false) => {
      try {
        const response = await api.get('/dashboards/admin');
        const data = response.data;
        
        const updatedMetrics = [
          {
            ...metrics[0],
            value: (isLoading && !isBackground) ? '...' : String(data.today_patients || 0),
            change: data.today_patients_change || '',
          },
          {
            ...metrics[1],
            value: (isLoading && !isBackground) ? '...' : String(data.total_appointments || 0),
            change: data.total_appointments_change || '',
          },
          {
            ...metrics[2],
            value: (isLoading && !isBackground) ? '...' : String(data.doctors_available || 0),
            change: data.doctors_available_change || '',
          },
          {
            ...metrics[3],
            value: (isLoading && !isBackground) ? '...' : `${data.utilization_percent || 0}%`,
            change: data.utilization_percent_change || '',
          },
        ];
        setMetricsList(updatedMetrics);
        if (data.users) {
          setUsers(data.users);
        }
        if (data.systemEvents) {
          setSystemEvents(data.systemEvents);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        if (!isBackground) setIsLoading(false);
      }
      try {
        const forecastRes = await api.get('/infusion/inventory-forecast');
        if (forecastRes.data && forecastRes.data.forecast) {
          setInventoryForecast(forecastRes.data.forecast);
        }
      } catch (err) {
        console.error('Error fetching inventory forecast', err);
      }
    };
    
    fetchDashboard();
    intervalId = setInterval(() => fetchDashboard(true), 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-500">Manage your hospital operations and monitor system health</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsList.map((metric, index) => (
          <Card
            key={metric.title}
            className="bg-white/80 backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10 animate-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{metric.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-2 mb-1 bg-slate-100" />
                  ) : (
                    <h3 className="text-slate-900 mt-2 mb-1">{metric.value}</h3>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-5 w-14 mt-1 bg-slate-100 rounded-full" />
                  ) : metric.change ? (
                    <Badge
                      variant="outline"
                      className={`mt-1 ${
                        metric.change.startsWith('-')
                          ? 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                          : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      }`}
                    >
                      {metric.change}
                    </Badge>
                  ) : null}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                  <metric.icon className="w-5 h-5 text-slate-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manage Users Table */}
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Manage Users
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/staff/invite')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900">
              Invite Staff
            </Button>
            <Button onClick={() => navigate('/admin/doctors/new')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900">
              Add Doctor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-slate-100/20">
                <TableHead className="text-slate-500">Name</TableHead>
                <TableHead className="text-slate-500">Role</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500">Active Patients</TableHead>
                <TableHead className="text-slate-500">Last Active</TableHead>
                <TableHead className="text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={`skel-${i}`} className="border-slate-200">
                    <TableCell><Skeleton className="h-5 w-32 bg-slate-100" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 bg-slate-100 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 bg-slate-100 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 bg-slate-100" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto bg-slate-100 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-slate-200 hover:bg-slate-100/20 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(user)}
                >
                  <TableCell className="text-slate-900">{user.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.role === 'DOCTOR'
                          ? 'border-violet-500/30 text-violet-400 bg-violet-500/10'
                          : user.role === 'NURSE'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.verification_status === 'APPROVED'
                          ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                          : user.verification_status === 'UNDER_REVIEW'
                          ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                          : 'border-slate-500/30 text-slate-500 bg-slate-500/10'
                      }
                    >
                      {user.verification_status ? user.verification_status.replace('_', ' ') : user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.patients}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{user.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-slate-100 text-slate-600 h-8"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(user); }}
                      >
                        View
                      </Button>
                      {user.verification_status !== 'APPROVED' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleApproveUser(user.id); }}
                          className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 h-8"
                        >
                          Approve
                        </Button>
                      )}
                      {user.verification_status !== 'REJECTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30 h-8"
                          onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsRejectModalOpen(true); }}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30 h-8"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Health Feed */}
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            System Health & Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={`se-skel-${i}`} className="flex items-start gap-4 p-4 rounded-xl bg-slate-100/20 border border-slate-200/20">
                  <Skeleton className="w-2 h-2 mt-2 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-slate-100" />
                    <Skeleton className="h-3 w-1/4 bg-slate-100" />
                  </div>
                </div>
              ))
            ) : systemEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-100/20 border border-slate-200/20 hover:border-slate-600/30 transition-colors"
              >
                <div
                  className={`w-2 h-2 mt-2 rounded-full ${
                    event.type === 'critical'
                      ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse'
                      : event.type === 'warning'
                      ? 'bg-rose-400 shadow-lg shadow-rose-400/50 animate-pulse'
                      : 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-slate-200">{event.message}</p>
                  <p className="text-slate-500 text-sm mt-1">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drug Inventory Forecast */}
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-indigo-400" />
            AI Drug Inventory Forecasting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-500">Drug</TableHead>
                <TableHead className="text-slate-500">Current Stock</TableHead>
                <TableHead className="text-slate-500">Needed (7 Days)</TableHead>
                <TableHead className="text-slate-500">Needed (14 Days)</TableHead>
                <TableHead className="text-slate-500">Needed (30 Days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryForecast.map((item, idx) => (
                <TableRow key={idx} className="border-slate-200 hover:bg-slate-100/20">
                  <TableCell className="text-slate-900 font-medium">{item.drug}</TableCell>
                  <TableCell className="text-slate-600">
                    <Badge variant="outline" className={item.current_stock < item.needed_7_days ? 'border-rose-500/50 text-rose-400 bg-rose-500/10' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'}>
                      {item.current_stock} vials
                    </Badge>
                  </TableCell>
                  <TableCell className="text-indigo-300">{item.needed_7_days} vials</TableCell>
                  <TableCell className="text-indigo-300">{item.needed_14_days} vials</TableCell>
                  <TableCell className="text-indigo-300">{item.needed_30_days} vials</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name}'s Details</DialogTitle>
            <DialogDescription className="text-slate-500">
              Review user information and uploaded documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-2">
            {selectedUser && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-200 space-y-2">
                <p className="text-sm"><span className="text-slate-500">Email:</span> <span className="text-slate-900">{selectedUser.email || 'N/A'}</span></p>
                <p className="text-sm"><span className="text-slate-500">Role:</span> <span className="text-slate-900">{selectedUser.role}</span></p>
                <p className="text-sm"><span className="text-slate-500">Status:</span> <span className="text-slate-900">{selectedUser.verification_status ? selectedUser.verification_status.replace('_', ' ') : selectedUser.status}</span></p>
              </div>
            )}
            
            <h4 className="text-sm font-semibold text-slate-600 mt-4 mb-2">Uploaded Documents</h4>
            {userDocuments.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-2">No documents uploaded yet.</p>
            ) : (
              userDocuments.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-950 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-cyan-400">{doc.document_type}</span>
                    <Badge variant="outline" className={
                      doc.status === 'VERIFIED' ? 'border-emerald-500/50 text-emerald-400' : 
                      doc.status === 'REJECTED' ? 'border-rose-500/50 text-rose-400' :
                      'border-amber-500/50 text-amber-400'
                    }>
                      {doc.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-2 truncate">File: <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">{doc.file_url}</a></p>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Issued: {doc.issue_date || 'N/A'}</span>
                    <span>Expires: {doc.expiry_date || 'N/A'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription className="text-slate-500">
              Please provide a reason for rejecting {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full bg-slate-950 border border-slate-200 rounded-md p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
              rows={4}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} className="border-slate-200 text-slate-600 hover:bg-slate-100">
              Cancel
            </Button>
            <Button onClick={handleRejectUser} className="bg-amber-500 hover:bg-amber-600 text-slate-900" disabled={!rejectReason.trim()}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
