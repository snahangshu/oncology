import { ArrowRight, FileText, FileSearch, ShieldAlert, Image as ImageIcon, ClipboardList, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

import { useState } from 'react';

// State interface
interface Referral {
  id: number;
  name: string;
  from: string;
  type: string;
  status: string;
  urgency: string;
  date: string;
}

export default function DoctorReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Referrals & New Cases
          </h1>
          <p className="text-slate-500">Manage incoming oncology referrals and intake tracking</p>
        </div>
      </div>

      {/* Top Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 backdrop-blur-xl overflow-hidden relative group hover:border-violet-500/40 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-violet-400" />
          </div>
          <CardContent className="p-8">
            <p className="text-violet-300 font-medium mb-2 uppercase tracking-widest text-xs">Total New Cases This Week</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-6xl font-bold text-slate-900">0</h2>
              <span className="text-sm text-slate-500 font-medium">No new cases</span>
            </div>
            <p className="text-slate-500 mt-4 text-sm max-w-[80%]">New oncology referrals requiring initial review and treatment planning.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/20 backdrop-blur-xl overflow-hidden relative group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity animate-pulse">
            <ShieldAlert className="w-24 h-24 text-rose-400" />
          </div>
          <CardContent className="p-8">
            <p className="text-rose-300 font-medium mb-2 uppercase tracking-widest text-xs">Action Required Today</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-6xl font-bold text-slate-900">0</h2>
              <span className="text-sm text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-full">All clear</span>
            </div>
            <p className="text-slate-500 mt-4 text-sm max-w-[80%]">Cases flagged as critical or high urgency that need immediate attention.</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel / Status Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'New Referrals', count: 0, icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
          { label: 'Pending Intake', count: 0, icon: ClipboardList, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
          { label: 'Awaiting Pathology', count: 0, icon: FileSearch, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Awaiting Imaging', count: 0, icon: ImageIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: 'Awaiting Insurance', count: 0, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        ].map((stat, idx) => (
          <Card key={idx} className={`bg-white/50 backdrop-blur-xl border ${stat.border} hover:scale-105 transition-transform cursor-pointer`}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.count}</h3>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referrals List */}
      <Card className="bg-white/50 border-slate-200 shadow-sm backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-200/50 bg-white/20">
          <CardTitle className="text-slate-900 text-lg">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/50">
            {referrals.length > 0 ? (
              referrals.map((ref, idx) => (
                <div 
                  key={ref.id} 
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors group animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                      {ref.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-slate-900 font-bold text-lg">{ref.name}</h4>
                        {ref.urgency === 'Critical' && <Badge variant="outline" className="border-rose-500/50 text-rose-400 bg-rose-500/10 text-[10px] animate-pulse">Critical</Badge>}
                        {ref.urgency === 'High' && <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-500/10 text-[10px]">High</Badge>}
                      </div>
                      <p className="text-cyan-400 font-medium text-sm mb-1">{ref.type}</p>
                      <p className="text-slate-500 text-xs">Referred by: {ref.from} • {ref.date}</p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto">
                    <Badge variant="outline" className={`
                      ${ref.status === 'Pending Review' ? 'border-violet-500/50 text-violet-400 bg-violet-500/10' : ''}
                      ${ref.status === 'Awaiting Pathology' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : ''}
                      ${ref.status === 'Awaiting Imaging' ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10' : ''}
                      ${ref.status === 'Pending Intake' ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' : ''}
                      ${ref.status === 'Awaiting Insurance' ? 'border-rose-500/50 text-rose-400 bg-rose-500/10' : ''}
                    `}>
                      {ref.status}
                    </Badge>
                    
                    <Button size="sm" variant="outline" className="border-slate-200 hover:border-cyan-500 hover:text-cyan-400 bg-slate-50 transition-colors">
                      Review Case <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-slate-700">No recent referrals</p>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">There are no new cases requiring your attention at this time.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
