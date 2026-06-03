import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router';
import { api } from '../../shared/api';

interface IntakeData {
  id: number;
  name: string;
  referral: boolean;
  pathology: boolean;
  imaging: boolean;
  insurance: boolean;
  status: string;
}

export default function IntakeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [intakes, setIntakes] = useState<IntakeData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboards/receptionist/intakes')
      .then(res => setIntakes(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredIntakes = intakes.filter(intake => 
    intake.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Completed</Badge>;
      case 'Incomplete': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Incomplete</Badge>;
      case 'Missing Documents': return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30">Missing Docs</Badge>;
      case 'New Referral': return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">New Referral</Badge>;
      case 'Urgent Case': return <Badge className="bg-red-500/10 text-red-400 border-red-500/50 animate-pulse">Urgent</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const renderCheckmark = (status: boolean) => {
    return status 
      ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
      : <XCircle className="w-5 h-5 text-rose-400 mx-auto opacity-50" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent text-3xl font-bold mb-2">
            Intake Management
          </h1>
          <p className="text-slate-400">Global queue for tracking new patient onboarding and document collection</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800/50 border-slate-700/50 text-white"
          />
        </div>
      </div>

      {/* Global Queue Table */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium text-center">Referral</th>
                  <th className="px-6 py-4 font-medium text-center">Pathology</th>
                  <th className="px-6 py-4 font-medium text-center">Imaging</th>
                  <th className="px-6 py-4 font-medium text-center">Insurance</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIntakes.length > 0 ? (
                  filteredIntakes.map((intake, idx) => (
                    <tr 
                      key={intake.id} 
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">{intake.name}</td>
                      <td className="px-6 py-4">{renderCheckmark(intake.referral)}</td>
                      <td className="px-6 py-4">{renderCheckmark(intake.pathology)}</td>
                      <td className="px-6 py-4">{renderCheckmark(intake.imaging)}</td>
                      <td className="px-6 py-4">{renderCheckmark(intake.insurance)}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(intake.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => navigate(`/receptionist/intake/${intake.id}`)}
                          className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                          size="sm"
                        >
                          Open Patient Intake
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No patients found in the intake queue.
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
