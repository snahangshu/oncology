import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Activity, TrendingUp, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { api } from '../shared/api';
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

const metrics = [
  {
    title: "Today's Patients",
    value: '147',
    change: '+12%',
    icon: Users,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Total Appointments',
    value: '89',
    change: '+8%',
    icon: Calendar,
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    title: 'Doctors Available',
    value: '24',
    change: '-2',
    icon: Activity,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Appointment Utilization',
    value: '94%',
    change: '+5%',
    icon: TrendingUp,
    gradient: 'from-rose-500 to-pink-500',
  },
];

const users = [
  { id: 1, name: 'Dr. Sarah Chen', role: 'DOCTOR', status: 'Active', patients: 12, lastActive: '2 min ago' },
  { id: 2, name: 'Dr. Michael Rodriguez', role: 'DOCTOR', status: 'Active', patients: 15, lastActive: '5 min ago' },
  { id: 3, name: 'Emily Johnson', role: 'RECEPTIONIST', status: 'Active', patients: 0, lastActive: '1 min ago' },
  { id: 4, name: 'Nurse Williams', role: 'NURSE', status: 'Active', patients: 8, lastActive: '3 min ago' },
  { id: 5, name: 'Dr. James Park', role: 'DOCTOR', status: 'Inactive', patients: 0, lastActive: '2 hrs ago' },
  { id: 6, name: 'Lisa Martinez', role: 'NURSE', status: 'Active', patients: 6, lastActive: '10 min ago' },
];

const systemEvents = [
  { id: 1, type: 'critical', message: 'Database backup completed successfully', time: '5 min ago' },
  { id: 2, type: 'warning', message: 'High CPU usage on server-02 (87%)', time: '12 min ago' },
  { id: 3, type: 'info', message: 'New user registered: Dr. Amanda Lee', time: '25 min ago' },
  { id: 4, type: 'critical', message: 'Payment gateway integration updated', time: '1 hr ago' },
  { id: 5, type: 'info', message: 'Appointment reminder sent to 45 patients', time: '2 hrs ago' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metricsList, setMetricsList] = useState(metrics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/admin');
        const data = response.data;
        
        const updatedMetrics = [
          {
            ...metrics[0],
            value: isLoading ? '...' : String(data.today_patients || 147),
          },
          {
            ...metrics[1],
            value: isLoading ? '...' : String(data.total_appointments || 89),
          },
          {
            ...metrics[2],
            value: isLoading ? '...' : String(data.doctors_available || 24),
          },
          {
            ...metrics[3],
            value: isLoading ? '...' : `${data.utilization_percent || 94}%`,
          },
        ];
        setMetricsList(updatedMetrics);
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
                  <h3 className="text-white mt-2 mb-1">{metric.value}</h3>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  >
                    {metric.change}
                  </Badge>
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
          <Button onClick={() => navigate('/admin/doctors/new')} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            Add Doctor
          </Button>
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
              {users.map((user) => (
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
                        user.status === 'Active'
                          ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 animate-pulse'
                          : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{user.patients}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{user.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-slate-700/30"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-slate-900 border-slate-700/30"
                      >
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400">
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            {systemEvents.map((event) => (
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
    </div>
  );
}
