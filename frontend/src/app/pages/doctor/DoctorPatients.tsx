import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, AlertCircle, Activity, Heart, Clock, CheckCircle2, UserCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

// Mock Patient Data
const mockPatients = [
  { id: 1, name: 'John Anderson', age: 58, type: 'Lung Cancer', stage: 'Stage 3A', status: 'Active Treatment', urgency: 'High', doctor: 'Dr. Sarah Jenkins', lastVisit: '2 days ago', avatar: 'JA' },
  { id: 2, name: 'Maria Garcia', age: 45, type: 'Breast Cancer', stage: 'Stage 2B', status: 'Active Treatment', urgency: 'Routine', doctor: 'Dr. Sarah Jenkins', lastVisit: '1 week ago', avatar: 'MG' },
  { id: 3, name: 'Robert Kim', age: 62, type: 'Non-Hodgkin Lymphoma', stage: 'Stage 4', status: 'High-Risk', urgency: 'Critical', doctor: 'Dr. James Wilson', lastVisit: 'Today', avatar: 'RK' },
  { id: 4, name: 'Lisa Thompson', age: 39, type: 'Meningioma', stage: 'Benign', status: 'Follow-up', urgency: 'Routine', doctor: 'Dr. Sarah Jenkins', lastVisit: '3 months ago', avatar: 'LT' },
  { id: 5, name: 'David Miller', age: 71, type: 'Prostate Cancer', stage: 'Stage 2', status: 'New Referral', urgency: 'Medium', doctor: 'Unassigned', lastVisit: 'Never', avatar: 'DM' },
  { id: 6, name: 'Emily Chen', age: 52, type: 'Ovarian Cancer', stage: 'Remission', status: 'Discharged', urgency: 'Low', doctor: 'Dr. Sarah Jenkins', lastVisit: '6 months ago', avatar: 'EC' },
];

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Filter mocked patients
  const filteredPatients = mockPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'active': return p.status === 'Active Treatment';
      case 'new': return p.status === 'New Referral';
      case 'followup': return p.status === 'Follow-up';
      case 'highrisk': return p.status === 'High-Risk';
      case 'discharged': return p.status === 'Discharged';
      default: return true;
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            My Patients
          </h1>
          <p className="text-slate-400">Manage and monitor your patient panel</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search patients, cancer type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900/50 border-slate-700/50 focus-visible:ring-cyan-500/50 text-white"
            />
          </div>
          <Button variant="outline" className="border-slate-700/50 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="active" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-700/50 p-1 mb-6 flex flex-wrap h-auto w-full justify-start rounded-xl shadow-lg">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2 flex items-center gap-2">
             <UserCircle2 className="w-4 h-4" /> All
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Active Treatment
          </TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <Heart className="w-4 h-4" /> New Referrals
          </TabsTrigger>
          <TabsTrigger value="followup" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Follow-up
          </TabsTrigger>
          <TabsTrigger value="highrisk" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> High-Risk
          </TabsTrigger>
          <TabsTrigger value="discharged" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Discharged
          </TabsTrigger>
        </TabsList>

        <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnosis & Stage</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Urgency</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Last Visit</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient, idx) => (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-slate-800/40 transition-colors group animate-in slide-in-from-left duration-500"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold shrink-0 shadow-inner">
                            {patient.avatar}
                          </div>
                          <div>
                            <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">{patient.name}</p>
                            <p className="text-xs text-slate-500">{patient.age} yrs • {patient.doctor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-200 font-medium">{patient.type}</p>
                        <p className="text-xs text-slate-500">{patient.stage}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`
                          ${patient.status === 'Active Treatment' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : ''}
                          ${patient.status === 'New Referral' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : ''}
                          ${patient.status === 'High-Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : ''}
                          ${patient.status === 'Follow-up' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : ''}
                          ${patient.status === 'Discharged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : ''}
                        `}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {patient.urgency === 'Critical' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                          <span className={`text-sm font-medium ${
                            patient.urgency === 'Critical' ? 'text-rose-400' : 
                            patient.urgency === 'High' ? 'text-orange-400' : 
                            patient.urgency === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {patient.urgency}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-slate-400">
                        {patient.lastVisit}
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="bg-slate-800 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-slate-700 transition-all"
                        >
                          Workspace
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      No patients found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Tabs>
    </div>
  );
}
