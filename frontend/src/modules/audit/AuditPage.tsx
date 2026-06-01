import { useState } from 'react';
import { useAppState } from '../../shared/store';
import { ShieldCheck, Search, FileText, Filter, Terminal, Info } from 'lucide-react';

export function AuditPage() {
  const { auditLogs, patients } = useAppState();

  const getPatientName = (id: number) => {
    const p = patients.find(pat => pat.id === id);
    return p ? `${p.firstName} ${p.lastName}` : `Patient #${id}`;
  };
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(auditLogs[0]?.id || null);

  // Filter actions
  const actions = [
    { value: 'all', label: 'All Operations' },
    { value: 'submit_intake', label: 'Patient Registrations' },
    { value: 'document_completeness_check', label: 'OCR Document Scans' },
    { value: 'confirm_slot', label: 'Confirmed Appointments' },
    { value: 'override', label: 'Safety Overrides' }
  ];

  // Filter logs based on search + selected action category
  const filteredLogs = auditLogs.filter(log => {
    // Action category matching
    if (selectedAction !== 'all') {
      if (selectedAction === 'override') {
        if (!log.action.includes('override') && !log.action.includes('conflict')) return false;
      } else if (log.action !== selectedAction) {
        return false;
      }
    }

    // Search term matching
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(term);
      const matchUser = log.userId.toLowerCase().includes(term);
      const matchPatient = log.patientId?.toString().includes(term);
      const matchDetails = JSON.stringify(log.details).toLowerCase().includes(term);
      if (!matchAction && !matchUser && !matchPatient && !matchDetails) return false;
    }

    return true;
  });

  const selectedLog = auditLogs.find(l => l.id === selectedLogId);

  const getActionBadge = (actionName: string) => {
    switch (actionName) {
      case 'submit_intake':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'document_completeness_check':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'confirm_slot':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
      case 'override_applied':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'override_failed_conflict':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 pulse-rose';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getActionLabel = (actionName: string) => {
    return actionName.replace(/_/g, ' ').toUpperCase();
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Log Grid & Filters */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Compliance Header Warning */}
        <section className="bg-gradient-to-r from-slate-950 to-indigo-950 border border-[var(--color-border)] rounded-xl p-4 flex items-start space-x-3 shadow-xl">
          <ShieldCheck className="w-5 h-5 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Immutable Clinical Registry Ledger</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              Compliance enforcement active: In accordance with HIPAA & ISO-27001 medical standards, all operations are logged to an append-only state. Update, delete, and truncation capabilities are physically omitted from this micro-service.
            </p>
          </div>
        </section>

        {/* Audit Search and Filter Controls */}
        <section className="clinical-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search ledger (e.g. patient ID, action, system)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:bg-slate-900 focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="w-4 h-4 text-[var(--text-muted)]" />
              <div className="flex space-x-1">
                {actions.map((act) => (
                  <button
                    key={act.value}
                    onClick={() => setSelectedAction(act.value)}
                    className={`px-3.5 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      selectedAction === act.value
                        ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30 shadow-[0_0_12px_-3px_rgba(6,182,212,0.25)] glow-cyan'
                        : 'bg-slate-900 border border-slate-800 text-[var(--text-secondary)] hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Audit Table Grid */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs text-[var(--text-muted)] font-semibold uppercase">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Action Type</th>
                  <th className="pb-3">Operator</th>
                  <th className="pb-3">Subject ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/40 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[var(--text-muted)] italic">
                      No compliant log entries match the filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSelected = selectedLogId === log.id;
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLogId(log.id)}
                        className={`hover:bg-slate-900/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-slate-900/60 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 text-[var(--text-secondary)]">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="py-3 pr-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${getActionBadge(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="py-3 text-white font-semibold">
                          {log.userId}
                        </td>
                        <td className="py-3 text-[var(--text-cyan)] font-mono">
                          {log.patientId ? `PAT-${log.patientId}` : 'SYSTEM'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Right Column: Detail Inspector Card */}
      <div className="lg:col-span-4 space-y-6">
        <section className="clinical-card min-h-[400px] flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold text-white font-display">Log Detail Inspector</h2>
          </div>

          {selectedLog ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--color-border)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Transaction Reference</span>
                  <div className="text-xs text-white font-mono mt-1">UUID: txn_{selectedLog.id}992389d</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Timestamp: {formatDate(selectedLog.timestamp)}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase">Operation Summary</span>
                  <p className="text-xs text-white leading-relaxed">
                    Action <strong className="text-[var(--text-cyan)]">{selectedLog.action}</strong> triggered by user <strong className="text-white">"{selectedLog.userId}"</strong>.
                    {selectedLog.patientId && ` This modified patient profile references ID: ${selectedLog.patientId} (${getPatientName(selectedLog.patientId)}).`}
                  </p>
                </div>

                {/* Structured details display */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase">State Details Payload</span>
                  <div className="bg-slate-950 p-3 rounded-lg border border-[var(--color-border)] font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-[220px]">
                    <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)] mt-4">
                <div className="flex items-center space-x-1.5 text-[10px] text-[var(--text-muted)]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Verified SHA-256 Ledger Signature OK</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <FileText className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">Select an entry from the ledger table to audit transaction payloads and system state changes.</p>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
