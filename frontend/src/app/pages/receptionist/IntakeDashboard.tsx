import { useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { api } from '../../shared/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle, FileUp, Loader2, AlertCircle, Calendar, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface IntakeData {
  id: number;
  patient_id: number;
  referral_letter: any;
  pathology_report: any;
  imaging_report: any;
  insurance_authorization: any;
  intake_status: string;
  completion_percentage: number;
}

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

export default function IntakeDashboard() {
  const { patientId } = useParams();
  const queryClient = useQueryClient();

  const { data: intake, isLoading: intakeLoading } = useQuery<IntakeData>({
    queryKey: ['intake', patientId],
    queryFn: async () => {
      const res = await api.get(`/intake/${patientId}`);
      return res.data;
    }
  });

  const { data: allDocs = {}, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', patientId],
    queryFn: async () => {
      const res = await api.get(`/intake/${patientId}/documents`);
      return res.data;
    }
  });

  if (intakeLoading || docsLoading) return <div className="flex justify-center items-center h-64 text-cyan-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!intake) return <div className="text-rose-400 text-center">Intake case not found!</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header and Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Patient Intake & Triage
          </h1>
          <p className="text-slate-400 mt-1">Comprehensive document management for Patient #{patientId}</p>
        </div>
        <div className="flex gap-3">
          <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 ${
            intake.intake_status === 'COMPLETE' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-emerald-500/20' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-amber-500/20'
          }`}>
            {intake.intake_status === 'COMPLETE' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            INTAKE {intake.intake_status}
          </div>
          <Button 
            onClick={() => window.location.href = `/patients/${patientId}`}
            variant="outline" 
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            Open Clinical Workspace
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Upload Zones by Phase */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Phase 1 */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm border border-cyan-500/30">1</span>
                Phase 1: Intake & Triage
              </h2>
              <p className="text-slate-400 text-sm ml-10">Mandatory documents required to complete the patient's initial intake.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PHASE_1_DOCS.map(doc => {
                const phase1Docs = allDocs['PHASE_1'] || [];
                const uploadedFiles = phase1Docs.filter((d: any) => d.document_type === doc.id.toUpperCase());
                
                return (
                  <DocumentUploadZone 
                    key={doc.id}
                    patientId={patientId!}
                    docType={doc.id}
                    label={doc.label}
                    existingData={(intake as any)[doc.id]} // Legacy JSON completeness object
                    uploadedFiles={uploadedFiles}
                    onUploadSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['intake', patientId] });
                      queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
                    }}
                    allowDefer={doc.id === 'insurance_authorization'}
                  />
                )
              })}
            </div>
          </section>

          {/* Phase 2 */}
          <section className="space-y-4 pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm border border-violet-500/30">2</span>
                  Phase 2: Consultation
                </h2>
                <p className="text-slate-400 text-sm ml-10">Optional for initial intake. Time-series data used for safe chemotherapy prescribing.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                <Bot className="w-4 h-4" /> Used by: Pre-Consult & Drug Safety AI Agents
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PHASE_2_DOCS.map(doc => {
                const phase2Docs = allDocs['PHASE_2'] || [];
                const uploadedFiles = phase2Docs.filter((d: any) => d.document_type === doc.id.toUpperCase());
                return (
                  <TimeSeriesUploadZone 
                    key={doc.id}
                    patientId={patientId!}
                    docType={doc.id}
                    label={doc.label}
                    uploadedFiles={uploadedFiles}
                    onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['documents', patientId] })}
                  />
                )
              })}
            </div>
          </section>

          {/* Phase 3 */}
          <section className="space-y-4 pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm border border-rose-500/30">3</span>
                  Phase 3: Treatment & Infusion
                </h2>
                <p className="text-slate-400 text-sm ml-10">Clinical notes and historic records used to monitor toxicity and plan cycles.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                <Bot className="w-4 h-4" /> Used by: Treatment Structurer & Toxicity Agents
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PHASE_3_DOCS.map(doc => {
                const phase3Docs = allDocs['PHASE_3'] || [];
                const uploadedFiles = phase3Docs.filter((d: any) => d.document_type === doc.id.toUpperCase());
                return (
                  <TimeSeriesUploadZone 
                    key={doc.id}
                    patientId={patientId!}
                    docType={doc.id}
                    label={doc.label}
                    uploadedFiles={uploadedFiles}
                    onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['documents', patientId] })}
                  />
                )
              })}
            </div>
          </section>

        </div>

        {/* Right Column: Progress Tracker (Locked to Phase 1 only) */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cyan-400" />
                Intake Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Phase 1 Completion</span>
                  <span className="text-cyan-400 font-bold">{intake.completion_percentage}%</span>
                </div>
                <Progress value={intake.completion_percentage} className="h-2 bg-slate-800" />
              </div>

              <div className="space-y-3">
                {PHASE_1_DOCS.map(doc => {
                  const isUploaded = !!(intake as any)[doc.id];
                  return (
                    <div key={doc.id} className="flex items-center gap-3 text-sm">
                      {isUploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 opacity-50" />
                      )}
                      <span className={isUploaded ? "text-slate-300" : "text-slate-500 line-through"}>
                        {doc.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {intake.completion_percentage < 100 && (
                <div className="p-3 mt-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex gap-3 items-start">
                  <Bot className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-cyan-200">
                    The Missing Document Detector AI agent will automatically draft an email to the patient to request these missing documents.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// Phase 1 Strict Upload Zone (Allows Deferral, shows large checkmark)
function DocumentUploadZone({ patientId, docType, label, existingData, uploadedFiles, onUploadSuccess, allowDefer }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post(`/intake/${patientId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${label} uploaded successfully!`);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [patientId, docType, label, onUploadSuccess]);

  const handleDefer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('document_type', docType);
      await api.post(`/intake/${patientId}/defer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${label} deferred to Patient Portal!`);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Deferral failed');
    } finally {
      setIsUploading(false);
    }
  };

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
      existingData 
        ? (isDeferred ? 'bg-amber-950/20 border-amber-500/30' : 'bg-emerald-950/20 border-emerald-500/30')
        : isDragActive 
          ? 'bg-cyan-950/30 border-cyan-400' 
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
              <div className="p-3 bg-slate-800/80 rounded-full group-hover:bg-cyan-950/50 transition-colors">
                <FileUp className={`w-8 h-8 ${isDragActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-200">
                {label}
                {isDeferred && <span className="ml-2 text-amber-400 font-normal">(Requested from Patient)</span>}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isDragActive ? "Drop here!" : "Drag & Drop or Click"}
              </p>
            </div>
          </div>
        )}

        {/* List additional uploads if any (in case they uploaded twice before we blocked it) */}
        {uploadedFiles && uploadedFiles.length > 1 && !isDeferred && (
           <div className="mt-4 pt-4 border-t border-emerald-500/30 space-y-2">
             <p className="text-xs text-emerald-400/70 font-bold">History ({uploadedFiles.length})</p>
             {uploadedFiles.slice(1).map((f: any) => (
                <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className="block text-xs text-slate-400 hover:text-cyan-400 truncate">
                  • {f.original_name}
                </a>
             ))}
           </div>
        )}

        {/* Deferral Button (Only shown if allowDefer is true and it hasn't been uploaded yet) */}
        {allowDefer && !existingData && !isUploading && (
          <div className="absolute top-2 right-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDefer}
              className="text-xs bg-slate-800/80 border-slate-700/50 hover:bg-slate-700 text-slate-300 h-7 px-2"
            >
              Defer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Phase 2/3 Time Series Upload Zone (Allows infinite uploads, shows a list)
function TimeSeriesUploadZone({ patientId, docType, label, uploadedFiles, onUploadSuccess }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post(`/intake/${patientId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${label} uploaded successfully!`);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [patientId, docType, label, onUploadSuccess]);

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
               <p className="text-xs text-slate-500 mt-0.5">{isDragActive ? "Drop here!" : "Click or drag to add"}</p>
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
