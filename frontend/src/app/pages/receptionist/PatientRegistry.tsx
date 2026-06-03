import { useState, useEffect } from 'react';
import { Search, Filter, Users, FileText, Calendar, Clock, Activity, FileCheck, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api } from '../../shared/api';

interface PatientData {
  id: number;
  name: string;
  mrn: string;
  diagnosis: string;
  intake: string;
  nextAppointment: string;
  status: string;
}

export default function PatientRegistry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboards/receptionist/registry')
      .then(res => setPatients(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filters = ['All', 'New Patients', 'Pending Intake', 'Awaiting Scheduling', 'Active Treatment', 'Completed Treatment'];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || patient.status === activeFilter;
    
    // Quick mapping for New Patient -> New Patients, etc.
    if (activeFilter === 'New Patients' && patient.status === 'New Patient') return matchesSearch;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active Treatment': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case 'Pending Intake': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Pending Intake</Badge>;
      case 'New Patient': return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">New</Badge>;
      case 'Awaiting Scheduling': return <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30">Needs Scheduling</Badge>;
      case 'Completed Treatment': return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">Completed</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent text-3xl font-bold mb-2">
            Patient Registry
          </h1>
          <p className="text-slate-400">Master index of all clinic patients</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  onClick={() => setActiveFilter(filter)}
                  className={activeFilter === filter 
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" 
                    : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                  size="sm"
                >
                  {filter}
                </Button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search name or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-700/50 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">MRN</th>
                  <th className="px-6 py-4 font-medium">Diagnosis</th>
                  <th className="px-6 py-4 font-medium">Intake Progress</th>
                  <th className="px-6 py-4 font-medium">Next Appointment</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient, idx) => (
                    <tr 
                      key={patient.id} 
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">{patient.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{patient.mrn}</td>
                      <td className="px-6 py-4">{patient.diagnosis}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-800">
                            <div 
                              className={`h-full rounded-full ${patient.intake === '4/4' ? 'bg-emerald-500' : patient.intake === '0/4' ? 'bg-rose-500' : 'bg-amber-500'}`} 
                              style={{ width: `${(parseInt(patient.intake[0]) / 4) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{patient.intake}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className={patient.nextAppointment === 'Unscheduled' ? 'text-amber-400/80 italic' : ''}>
                            {patient.nextAppointment}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(patient.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
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
