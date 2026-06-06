import { Droplet, CheckCircle, Clock, AlertTriangle, PlayCircle, ShieldCheck, User, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useState } from 'react';

export default function InfusionCenter() {
  const queryClient = useQueryClient();

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['infusion_today'],
    queryFn: async () => {
      const res = await api.get('/infusion/today');
      return res.data;
    }
  });

  const { data: clearanceQueue, isLoading: queueLoading } = useQuery({
    queryKey: ['infusion_clearance_queue'],
    queryFn: async () => {
      const res = await api.get('/infusion/clearance-queue');
      return res.data;
    }
  });

  const { data: pharmacyQueue, isLoading: pharmacyLoading } = useQuery({
    queryKey: ['infusion_pharmacy_queue'],
    queryFn: async () => {
      const res = await api.get('/infusion/pharmacy-queue');
      return res.data;
    }
  });

  const [safetyResult, setSafetyResult] = useState<any>(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  const clearMutation = useMutation({
    mutationFn: async (cycleId: number) => {
      const res = await api.post(`/infusion/cycles/${cycleId}/clear-and-book`);
      return res.data;
    },
    onSuccess: (data) => {
      setSafetyResult(data);
      setIsSafetyModalOpen(true);
      if (data.status !== 'BLOCKED') {
        queryClient.invalidateQueries({ queryKey: ['infusion_clearance_queue'] });
        queryClient.invalidateQueries({ queryKey: ['infusion_today'] });
      }
    },
    onError: () => {
      toast.error("Failed to clear plan for scheduling.");
    }
  });

  const updateApptStatusMutation = useMutation({
    mutationFn: async ({ apptId, status }: { apptId: number, status: string }) => {
      return api.put(`/infusion/appointments/${apptId}/status`, { status });
    },
    onSuccess: () => {
      toast.success("Appointment status updated");
      queryClient.invalidateQueries({ queryKey: ['infusion_today'] });
    }
  });

  const chairs = todayData?.chairs || [];
  const activeAppointments = todayData?.appointments || [];
  const pendingPlans = clearanceQueue || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Infusion Center
          </h1>
          <p className="text-slate-400">Manage daily infusions and clinical clearance workflows</p>
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-700/50 mb-6 p-1">
          <TabsTrigger value="today" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400">
            Today's Infusions
          </TabsTrigger>
          <TabsTrigger value="pharmacy" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 text-slate-400 flex items-center gap-2">
            Pharmacy Vials Auth
            {pharmacyQueue?.length > 0 && (
              <span className="bg-rose-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">{pharmacyQueue.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="clearance" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-slate-400 flex items-center gap-2">
            Clearance Queue
            {pendingPlans.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">{pendingPlans.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6 outline-none">
          {/* Top Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">Total Scheduled</p>
                </div>
                <h2 className="text-3xl font-bold text-white">{activeAppointments.length}</h2>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <PlayCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-emerald-400 uppercase tracking-wider font-bold">Active Chairs</p>
                </div>
                <h2 className="text-3xl font-bold text-white">{chairs.filter((c: any) => c.status === 'In-Use').length} / {chairs.length}</h2>
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
                <h2 className="text-3xl font-bold text-white">{activeAppointments.filter((a: any) => a.status === 'Completed').length}</h2>
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
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient ID</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {todayLoading ? (
                      <tr><td colSpan={3} className="p-8 text-center text-slate-400">Loading...</td></tr>
                    ) : activeAppointments.length > 0 ? (
                      activeAppointments.map((appt: any, idx: number) => (
                        <tr 
                          key={appt.id} 
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                                 <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-white font-bold">Patient #{appt.patient_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-white font-medium">{new Date(appt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <select 
                              className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-cyan-500"
                              value={appt.status}
                              onChange={(e) => updateApptStatusMutation.mutate({ apptId: appt.id, status: e.target.value })}
                              disabled={updateApptStatusMutation.isPending}
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-12 text-center">
                          <p className="text-slate-500">No active infusions for today.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clearance" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Clinical Clearance Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {queueLoading ? (
                  <p className="text-slate-400 text-center py-8">Loading queue...</p>
                ) : pendingPlans.length > 0 ? (
                  pendingPlans.map((plan: any) => (
                    <div key={plan.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-amber-500/30 transition-colors gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-center">
                          <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg">Patient #{plan.patient_id} - {plan.regimen}</h4>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-300">
                              Cycle {plan.current_cycle} of {plan.total_cycles}
                            </Badge>
                            <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                              <CalendarCheck className="w-3 h-3 mr-1" /> {plan.scheduled_date}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-300">
                              <Clock className="w-3 h-3 mr-1" /> {plan.duration_minutes} mins
                            </Badge>
                            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 uppercase">
                              {plan.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-slate-600 bg-slate-800 text-slate-300 hover:text-white">
                          Review Labs
                        </Button>
                        <Button 
                          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                          onClick={() => clearMutation.mutate(plan.cycle_id)}
                          disabled={clearMutation.isPending}
                        >
                          <CalendarCheck className="w-4 h-4 mr-2" />
                          Clear & Schedule
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-bold text-lg">Queue is Empty</h3>
                    <p className="text-slate-500">All treatment plans have been cleared for scheduling.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacy" className="space-y-6 outline-none">
          <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-rose-400" />
                Pharmacy Vials Authorization Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {pharmacyLoading ? (
                  <p className="text-slate-400 text-center py-8">Loading queue...</p>
                ) : pharmacyQueue?.length > 0 ? (
                  pharmacyQueue.map((item: any) => (
                    <div key={item.cycle_id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-rose-500/30 transition-colors gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-center">
                          <CheckCircle className="w-6 h-6 text-rose-400 mx-auto mb-1" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg">{item.patient_name} - {item.regimen}</h4>
                          <div className="flex gap-4 mt-2">
                            <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-300">
                              Cycle {item.cycle_number}
                            </Badge>
                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 uppercase">
                              AI FIT-CHECK PASSED
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20"
                          onClick={async () => {
                            try {
                              await api.post(`/journey/cycle/${item.cycle_id}/pharmacy-auth`);
                              toast.success("Pharmacy authorized! Booking slot unlocked for patient.");
                              queryClient.invalidateQueries({ queryKey: ['infusion_pharmacy_queue'] });
                            } catch (e) {
                              toast.error("Failed to authorize vials");
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Vials (Unlock Booking)
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-bold text-lg">Queue is Empty</h3>
                    <p className="text-slate-500">All requested drugs have been authorized.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Safety Score Dialog */}
      <Dialog open={isSafetyModalOpen} onOpenChange={setIsSafetyModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className={`w-6 h-6 ${safetyResult?.status === 'BLOCKED' ? 'text-rose-500' : 'text-emerald-500'}`} />
              Safety Check Result
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Automated safety rules evaluation for treatment progression.
            </DialogDescription>
          </DialogHeader>
          
          {safetyResult && (
            <div className="py-4">
              <div className="flex justify-between items-center mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-medium">Safety Score</span>
                <span className={`text-2xl font-bold ${safetyResult.status === 'BLOCKED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {safetyResult.score}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className={`font-bold uppercase tracking-wider text-sm ${safetyResult.status === 'BLOCKED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {safetyResult.status === 'BLOCKED' ? 'BLOCKED' : 'SAFE TO PROCEED'}
                  </span>
                </div>
                {safetyResult.status === 'BLOCKED' && safetyResult.failed_rules?.map((rule: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-rose-300 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Failed: {rule}
                  </div>
                ))}
                {safetyResult.status !== 'BLOCKED' && (
                  <div className="text-sm text-slate-300">
                    <p className="mb-2">{safetyResult.message}</p>
                    <p className="text-emerald-400 font-medium">✓ Scheduled on {safetyResult.chair}</p>
                    <p className="text-slate-400 mt-1">
                      Time: {new Date(safetyResult.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSafetyModalOpen(false)}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
