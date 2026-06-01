import { useState } from 'react';
import { useAppState } from '../../shared/store';
import { User, FileText, HeartPulse, CheckCircle2, AlertTriangle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export function IntakePage() {
  const { patients, documents, submitIntake, uploadDocument, querySlots, setActiveTab, currentRole } = useAppState();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1978-05-12');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [patientComments, setPatientComments] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const providerName = 'Shield Healthcare';
  const policyNumber = 'POL-100223';
  const groupNumber = 'GRP-8829';
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) return;

    setSubmitting(true);
    try {
      const patient = await submitIntake({
        firstName,
        lastName,
        dateOfBirth: dob,
        email,
        phone,
        primaryDiagnosis,
        patientComments,
        insuranceDetails: { providerName, policyNumber, groupNumber }
      });
      
      if (patient && files.length > 0) {
        await uploadDocument(patient.id, files);
      }

      // Reset form fields
      setFirstName('');
      setLastName('');
      setDob('');
      setEmail('');
      setPhone('');
      setPrimaryDiagnosis('');
      setPatientComments('');
      setFiles([]);
      if (patient) {
        setSelectedPatientId(patient.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className={`grid grid-cols-1 ${currentRole === 'patient' ? 'md:max-w-3xl md:mx-auto' : 'lg:grid-cols-12'} gap-6`}>
      
      {/* Left Column: Forms & Uploader */}
      <div className={`${currentRole === 'patient' ? 'w-full' : 'lg:col-span-5'} space-y-6`}>
        
        {/* Step 1: Demographic Form */}
        <section className="clinical-card">
          <div className="flex items-center space-x-2 mb-5">
            <User className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold text-white font-display">New Patient Registration</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="clinical-input-label">First Name</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="clinical-input mt-1.5"
                  required
                />
              </div>
              <div>
                <label className="clinical-input-label">Last Name</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="clinical-input mt-1.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="clinical-input-label">Date of Birth</label>
                <input 
                  type="date" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)}
                  className="clinical-input mt-1.5"
                  required
                />
              </div>
              <div>
                <label className="clinical-input-label">Phone</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-0100"
                  className="clinical-input mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="clinical-input-label">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@hospital.org"
                className="clinical-input mt-1.5"
                required
              />
            </div>

            <div>
              <label className="clinical-input-label">Primary Clinical Diagnosis / Notes</label>
              <textarea 
                value={primaryDiagnosis} 
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                placeholder="E.g., Breast Carcinoma Stage III, presenting symptoms..."
                rows={2}
                className="clinical-input mt-1.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="clinical-input-label">Patient Comments / Condition Description</label>
              <textarea
                value={patientComments}
                onChange={(e) => setPatientComments(e.target.value)}
                className="clinical-input min-h-[80px] mt-1.5"
                placeholder="Describe your current condition, symptoms, or any specific concerns..."
              />
            </div>

            {/* Document Uploader within Form */}
            <div className="mt-6 border-t border-[var(--color-border)] pt-6">
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--accent-cyan)]/50 hover:bg-slate-900/30 transition-all group cursor-pointer relative overflow-hidden">
                <input 
                  type="file" 
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(Array.from(e.target.files));
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none relative z-0">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-[var(--accent-cyan)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Upload Pathology or Referral Documents</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Accepts multiple PDFs or Images (JPG, PNG)</p>
                  </div>
                </div>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 p-4 bg-slate-900/50 border border-[var(--color-border)] rounded-xl">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Selected Files ({files.length}):</p>
                  <ul className="space-y-1.5">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center space-x-2 text-sm text-white">
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />
                        <span className="truncate">{f.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="clinical-btn-primary w-full mt-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Registration & Upload</span>}
            </button>
          </form>
        </section>


      </div>

      {/* Right Column: Active Patient Registry & OCR Checklist */}
      {currentRole !== 'patient' && (
        <div className="lg:col-span-7 space-y-6">
        
        {/* Active Patients Registry Queue */}
        <section className="clinical-card h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-5 h-5 text-[var(--accent-cyan)] animate-pulse" />
              <h2 className="text-lg font-bold text-white font-display">Patient Triage & Registration Queue</h2>
            </div>
            <span className="text-xs bg-slate-900 border border-[var(--color-border)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full">
              {patients.length} Registered
            </span>
          </div>

          <div className="flex-grow space-y-3 overflow-y-auto pr-1 max-h-[480px]">
            {patients.map((patient) => {
              const isSelected = selectedPatientId === patient.id;
              
              // Urgency badge styles
              let urgencyBadge = 'badge-routine';
              if (patient.urgencyLevel === 'EMERGENT') urgencyBadge = 'badge-emergent';
              if (patient.urgencyLevel === 'URGENT') urgencyBadge = 'badge-urgent';

              // Verification status styles
              const docsForPatient = documents.filter(d => d.patientId === patient.id);
              const isProcessing = docsForPatient.some(d => d.status === 'processing');
              const isIncomplete = docsForPatient.some(d => d.status === 'incomplete') || patient.status === 'incomplete';
              const isProcessed = patient.status === 'processed' && docsForPatient.length > 0 && !isProcessing && !isIncomplete;

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900/60 border-[var(--accent-cyan)]/40 shadow-[0_0_15px_-5px_rgba(6,182,212,0.15)] glow-cyan'
                      : 'bg-[var(--bg-surface-elevated)]/40 border-[var(--color-border)] hover:border-slate-700 hover:bg-slate-900/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm">{patient.firstName} {patient.lastName}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">DOB: {patient.dateOfBirth} | ID: {patient.id}</div>
                    {patient.primaryDiagnosis && (
                      <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[220px]">{patient.primaryDiagnosis}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urgencyBadge}`}>
                      {patient.urgencyLevel || 'PENDING'}
                    </span>

                    {isProcessing ? (
                      <span className="inline-flex items-center space-x-1.5 text-[11px] text-[var(--accent-cyan)] animate-pulse font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Scanning OCR...</span>
                      </span>
                    ) : isIncomplete ? (
                      <span className="inline-flex items-center space-x-1.5 text-[11px] text-[var(--accent-rose)] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Missing Checklist</span>
                      </span>
                    ) : isProcessed ? (
                      <span className="inline-flex items-center space-x-1.5 text-[11px] text-[var(--accent-emerald)] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Checklist Verified</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] italic">No Docs Scan</span>
                    )}
                  </div>

                  <div className="text-right self-end sm:self-center">
                    <button
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        querySlots(patient.id, "oncology");
                        setActiveTab("scheduling");
                      }}
                      className={`inline-flex items-center space-x-1 text-xs px-3.5 py-2 rounded-xl font-bold transition-all ${
                        isProcessed
                          ? 'bg-[var(--accent-cyan)] text-white hover:bg-[var(--accent-cyan)]/95 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-800/50 text-[var(--text-muted)] border border-slate-800 pointer-events-none'
                      }`}
                    >
                      <span>Schedule</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checklist Panel details for selected patient */}
          {selectedPatient && (
            <div className="mt-6 border-t border-[var(--color-border)] pt-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-white mb-2 font-display">
                Checklist Audit: <span className="text-[var(--accent-cyan)]">{selectedPatient.firstName} {selectedPatient.lastName}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--color-border)]">
                <div>
                  <h4 className="text-xs text-[var(--text-secondary)] font-medium mb-2">Required Core Oncology Items</h4>
                  <ul className="space-y-1.5 text-xs">
                    {/* Checklist items */}
                    <li className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">1. Patient Name & DOB</span>
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">2. Primary Diagnosis Match</span>
                      {selectedPatient.primaryDiagnosis ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[var(--accent-rose)]" />
                      )}
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">3. Pathology Biopsy Report</span>
                      {documents.some(d => d.patientId === selectedPatient.id && d.status === 'processed') ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[var(--accent-rose)]" />
                      )}
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">4. Staging Data (TNM)</span>
                      {documents.some(d => d.patientId === selectedPatient.id && d.status === 'processed' && d.metadata.staging) ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[var(--accent-rose)]" />
                      )}
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs text-[var(--text-secondary)] font-medium mb-2">AI Extraction Metadata</h4>
                  <div className="space-y-2 text-xs">
                    {documents.filter(d => d.patientId === selectedPatient.id && d.status === 'processed').map((doc) => (
                      <div key={doc.id} className="bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--color-border)]">
                        <div className="font-semibold text-white flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                          <span>{doc.filename}</span>
                        </div>
                        <div className="mt-1 text-[10px] space-y-0.5 text-[var(--text-secondary)]">
                          <div><strong>Extracted Name:</strong> {doc.metadata.patientName}</div>
                          <div><strong>Extracted DOB:</strong> {doc.metadata.dob}</div>
                          <div><strong>Cancer Stage:</strong> {doc.metadata.staging || doc.metadata.stage}</div>
                        </div>
                      </div>
                    ))}
                    {documents.filter(d => d.patientId === selectedPatient.id && d.status === 'incomplete').map((doc) => (
                      <div key={doc.id} className="bg-rose-950/20 p-2 rounded-lg border border-rose-900/30 text-rose-300">
                        <div className="font-semibold flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-rose)]" />
                          <span>{doc.filename} (Blocked Gate)</span>
                        </div>
                        <div className="mt-1 text-[10px]">
                          <strong>Missing Sections:</strong> {doc.missingSections.join(', ')}
                        </div>
                      </div>
                    ))}
                    {!documents.some(d => d.patientId === selectedPatient.id) && (
                      <div className="text-[var(--text-muted)] italic text-center py-4">No documents scanned for metadata.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      )}
    </div>
  );
}
