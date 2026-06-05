import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Activity, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { api } from '../shared/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { PatientSchedulingModal } from '../components/PatientSchedulingModal';
import { PatientAssistantChat } from '../components/PatientAssistantChat';
import { Link } from 'react-router';

export default function PatientDashboard() {
  const queryClient = useQueryClient();
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clinicalForm, setClinicalForm] = useState({ primary_diagnosis: '', patient_comments: '' });

  const { data: intake } = useQuery({
    queryKey: ['my_intake'],
    queryFn: async () => {
      const res = await api.get('/intake/me');
      return res.data;
    }
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['patient_dashboard', intake?.patient_id],
    queryFn: async () => {
      const res = await api.get(`/patients/${intake.patient_id}/dashboard`);
      return res.data;
    },
    enabled: !!intake?.patient_id
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/patient');
        const data = response.data;
        
        if (data.upcoming_appointments && data.upcoming_appointments.length > 0) {
          const apt = data.upcoming_appointments[0];
          setNextAppointment({
            id: apt.appointment_id,
            date: new Date(apt.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
            time: new Date(apt.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            doctor: apt.doctor_name,
            type: `${apt.specialty || 'Oncology'} Consultation`,
            status: apt.status.charAt(0).toUpperCase() + apt.status.slice(1),
          });
        }
      } catch (err) {
        console.error('Error fetching patient dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (dashboardData?.patient) {
      setClinicalForm({
        primary_diagnosis: dashboardData.patient.primary_diagnosis || '',
        patient_comments: dashboardData.patient.patient_comments || ''
      });
    }
  }, [dashboardData]);

  const updateClinicalMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/patients/${intake.patient_id}/clinical`, data);
    },
    onSuccess: () => {
      toast.success("Clinical profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['patient_dashboard', intake?.patient_id] });
    },
    onError: () => toast.error("Failed to update clinical profile")
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-16">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2 text-3xl font-bold">
          Welcome Back!
        </h1>
        <p className="text-slate-400">Manage your health journey with ease</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            {isLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>
            ) : nextAppointment ? (
              <>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white">Next Appointment</h3>
                      <p className="text-slate-400 text-sm">{nextAppointment.date} at {nextAppointment.time}</p>
                    </div>
                  </div>
                  <Separator className="bg-slate-700/30 mb-4" />
                  <div className="space-y-2 mb-4">
                    <p className="text-slate-300">{nextAppointment.doctor}</p>
                    <p className="text-slate-400 text-sm">{nextAppointment.type}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700/30">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-cyan-400" />
                          Appointment Details
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label className="text-slate-400 text-sm">Doctor</Label>
                          <p className="text-white mt-1">{nextAppointment.doctor}</p>
                        </div>
                        <Separator className="bg-slate-700/30" />
                        <div>
                          <Label className="text-slate-400 text-sm">Date & Time</Label>
                          <p className="text-white mt-1">{nextAppointment.date} at {nextAppointment.time}</p>
                        </div>
                        <Separator className="bg-slate-700/30" />
                        <div>
                          <Label className="text-slate-400 text-sm">Type</Label>
                          <p className="text-white mt-1">{nextAppointment.type}</p>
                        </div>
                        <Separator className="bg-slate-700/30" />
                        <div>
                          <Label className="text-slate-400 text-sm">Status</Label>
                          <Badge variant="outline" className="mt-1 border-cyan-500/50 text-cyan-400 bg-cyan-500/10">
                            {nextAppointment.status}
                          </Badge>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800" asChild>
                    <Link to="/patient/appointments">View All</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 h-full space-y-4">
                <Calendar className="w-8 h-8 text-slate-600" />
                <p className="text-slate-400 text-sm text-center">No upcoming appointments scheduled.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white">Schedule Appointment</h3>
                  <p className="text-slate-400 text-sm">Book your next visit</p>
                </div>
              </div>
              <Separator className="bg-slate-700/30 mb-4" />
              <p className="text-slate-300 text-sm mb-6">
                Need to see a doctor? Schedule a new appointment with your preferred healthcare provider.
              </p>
            </div>
            {!intake || intake.intake_status !== 'COMPLETE' ? (
              <Button 
                onClick={() => {
                  if (!intake) {
                    toast.error('Intake information is currently unavailable.');
                  } else {
                    toast.error('Please upload all Required Intake Documents via the Documents page before scheduling an appointment.', { duration: 5000 });
                  }
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white mt-auto"
              >
                Schedule Now
              </Button>
            ) : (
              <div className="mt-auto">
                <PatientSchedulingModal patientId={intake.patient_id} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clinical Profile & Symptoms */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Clinical Profile & Symptoms
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your current diagnosis and symptoms. This helps our AI perfectly predict your scheduling and resource needs before you book.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
          ) : (
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <Label className="text-slate-300">Primary Diagnosis</Label>
                <Input 
                  value={clinicalForm.primary_diagnosis}
                  onChange={(e) => setClinicalForm(prev => ({ ...prev, primary_diagnosis: e.target.value }))}
                  placeholder="e.g. Stage IV Lung Cancer" 
                  className="bg-slate-800/50 border-slate-700/50 text-white focus:border-violet-500/50 focus:ring-violet-500/20" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Presenting Symptoms / Notes</Label>
                <textarea 
                  value={clinicalForm.patient_comments}
                  onChange={(e) => setClinicalForm(prev => ({ ...prev, patient_comments: e.target.value }))}
                  placeholder="Describe how you are feeling, e.g. severe pain, shortness of breath..." 
                  className="w-full min-h-[100px] rounded-md bg-slate-800/50 border border-slate-700/50 text-white p-3 text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 outline-none transition-all resize-y"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => updateClinicalMutation.mutate(clinicalForm)}
                  disabled={updateClinicalMutation.isPending}
                  className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all"
                >
                  {updateClinicalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Save Clinical Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Widget */}
      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}
