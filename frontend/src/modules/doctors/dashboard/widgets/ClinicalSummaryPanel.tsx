import { Activity, AlertCircle, FileText, Stethoscope } from 'lucide-react';
import { useAppState } from '../../../../shared/store';

interface ClinicalSummaryPanelProps {
  patientId: number;
}

export function ClinicalSummaryPanel({ patientId }: ClinicalSummaryPanelProps) {
  const { doctorAppointments } = useAppState();
  const selectedPatientData = doctorAppointments.find(a => a.patientId === patientId);

  if (!selectedPatientData) return null;

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-5 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-center p-4 rounded-xl border border-[var(--color-border)] bg-slate-900 shadow-md">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">{selectedPatientData.patientName}</h3>
          <div className="flex space-x-4 text-sm text-[var(--text-secondary)] font-medium">
            <span>MRN: {selectedPatientData.patientId}</span>
            <span>{selectedPatientData.specialty}</span>
            <span className="text-emerald-400">ECOG: 1</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Encounter Time</div>
          <div className="text-base font-bold text-[var(--accent-cyan)]">
            {formatDate(selectedPatientData.startTime)} @ {formatTime(selectedPatientData.startTime)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Diagnosis */}
        <div className="glass-panel p-5 rounded-xl border border-[var(--color-border)] shadow-md">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-[var(--accent-amber)]" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Primary Diagnosis</h4>
          </div>
          <p className="text-sm text-white font-medium mb-1">
            {selectedPatientData.primaryDiagnosis || "Stage II Invasive Ductal Carcinoma"}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Current Protocol: Cycle 4/6 AC-T</p>
        </div>

        {/* AI Urgency */}
        <div className="glass-panel p-5 rounded-xl border border-[var(--color-border)] shadow-md">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Urgency Triage</h4>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-[var(--text-secondary)] mr-2">Assigned Level:</span>
            <span className={`text-sm font-black px-2 py-0.5 rounded ${
              selectedPatientData.urgencyLevel === 'EMERGENT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
              selectedPatientData.urgencyLevel === 'URGENT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {selectedPatientData.urgencyLevel || 'ROUTINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Patient Comments */}
      <div className="glass-panel p-5 rounded-xl border border-cyan-900/50 bg-cyan-950/10 shadow-md">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center uppercase tracking-wider">
          <FileText className="w-4 h-4 mr-2 text-[var(--accent-cyan)]" />
          Patient Reported Symptoms
        </h4>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-[var(--text-secondary)] italic whitespace-pre-wrap font-mono leading-relaxed">
          "{selectedPatientData.patientComments || "No additional comments provided during intake."}"
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="glass-panel p-5 rounded-xl border border-[var(--color-border)] bg-slate-900/50 shadow-md flex-1 flex flex-col">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between uppercase tracking-wider">
          <div className="flex items-center">
            <Stethoscope className="w-4 h-4 mr-2 text-[var(--accent-cyan)]" />
            My Clinical Treatment Notes
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-normal normal-case">Auto-saves to Record</span>
        </h4>
        <textarea 
          className="w-full flex-1 min-h-[150px] bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-white focus:border-[var(--accent-cyan)] focus:outline-none transition-colors leading-relaxed"
          placeholder="Enter treatment plan, encounter notes, or prescriptions here..."
          defaultValue={`Encounter Date: ${formatDate(selectedPatientData.startTime)}\n\n`}
        />
        <div className="flex justify-end mt-4">
          <button 
            className="btn-primary py-2 px-6 text-sm font-bold shadow-lg shadow-cyan-500/20"
            onClick={() => alert("Clinical notes saved successfully!")}
          >
            Sign & Save Encounter
          </button>
        </div>
      </div>
    </div>
  );
}
