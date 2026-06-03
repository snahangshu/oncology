import { useState } from 'react';
import { FlaskConical, AlertTriangle, FileText, CheckCircle2, TrendingDown, ArrowRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

// State interface
interface Lab {
  id: number;
  patient: string;
  type: string;
  value: string;
  normalRange: string;
  status: string;
  alert?: string;
  time: string;
}

export default function LabReviewCenter() {
  const [filter, setFilter] = useState('all');
  const [labs, setLabs] = useState<Lab[]>([]);

  const filteredLabs = labs.filter(lab => {
    if (filter === 'critical') return lab.status === 'Critical';
    if (filter === 'abnormal') return lab.status === 'Abnormal';
    if (filter === 'normal') return lab.status === 'Normal';
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Lab Review Center
          </h1>
          <p className="text-slate-400">Review critical lab results, CMPs, and CBCs across all patients</p>
        </div>
      </div>

      {/* Top Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/30 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 animate-pulse">
            <AlertTriangle className="w-16 h-16 text-rose-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-rose-300 font-medium mb-1 uppercase text-xs tracking-wider">Critical Values</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">0</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">All clear</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown className="w-16 h-16 text-amber-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-amber-300 font-medium mb-1 uppercase text-xs tracking-wider">Abnormal Results</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">0</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">All clear</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FlaskConical className="w-16 h-16 text-cyan-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-cyan-300 font-medium mb-1 uppercase text-xs tracking-wider">New Reports Today</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">0</h2>
              <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">Since 08:00 AM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/50 bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Lab Queue
          </CardTitle>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">All</TabsTrigger>
              <TabsTrigger value="critical" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300">Critical</TabsTrigger>
              <TabsTrigger value="abnormal" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">Abnormal</TabsTrigger>
              <TabsTrigger value="normal" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Normal</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/50">
            {filteredLabs.length > 0 ? (
              filteredLabs.map((lab, idx) => (
                <div 
                  key={lab.id} 
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors group animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${
                      lab.status === 'Critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                      lab.status === 'Abnormal' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-bold text-lg">{lab.patient}</h4>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 ${
                          lab.status === 'Critical' ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse' :
                          lab.status === 'Abnormal' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' :
                          'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                        }`}>
                          {lab.status}
                        </Badge>
                        <span className="text-xs text-slate-500 ml-2">{lab.time}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm mt-1">
                        <span className="text-slate-400 font-medium">{lab.type} Report</span>
                        <span className="text-slate-600">•</span>
                        <span className={`font-bold ${lab.status === 'Critical' ? 'text-rose-400' : lab.status === 'Abnormal' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {lab.value}
                        </span>
                        <span className="text-slate-500 text-xs hidden sm:inline">(Ref: {lab.normalRange})</span>
                      </div>
                      {lab.alert && lab.status !== 'Normal' && (
                        <p className={`text-xs mt-1 font-medium ${lab.status === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                          ⚠ {lab.alert}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    {lab.status === 'Critical' ? (
                      <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 border-0 w-full sm:w-auto">
                        Review Critical Result
                      </Button>
                    ) : lab.status === 'Abnormal' ? (
                      <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 w-full sm:w-auto">
                        Review Result
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white w-full sm:w-auto">
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-slate-300">No lab reports found</p>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">There are no pending lab results matching your selected filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
