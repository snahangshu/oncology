import { useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { api } from '../../shared/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle, FileUp, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface IntakeData {
  id: int;
  patient_id: int;
  referral_letter: any;
  pathology_report: any;
  imaging_report: any;
  insurance_authorization: any;
  intake_status: string;
  completion_percentage: number;
}

const REQUIRED_DOCS = [
  { id: 'referral_letter', label: 'GP Referral Letter' },
  { id: 'pathology_report', label: 'Pathology Report' },
  { id: 'imaging_report', label: 'Staging Imaging Report' },
  { id: 'insurance_authorization', label: 'Insurance Authorization' }
];

export default function IntakeDashboard() {
  const { patientId } = useParams();
  const queryClient = useQueryClient();

  const { data: intake, isLoading } = useQuery<IntakeData>({
    queryKey: ['intake', patientId],
    queryFn: async () => {
      const res = await api.get(`/intake/${patientId}`);
      return res.data;
    }
  });

  if (isLoading) return <div className="flex justify-center items-center h-64 text-cyan-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!intake) return <div className="text-rose-400 text-center">Intake case not found!</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header and Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Patient Intake Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Manage intake documentation for Patient #{patientId}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg ${
          intake.intake_status === 'COMPLETE' 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-emerald-500/20' 
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-amber-500/20'
        }`}>
          {intake.intake_status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload Zones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REQUIRED_DOCS.map(doc => (
              <DocumentUploadZone 
                key={doc.id}
                patientId={patientId!}
                docType={doc.id}
                label={doc.label}
                existingData={(intake as any)[doc.id]}
                onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['intake', patientId] })}
                allowDefer={doc.id === 'insurance_authorization'}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Progress Tracker */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-violet-400" />
                Intake Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Completion</span>
                  <span className="text-cyan-400 font-bold">{intake.completion_percentage}%</span>
                </div>
                <Progress value={intake.completion_percentage} className="h-2 bg-slate-800" />
              </div>

              <div className="space-y-3">
                {REQUIRED_DOCS.map(doc => {
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

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// Sub-component for individual upload zones
function DocumentUploadZone({ patientId, docType, label, existingData, onUploadSuccess, allowDefer }: any) {
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
      <CardContent className="p-6 relative">
        {existingData ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className={`p-3 rounded-full ${isDeferred ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
              <CheckCircle2 className={`w-8 h-8 ${isDeferred ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isDeferred ? 'text-amber-100' : 'text-emerald-100'}`}>{label}</p>
              <p className={`text-xs truncate w-40 mt-1 ${isDeferred ? 'text-amber-400/70' : 'text-emerald-400/70'}`} title={existingData.originalName}>
                {existingData.originalName}
              </p>
            </div>
            {!isDeferred && (
              <a href={existingData.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">
                View Document
              </a>
            )}
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
              <p className="text-sm font-bold text-slate-200">{label}</p>
              <p className="text-xs text-slate-500 mt-1">
                {isDragActive ? "Drop here!" : "Drag & Drop or Click"}
              </p>
            </div>
          </div>
        )}

        {/* Deferral Button (Only shown if allowDefer is true and it hasn't been uploaded yet) */}
        {allowDefer && !existingData && !isUploading && (
          <div className="absolute top-2 right-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDefer}
              className="text-xs bg-slate-800/80 border-slate-700/50 hover:bg-slate-700 text-slate-300"
            >
              Defer to Patient
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
