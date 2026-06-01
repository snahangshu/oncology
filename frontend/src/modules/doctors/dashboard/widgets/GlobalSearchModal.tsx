import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useAppState } from '../../../../shared/store';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patientId: number) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onSelectPatient }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const { doctorAppointments } = useAppState();

  // Simple local filter of all known patients/appointments based on query
  // In a real app, this would hit a global backend search endpoint.
  const results = doctorAppointments.filter(apt => 
    apt.patientName.toLowerCase().includes(query.toLowerCase()) ||
    apt.patientId.toString().includes(query) ||
    (apt.primaryDiagnosis || '').toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      // Focus input would go here
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Search Input Area */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
          <Search className="w-6 h-6 text-cyan-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search by Name, MRN, Diagnosis, or Protocol..."
            className="flex-1 bg-transparent text-lg text-white placeholder-slate-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 bg-slate-950/50">
          {!query ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              <p>Type to search across all patients, protocols, and clinical trials.</p>
              <div className="flex justify-center gap-2 mt-4">
                <span className="px-2 py-1 bg-slate-900 rounded text-xs border border-slate-800">MRN: 1042</span>
                <span className="px-2 py-1 bg-slate-900 rounded text-xs border border-slate-800">Breast Cancer</span>
                <span className="px-2 py-1 bg-slate-900 rounded text-xs border border-slate-800">Paxlovid</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              No results found for "{query}".
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Patients ({results.length})</div>
              {results.map(pt => (
                <div 
                  key={pt.id} 
                  onClick={() => {
                    onSelectPatient(pt.patientId);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-400 font-bold group-hover:bg-cyan-900 transition-colors">
                      {pt.patientName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{pt.patientName}</div>
                      <div className="text-xs text-[var(--text-secondary)]">MRN: {pt.patientId} • {pt.primaryDiagnosis || 'No Diagnosis'}</div>
                    </div>
                  </div>
                  <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                    pt.urgencyLevel === 'EMERGENT' ? 'bg-red-500/20 text-red-400' : 
                    pt.urgencyLevel === 'URGENT' ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {pt.urgencyLevel || 'ROUTINE'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-900 p-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
          <span>Use <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">↑</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">↓</kbd> to navigate</span>
          <span>Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
