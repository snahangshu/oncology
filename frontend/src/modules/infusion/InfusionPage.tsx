import { useState } from 'react';
import { useAppState } from '../../shared/store';
import { Activity, Users, ShieldAlert, AlertTriangle, AlertCircle, X, Loader2 } from 'lucide-react';

export function InfusionPage() {
  const { patients, assignments, applyOverride, addNotification, currentRole } = useAppState();

  // Override Form State
  const [patientId, setPatientId] = useState<number | null>(null);
  const [chairId, setChairId] = useState<number>(1);
  const [nurseId, setNurseId] = useState<number>(1);
  const date = '2026-06-01';
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('11:00');
  const [justification, setJustification] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // Chairs list
  const chairs = [1, 2, 3, 4];
  // Nurses list
  const nurses = [1, 2, 3];

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !justification) return;

    setSubmitting(true);
    const startIso = `${date}T${startTimeStr}:00`;
    const endIso = `${date}T${endTimeStr}:00`;

    try {
      const res = await applyOverride({
        patientId,
        chairId,
        nurseId,
        startTime: startIso,
        endTime: endIso,
        justification
      });

      if (!res.success && res.conflictDescription) {
        setConflictMessage(res.conflictDescription);
        setShowConflictModal(true);
      } else {
        addNotification(`Manual override approved: Chair ${chairId} assigned to Patient ID ${patientId}`);
        // Reset form
        setJustification('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getPatientName = (id: number) => {
    const p = patients.find(pat => pat.id === id);
    return p ? `${p.firstName} ${p.lastName}` : `Patient #${id}`;
  };

  // Helper to format iso date to friendly hour
  const formatHour = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Visual Resource Timeline Board */}
      <div className={`${currentRole === 'nurse' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
        <section className="clinical-card">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[var(--accent-cyan)] animate-pulse" />
              <h2 className="text-lg font-bold text-white font-display">Infusion Chair Allocation Timeline</h2>
            </div>
            <div className="flex space-x-2 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-cyan-500 to-blue-500 block"></span>
                <span className="text-[var(--text-secondary)]">Allocated</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-[var(--color-border)] block"></span>
                <span className="text-[var(--text-secondary)]">Available</span>
              </span>
            </div>
          </div>

          {/* Timeline Grid layout */}
          <div className="space-y-4">
            {chairs.map((chairNum) => {
              // Find assignments for this chair
              const chairAssignments = assignments.filter(a => a.chairId === chairNum);

              return (
                <div key={chairNum} className="grid grid-cols-12 gap-4 items-center bg-[var(--bg-surface-elevated)]/40 p-4 rounded-2xl border border-[var(--color-border)] hover:border-slate-700 transition-all">
                  {/* Chair Identifier */}
                  <div className="col-span-3">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">RESOURCE</span>
                    <h3 className="text-sm font-bold text-white font-display">Infusion Chair #{chairNum}</h3>
                  </div>

                  {/* Allocated Time Blocks */}
                  <div className="col-span-9 flex gap-2 flex-wrap">
                    {chairAssignments.length === 0 ? (
                      <div className="w-full text-center py-2 bg-slate-900/30 border border-dashed border-[var(--color-border)] text-xs text-[var(--text-muted)] rounded-lg">
                        No active clinical allocations for today
                      </div>
                    ) : (
                      chairAssignments.map((a, i) => (
                        <div key={i} className="flex-1 min-w-[220px] bg-gradient-to-r from-slate-900 to-cyan-950/50 border border-[var(--accent-cyan)]/30 p-3.5 rounded-xl flex justify-between items-center relative overflow-hidden shadow-lg shadow-cyan-950/20 group hover:border-[var(--accent-cyan)]/60 transition-all">
                          {/* Accent glowing border */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-cyan)]"></div>
                          
                          <div className="pl-2">
                            <span className="text-[10px] text-[var(--text-cyan)] font-bold tracking-wide uppercase">Patient Info</span>
                            <div className="text-xs font-semibold text-white">{getPatientName(a.patientId || 0)}</div>
                            <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center space-x-2">
                              <span>Hours: {formatHour(a.startTime)} - {formatHour(a.endTime)}</span>
                              <span>•</span>
                              <span className="text-[var(--accent-emerald)]">Nurse {a.nurseId}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/80 border border-slate-700 text-[10px] text-white px-2 py-0.5 rounded mr-1">
                            Locked
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Medical Nurse Workload Ratio Monitor */}
        <section className="clinical-card">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold text-white font-display">Nurse Staffing Workload Ratio Monitor</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nurses.map((nurseNum) => {
              // Count patient assignments for this nurse
              const activeCount = assignments.filter(a => a.nurseId === nurseNum).length;
              const ratioExceeded = activeCount >= 2;

              return (
                <div key={nurseNum} className={`p-5 rounded-2xl border transition-all ${
                  ratioExceeded 
                    ? 'bg-rose-950/10 border-[var(--accent-rose)]/40 shadow-[0_0_15px_-5px_rgba(244,63,94,0.15)] glow-rose' 
                    : 'bg-[var(--bg-surface-elevated)]/40 border-[var(--color-border)] hover:border-slate-700'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white">Clinical Nurse #{nurseNum}</h3>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Shift bounds: 8:00 AM - 4:00 PM</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      ratioExceeded ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {activeCount}/2 Load
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        ratioExceeded ? 'bg-[var(--accent-rose)]' : 'bg-[var(--accent-emerald)]'
                      }`}
                      style={{ width: `${Math.min((activeCount / 2) * 100, 100)}%` }}
                    ></div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-[10px]">
                    <span className="text-[var(--text-secondary)]">Workload Status:</span>
                    <span className={ratioExceeded ? 'text-[var(--accent-rose)] font-semibold' : 'text-[var(--accent-emerald)]'}>
                      {ratioExceeded ? 'Ratio Limit Met' : 'Safe Operating Margins'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Right Column: Override Control Matrix Form */}
      {currentRole === 'nurse' && (
      <div className="lg:col-span-4 space-y-6">
        <section className="clinical-card">
          <div className="flex items-center space-x-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-[var(--accent-rose)]" />
            <h2 className="text-lg font-bold text-white font-display">Resource Safety Override Matrix</h2>
          </div>

          <form onSubmit={handleApplyOverride} className="space-y-4">
            <div>
              <label className="clinical-input-label">Target Patient</label>
              <select
                value={patientId || ''}
                onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : null)}
                className="w-full mt-1 px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent-cyan)] focus:bg-slate-900 focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all"
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} (ID: {p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="clinical-input-label">Target Chair</label>
                <select
                  value={chairId}
                  onChange={(e) => setChairId(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent-cyan)] focus:bg-slate-900 focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all"
                >
                  {chairs.map(num => (
                    <option key={num} value={num}>Chair #{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="clinical-input-label">Clinical Nurse</label>
                <select
                  value={nurseId}
                  onChange={(e) => setNurseId(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent-cyan)] focus:bg-slate-900 focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all"
                >
                  {nurses.map(num => (
                    <option key={num} value={num}>Nurse #{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="clinical-input-label">Start Time</label>
                <input 
                  type="time" 
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent-cyan)] focus:bg-slate-900 focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all"
                  required
                />
              </div>

              <div>
                <label className="clinical-input-label">End Time</label>
                <input 
                  type="time" 
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent-cyan)] focus:bg-slate-900 focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="clinical-input-label">Clinician Justification (Audit Required)</label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Required clinical rationale for overriding safety bounds..."
                rows={3}
                className="w-full mt-1 px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:bg-slate-900 focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all"
                required
              />
            </div>

            <div className="bg-rose-950/20 border border-rose-900/30 p-3 rounded-lg text-[10px] text-rose-300">
              <div className="flex space-x-1.5">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[var(--accent-rose)]" />
                <span>
                  <strong>Safety Alert:</strong> Manual override bypasses normal constraints. Proceeding will record this action to the append-only audit trail for compliance verification.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-900/20 text-white flex items-center justify-center space-x-2 text-xs py-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Force Override Assignment</span>}
            </button>
          </form>
        </section>
      </div>
      )}

      {/* SAFETY EXPLAINER MODAL (CONFLICTS TRIGGERED FROM CLAUDE-3.5 OUTLINE) */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel bg-[var(--bg-surface)] border-[var(--accent-rose)] max-w-md w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowConflictModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-[var(--accent-rose)]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">AI Safety Inspector Block</h3>
                <span className="text-[10px] text-rose-400 font-semibold uppercase">Resource Allocation Collision</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--color-border)]">
              {conflictMessage}
            </p>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setShowConflictModal(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Dismiss Warning
              </button>
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setChairId(2); // Automatically set to a safe alternative Chair
                  addNotification("Auto-adjusted target to Chair 2 to resolve scheduling collision.");
                }}
                className="btn-primary text-xs px-4 py-2"
              >
                Resolve: Assign to Chair 2
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
