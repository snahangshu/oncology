import { Droplet, CheckCircle, Clock, AlertTriangle, PlayCircle, ShieldCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

import { useState } from 'react';

// State interface
interface Infusion {
  id: number;
  patient: string;
  regimen: string;
  chair: string;
  time: string;
  duration: string;
  status: string;
  progress: number;
  verification: string;
  alert?: string;
}

export default function InfusionCenter() {
  const [infusions, setInfusions] = useState<Infusion[]>([]);
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Infusion Center
          </h1>
          <p className="text-slate-400">Live monitoring of today's chemotherapy and immunotherapy sessions</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Droplet className="w-4 h-4" />
              </div>
              <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">Total Today</p>
            </div>
            <h2 className="text-3xl font-bold text-white">0</h2>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <PlayCircle className="w-4 h-4" />
              </div>
              <p className="text-sm text-emerald-400 uppercase tracking-wider font-bold">In Progress</p>
            </div>
            <h2 className="text-3xl font-bold text-white">0</h2>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">Completed</p>
            </div>
            <h2 className="text-3xl font-bold text-white">0</h2>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-sm text-rose-400 uppercase tracking-wider font-bold">Delayed</p>
            </div>
            <h2 className="text-3xl font-bold text-white">0</h2>
          </CardContent>
        </Card>
      </div>

      {/* Main Board */}
      <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Droplet className="w-5 h-5 text-cyan-400" />
            Active Infusion Board
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient & Regimen</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule & Chair</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Drug Verification</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status & Progress</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {infusions.length > 0 ? (
                  infusions.map((infusion, idx) => (
                    <tr 
                      key={infusion.id} 
                      className="hover:bg-slate-800/40 transition-colors group animate-in slide-in-from-left duration-500"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                             <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-white font-bold group-hover:text-cyan-400 transition-colors">{infusion.patient}</p>
                            <p className="text-sm text-cyan-400 font-medium">{infusion.regimen}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-white font-medium">{infusion.time}</span>
                          <span className="text-xs text-slate-500">({infusion.duration})</span>
                        </div>
                        <Badge variant="outline" className="border-slate-600 bg-slate-800 text-slate-300 text-xs">
                          {infusion.chair}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {infusion.verification === 'Verified' ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          ) : infusion.verification === 'Awaiting Pharmacy' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            infusion.verification === 'Verified' ? 'text-emerald-400' :
                            infusion.verification === 'Awaiting Pharmacy' ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {infusion.verification}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2 max-w-[200px]">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`
                              ${infusion.status === 'In Progress' ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' : ''}
                              ${infusion.status === 'Completed' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : ''}
                              ${infusion.status === 'Scheduled' ? 'border-slate-500/50 text-slate-400 bg-slate-500/10' : ''}
                              ${infusion.status === 'Delayed' ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse' : ''}
                            `}>
                              {infusion.status}
                            </Badge>
                            {infusion.status === 'In Progress' && (
                               <span className="text-xs font-bold text-cyan-400">{infusion.progress}%</span>
                            )}
                          </div>
                          {infusion.status === 'In Progress' && (
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-500 rounded-full relative" style={{ width: `${infusion.progress}%` }}>
                                 <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          )}
                          {infusion.alert && (
                            <p className="text-xs text-rose-400 mt-1">{infusion.alert}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-500">
                          View Chart
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                           <Droplet className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-medium text-slate-300">No active infusions</p>
                          <p className="text-sm text-slate-500 max-w-sm mx-auto">There are currently no patients checked into the infusion center.</p>
                        </div>
                      </div>
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
