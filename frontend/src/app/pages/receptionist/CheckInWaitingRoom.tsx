import { useState, useEffect } from 'react';
import { Search, UserCheck, Clock, UserX, User, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { api } from '../../shared/api';

interface WaitListData {
  id: number;
  name: string;
  doctor: string;
  time: string;
  status: string;
  waitMinutes: number;
}

const STATUSES = ['All', 'Scheduled', 'Checked-In', 'Waiting', 'Roomed', 'With Doctor', 'Completed', 'No Show'];

export default function CheckInWaitingRoom() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [patients, setPatients] = useState<WaitListData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboards/receptionist/waiting-room')
      .then(res => setPatients(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeStatus === 'All' || patient.status === activeStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled': return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/30">Scheduled</Badge>;
      case 'Checked-In': return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">Checked-In</Badge>;
      case 'Waiting': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Waiting</Badge>;
      case 'Roomed': return <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30">Roomed</Badge>;
      case 'With Doctor': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">With Doctor</Badge>;
      case 'Completed': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Completed</Badge>;
      case 'No Show': return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30">No Show</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/30">{status}</Badge>;
    }
  };

  const getWaitTimeDisplay = (waitMinutes: number, status: string) => {
    if (status === 'Scheduled' || status === 'Completed' || status === 'No Show') return '-';
    
    if (waitMinutes > 30 && status === 'Waiting') {
      return (
        <span className="flex items-center gap-2 text-rose-400 font-medium">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          {waitMinutes} mins
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 text-slate-700">
        <Clock className="w-4 h-4 text-slate-500" />
        {waitMinutes} mins
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent text-3xl font-bold mb-2">
            Check-In & Waiting Room
          </h1>
          <p className="text-slate-500">Track clinic flow and patient wait times</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <UserCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Total Checked-In</p>
              <h3 className="text-slate-900 text-2xl font-bold">{patients.filter(p => p.status !== 'Scheduled' && p.status !== 'No Show' && p.status !== 'Completed').length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">In Waiting Room</p>
              <h3 className="text-slate-900 text-2xl font-bold">{patients.filter(p => p.status === 'Waiting').length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">With Doctor</p>
              <h3 className="text-slate-900 text-2xl font-bold">{patients.filter(p => p.status === 'With Doctor').length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm border-rose-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Wait {'>'} 30 mins</p>
              <h3 className="text-rose-400 text-2xl font-bold">{patients.filter(p => p.waitMinutes > 30).length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Select value={activeStatus} onValueChange={setActiveStatus}>
                <SelectTrigger className="w-[180px] bg-slate-50/50 border-slate-200/50 text-slate-900">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-sm">
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search patient or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50/50 border-slate-200/50 text-slate-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-50/50 text-slate-500 border-b border-slate-200/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient Name</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Doctor</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Wait Time</th>
                  <th className="px-6 py-4 font-medium text-right">Update Flow</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient, idx) => (
                    <tr 
                      key={patient.id} 
                      className={`border-b border-slate-200 shadow-sm hover:bg-slate-50 transition-colors ${
                        patient.waitMinutes > 30 && patient.status === 'Waiting' ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{patient.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{patient.time}</td>
                      <td className="px-6 py-4">{patient.doctor}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(patient.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getWaitTimeDisplay(patient.waitMinutes, patient.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Select defaultValue={patient.status}>
                          <SelectTrigger className="w-[140px] ml-auto h-8 bg-slate-50/80 border-slate-200/50 text-slate-900 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 shadow-sm text-xs">
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="Checked-In">Checked-In</SelectItem>
                            <SelectItem value="Waiting">Waiting</SelectItem>
                            <SelectItem value="Roomed">Roomed</SelectItem>
                            <SelectItem value="With Doctor">With Doctor</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="No Show">No Show</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No patients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
