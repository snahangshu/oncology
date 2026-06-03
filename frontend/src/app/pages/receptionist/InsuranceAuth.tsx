import { useState, useEffect } from 'react';
import { Search, ShieldAlert, FileWarning, ShieldCheck, CreditCard, ShieldQuestion } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api } from '../../shared/api';

interface InsuranceData {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  expiry: string;
}

export default function InsuranceAuth() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [insuranceRecords, setInsuranceRecords] = useState<InsuranceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboards/receptionist/insurance')
      .then(res => setInsuranceRecords(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filters = ['All', 'Pending', 'Approved', 'Denied', 'Expiring Soon', 'Missing Document'];

  const filteredInsurance = insuranceRecords.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || item.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Approved</Badge>;
      case 'Pending': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Pending Auth</Badge>;
      case 'Denied': return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30">Denied / Rejected</Badge>;
      case 'Expiring Soon': return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30 animate-pulse">Expiring Soon</Badge>;
      case 'Missing Document': return <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30">Missing Doc</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent text-3xl font-bold mb-2">
            Insurance & Authorizations
          </h1>
          <p className="text-slate-400">Track prior authorizations, claims, and coverage limits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <ShieldQuestion className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Pending Auth</p>
              <h3 className="text-white text-2xl font-bold">{insuranceRecords.filter(i => i.status === 'Pending').length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Expiring {'<'} 7 Days</p>
              <h3 className="text-orange-400 text-2xl font-bold">{insuranceRecords.filter(i => i.status === 'Expiring Soon').length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <FileWarning className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Rejected Claims</p>
              <h3 className="text-white text-2xl font-bold">{insuranceRecords.filter(i => i.status === 'Denied').length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Approved Today</p>
              <h3 className="text-white text-2xl font-bold">{insuranceRecords.filter(i => i.status === 'Approved').length}</h3>
            </div>
          </CardContent>
        </Card>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search patient or provider..."
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
                  <th className="px-6 py-4 font-medium">Patient Name</th>
                  <th className="px-6 py-4 font-medium">Provider</th>
                  <th className="px-6 py-4 font-medium">Request Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Expiry / Deadline</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInsurance.length > 0 ? (
                  filteredInsurance.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors ${
                        item.status === 'Expiring Soon' || item.status === 'Denied' ? 'bg-orange-500/5 hover:bg-orange-500/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        {item.provider}
                      </td>
                      <td className="px-6 py-4">{item.type}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {item.expiry}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                          Follow Up
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No records found matching your search.
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
