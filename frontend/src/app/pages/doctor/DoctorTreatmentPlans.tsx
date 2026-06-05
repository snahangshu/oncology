import { useState, useEffect } from 'react';
import { Pill, Activity, ArrowRight, ShieldCheck, Zap, User, Clock, CheckCircle, AlertTriangle, CalendarDays, FlaskConical, Beaker } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { api } from '../../shared/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function DoctorTreatmentPlans() {
  const [activeTab, setActiveTab] = useState('chemotherapy');
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['doctor_dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboards/doctor');
      return res.data;
    }
  });

  const plansList = dashboardData?.treatment_plans || [];

  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['plan_cycles', expandedPlanId],
    queryFn: async () => {
      if (!expandedPlanId) return null;
      try {
        const res = await api.get(`/treatment-plans/${expandedPlanId}/cycles`);
        return res.data;
      } catch (e: any) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!expandedPlanId
  });

  const generateCyclesMutation = useMutation({
    mutationFn: async (planId: number) => {
      // If plan doesn't exist in DB, we'd normally create it first. 
      // For MVP demo, we assume the plan exists (or we use a hardcoded plan ID that exists).
      // Let's create the plan on the fly if it fails, or just assume the backend has it.
      return api.post(`/treatment-plans/${planId}/generate-cycles`);
    },
    onSuccess: () => {
      toast.success("Cycles generated successfully!");
      queryClient.invalidateQueries({ queryKey: ['plan_cycles', expandedPlanId] });
    },
    onError: () => toast.error("Failed to generate cycles. Plan may not exist in DB yet.")
  });

  const updateCycleMutation = useMutation({
    mutationFn: async ({ cycleId, status }: { cycleId: number, status: string }) => {
      return api.put(`/treatment-plans/cycles/${cycleId}`, { status });
    },
    onSuccess: () => {
      toast.success("Cycle updated!");
      queryClient.invalidateQueries({ queryKey: ['plan_cycles', expandedPlanId] });
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Treatment Journey Manager
          </h1>
          <p className="text-slate-400">Master orchestration of patient regimens and cycle tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {dashboardLoading && <p className="text-slate-400">Loading plans...</p>}
        {plansList.length === 0 && !dashboardLoading && (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <p className="text-slate-400">No active treatment plans found for your patients.</p>
          </div>
        )}
        {plansList.map((plan: any) => (
          <Card 
            key={plan.id} 
            className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            <div 
              className="p-6 cursor-pointer hover:bg-slate-800/30 transition-colors"
              onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{plan.patient}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{plan.regimen}</span>
                      <span className="text-slate-400 text-sm">Total Cycles: {plan.totalCycles}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-sm py-1 px-3">
                    {plan.status}
                  </Badge>
                  <p className="text-slate-500 text-sm mt-2">Started: {plan.start}</p>
                </div>
              </div>
            </div>

            {/* EXPANDED JOURNEY VIEW */}
            {expandedPlanId === plan.id && (
              <div className="border-t border-slate-800 bg-slate-950/50 p-6 animate-in slide-in-from-top-4 duration-300">
                <div className="mb-8 flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-200">Treatment Journey Map</h4>
                  {!cyclesData && !cyclesLoading && (
                    <Button 
                      onClick={() => generateCyclesMutation.mutate(plan.id)}
                      disabled={generateCyclesMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                      Initialize {plan.totalCycles} Cycles
                    </Button>
                  )}
                </div>

                {cyclesLoading ? (
                  <p className="text-slate-400 text-center py-8">Loading cycle data...</p>
                ) : cyclesData && cyclesData.cycles ? (
                  <div className="space-y-6">
                    {/* Summary Bar */}
                    <div className="flex gap-6 mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex-1 text-center border-r border-slate-800">
                        <p className="text-slate-500 text-xs uppercase mb-1">Completed</p>
                        <p className="text-2xl font-bold text-emerald-400">{cyclesData.plan.completed_cycles}</p>
                      </div>
                      <div className="flex-1 text-center border-r border-slate-800">
                        <p className="text-slate-500 text-xs uppercase mb-1">Upcoming</p>
                        <p className="text-2xl font-bold text-cyan-400">{cyclesData.plan.upcoming_cycles}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-slate-500 text-xs uppercase mb-1">Delayed</p>
                        <p className="text-2xl font-bold text-rose-400">{cyclesData.plan.delayed_cycles}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      {cyclesData.cycles.map((cycle: any, idx: number) => {
                        const isCompleted = cycle.status === 'COMPLETED';
                        const isNext = cycle.status === 'SCHEDULED' || cycle.status === 'PLANNED';
                        const isDelayed = cycle.status === 'DELAYED';

                        return (
                          <div key={cycle.id} className="relative flex gap-6">
                            {/* Line connecting nodes */}
                            {idx !== cyclesData.cycles.length - 1 && (
                              <div className={`absolute left-[19px] top-[38px] bottom-[-20px] w-0.5 ${isCompleted ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                            )}
                            
                            {/* Node */}
                            <div className="relative z-10 shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                                isNext ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.5)]' :
                                isDelayed ? 'bg-rose-500/20 border-rose-500 text-rose-400' :
                                'bg-slate-800 border-slate-700 text-slate-500'
                              }`}>
                                {isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                                 isDelayed ? <AlertTriangle className="w-5 h-5" /> :
                                 <span className="font-bold">{cycle.cycle_number}</span>}
                              </div>
                            </div>

                            {/* Content */}
                            <div className={`flex-1 p-5 rounded-xl border ${
                              isCompleted ? 'bg-slate-800/20 border-emerald-500/20' :
                              isNext ? 'bg-slate-800/50 border-cyan-500/30' :
                              'bg-slate-900/30 border-slate-800/50'
                            }`}>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className={`font-bold text-lg ${isCompleted ? 'text-emerald-400' : isNext ? 'text-cyan-400' : 'text-slate-300'}`}>
                                      Cycle {cycle.cycle_number}
                                    </h5>
                                    <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-950">
                                      {cycle.scheduled_date}
                                    </Badge>
                                  </div>
                                  
                                  {/* Cycle Event Timeline (Sub-events) */}
                                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <Beaker className="w-4 h-4 text-violet-400" />
                                      Labs: {isCompleted ? '✓ Cleared' : 'Pending'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                      Clearance: {cycle.doctor_clearance ? '✓ Approved' : 'Pending'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <FlaskConical className="w-4 h-4 text-amber-400" />
                                      Dose: {cycle.dose_status.replace('_', ' ')}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                {isNext && (
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                      onClick={() => updateCycleMutation.mutate({ cycleId: cycle.id, status: "COMPLETED" })}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                    >
                                      Delay
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No cycles initialized for this plan yet.</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
