import { useState } from 'react';
import { Pill, Activity, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';

// State interface
interface Treatment {
  id: number;
  name: string;
  category: string;
  regimen: string;
  cycle: number;
  totalCycles: number;
  progress: number;
  nextDose: string;
  status: string;
}

export default function DoctorTreatmentPlans() {
  const [activeTab, setActiveTab] = useState('chemotherapy');
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const filteredTreatments = treatments.filter(t => {
    if (activeTab === 'chemotherapy') return t.category === 'Chemotherapy';
    if (activeTab === 'radiation') return t.category === 'Radiation';
    if (activeTab === 'followup') return t.category === 'Follow-Up';
    if (activeTab === 'remission') return t.category === 'Remission';
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Treatment Plans
          </h1>
          <p className="text-slate-400">Overview of patient regimens and cycle tracking</p>
        </div>
      </div>

      <Tabs defaultValue="chemotherapy" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-700/50 p-1 mb-6 flex flex-wrap h-auto w-full justify-start rounded-xl shadow-lg">
          <TabsTrigger value="chemotherapy" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <Pill className="w-4 h-4" /> Chemotherapy
          </TabsTrigger>
          <TabsTrigger value="radiation" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Radiation
          </TabsTrigger>
          <TabsTrigger value="followup" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Follow-Up
          </TabsTrigger>
          <TabsTrigger value="remission" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 rounded-lg px-6 py-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Remission
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTreatments.map((treatment, idx) => (
            <Card 
              key={treatment.id} 
              className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl hover:border-cyan-500/50 transition-colors group animate-in zoom-in-95 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{treatment.name}</h3>
                    <p className="text-sm text-cyan-400 font-medium">{treatment.regimen}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    {treatment.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>

                {treatment.totalCycles > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Cycle {treatment.cycle} of {treatment.totalCycles}</span>
                      <span className="text-white font-bold">{Math.round(treatment.progress)}%</span>
                    </div>
                    <Progress value={treatment.progress} className="h-2 bg-slate-800" indicatorClassName="bg-gradient-to-r from-cyan-500 to-violet-500" />
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/50">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                    <Badge variant="outline" className={`
                      ${treatment.status === 'On Track' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : ''}
                      ${treatment.status.includes('Delayed') ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse' : ''}
                      ${treatment.status === 'Stable' ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' : ''}
                      ${treatment.status.includes('Remission') ? 'border-violet-500/50 text-violet-400 bg-violet-500/10' : ''}
                    `}>
                      {treatment.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Next Dose</p>
                    <p className="text-sm font-medium text-white">{treatment.nextDose}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredTreatments.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
             <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
               <Pill className="w-8 h-8" />
             </div>
             <p className="text-lg font-medium text-slate-300">No active treatment plans</p>
             <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">There are no patients currently undergoing {activeTab}.</p>
           </div>
        )}
      </Tabs>
    </div>
  );
}
