import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle2, FileUp, Loader2, Info, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { api } from '../shared/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const PHASE_1_DOCS = [
  { 
    id: 'referral_letter', 
    label: 'GP Referral Letter',
    description: 'A formal letter from your General Practitioner summarizing your medical history and reason for consulting an oncologist.'
  },
  { 
    id: 'pathology_report', 
    label: 'Pathology Report',
    description: 'The laboratory results from your biopsy or tissue sample that confirm your diagnosis.'
  },
  { 
    id: 'imaging_report', 
    label: 'Staging Imaging Report',
    description: 'Results from recent scans (like MRI, CT, or PET scans) to determine the size and spread of the disease.'
  },
  { 
    id: 'insurance_authorization', 
    label: 'Insurance Authorization',
    description: 'Proof of coverage or pre-authorization from your insurance provider for oncology consultations.'
  }
];

export function PatientIntakeWizard({ intake, allDocs, onUploadSuccess }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const currentDoc = PHASE_1_DOCS[currentStep];
  const phase1Docs = allDocs['PHASE_1'] || [];
  
  // Calculate Progress
  const completedDocs = PHASE_1_DOCS.filter(doc => intake && intake[doc.id] && intake[doc.id].fileType !== "deferred").length;
  const progressPercentage = (completedDocs / PHASE_1_DOCS.length) * 100;

  const existingData = intake ? intake[currentDoc.id] : null;
  const isDeferred = existingData && existingData.fileType === "deferred";
  const isCompleted = existingData && !isDeferred;

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('document_type', currentDoc.id);
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post(`/intake/me/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${currentDoc.label} uploaded successfully!`);
      onUploadSuccess();
      
      // Auto-advance if not the last step
      if (currentStep < PHASE_1_DOCS.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 1000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
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

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-slate-400 text-sm mb-1">Intake Progress</p>
            <p className="text-white font-bold">{completedDocs} of {PHASE_1_DOCS.length} Documents</p>
          </div>
          <span className="text-emerald-400 font-bold">{progressPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Wizard Content */}
      <Card className="bg-slate-900/40 border-slate-700/50 overflow-hidden relative min-h-[350px] flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">Step {currentStep + 1} of {PHASE_1_DOCS.length}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-xl text-white font-bold">{currentDoc.label}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-slate-400 hover:text-cyan-400 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200 max-w-xs">
                    {currentDoc.description}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-center">
          <p className="text-slate-400 mb-6 text-center max-w-md mx-auto">{currentDoc.description}</p>
          
          <div className="max-w-md mx-auto w-full">
            <Card className={`border-dashed border-2 transition-all duration-500 ${
              isCompleted
                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : isDragActive 
                  ? 'bg-cyan-950/30 border-cyan-400 scale-105 shadow-2xl' 
                  : isDeferred
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/50'
            }`}>
              <CardContent className="p-6 relative">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-8">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                    <p className="text-cyan-400 animate-pulse">Uploading...</p>
                  </div>
                ) : isCompleted ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in zoom-in duration-500">
                    <div className="p-4 bg-emerald-500/20 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-100">Successfully Uploaded</p>
                      <p className="text-sm text-emerald-400/70 truncate max-w-[250px] mt-1" title={existingData.originalName}>
                        {existingData.originalName}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 w-full">
                      <a href={existingData.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-400 hover:underline px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50">
                        Preview
                      </a>
                      <div {...getRootProps()} className="cursor-pointer">
                        <input {...getInputProps()} />
                        <div className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50">
                          Replace
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div {...getRootProps()} className="cursor-pointer flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <input {...getInputProps()} />
                    <div className={`p-4 rounded-full transition-colors ${isDeferred ? 'bg-amber-900/50' : 'bg-slate-800/80 group-hover:bg-cyan-950/50'}`}>
                      <FileUp className={`w-10 h-10 ${isDragActive ? 'text-cyan-400' : isDeferred ? 'text-amber-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-200">
                        {isDragActive ? "Drop it here!" : "Drag & Drop your file"}
                      </p>
                      <p className="text-sm mt-1 text-slate-500">
                        or click to browse from your device
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Wizard Controls */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center mt-auto">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0 || isUploading}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-1">
            {PHASE_1_DOCS.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === currentStep ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'}`} />
            ))}
          </div>

          <Button 
            variant="ghost"
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={currentStep === PHASE_1_DOCS.length - 1 || isUploading}
            className="text-slate-400 hover:text-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
