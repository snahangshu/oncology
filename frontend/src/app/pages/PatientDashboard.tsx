import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Calendar, FileText, Clock, Upload, Plus, Heart, CheckCircle2, Loader2, FileUp, MessageSquare, X, Send, Globe, Activity } from 'lucide-react';
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
import { PatientIntakeWizard } from '../components/PatientIntakeWizard';

const PHASE_1_DOCS = [
  { id: 'referral_letter', label: 'GP Referral Letter' },
  { id: 'pathology_report', label: 'Pathology Report' },
  { id: 'imaging_report', label: 'Staging Imaging Report' },
  { id: 'insurance_authorization', label: 'Insurance Authorization' }
];

const PHASE_2_DOCS = [
  { id: 'cbc_report', label: 'CBC Report' },
  { id: 'cmp_report', label: 'CMP Report' },
  { id: 'medication_list', label: 'Medication List' },
  { id: 'allergy_record', label: 'Allergy Record' }
];

const PHASE_3_DOCS = [
  { id: 'consultation_note', label: 'Consultation Note' },
  { id: 'nursing_note', label: 'Nursing Note' },
  { id: 'surgery_report', label: 'Surgery Report' },
  { id: 'discharge_summary', label: 'Discharge Summary' },
  { id: 'radiation_report', label: 'Radiation Report' }
];

const upcomingAppointments: any[] = [];
const medicalHistory: any[] = [];
const activePrescriptions: any[] = [];

export default function PatientDashboard() {
  const queryClient = useQueryClient();
  const [appointmentsList, setAppointmentsList] = useState(upcomingAppointments);
  const [prescriptionsList, setPrescriptionsList] = useState(activePrescriptions);
  const [isLoading, setIsLoading] = useState(true);
  
  const [survivorshipPlan, setSurvivorshipPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planLanguage, setPlanLanguage] = useState('English');

  const { data: intake, isLoading: intakeLoading } = useQuery({
    queryKey: ['my_intake'],
    queryFn: async () => {
      const res = await api.get('/intake/me');
      return res.data;
    }
  });

  const { data: allDocs = {}, isLoading: docsLoading } = useQuery({
    queryKey: ['my_documents'],
    queryFn: async () => {
      const res = await api.get(`/intake/me/documents`);
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

  const [clinicalForm, setClinicalForm] = useState({ primary_diagnosis: '', patient_comments: '' });

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

  useEffect(() => {
    if (!dashboardData) return;
    const appointments = dashboardData.appointments || [];
    const prescriptions = dashboardData.prescriptions || []; // Assuming these exist, else empty
    
    if (appointments.length > 0) {
      const merged = appointments.map((apt: any) => {
        return {
          id: apt.id,
          date: new Date(apt.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
          time: new Date(apt.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          doctor: apt.doctor_name || 'Assigned Provider',
          type: apt.type,
          status: apt.status.charAt(0).toUpperCase() + apt.status.slice(1),
        };
      });
      setAppointmentsList(merged);
    } else {
      setAppointmentsList([]);
    }
    
    if (prescriptions.length > 0) {
      const merged = prescriptions.map((rx: any) => ({
        name: rx.medication,
        dosage: 'Standard',
        frequency: 'Once daily',
        refillsLeft: 3,
      }));
      setPrescriptionsList(merged);
    }
    setIsLoading(false);
  }, [dashboardData]);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2">
          Welcome Back!
        </h1>
        <p className="text-slate-400">Manage your health journey with ease</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
          <CardContent className="p-6">
            {appointmentsList.length > 0 ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white">Next Appointment</h3>
                    <p className="text-slate-400 text-sm">{appointmentsList[0].date} at {appointmentsList[0].time}</p>
                  </div>
                </div>
                <Separator className="bg-slate-700/30 mb-4" />
                <div className="space-y-2 mb-4">
                  <p className="text-slate-300">{appointmentsList[0].doctor}</p>
                  <p className="text-slate-400 text-sm">{appointmentsList[0].type}</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white">
                  View Details
                </Button>
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
          <CardContent className="p-6">
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
            <p className="text-slate-300 text-sm mb-4">
              Need to see a doctor? Schedule a new appointment with your preferred healthcare provider.
            </p>
            {!intake || intake.intake_status !== 'COMPLETE' ? (
              <Button 
                onClick={() => {
                  if (!intake) {
                    toast.error('Intake information is currently unavailable.');
                  } else {
                    toast.error('Please upload all Required Intake Documents below before scheduling an appointment.', { duration: 5000 });
                  }
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
              >
                Schedule Now
              </Button>
            ) : (
              <PatientSchedulingModal patientId={intake.patient_id} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Documents (Real Cloudinary Integration) */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            Medical Document Portal
          </CardTitle>
          <p className="text-sm text-slate-400">Upload requested documents to complete your intake and prepare for consultation.</p>
        </CardHeader>
        <CardContent>
          {intakeLoading || docsLoading ? (
            <div className="text-slate-400 text-center py-8">
              <Loader2 className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
              Loading your intake checklist...
            </div>
          ) : !intake ? (
            <div className="text-rose-400 text-center py-8">No intake case found for your profile.</div>
          ) : (
            <div className="space-y-8">
              
              {/* Phase 1 Guided Wizard */}
              <div className="space-y-4">
                <h3 className="text-white font-bold border-b border-slate-700/50 pb-2">Required Intake Documents</h3>
                <PatientIntakeWizard 
                  intake={intake} 
                  allDocs={allDocs} 
                  onUploadSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['my_intake'] });
                    queryClient.invalidateQueries({ queryKey: ['my_documents'] });
                  }} 
                />
              </div>

              {/* Phase 2 & 3 Combined for Patient View */}
              <div className="space-y-4">
                <h3 className="text-white font-bold border-b border-slate-700/50 pb-2 pt-4">Additional Clinical Documents</h3>
                <p className="text-sm text-slate-400 mb-4">You may upload historic labs, notes, or imaging requested by your doctor here.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...PHASE_2_DOCS, ...PHASE_3_DOCS].map(doc => {
                    const phase2Docs = allDocs['PHASE_2'] || [];
                    const phase3Docs = allDocs['PHASE_3'] || [];
                    const combined = [...phase2Docs, ...phase3Docs];
                    const uploadedFiles = combined.filter((d: any) => d.document_type === doc.id.toUpperCase());
                    
                    return (
                      <PatientTimeSeriesUploadZone 
                        key={doc.id}
                        docType={doc.id}
                        label={doc.label}
                        uploadedFiles={uploadedFiles}
                        onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['my_documents'] })}
                      />
                    )
                  })}
                </div>
              </div>

            </div>
          )}
        </CardContent>
      </Card>


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

      {/* Upcoming Appointments */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-slate-400 text-center py-8">
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                Loading appointments...
              </div>
            ) : appointmentsList.length === 0 ? (
              <div className="text-slate-400 text-center py-8">
                No upcoming appointments found.
              </div>
            ) : appointmentsList.map((apt, index) => (
              <div
                key={apt.id}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/50 transition-all animate-in slide-in-from-left duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white mb-1">{apt.type}</h4>
                    <p className="text-slate-400 text-sm">{apt.doctor}</p>
                    <p className="text-cyan-400 text-sm mt-2">
                      {apt.date} at {apt.time}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                  >
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Prescriptions */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Active Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="text-slate-400 text-center py-8 col-span-2">
                <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-2" />
                Loading prescriptions...
              </div>
            ) : prescriptionsList.length === 0 ? (
              <div className="text-slate-400 text-center py-8 col-span-2">
                No active prescriptions found.
              </div>
            ) : prescriptionsList.map((rx, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-rose-500/50 transition-all animate-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h4 className="text-white mb-1">{rx.name}</h4>
                <p className="text-slate-400 text-sm mb-2">{rx.dosage}</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-300 text-sm">{rx.frequency}</p>
                  <Badge
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                  >
                    {rx.refillsLeft} refills left
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
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

      {/* Medical Records Timeline */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Medical Records Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {medicalHistory.length === 0 ? (
              <div className="text-slate-400 text-center py-8">
                No medical records found.
              </div>
            ) : medicalHistory.map((record, index) => (
              <Dialog key={record.id}>
                <DialogTrigger asChild>
                  <div
                    className="relative pl-8 pb-6 border-l-2 border-slate-700/30 cursor-pointer hover:border-violet-500/50 transition-all last:border-transparent animate-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/50" />
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 hover:border-violet-500/50 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white">{record.diagnosis}</h4>
                          <p className="text-slate-400 text-sm">{record.doctor}</p>
                        </div>
                        <p className="text-slate-400 text-sm">{record.date}</p>
                      </div>
                      <p className="text-slate-300 text-sm mt-2">{record.notes}</p>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700/30 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-400" />
                      Visit Details - {record.date}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Doctor</Label>
                      <p className="text-white mt-1">{record.doctor}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-400 text-sm">Diagnosis</Label>
                      <p className="text-white mt-1">{record.diagnosis}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-400 text-sm">Doctor's Notes</Label>
                      <p className="text-slate-300 mt-1">{record.notes}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-400 text-sm">Prescriptions</Label>
                      <div className="space-y-2 mt-2">
                        {record.prescriptions.map((rx, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                          >
                            <p className="text-slate-300">{rx}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Chat Widget */}
      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}


// Phase 1 Upload Zone
function PatientDocumentUploadZone({ docType, label, existingData, uploadedFiles, onUploadSuccess }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post(`/intake/me/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${label} uploaded successfully!`);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [docType, label, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const isDeferred = existingData && existingData.fileType === "deferred";

  return (
    <Card className={`border-dashed border-2 transition-all duration-300 ${
      existingData && !isDeferred
        ? 'bg-emerald-950/20 border-emerald-500/30'
        : isDragActive 
          ? 'bg-cyan-950/30 border-cyan-400' 
          : isDeferred
            ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
            : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-500'
    }`}>
      <CardContent className="p-4 relative">
        {existingData && !isDeferred ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3 pt-2">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-100">{label}</p>
              <p className="text-xs text-emerald-400/70 truncate w-40 mt-1" title={existingData.originalName}>
                {existingData.originalName}
              </p>
            </div>
            <a href={existingData.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">
              View Document
            </a>
          </div>
        ) : (
          <div {...getRootProps()} className="cursor-pointer flex flex-col items-center justify-center text-center space-y-3 min-h-[140px]">
            <input {...getInputProps()} />
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            ) : (
              <div className={`p-3 rounded-full transition-colors ${isDeferred ? 'bg-amber-900/50 group-hover:bg-amber-800/50' : 'bg-slate-800/80 group-hover:bg-cyan-950/50'}`}>
                <FileUp className={`w-8 h-8 ${isDragActive ? 'text-cyan-400' : isDeferred ? 'text-amber-400' : 'text-slate-400'}`} />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-200">
                {label} {isDeferred && <span className="text-amber-400 text-xs ml-1">(Requested)</span>}
              </p>
              <p className={`text-xs mt-1 ${isDeferred ? 'text-amber-200/70' : 'text-slate-500'}`}>
                {isDragActive ? "Drop here!" : "Drag & Drop or Click"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Phase 2/3 Time Series Upload Zone
function PatientTimeSeriesUploadZone({ docType, label, uploadedFiles, onUploadSuccess }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post(`/intake/me/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${label} uploaded successfully!`);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [docType, label, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const hasFiles = uploadedFiles && uploadedFiles.length > 0;

  return (
    <Card className={`border-dashed border transition-all duration-300 ${
      isDragActive 
        ? 'bg-violet-950/30 border-violet-400' 
        : 'bg-slate-900/30 border-slate-700/30 hover:border-slate-500/50'
    }`}>
      <CardContent className="p-0">
        
        {/* Top Dropzone */}
        <div {...getRootProps()} className="cursor-pointer p-4 flex items-center justify-between group">
          <input {...getInputProps()} />
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-800/80 rounded-lg group-hover:bg-violet-900/50 transition-colors">
               {isUploading ? <Loader2 className="w-5 h-5 text-violet-400 animate-spin" /> : <FileUp className={`w-5 h-5 ${isDragActive ? 'text-violet-400' : 'text-slate-400'}`} />}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-200 group-hover:text-violet-300 transition-colors">{label}</p>
               <p className="text-xs text-slate-500 mt-0.5">{isDragActive ? "Drop here!" : "Click to add"}</p>
             </div>
          </div>
          {hasFiles && (
            <div className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
              {uploadedFiles.length}
            </div>
          )}
        </div>

        {/* Bottom List of Files */}
        {hasFiles && (
          <div className="bg-slate-950/50 p-3 max-h-[150px] overflow-y-auto border-t border-slate-800 space-y-2">
            {uploadedFiles.map((file: any) => (
              <a 
                key={file.id} 
                href={file.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 p-2 rounded-md bg-slate-900 border border-slate-800 hover:border-violet-500/30 transition-colors group/link"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300 truncate group-hover/link:text-violet-300 transition-colors">
                    {file.original_name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function PatientAssistantChat({ patientId }: { patientId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [history, isOpen]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message;
    setMessage('');
    setHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post(`/patients/${patientId}/chat`, { message: userMessage });
      setHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (res.data.action_taken) {
         toast.success(res.data.action_taken);
      }
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 shadow-lg shadow-violet-500/30 transition-transform ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] flex flex-col bg-slate-900 border-slate-700 shadow-2xl z-50 animate-in slide-in-from-bottom-5">
          <CardHeader className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Clinical Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 && (
                <div className="text-center text-sm text-slate-400 mt-4">
                  Hello! I'm your AI Clinical Assistant. How can I help you today? You can ask questions, check symptoms, or request medication refills.
                </div>
              )}
              {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="flex-1 bg-slate-800 border-slate-700 text-sm text-white rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <Button type="submit" disabled={isLoading || !message.trim()} size="icon" className="h-9 w-9 rounded-full bg-cyan-600 hover:bg-cyan-700">
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
