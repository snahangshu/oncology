import { useState, useEffect } from 'react';
import { Search, Inbox, AlertCircle, FileText, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api } from '../../shared/api';

interface ReferralData {
  id: number;
  name: string;
  referringDoctor: string;
  referralDate: string;
  status: string;
}

export default function ReferralsQueue() {
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboards/receptionist/referrals')
      .then(res => setReferrals(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredReferrals = referrals.filter(referral => 
    referral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referringDoctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready For Intake': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Ready For Intake</Badge>;
      case 'Ready For Scheduling': return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">Ready For Scheduling</Badge>;
      case 'Awaiting Pathology': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Awaiting Pathology</Badge>;
      case 'Awaiting Imaging': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Awaiting Imaging</Badge>;
      case 'Pending Review': return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30">Pending Review</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent text-3xl font-bold mb-2">
            Referrals Queue
          </h1>
          <p className="text-slate-400">Incoming patient referrals and readiness tracking</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search referrals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800/50 border-slate-700/50 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <Inbox className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">New Referrals (24h)</p>
              <h3 className="text-white text-2xl font-bold">{referrals.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Pending Review</p>
              <h3 className="text-white text-2xl font-bold">{referrals.filter(r => r.status === 'Pending Review').length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Awaiting Docs</p>
              <h3 className="text-white text-2xl font-bold">{referrals.filter(r => r.status === 'Awaiting Pathology' || r.status === 'Awaiting Imaging').length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CalendarClock className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Ready For Intake</p>
              <h3 className="text-white text-2xl font-bold">{referrals.filter(r => r.status === 'Ready For Intake' || r.status === 'Ready For Scheduling').length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient Name</th>
                  <th className="px-6 py-4 font-medium">Referring Doctor</th>
                  <th className="px-6 py-4 font-medium">Referral Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length > 0 ? (
                  filteredReferrals.map((referral, idx) => (
                    <tr 
                      key={referral.id} 
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">{referral.name}</td>
                      <td className="px-6 py-4">{referral.referringDoctor}</td>
                      <td className="px-6 py-4">{referral.referralDate}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(referral.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                          Process Referral
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No referrals found matching your search.
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
