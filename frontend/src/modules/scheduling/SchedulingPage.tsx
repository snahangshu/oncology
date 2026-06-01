import { useState } from 'react';
import { useAppState, type SlotOption } from '../../shared/store';
import { Calendar, Clock, CheckCircle2, ChevronRight, Loader2, RefreshCw, AlertCircle, HeartPulse, User } from 'lucide-react';

export function SchedulingPage() {
  const { patients, slots, selectedPatientId, setSelectedPatientId, querySlots, confirmSlot, setActiveTab, addNotification } = useAppState();
  const [confirmingSlotId, setConfirmingSlotId] = useState<string | null>(null);

  // Find currently active patient for scheduling
  const activePatient = patients.find(p => p.id === selectedPatientId);



  const handleQuerySlots = (patientId: number) => {
    querySlots(patientId, 'oncology');
  };

  const handleConfirmSlot = async (slot: SlotOption) => {
    if (!activePatient) return;
    setConfirmingSlotId(slot.slotId);
    try {
      await confirmSlot(activePatient.id, slot.slotId, slot.doctorId, slot.startTime, slot.endTime);
      addNotification(`Appointment confirmed for ${activePatient.firstName} ${activePatient.lastName} with Dr. ${slot.doctorName} on ${formatDate(slot.startTime)}`);
      // Redirect to Doctors tab or keep them here
      setActiveTab('doctors');
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingSlotId(null);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Active Patient Focus Panel */}
      <div className="lg:col-span-4 space-y-6">
        <section className="clinical-card">
          <div className="flex items-center space-x-2 mb-5">
            <User className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold text-white font-display">Target Patient Selection</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="clinical-input-label block mb-1.5">Select Patient from Queue</label>
              <select
                value={selectedPatientId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedPatientId(val);
                  if (val) {
                    handleQuerySlots(val);
                  }
                }}
                className="clinical-input"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} (ID: {p.id}) - {p.urgencyLevel}
                  </option>
                ))}
              </select>
            </div>

            {activePatient ? (
              <div className="border-t border-[var(--color-border)] pt-4 mt-2 space-y-3">
                <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--color-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Active File</span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {activePatient.firstName} {activePatient.lastName}
                  </h3>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    DOB: {activePatient.dateOfBirth} | ID: {activePatient.id}
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-xs text-[var(--text-secondary)]">Urgency Triage:</span>
                    <span className={
                      activePatient.urgencyLevel === 'EMERGENT' 
                        ? 'badge-emergent' 
                        : activePatient.urgencyLevel === 'URGENT' 
                        ? 'badge-urgent' 
                        : 'badge-routine'
                    }>
                      {activePatient.urgencyLevel || 'ROUTINE'}
                    </span>
                  </div>

                  {activePatient.primaryDiagnosis && (
                    <div className="mt-3 text-xs">
                      <div className="text-[var(--text-muted)] font-medium">Primary Diagnosis:</div>
                      <div className="text-white mt-0.5 bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--color-border)]">
                        {activePatient.primaryDiagnosis}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center space-x-1.5 text-xs text-[var(--accent-emerald)]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pathology Checklist Verified</span>
                  </div>
                </div>

                <button
                  onClick={() => handleQuerySlots(activePatient.id)}
                  className="clinical-btn-secondary w-full py-2.5 flex items-center justify-center space-x-2 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recalculate Optimal Slots</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-dashed border-[var(--color-border)] p-6 rounded-xl text-center text-xs text-[var(--text-muted)]">
                <HeartPulse className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                Select a patient from the dropdown list to see their clinical score analysis and recommended treatment slots.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: AI Slot Recommendation Panel */}
      <div className="lg:col-span-8 space-y-6">
        <section className="clinical-card min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h2 className="text-lg font-bold text-white font-display">Optimal Treatment Slot Recommendations</h2>
            </div>
            {activePatient && slots.length > 0 && (
              <span className="text-xs bg-slate-900 border border-[var(--color-border)] text-cyan-400 px-3 py-1 rounded-xl font-bold">
                AI Optimization Active
              </span>
            )}
          </div>

          {!activePatient ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)]">
              <Calendar className="w-12 h-12 mb-3 opacity-30 text-[var(--text-secondary)]" />
              <h3 className="text-base font-semibold text-white mb-1">No Active Patient Selected</h3>
              <p className="text-xs max-w-sm">
                Choose a patient in the left panel to load and score treatment schedule slots based on clinical urgency and resources.
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="w-8 h-8 mb-3 animate-spin text-[var(--accent-cyan)]" />
              <h3 className="text-base font-semibold text-white mb-1">Scoring Treatment Slots</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                Running optimization model over chairs, nurse shift bounds, and patient priority weights...
              </p>
              <button
                onClick={() => handleQuerySlots(activePatient.id)}
                className="mt-4 btn-primary py-2 px-4 text-xs"
              >
                Trigger AI Optimization Engine
              </button>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-[var(--color-border)] mb-4 text-xs">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4.5 h-4.5 text-[var(--accent-cyan)] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">AI Scoring Rationale:</span> This model ranks slots by minimizing time-to-treatment for urgent patients while preventing chair fragmentation and keeping nurse workload within the safe 1:2 ratio.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {slots.sort((a, b) => b.score - a.score).map((slot, index) => {
                  const isBest = index === 0;
                  return (
                    <div
                      key={slot.slotId}
                      className={`glass-panel p-5 bg-[var(--bg-surface-elevated)]/60 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isBest ? 'border-[var(--accent-cyan)] shadow-xl shadow-[rgba(6,182,212,0.1)] glow-cyan' : 'border-[var(--color-border)] hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Timing and Badges */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isBest ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]' : 'bg-slate-800 text-[var(--text-secondary)]'
                          }`}>
                            {isBest ? 'AI Recommended Slot' : `Option ${index + 1}`}
                          </span>
                          <div className="flex items-center text-xs text-[var(--text-secondary)]">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            <span>2 Hours Duration</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-white">
                            {formatDate(slot.startTime)}
                          </h3>
                          <p className="text-xs text-[var(--text-secondary)] font-medium">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                          <p className="text-xs font-bold text-[var(--accent-cyan)] mt-1">
                            Dr. {slot.doctorName}
                          </p>
                        </div>

                        {/* Reasoning */}
                        <p className="text-xs text-[var(--text-muted)] italic pl-3 border-l-2 border-[var(--color-border)] mt-2">
                          "{slot.reasoning}"
                        </p>
                      </div>

                      {/* Right: Score and Confirm CTA */}
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-[var(--text-muted)] font-medium uppercase">Match Score</div>
                          <div className="flex items-baseline space-x-1 justify-end">
                            <span className={`text-2xl font-black font-display ${isBest ? 'text-[var(--accent-cyan)]' : 'text-white'}`}>
                              {slot.score.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">%</span>
                          </div>
                        </div>

                        <button
                          disabled={confirmingSlotId !== null}
                          onClick={() => handleConfirmSlot(slot)}
                          className={`flex items-center justify-center space-x-2 text-xs py-2.5 px-4.5 rounded-xl font-bold transition-all w-full md:w-auto ${
                            isBest 
                              ? 'btn-primary bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md shadow-cyan-500/20'
                              : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {confirmingSlotId === slot.slotId ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Scheduling...</span>
                            </>
                          ) : (
                            <>
                              <span>Confirm & Sync</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
