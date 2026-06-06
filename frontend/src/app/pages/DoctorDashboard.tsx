import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Clock, AlertCircle, FileText, Pill, CheckCircle, Sparkles, FlaskConical, Timer, CalendarDays, FilePlus, Activity, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../shared/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import ReactMarkdown from 'react-markdown';

interface Appointment {
  id: number | string;
  patientId?: number | string;
  patientName: string;
  time: string;
  urgency: string;
  chiefComplaint: string;
  predictedDuration: string;
  aiSummary: string;
  vitals: { bp: string; hr: string; temp: string; weight: string };
  history: string;
  patient_comments?: string;
  intake_summary?: any;
}

interface ChemoSession {
  patient: string;
  time: string;
  regimen: string;
  status: string;
}

interface LabAlert {
  patient: string;
  alert: string;
  severity: string;
  time: string;
}

import { useAppSelector } from '../store';

export default function DoctorDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [upcomingAppointmentsList, setUpcomingAppointmentsList] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [chemoScheduleList, setChemoScheduleList] = useState<ChemoSession[]>([]);
  const [labAlertsList, setLabAlertsList] = useState<LabAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{name: string, url: string} | null>(null);
  const [codingResult, setCodingResult] = useState<any>(null);
  const [editablePlan, setEditablePlan] = useState<{ regimen_name: string, description: string, cycles: number } | null>(null);
  const [showCodingModal, setShowCodingModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/doctor');
        const backendAppointments = response.data.today_appointments || [];
        const upcoming = response.data.upcoming_appointments || [];
        
        const mapApt = (apt: any) => ({
          id: apt.appointment_id,
          patientId: apt.patient_id,
          patientName: apt.patient_name,
          time: apt.time,
          date: apt.date,
          urgency: apt.urgency_level || 'Routine',
          chiefComplaint: apt.primary_diagnosis || 'Unknown',
          predictedDuration: 'Routine (15m)',
          aiSummary: apt.ai_summary || `AI Summary based on Intake: Patient presents with ${apt.primary_diagnosis || 'Unknown'}. Intake documents include: ${Object.keys(apt.intake_summary || {}).join(', ') || 'None'}.`,
          vitals: apt.vitals || { bp: '--/--', hr: '--', temp: '--', weight: '--' },
          history: apt.primary_diagnosis || 'Unknown',
          patient_comments: apt.patient_comments,
          intake_summary: apt.intake_summary,
        });

        if (backendAppointments.length > 0) {
          const mapped = backendAppointments.map(mapApt);
          setAppointmentsList(mapped);
          setSelectedPatient(mapped[0]);
        }
        if (upcoming.length > 0) {
          setUpcomingAppointmentsList(upcoming.map(mapApt));
        }

        const backendAlerts = response.data.clinical_alerts || [];
        setLabAlertsList(backendAlerts.map((a: any) => ({
          patient: a.patient_name,
          alert: a.message,
          severity: a.severity,
          time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'
        })));
      } catch (err) {
        console.error('Error fetching doctor dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isStructuringPlan, setIsStructuringPlan] = useState(false);

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    toast.info('AI is generating pre-consultation brief...', { id: 'brief-toast' });
    try {
      const response = await api.post(`/doctors/${selectedPatient?.patientId}/generate-brief`, {
        patient_name: selectedPatient?.patientName,
        diagnosis: selectedPatient?.chiefComplaint || "Oncology Diagnosis",
        clinical_history: selectedPatient?.history || "No history provided",
        recent_labs: "Standard CBC & CMP",
        imaging_reports: "Standard Imaging"
      });
      
      if (response.data.summary) {
         setSelectedPatient(prev => prev ? { ...prev, aiSummary: response.data.summary } : null);
         setAppointmentsList(prev => prev.map(a => a.id === selectedPatient?.id ? { ...a, aiSummary: response.data.summary } : a));
         setUpcomingAppointmentsList(prev => prev.map(a => a.id === selectedPatient?.id ? { ...a, aiSummary: response.data.summary } : a));
      }
      
      toast.success('AI Pre-Consult Brief generated successfully!', { id: 'brief-toast' });
      setIsGeneratingBrief(false);
    } catch (err) {
      toast.error('Failed to generate brief', { id: 'brief-toast' });
      setIsGeneratingBrief(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedPatient || !selectedPatient.patientId) {
      toast.error('Please select a valid patient appointment first.');
      return;
    }

    setIsStructuringPlan(true);
    toast.info('AI is structuring your treatment plan...', { id: 'plan-toast' });
    try {
      const res = await api.post(`/doctors/${selectedPatient.patientId}/structure-plan`, {
        clinical_note: `Diagnosis: ${diagnosis}. Prescription: ${prescription}. Notes: ${notes}`,
        appointment_id: selectedPatient.id
      });
      
      if (res.data.coding_analysis) {
        setCodingResult(res.data.coding_analysis);
      }
      
      if (res.data.treatment_plan) {
        const meds = res.data.treatment_plan.medications || [];
        const med_str = meds.map((m: any) => `${m.drug_name || ''} ${m.dose_amount || ''}${m.dose_unit || ''}`).join(', ');
        
        setEditablePlan({
          regimen_name: res.data.treatment_plan.regimen_name || "AI Suggested Regimen",
          description: `Intent: ${res.data.treatment_plan.intent || 'unknown'}. Medications: ${med_str}`,
          cycles: res.data.treatment_plan.number_of_cycles || 6
        });
      }
      
      setShowCodingModal(true);
      toast.success('Consultation complete! AI structured the treatment plan.', { id: 'plan-toast' });
      setIsStructuringPlan(false);
    } catch (err) {
      toast.error('Failed to structure treatment plan', { id: 'plan-toast' });
      setIsStructuringPlan(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {user?.verificationStatus && user.verificationStatus !== 'APPROVED' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-amber-400 font-medium text-sm">Profile Status: {user.verificationStatus.replace('_', ' ')}</p>
              <p className="text-amber-300/80 text-sm">Your credentials are currently under review. Some features may be restricted until approval.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/doctor/profile-setup')} size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20">
            View Setup
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Doctor Portal
          </h1>
          <p className="text-slate-500">Today's consultation queue and AI-driven clinical insights</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/doctor/profile-setup')} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900">
            <Activity className="w-4 h-4 mr-2" /> Profile Setup
          </Button>
        </div>
      </div>

      {/* Top Row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CalendarDays className="w-16 h-16 text-indigo-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm text-indigo-300 font-medium mb-1">Today's Appointments</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-slate-900">{appointmentsList.length}</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">All listed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/20 backdrop-blur-xl relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity animate-pulse">
            <Activity className="w-16 h-16 text-rose-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm text-rose-300 font-medium mb-1">Critical Alerts</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-slate-900">{labAlertsList.length}</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Requires review</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FilePlus className="w-16 h-16 text-emerald-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm text-emerald-300 font-medium mb-1">New Reports Uploaded</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-slate-900">0</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">No new reports</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Consultation Queue (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-slate-200 bg-slate-50/80">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                Patient Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-slate-500 text-center py-12">
                    <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                    Loading patient queue and predicting durations...
                  </div>
                ) : appointmentsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="mb-2">No appointments scheduled for today.</p>
                  </div>
                ) : appointmentsList.map((appointment, index) => (
                  <Dialog key={appointment.id}>
                    <DialogTrigger asChild>
                      <div
                        onClick={() => setSelectedPatient(appointment)}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-violet-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-violet-500/10 group animate-in slide-in-from-left duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                              <span className="text-slate-900 font-medium">
                                {appointment.patientName && typeof appointment.patientName === 'string' ? appointment.patientName.split(' ').filter(Boolean).map(n => n[0]).join('') : 'P'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-slate-900 font-medium">{appointment.patientName}</h4>
                                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 text-[10px]">
                                  <Timer className="w-3 h-3 mr-1 inline" />
                                  {appointment.predictedDuration}
                                </Badge>
                              </div>
                              <p className="text-slate-500 text-sm line-clamp-1">{appointment.chiefComplaint}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <Badge
                              variant="outline"
                              className={
                                appointment.urgency === 'Urgent'
                                  ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse'
                                  : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              }
                            >
                              {appointment.urgency}
                            </Badge>
                            <p className="text-cyan-400 text-sm font-medium">{appointment.time}</p>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-slate-200 max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader className="flex flex-row items-center justify-between mt-2">
                        <DialogTitle className="text-slate-900 flex items-center gap-2 text-xl">
                          <FileText className="w-6 h-6 text-violet-400" />
                          Patient Clinical Profile - {selectedPatient?.patientName}
                        </DialogTitle>
                        {selectedPatient?.patientId && (
                          <Button 
                            onClick={() => navigate(`/patients/${selectedPatient.patientId}`)}
                            className="bg-slate-100 hover:bg-slate-700 text-cyan-400 border border-slate-200 transition-colors"
                          >
                            View Clinical Workspace <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </DialogHeader>

                      {selectedPatient && (
                      <div className="space-y-6 mt-4">
                        {/* AI Summary Highlight Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/30 shadow-lg shadow-indigo-500/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-indigo-300 font-semibold flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              AI Patient Summary
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-7 text-xs"
                              onClick={handleGenerateBrief}
                              disabled={isGeneratingBrief}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                              Regenerate Brief
                            </Button>
                          </div>
                          {isGeneratingBrief ? (
                            <div className="space-y-3 animate-pulse py-2">
                              <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                              <div className="h-4 bg-indigo-500/20 rounded w-full"></div>
                              <div className="h-4 bg-indigo-500/20 rounded w-5/6"></div>
                              <div className="h-4 bg-indigo-500/20 rounded w-2/3"></div>
                            </div>
                          ) : (
                            <div className="text-slate-200 leading-relaxed text-sm transition-all duration-300">
                              <ReactMarkdown
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-600 marker:text-indigo-400" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-600 marker:text-indigo-400" {...props} />,
                                  li: ({node, ...props}) => <li {...props} />,
                                  h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-slate-900 mt-4 mb-2" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-base font-semibold text-indigo-300 mt-4 mb-2" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-indigo-400 mt-3 mb-1" {...props} />,
                                  a: ({node, ...props}) => <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" {...props} />
                                }}
                              >
                                {selectedPatient.aiSummary}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {/* Patient Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Chief Complaint / Notes</p>
                            <p className="text-slate-900 text-sm">{selectedPatient.chiefComplaint}</p>
                            {selectedPatient.patient_comments && selectedPatient.patient_comments !== 'No additional comments provided.' && (
                              <p className="text-slate-500 text-xs mt-1 italic">"{selectedPatient.patient_comments}"</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Predicted Duration</p>
                            <p className="text-indigo-300 text-sm font-medium flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {selectedPatient.predictedDuration}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Appointment Time</p>
                            <p className="text-cyan-400 text-sm font-medium">{selectedPatient.time}</p>
                          </div>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Vitals */}
                        <div>
                          <h4 className="text-slate-900 mb-3 flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 text-emerald-400" />
                            Current Vitals
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Blood Pressure</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.bp}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Heart Rate</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.hr} <span className="text-slate-500 text-sm">bpm</span></p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Temperature</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.temp}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Weight</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.weight}</p>
                            </div>
                          </div>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Medical History & Intake Documents */}
                        <div>
                          <h4 className="text-slate-900 mb-2 font-medium">Medical History & Intake Summary</h4>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-3">
                            <p className="text-slate-600">
                              <strong className="text-slate-900">Primary Diagnosis: </strong> {selectedPatient.history}
                            </p>
                            {selectedPatient.intake_summary && Object.keys(selectedPatient.intake_summary).length > 0 ? (
                              <div className="space-y-2 mt-2">
                                <p className="text-slate-500 font-medium">Uploaded Documents:</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(selectedPatient.intake_summary).map(([key, val]: any) => (
                                    <button 
                                      key={key} 
                                      onClick={() => setPreviewDoc({ name: key.replace('_', ' '), url: val.fileUrl })}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span className="capitalize">{key.replace('_', ' ')}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-500 italic mt-2">No intake documents uploaded yet.</p>
                            )}
                          </div>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Clinical Action Form */}
                        <div className="space-y-5">
                          <h4 className="text-slate-900 flex items-center gap-2 font-medium">
                            <Pill className="w-4 h-4 text-cyan-400" />
                            Clinical Action
                          </h4>

                          <div className="space-y-2">
                            <Label htmlFor="diagnosis" className="text-slate-600">Diagnosis</Label>
                            <Input
                              id="diagnosis"
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              placeholder="Enter diagnosis..."
                              className="bg-slate-100 border-slate-200 text-slate-900 focus-visible:ring-violet-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="prescription" className="text-slate-600">Prescription</Label>
                            <Textarea
                              id="prescription"
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              placeholder="Enter medications and dosages..."
                              className="bg-slate-100 border-slate-200 text-slate-900 min-h-[100px] focus-visible:ring-violet-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="notes" className="text-slate-600">Treatment Notes</Label>
                            <Textarea
                              id="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Enter treatment plan and follow-up instructions..."
                              className="bg-slate-100 border-slate-200 text-slate-900 min-h-[120px] focus-visible:ring-violet-500/50"
                            />
                          </div>

                          <Button
                            onClick={handleCompleteConsultation}
                            disabled={isStructuringPlan || (!diagnosis && !prescription && !notes)}
                            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-900 shadow-lg shadow-emerald-500/20"
                          >
                            {isStructuringPlan ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            {isStructuringPlan ? 'AI Structuring Plan...' : 'Complete Consultation'}
                          </Button>
                        </div>
                      </div>
                      )}
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="bg-white backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-slate-200 bg-slate-50/80">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-cyan-400" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-slate-500 text-center py-12">
                    Loading upcoming queue...
                  </div>
                ) : upcomingAppointmentsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="mb-2">No upcoming appointments scheduled.</p>
                  </div>
                ) : upcomingAppointmentsList.map((appointment: any, index) => (
                  <Dialog key={appointment.id}>
                    <DialogTrigger asChild>
                      <div
                        onClick={() => setSelectedPatient(appointment)}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10 group animate-in slide-in-from-left duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                              <span className="text-slate-900 font-medium">
                                {appointment.patientName && typeof appointment.patientName === 'string' ? appointment.patientName.split(' ').filter(Boolean).map((n: string) => n[0]).join('') : 'P'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-slate-900 font-medium">{appointment.patientName}</h4>
                                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 text-[10px]">
                                  {appointment.date}
                                </Badge>
                              </div>
                              <p className="text-slate-500 text-sm line-clamp-1">{appointment.chiefComplaint}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <Badge
                              variant="outline"
                              className={
                                appointment.urgency === 'Urgent'
                                  ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse'
                                  : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              }
                            >
                              {appointment.urgency}
                            </Badge>
                            <p className="text-cyan-400 text-sm font-medium">{appointment.time}</p>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    {/* Reuse the same DialogContent for the clinical profile */}
                    <DialogContent className="bg-white border-slate-200 max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader className="flex flex-row items-center justify-between mt-2">
                        <DialogTitle className="text-slate-900 flex items-center gap-2 text-xl">
                          <FileText className="w-6 h-6 text-violet-400" />
                          Patient Clinical Profile - {selectedPatient?.patientName}
                        </DialogTitle>
                        {selectedPatient?.patientId && (
                          <Button 
                            onClick={() => navigate(`/patients/${selectedPatient.patientId}`)}
                            className="bg-slate-100 hover:bg-slate-700 text-cyan-400 border border-slate-200 transition-colors"
                          >
                            View Clinical Workspace <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </DialogHeader>

                      {selectedPatient && (
                      <div className="space-y-6 mt-4">
                        {/* AI Summary Highlight Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/30 shadow-lg shadow-indigo-500/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-indigo-300 font-semibold flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              AI Patient Summary
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-7 text-xs"
                              onClick={handleGenerateBrief}
                              disabled={isGeneratingBrief}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                              Regenerate Brief
                            </Button>
                          </div>
                          {isGeneratingBrief ? (
                            <div className="space-y-3 animate-pulse py-2">
                              <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                              <div className="h-4 bg-indigo-500/20 rounded w-full"></div>
                              <div className="h-4 bg-indigo-500/20 rounded w-5/6"></div>
                              <div className="h-4 bg-indigo-500/20 rounded w-2/3"></div>
                            </div>
                          ) : (
                            <div className="text-slate-200 leading-relaxed text-sm transition-all duration-300">
                              <ReactMarkdown
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-600 marker:text-indigo-400" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-600 marker:text-indigo-400" {...props} />,
                                  li: ({node, ...props}) => <li {...props} />,
                                  h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-slate-900 mt-4 mb-2" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-base font-semibold text-indigo-300 mt-4 mb-2" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-indigo-400 mt-3 mb-1" {...props} />,
                                  a: ({node, ...props}) => <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" {...props} />
                                }}
                              >
                                {selectedPatient.aiSummary}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {/* Patient Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Chief Complaint / Notes</p>
                            <p className="text-slate-900 text-sm">{selectedPatient.chiefComplaint}</p>
                            {selectedPatient.patient_comments && selectedPatient.patient_comments !== 'No additional comments provided.' && (
                              <p className="text-slate-500 text-xs mt-1 italic">"{selectedPatient.patient_comments}"</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Predicted Duration</p>
                            <p className="text-indigo-300 text-sm font-medium flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {selectedPatient.predictedDuration}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Appointment Time</p>
                            <p className="text-cyan-400 text-sm font-medium">{selectedPatient.date} {selectedPatient.time}</p>
                          </div>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Vitals */}
                        <div>
                          <h4 className="text-slate-900 mb-3 flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 text-emerald-400" />
                            Current Vitals
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Blood Pressure</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.bp}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Heart Rate</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.hr} <span className="text-slate-500 text-sm">bpm</span></p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Temperature</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.temp}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-600 transition-colors">
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Weight</p>
                              <p className="text-slate-900 font-medium">{selectedPatient.vitals.weight}</p>
                            </div>
                          </div>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Medical History & Intake Documents */}
                        <div>
                          <h4 className="text-slate-900 mb-2 font-medium">Medical History & Intake Summary</h4>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-3">
                            <p className="text-slate-600">
                              <strong className="text-slate-900">Primary Diagnosis: </strong> {selectedPatient.history}
                            </p>
                            {selectedPatient.intake_summary && Object.keys(selectedPatient.intake_summary).length > 0 ? (
                              <div className="space-y-2 mt-2">
                                <p className="text-slate-500 font-medium">Uploaded Documents:</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(selectedPatient.intake_summary).map(([key, val]: any) => (
                                    <button 
                                      key={key} 
                                      onClick={() => setPreviewDoc({ name: key.replace('_', ' '), url: val.fileUrl })}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span className="capitalize">{key.replace('_', ' ')}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-500 italic mt-2">No intake documents uploaded yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      )}
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Alerts and Schedules (1/3 width) */}
        <div className="space-y-6">
          
          {/* Critical Alerts */}
          <Card className="bg-white backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-rose-500/20 bg-rose-500/5">
              <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                <FlaskConical className="w-4 h-4 text-rose-400" />
                Critical Alerts & Escalations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {labAlertsList.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No critical alerts.
                  </div>
                ) : labAlertsList.map((alert, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-100 border border-rose-500/20 flex flex-col gap-1 hover:border-rose-500/40 transition-colors cursor-default">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-slate-900">{alert.patient}</h5>
                      <span className="text-[10px] text-slate-500">{alert.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-rose-300 font-medium">{alert.alert}</p>
                      <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10 text-[10px] py-0 px-1.5 h-4">
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chemotherapy Schedule */}
          <Card className="bg-white backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-slate-200 bg-slate-50/80">
              <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
                <CalendarDays className="w-4 h-4 text-cyan-400" />
                Chemotherapy Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {chemoScheduleList.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No chemotherapy sessions scheduled.
                  </div>
                ) : chemoScheduleList.map((session, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {/* Timeline line */}
                    {idx !== chemoScheduleList.length - 1 && (
                      <div className="absolute left-[5px] top-6 bottom-[-16px] w-[2px] bg-slate-700/50" />
                    )}
                    {/* Timeline dot */}
                    <div className="mt-1.5">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <p className="text-xs text-cyan-400 font-medium mb-0.5">{session.time}</p>
                      <p className="text-sm text-slate-900 font-medium">{session.patient}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-500">{session.regimen}</p>
                        <Badge variant="outline" className="border-slate-600 text-slate-600 text-[10px] py-0 px-1.5 h-4">
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-6xl w-[90vw] h-[90vh] bg-white border-slate-200 p-0 flex flex-col z-[100]">
          <DialogHeader className="p-4 border-b border-slate-200 bg-white shrink-0">
            <DialogTitle className="text-slate-900 capitalize flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full bg-slate-950">
            {previewDoc && (
              <iframe 
                src={previewDoc.url} 
                className="w-full h-full border-0 rounded-b-lg" 
                title={previewDoc.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Medical Coding Modal */}
      <Dialog open={showCodingModal} onOpenChange={setShowCodingModal}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              AI Medical Coding & Compliance Check
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div>
              <h4 className="text-slate-600 font-medium mb-2 border-b border-slate-200 pb-1">Suggested ICD-10 Codes</h4>
              <div className="space-y-2">
                {codingResult?.icd10_codes?.map((c: any, i: number) => (
                  <div key={i} className="flex gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <span className="text-emerald-400 font-mono font-bold">{c.code}</span>
                    <span className="text-slate-600 text-sm">{c.description}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-slate-600 font-medium mb-2 border-b border-slate-200 pb-1">Suggested CPT Codes</h4>
              <div className="space-y-2">
                {codingResult?.cpt_codes?.map((c: any, i: number) => (
                  <div key={i} className="flex gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <span className="text-cyan-400 font-mono font-bold">{c.code}</span>
                    <span className="text-slate-600 text-sm">{c.description}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {codingResult?.denial_risks?.length > 0 && (
              <div>
                <h4 className="text-rose-400 font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Potential Claim Denial Risks
                </h4>
                <div className="space-y-2">
                  {codingResult.denial_risks.map((risk: string, i: number) => (
                    <div key={i} className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-sm">
                      {risk}
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 mt-2 italic">Please update the clinical note to address these risks before final sign-off.</p>
                </div>
              </div>
            )}
            
            {editablePlan && (
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-4 space-y-4">
                <h4 className="text-slate-900 font-medium flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-violet-400" />
                  Proposed Treatment Plan
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Regimen Name</Label>
                    <Input 
                      className="bg-white border-slate-200 text-slate-200" 
                      value={editablePlan.regimen_name}
                      onChange={(e) => setEditablePlan({ ...editablePlan, regimen_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Total Cycles</Label>
                    <Input 
                      type="number"
                      className="bg-white border-slate-200 text-slate-200" 
                      value={editablePlan.cycles}
                      onChange={(e) => setEditablePlan({ ...editablePlan, cycles: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Plan Description & Medications</Label>
                  <Textarea 
                    className="bg-white border-slate-200 text-slate-200 min-h-[80px]" 
                    value={editablePlan.description}
                    onChange={(e) => setEditablePlan({ ...editablePlan, description: e.target.value })}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" className="border-slate-200 text-slate-600" onClick={() => setShowCodingModal(false)}>
                Review Notes
              </Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-900" onClick={async () => {
                if (!selectedPatient || !selectedPatient.patientId || !selectedPatient.id) {
                  toast.error("Cannot complete: No valid patient selected.");
                  return;
                }
                try {
                  await api.put(`/patients/${selectedPatient.patientId}/appointments/${selectedPatient.id}/complete`, {
                    notes: notes,
                    diagnosis: diagnosis,
                    regimen_name: editablePlan?.regimen_name,
                    plan_description: editablePlan?.description,
                    cycles: editablePlan?.cycles
                  });
                  toast.success("Codes approved and submitted for billing. Appointment completed!");
                  
                  // Instantly remove the completed appointment from the queue
                  setAppointmentsList((prev) => prev.filter(a => a.id !== selectedPatient.id));
                  
                  setShowCodingModal(false);
                  setSelectedPatient(null);
                  setDiagnosis('');
                  setPrescription('');
                  setNotes('');
                  setEditablePlan(null);
                } catch (error) {
                  toast.error("Failed to complete appointment");
                }
              }}>
                Approve & Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
