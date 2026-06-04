import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { useAppSelector } from '../store';
import { api } from '../shared/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  FileText, 
  FileUp, 
  Heart, 
  Loader2, 
  Stethoscope, 
  Activity, 
  Bot, 
  FlaskConical, 
  CheckCircle2, 
  Trash2,
  CalendarPlus,
  Plus,
  Pill
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Types
interface DashboardData {
  patient: any;
  snapshot: any;
  insurance: any[];
  intake: any;
  documents: {
    PHASE_1: any[];
    PHASE_2: any[];
    PHASE_3: any[];
  };
  appointments: any[];
  timeline: any[];
  alerts: string[];
  aiSummary: any;
}

export default function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { role } = useAppSelector((state) => state.auth.user || {});
  
  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ['patient_dashboard', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/dashboard`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-cyan-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="animate-pulse">Aggregating patient data...</p>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-rose-400 text-center">Patient profile not found.</div>;
  }

  const { patient, snapshot, alerts } = dashboard;

  // Calculate age
  const age = patient.date_of_birth ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / 3.15576e+10) : 'Unknown';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {/* 1. Critical Alerts Widget */}
      {alerts && alerts.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="p-2 bg-rose-500/20 rounded-full shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-400 font-bold mb-1">Critical Action Items</h3>
            <div className="flex flex-wrap gap-2">
              {alerts.map((alert, idx) => (
                <span key={idx} className="text-xs bg-rose-950/50 border border-rose-500/30 text-rose-300 px-2 py-1 rounded-md">
                  {alert}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Clinical Snapshot Header */}
      <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardContent className="p-6">
          <div className="flex flex-col xl:flex-row justify-between gap-6">
            
            {/* Left: Demographics */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {patient.first_name} {patient.last_name}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-slate-400 text-sm font-medium">
                  <span>{age} Years</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{patient.gender || 'Unspecified'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="text-cyan-400">ID: #{patient.id}</span>
                </div>
              </div>
            </div>

            {/* Middle: Clinical Snapshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-8 flex-1 border-y xl:border-y-0 xl:border-l border-slate-700/50 py-4 xl:py-0 xl:pl-8">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Diagnosis</p>
                <p className="text-white font-medium text-sm truncate" title={snapshot.cancerType}>{snapshot.cancerType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Status</p>
                <p className="text-emerald-400 font-medium text-sm">{snapshot.currentTreatmentStatus}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Oncologist</p>
                <p className="text-white font-medium text-sm">{snapshot.assignedOncologist}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Urgency</p>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                  snapshot.urgencyLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {snapshot.urgencyLevel}
                </span>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex flex-row xl:flex-col gap-2 shrink-0">
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white w-full flex items-center justify-center gap-2">
                <CalendarPlus className="w-4 h-4" /> <span className="hidden sm:inline">Schedule</span>
              </Button>
              <Button size="sm" variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 w-full flex items-center justify-center gap-2">
                <FileUp className="w-4 h-4" /> <span className="hidden sm:inline">Upload</span>
              </Button>
              <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 w-full flex items-center justify-center gap-2">
                <Bot className="w-4 h-4" /> <span className="hidden sm:inline">AI Brief</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-700/50 p-1 mb-6 flex flex-wrap h-auto w-full justify-start rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2">Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2">Timeline</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2">Documents</TabsTrigger>
          <TabsTrigger value="labs" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2 flex gap-2 items-center">
            <FlaskConical className="w-4 h-4" /> Labs
          </TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2">Appointments</TabsTrigger>
          <TabsTrigger value="treatmentplans" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2 flex gap-2 items-center">
            <Pill className="w-4 h-4" /> Treatment Plans
          </TabsTrigger>
          <TabsTrigger value="aisummary" className="data-[state=active]:bg-violet-900/50 data-[state=active]:text-violet-300 rounded-lg px-6 py-2 flex gap-2 items-center">
            <Bot className="w-4 h-4" /> AI Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <OverviewTab dashboard={dashboard} />
        </TabsContent>
        
        <TabsContent value="timeline" className="outline-none">
          <TimelineTab timeline={dashboard.timeline} />
        </TabsContent>

        <TabsContent value="documents" className="outline-none">
          <DocumentsTab 
            patientId={patientId!} 
            documents={dashboard.documents} 
            role={role} 
          />
        </TabsContent>

        <TabsContent value="labs" className="outline-none">
          <LabsTab 
            patientId={patientId!} 
            documents={dashboard.documents} 
            role={role}
          />
        </TabsContent>

        <TabsContent value="appointments" className="outline-none">
          <AppointmentsTab appointments={dashboard.appointments} />
        </TabsContent>

        <TabsContent value="treatmentplans" className="outline-none">
          <TreatmentPlansTab />
        </TabsContent>

        <TabsContent value="aisummary" className="outline-none">
          <AISummaryTab aiSummary={dashboard.aiSummary} />
        </TabsContent>
      </Tabs>

    </div>
  );
}

// --- TAB COMPONENTS ---

function OverviewTab({ dashboard }: { dashboard: DashboardData }) {
  const { intake, insurance, patient } = dashboard;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* Intake Progress */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Intake Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Phase 1 Completion</span>
              <span className="text-cyan-400 font-bold">{intake.completion_percentage}%</span>
            </div>
            <Progress value={intake.completion_percentage} className="h-2 bg-slate-800" />
            <div className={`mt-4 px-3 py-2 rounded-lg text-center font-bold text-sm ${
              intake.status === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {intake.status}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Vitals (Mock for now) */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            Latest Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase font-bold">Blood Pressure</p>
              <p className="text-lg text-white font-medium mt-1">120/80</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase font-bold">Heart Rate</p>
              <p className="text-lg text-white font-medium mt-1">72 bpm</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase font-bold">Weight</p>
              <p className="text-lg text-white font-medium mt-1">155 lbs</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase font-bold">Temp</p>
              <p className="text-lg text-white font-medium mt-1">98.6 °F</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Info */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Insurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insurance.length > 0 ? (
            <div className="space-y-4">
              {insurance.map((ins, i) => (
                <div key={i} className="border-b border-slate-700/50 last:border-0 pb-3 last:pb-0">
                  <p className="text-white font-bold">{ins.provider_name}</p>
                  <p className="text-slate-400 text-sm mt-1">Policy: <span className="text-slate-300">{ins.policy_number}</span></p>
                  {ins.group_number && <p className="text-slate-400 text-sm">Group: <span className="text-slate-300">{ins.group_number}</span></p>}
                </div>
              ))}
            </div>
          ) : (
             <p className="text-slate-500 italic">No insurance records found.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function TimelineTab({ timeline }: { timeline: any[] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 p-12 text-center">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-slate-300 font-bold">No Events Yet</h3>
        <p className="text-slate-500 mt-2">The timeline will populate automatically as documents are uploaded and appointments are made.</p>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'DOCUMENT_UPLOAD': return <FileUp className="w-4 h-4 text-emerald-400" />;
      case 'INTAKE_CREATED': return <Plus className="w-4 h-4 text-cyan-400" />;
      case 'INTAKE_COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'APPOINTMENT_CREATED': return <Calendar className="w-4 h-4 text-violet-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="p-8">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
          {timeline.map((event, idx) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {getIcon(event.eventType)}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-slate-200">{event.title}</div>
                  <time className="text-xs font-medium text-cyan-400 ml-2">
                    {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'Unknown'}
                  </time>
                </div>
                <div className="text-slate-400 text-sm">{event.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Reusable Document Zones
const DOC_DEFINITIONS = {
  PHASE_1: [
    { id: 'referral_letter', label: 'GP Referral Letter' },
    { id: 'pathology_report', label: 'Pathology Report' },
    { id: 'imaging_report', label: 'Imaging Report' },
    { id: 'insurance_authorization', label: 'Insurance Auth' }
  ],
  PHASE_2: [
    { id: 'cbc_report', label: 'CBC Report' },
    { id: 'cmp_report', label: 'CMP Report' },
    { id: 'medication_list', label: 'Medication List' },
    { id: 'allergy_record', label: 'Allergy Record' }
  ],
  PHASE_3: [
    { id: 'consultation_note', label: 'Consultation Note' },
    { id: 'nursing_note', label: 'Nursing Note' },
    { id: 'surgery_report', label: 'Surgery Report' },
    { id: 'discharge_summary', label: 'Discharge Summary' },
    { id: 'radiation_report', label: 'Radiation Report' }
  ]
};

function DocumentsTab({ patientId, documents, role }: { patientId: string, documents: any, role: string }) {
  const queryClient = useQueryClient();
  const canDelete = role === 'ADMIN' || role === 'RECEPTIONIST';

  return (
    <div className="space-y-8">
      {/* Phase 1 */}
      <section>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
          Intake Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DOC_DEFINITIONS.PHASE_1.map(doc => {
            const uploadedFiles = (documents.PHASE_1 || []).filter((d: any) => d.document_type === doc.id.toUpperCase());
            return (
               <DocumentUploader key={doc.id} patientId={patientId} docType={doc.id} label={doc.label} files={uploadedFiles} canDelete={canDelete} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patient_dashboard', patientId] })} />
            )
          })}
        </div>
      </section>

      {/* Phase 2 */}
      <section>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs">2</span>
          Consultation & Labs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DOC_DEFINITIONS.PHASE_2.map(doc => {
            // Skip CBC/CMP here as they have their own dedicated tab
            if (doc.id === 'cbc_report' || doc.id === 'cmp_report') return null;
            const uploadedFiles = (documents.PHASE_2 || []).filter((d: any) => d.document_type === doc.id.toUpperCase());
            return (
               <DocumentUploader key={doc.id} patientId={patientId} docType={doc.id} label={doc.label} files={uploadedFiles} canDelete={canDelete} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patient_dashboard', patientId] })} />
            )
          })}
        </div>
      </section>

      {/* Phase 3 */}
      <section>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs">3</span>
          Treatment Records
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DOC_DEFINITIONS.PHASE_3.map(doc => {
            const uploadedFiles = (documents.PHASE_3 || []).filter((d: any) => d.document_type === doc.id.toUpperCase());
            return (
               <DocumentUploader key={doc.id} patientId={patientId} docType={doc.id} label={doc.label} files={uploadedFiles} canDelete={canDelete} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patient_dashboard', patientId] })} />
            )
          })}
        </div>
      </section>
    </div>
  );
}

function LabsTab({ patientId, documents, role }: { patientId: string, documents: any, role: string }) {
  const queryClient = useQueryClient();
  const canDelete = role === 'ADMIN' || role === 'RECEPTIONIST';
  
  const cbcFiles = (documents.PHASE_2 || []).filter((d: any) => d.document_type === 'CBC_REPORT');
  const cmpFiles = (documents.PHASE_2 || []).filter((d: any) => d.document_type === 'CMP_REPORT');

  return (
    <div className="space-y-8">
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 flex gap-3 items-start">
        <FlaskConical className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-sm text-cyan-200">
          <strong className="text-cyan-400">Labs Workspace.</strong> Upload longitudinal CBC and CMP records here. In the future, the OCR AI Agent will automatically extract values from these PDFs and plot trendlines over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <DocumentUploader patientId={patientId} docType="cbc_report" label="Complete Blood Count (CBC)" files={cbcFiles} canDelete={canDelete} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patient_dashboard', patientId] })} expanded />
         <DocumentUploader patientId={patientId} docType="cmp_report" label="Comprehensive Metabolic Panel (CMP)" files={cmpFiles} canDelete={canDelete} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patient_dashboard', patientId] })} expanded />
      </div>
    </div>
  );
}

// Reusable Multi-file uploader component
function DocumentUploader({ patientId, docType, label, files, canDelete, onSuccess, expanded = false }: any) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{name: string, url: string} | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post(`/intake/${patientId}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${label} uploaded successfully!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [patientId, docType, label, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }, maxFiles: 1
  });

  const handleDelete = async (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.delete(`/intake/${patientId}/document/${type}`);
      toast.success("Document deleted");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <Card className={`border-dashed border transition-all duration-300 bg-slate-900/30 border-slate-700/30 hover:border-slate-500/50 flex flex-col ${expanded ? 'h-full min-h-[300px]' : ''}`}>
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Dropzone Area */}
        <div {...getRootProps()} className="cursor-pointer p-4 flex items-center justify-between group border-b border-slate-800/50">
          <input {...getInputProps()} />
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-800/80 rounded-lg group-hover:bg-cyan-900/50 transition-colors">
               {isUploading ? <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /> : <FileUp className={`w-5 h-5 ${isDragActive ? 'text-cyan-400' : 'text-slate-400'}`} />}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">{label}</p>
               <p className="text-xs text-slate-500 mt-0.5">{isDragActive ? "Drop here!" : "Click or drag to upload"}</p>
             </div>
          </div>
          {files.length > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
              {files.length}
            </div>
          )}
        </div>

        {/* File List */}
        <div className={`bg-slate-950/50 p-3 overflow-y-auto space-y-2 flex-1 ${!expanded && files.length > 0 ? 'max-h-[150px]' : ''}`}>
          {files.length === 0 ? (
            <p className="text-center text-xs text-slate-600 py-4 italic">No documents uploaded.</p>
          ) : (
            files.map((file: any) => (
              <div key={file.id} className="flex items-center justify-between p-2 rounded-md bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-colors group/link">
                <button onClick={(e) => { e.preventDefault(); setPreviewDoc({ name: file.original_name, url: file.file_url }); }} className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer text-left">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate group-hover/link:text-cyan-300 transition-colors">
                      {file.original_name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
                {canDelete && (
                   <button onClick={(e) => handleDelete(e, docType)} className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors" title="Delete File">
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-6xl w-[90vw] h-[90vh] bg-slate-900 border-slate-700 p-0 flex flex-col z-[100]">
          <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
            <DialogTitle className="text-white capitalize flex items-center gap-2">
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
    </Card>
  );
}

function AppointmentsTab({ appointments }: { appointments: any[] }) {
  if (!appointments || appointments.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 p-12 text-center">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-slate-300 font-bold">No Appointments</h3>
        <p className="text-slate-500 mt-2">There are no upcoming or past appointments scheduled.</p>
        <Button className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white">Schedule Now</Button>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-start gap-4">
                 <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-center min-w-[70px]">
                   <p className="text-xs text-slate-400 uppercase font-bold">{new Date(appt.start_time).toLocaleString('default', { month: 'short' })}</p>
                   <p className="text-2xl text-white font-bold">{new Date(appt.start_time).getDate()}</p>
                 </div>
                 <div>
                   <h4 className="text-white font-bold text-lg">{appt.type}</h4>
                   <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                     <Clock className="w-3.5 h-3.5" />
                     {new Date(appt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
                 </div>
              </div>
              <div className="text-right">
                 <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold border bg-slate-800 border-slate-700 text-slate-300">
                   {appt.status}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AISummaryTab({ aiSummary }: { aiSummary: any }) {
  // Prepared response shape for future AI integration
  // { intakeSummary: null, preConsultBrief: null, drugSafetyAssessment: null, toxicityAssessment: null }
  
  const placeholders = [
    { title: "Intake Summary Agent", key: "intakeSummary", desc: "Synthesizes Referral Letter, Pathology, and Imaging into a structured oncological summary." },
    { title: "Pre-Consult Brief Agent", key: "preConsultBrief", desc: "Generates a 1-page brief for the Oncologist summarizing history, vitals, and recent labs." },
    { title: "Drug Safety Agent", key: "drugSafetyAssessment", desc: "Cross-references proposed chemo regimens against the patient's CMP and allergy records." },
    { title: "Toxicity Assessment Agent", key: "toxicityAssessment", desc: "Analyzes Nursing Notes and CBCs post-infusion to detect early signs of Grade 3+ toxicities." }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/20 mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">AI Clinical Agents</h2>
        <p className="text-violet-200 mt-2 max-w-2xl mx-auto">
          This dashboard is wired to the upcoming multi-agent system. As soon as the AI agents are deployed, they will automatically populate these reports based on the documents you upload.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {placeholders.map((agent, i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-700/50 opacity-75">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-lg text-slate-300 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-violet-400/50" />
                {agent.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               {aiSummary[agent.key] ? (
                 <div className="text-white whitespace-pre-wrap">{aiSummary[agent.key]}</div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-8 text-center">
                   <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
                     <Loader2 className="w-5 h-5 text-slate-500" />
                   </div>
                   <p className="text-slate-400 font-medium">Awaiting Agent Deployment</p>
                   <p className="text-xs text-slate-500 mt-2 max-w-[250px] mx-auto">{agent.desc}</p>
                 </div>
               )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TreatmentPlansTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Pill className="w-5 h-5 text-cyan-400" />
            Active Treatment Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto mb-4">
              <Pill className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-1">No Active Treatment Plans</h3>
            <p className="text-slate-500 max-w-sm mx-auto">This patient currently does not have any active chemotherapy or radiation regimens assigned.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

