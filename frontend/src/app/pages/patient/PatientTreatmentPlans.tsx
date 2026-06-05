import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, Heart, Globe, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { api } from '../../shared/api';
import { toast } from 'sonner';
import { PatientAssistantChat } from '../../components/PatientAssistantChat';

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
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2 text-2xl font-bold">
          Treatment Plans
        </h1>
        <p className="text-slate-400">View your active treatment regimens and generate a Survivorship Care Plan</p>
      </div>

      <div className="space-y-6">
        {/* Survivorship Care Plan */}
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              AI Survivorship Care Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Generate a personalized care plan to guide you through your post-treatment journey in your preferred language.</p>
              <div className="flex gap-4 items-center">
                <select 
                  value={planLanguage} 
                  onChange={(e) => setPlanLanguage(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
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
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                >
                  {isGeneratingPlan ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                  {isGeneratingPlan ? 'Translating...' : 'Generate Plan'}
                </Button>
              </div>
              
              {survivorshipPlan && (
                <div className="mt-6 space-y-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <Badge variant="outline" className="border-rose-500/50 text-rose-400 mb-2">Language: {survivorshipPlan.language}</Badge>
                  
                  <div>
                    <h4 className="text-white font-medium mb-1">Treatment Summary</h4>
                    <p className="text-slate-300 text-sm">{survivorshipPlan.treatment_summary}</p>
                  </div>
                  <Separator className="bg-slate-700/30" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Follow-Up Schedule</h4>
                    <p className="text-slate-300 text-sm">{survivorshipPlan.follow_up_schedule}</p>
                  </div>
                  <Separator className="bg-slate-700/30" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Late Effects to Watch For</h4>
                    <p className="text-slate-300 text-sm">{survivorshipPlan.late_effects}</p>
                  </div>
                  <Separator className="bg-slate-700/30" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Lifestyle Recommendations</h4>
                    <p className="text-slate-300 text-sm">{survivorshipPlan.lifestyle_recommendations}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Treatment Plans */}
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Active Treatment Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-slate-400 text-center py-8">
                <Loader2 className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                Loading treatment plans...
              </div>
            ) : treatmentPlans.length === 0 ? (
              <div className="text-slate-400 text-center py-8">No active treatment plans found.</div>
            ) : treatmentPlans.map((plan, i) => (
              <div key={plan.id || i} className="p-6 rounded-xl bg-slate-800/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.regimen_name}</h3>
                    <p className="text-slate-300">{plan.description}</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{plan.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Start Date</p>
                    <p className="text-white font-medium">{plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">End Date</p>
                    <p className="text-white font-medium">{plan.end_date ? new Date(plan.end_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Cycles</p>
                    <p className="text-white font-medium">{plan.cycles || 'N/A'}</p>
                  </div>
                  <div className="bg-emerald-950/30 p-4 rounded-lg border border-emerald-500/30">
                    <p className="text-emerald-400/80 text-xs uppercase tracking-wider mb-1">Current Cycle</p>
                    <p className="text-emerald-400 font-bold">{plan.current_cycle || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}
