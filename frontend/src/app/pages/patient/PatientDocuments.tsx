import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, FileUp, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PatientIntakeWizard } from '../../components/PatientIntakeWizard';
import { api } from '../../shared/api';
import { toast } from 'sonner';
import { PatientAssistantChat } from '../../components/PatientAssistantChat';

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
      await api.post(`/intake/me/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${label} uploaded successfully!`);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [docType, label, onUploadSuccess]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }, maxFiles: 1
  });
  const hasFiles = uploadedFiles && uploadedFiles.length > 0;
  return (
    <Card className={`border-dashed border transition-all duration-300 ${isDragActive ? 'bg-violet-950/30 border-violet-400' : 'bg-white border-slate-200 shadow-sm hover:border-slate-500/50'}`}>
      <CardContent className="p-0">
        <div {...getRootProps()} className="cursor-pointer p-4 flex items-center justify-between group">
          <input {...getInputProps()} />
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-violet-100 transition-colors">
               {isUploading ? <Loader2 className="w-5 h-5 text-violet-500 animate-spin" /> : <FileUp className={`w-5 h-5 ${isDragActive ? 'text-violet-500' : 'text-slate-500'}`} />}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-700 group-hover:text-violet-600 transition-colors">{label}</p>
               <p className="text-xs text-slate-500 mt-0.5">{isDragActive ? "Drop here!" : "Click to add"}</p>
             </div>
          </div>
          {hasFiles && <div className="px-2 py-0.5 rounded-full bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200">{uploadedFiles.length}</div>}
        </div>
        {hasFiles && (
          <div className="bg-slate-50 p-3 max-h-[150px] overflow-y-auto border-t border-slate-200 space-y-2">
            {uploadedFiles.map((file: any) => (
              <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 hover:border-violet-500/30 transition-colors group/link">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 truncate group-hover/link:text-violet-300 transition-colors">{file.original_name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{new Date(file.uploaded_at).toLocaleDateString()}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PatientDocuments() {
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-16">
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2 text-2xl font-bold">
          Medical Documents
        </h1>
        <p className="text-slate-500">Upload requested documents to complete your intake and prepare for consultation</p>
      </div>

      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            Medical Document Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {intakeLoading || docsLoading ? (
            <div className="text-slate-500 text-center py-8">
              <Loader2 className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
              Loading your document checklist...
            </div>
          ) : !intake ? (
            <div className="text-rose-400 text-center py-8">No intake case found for your profile.</div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-slate-900 font-bold border-b border-slate-200/50 pb-2">Required Intake Documents</h3>
                <PatientIntakeWizard 
                  intake={intake} 
                  allDocs={allDocs} 
                  onUploadSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['my_intake'] });
                    queryClient.invalidateQueries({ queryKey: ['my_documents'] });
                  }} 
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-slate-900 font-bold border-b border-slate-200/50 pb-2 pt-4">Additional Clinical Documents</h3>
                <p className="text-sm text-slate-500 mb-4">You may upload historic labs, notes, or imaging requested by your doctor here.</p>
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

      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}
