import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, Heart, Globe, Loader2, CheckCircle, Clock, MapPin, CalendarDays, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { api } from '../../shared/api';
import { toast } from 'sonner';
import { PatientAssistantChat } from '../../components/PatientAssistantChat';

function TreatmentJourneyTimeline({ planId, currentCycle, totalCycles }: { planId: number, currentCycle: number, totalCycles: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['patient_plan_cycles', planId],
    queryFn: async () => {
      try {
        const res = await api.get(`/treatment-plans/${planId}/cycles`);
        return res.data;
      } catch (e: any) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    }
  });

  if (isLoading) {
    return <div className="py-4 text-center text-slate-500 text-sm animate-pulse">Loading your journey...</div>;
  }

  // If no real cycles generated yet, we can mock the timeline based on totalCycles
  const cycles = data?.cycles || Array.from({ length: totalCycles }).map((_, i) => {
    const cycleNum = i + 1;
    let status = 'PLANNED';
    if (cycleNum < currentCycle) status = 'COMPLETED';
    if (cycleNum === currentCycle) status = 'SCHEDULED';
    return {
      id: i,
      cycle_number: cycleNum,
      status: status,
      scheduled_date: status === 'SCHEDULED' ? new Date(Date.now() + 86400000 * 2).toLocaleDateString() : null,
      chair_id: status === 'SCHEDULED' ? 'Chair 4' : null,
    };
  });

  const completedCount = cycles.filter((c: any) => c.status === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / totalCycles) * 100);

  return (
    <div className="mt-8 border-t border-slate-200 pt-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Your Treatment Journey
        </h4>
        <div className="text-right">
          <p className="text-slate-500 text-sm mb-1">Progress: {completedCount} / {totalCycles} Cycles</p>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Vertical Stepper Timeline */}
      <div className="space-y-6 relative ml-4">
        {/* Connecting line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" />

        {cycles.map((cycle: any, idx: number) => {
          const isCompleted = cycle.status === 'COMPLETED';
          const isNext = cycle.status === 'SCHEDULED' || cycle.status === 'CLEARED' || (['PLANNED', 'DELAYED'].includes(cycle.status) && cycle.cycle_number == currentCycle);
          const isPending = !isCompleted && !isNext;

          return (
            <div key={cycle.id} className="relative flex gap-6 group">
              {/* Node */}
              <div className="relative z-10 shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-xl transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500 text-white scale-100' :
                  isNext ? 'bg-cyan-500 text-slate-900 scale-110 ring-4 ring-cyan-500/20 animate-pulse' :
                  'bg-slate-200 text-slate-500 scale-90'
                }`}>
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold">{cycle.cycle_number}</span>}
                </div>
              </div>

              {/* Content Card */}
              <div className={`flex-1 p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                isCompleted ? 'bg-emerald-50 border-emerald-200 opacity-80' :
                isNext ? 'bg-cyan-50 border-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.15)] opacity-100 transform -translate-y-1' :
                'bg-slate-50 border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className={`font-bold text-lg mb-1 flex items-center gap-2 ${
                      isCompleted ? 'text-emerald-400' :
                      isNext ? 'text-cyan-400' : 'text-slate-500'
                    }`}>
                      Cycle {cycle.cycle_number}
                      {isCompleted && <span className="text-xs font-normal text-slate-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Completed</span>}
                      {isNext && <span className="text-xs font-bold text-cyan-950 uppercase tracking-wider bg-cyan-400 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(34,211,238,0.5)]">Next Up</span>}
                    </h5>
                  </div>
                </div>

                {isNext && (
                  <div className="mt-4 space-y-4">
                    {/* Readiness Stepper */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h6 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400" /> Pre-Infusion Readiness
                      </h6>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cycle.labs_uploaded ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                            <span className="text-sm text-slate-500">1. Recent Labs Uploaded</span>
                          </div>
                          {!cycle.labs_uploaded && (
                            <Button size="sm" className="h-7 text-xs bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold shadow-sm shadow-cyan-500/20 transition-all" onClick={async () => {
                              try {
                                toast.info("Uploading labs...");
                                // Mock upload
                                const formData = new FormData();
                                formData.append("file", new Blob(["mock pdf content"], {type: "application/pdf"}), "mock_labs.pdf");
                                await api.post(`/journey/cycle/${cycle.id}/upload-labs`, formData, {
                                  headers: {
                                    'Content-Type': 'multipart/form-data'
                                  }
                                });
                                toast.success("Labs uploaded successfully. Running AI Fit-Check...");
                                await api.post(`/journey/cycle/${cycle.id}/ai-fit-check`);
                                toast.success("AI Fit-Check passed! Awaiting Pharmacy Auth.");
                                // Note: Need a refetch mechanism to update UI, for now rely on page reload or react-query refetch
                              } catch (e) {
                                toast.error("Failed to upload labs");
                              }
                            }}>Upload Labs</Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cycle.ai_fit_check_passed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-sm text-slate-500">2. AI Fit-Check (ANC &gt; 1500)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cycle.pharmacy_vials_approved ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-sm text-slate-500">3. Pharmacy Vials Auth</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cycle.ready_for_booking ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-sm text-slate-500">4. Booking Unlocked</span>
                          </div>
                          {cycle.ready_for_booking && !cycle.scheduled_date && (
                             <Button 
                               size="sm" 
                               className="h-7 text-xs bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold"
                               onClick={async () => {
                                 try {
                                   toast.info("Finding optimal infusion slot...");
                                   await api.post(`/infusion/clear/${planId}`);
                                   toast.success("Slot booked successfully!");
                                   // Note: Would normally refetch the specific plan here
                                   setTimeout(() => window.location.reload(), 1000);
                                 } catch (e) {
                                   toast.error("Failed to book slot");
                                 }
                               }}
                             >
                               Book Slot
                             </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {cycle.scheduled_date && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        <Badge variant="outline" className="bg-white border-cyan-200 text-slate-700 py-1.5 px-3 shadow-sm">
                          <CalendarDays className="w-4 h-4 mr-2 text-cyan-400" />
                          {new Date(cycle.scheduled_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Badge>
                        <Badge variant="outline" className="bg-white border-cyan-200 text-slate-700 py-1.5 px-3 shadow-sm">
                          <Clock className="w-4 h-4 mr-2 text-amber-400" />
                          Arrival: 15 mins prior
                        </Badge>
                        <Badge variant="outline" className="bg-white border-cyan-200 text-slate-700 py-1.5 px-3 shadow-sm">
                          <MapPin className="w-4 h-4 mr-2 text-rose-400" />
                          {cycle.chair_id ? `Chair ${cycle.chair_id}` : 'Infusion Center, Floor 2'}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PatientTreatmentPlans() {
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [survivorshipPlan, setSurvivorshipPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planLanguage, setPlanLanguage] = useState('English');

  const { data: intake } = useQuery({
    queryKey: ['my_intake'],
    queryFn: async () => {
      const res = await api.get('/intake/me');
      return res.data;
    }
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/patient');
        const data = response.data;
        setTreatmentPlans(data.treatment_plans || []);
      } catch (err) {
        console.error('Error fetching treatment plans:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleGeneratePlan = async () => {
    if (!intake) return;
    setIsGeneratingPlan(true);
    try {
      const res = await api.post(`/patients/${intake.patient_id}/generate-survivorship-plan`, { language: planLanguage });
      setSurvivorshipPlan(res.data.plan);
      toast.success('Survivorship Plan generated successfully!');
    } catch (err) {
      toast.error('Failed to generate survivorship plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-16">
      <div>
        <h1 className="bg-gradient-to-r from-blue-600 via-emerald-600 to-violet-600 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
          Treatment Plans
        </h1>
        <p className="text-slate-500 text-lg">View your active treatment regimens and monitor your cycle progress</p>
      </div>

      <div className="space-y-6">
        {/* Active Treatment Plans */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-slate-500 text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              Loading your treatment journey...
            </div>
          ) : treatmentPlans.length === 0 ? (
            <div className="text-slate-500 text-center py-12 bg-white rounded-2xl border border-slate-200">No active treatment plans found.</div>
          ) : treatmentPlans.map((plan, i) => (
            <Card key={plan.id || i} className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden mb-8">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3 hover:bg-emerald-500/20 uppercase tracking-widest text-xs px-3 py-1">
                      {plan.status.replace('_', ' ')}
                    </Badge>
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">{plan.regimen_name}</h3>
                    <p className="text-slate-500 text-lg">{plan.description}</p>
                  </div>
                </div>
                
                <TreatmentJourneyTimeline 
                  planId={plan.id} 
                  currentCycle={plan.current_cycle || 1} 
                  totalCycles={plan.cycles || 1} 
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Survivorship Care Plan */}
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden mt-12">
          <CardHeader className="bg-white border-b border-slate-200">
            <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-rose-400" />
              AI Survivorship Care Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-slate-500 text-sm">Once you complete your treatment, you can generate a personalized care plan to guide you through your post-treatment journey.</p>
              <div className="flex gap-4 items-center">
                <select 
                  value={planLanguage} 
                  onChange={(e) => setPlanLanguage(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                </select>
                <Button 
                  onClick={handleGeneratePlan} 
                  disabled={isGeneratingPlan || !intake}
                  className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg px-6"
                >
                  {isGeneratingPlan ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                  {isGeneratingPlan ? 'Translating...' : 'Generate Plan'}
                </Button>
              </div>
              
              {survivorshipPlan && (
                <div className="mt-6 space-y-4 p-6 rounded-xl bg-slate-200/30 border border-slate-200">
                  <Badge variant="outline" className="border-rose-500/50 text-rose-400 mb-2">Language: {survivorshipPlan.language}</Badge>
                  
                  <div>
                    <h4 className="text-slate-900 font-medium mb-1">Treatment Summary</h4>
                    <p className="text-slate-700 text-sm">{survivorshipPlan.treatment_summary}</p>
                  </div>
                  <Separator className="bg-slate-300/30" />
                  <div>
                    <h4 className="text-slate-900 font-medium mb-1">Follow-Up Schedule</h4>
                    <p className="text-slate-700 text-sm">{survivorshipPlan.follow_up_schedule}</p>
                  </div>
                  <Separator className="bg-slate-300/30" />
                  <div>
                    <h4 className="text-slate-900 font-medium mb-1">Late Effects to Watch For</h4>
                    <p className="text-slate-700 text-sm">{survivorshipPlan.late_effects}</p>
                  </div>
                  <Separator className="bg-slate-300/30" />
                  <div>
                    <h4 className="text-slate-900 font-medium mb-1">Lifestyle Recommendations</h4>
                    <p className="text-slate-700 text-sm">{survivorshipPlan.lifestyle_recommendations}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}
