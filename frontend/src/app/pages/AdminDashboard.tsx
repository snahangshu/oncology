import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Users, Calendar, Activity, TrendingUp, MoreVertical } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

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

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/admin');
        const data = response.data;
        
        const updatedMetrics = [
          {
            ...metrics[0],
            value: isLoading ? '...' : String(data.today_patients || 0),
            change: data.today_patients_change || '',
          },
          {
            ...metrics[1],
            value: isLoading ? '...' : String(data.total_appointments || 0),
            change: data.total_appointments_change || '',
          },
          {
            ...metrics[2],
            value: isLoading ? '...' : String(data.doctors_available || 0),
            change: data.doctors_available_change || '',
          },
          {
            ...metrics[3],
            value: isLoading ? '...' : `${data.utilization_percent || 0}%`,
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
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [isLoading]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-400">Manage your hospital operations and monitor system health</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsList.map((metric, index) => (
          <Card
            key={metric.title}
            className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10 animate-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{metric.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-2 mb-1 bg-slate-800/50" />
                  ) : (
                    <h3 className="text-white mt-2 mb-1">{metric.value}</h3>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-5 w-14 mt-1 bg-slate-800/50 rounded-full" />
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
                  <metric.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manage Users Table */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Manage Users
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/staff/invite')} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Invite Staff
            </Button>
            <Button onClick={() => navigate('/admin/doctors/new')} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Add Doctor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/30 hover:bg-slate-800/20">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Active Patients</TableHead>
                <TableHead className="text-slate-400">Last Active</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={`skel-${i}`} className="border-slate-700/30">
                    <TableCell><Skeleton className="h-5 w-32 bg-slate-800/50" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 bg-slate-800/50 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 bg-slate-800/50 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 bg-slate-800/50" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-slate-800/50" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto bg-slate-800/50 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-slate-700/30 hover:bg-slate-800/20 transition-colors"
                >
                  <TableCell className="text-white">{user.name}</TableCell>
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
                          : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                      }
                    >
                      {user.verification_status ? user.verification_status.replace('_', ' ') : user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{user.patients}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{user.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {user.verification_status !== 'APPROVED' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveUser(user.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white h-8"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-slate-700/30"
                        onClick={() => handleViewDetails(user)}
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
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
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            System Health & Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={`se-skel-${i}`} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/20">
                  <Skeleton className="w-2 h-2 mt-2 rounded-full bg-slate-800/50" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-slate-800/50" />
                    <Skeleton className="h-3 w-1/4 bg-slate-800/50" />
                  </div>
                </div>
              ))
            ) : systemEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/20 hover:border-slate-600/30 transition-colors"
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

      {/* User Details Modal */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name}'s Documents</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review documents uploaded by this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {userDocuments.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No documents uploaded yet.</p>
            ) : (
              userDocuments.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
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
                  <p className="text-sm text-slate-400 mb-2 truncate">File: <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">{doc.file_url}</a></p>
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
    </div>
  );
}
