import { AlertCircle } from 'lucide-react';

export function AlertWidget() {
  const alerts = [
    { id: 1, type: 'critical', text: 'Grade 4 Neutropenia - J. Smith' },
    { id: 2, type: 'critical', text: 'Missed Treatment (Day 3) - E. Davis' },
    { id: 3, type: 'review', text: 'Abnormal LFTs post-infusion - M. Johnson' },
    { id: 4, type: 'review', text: 'New Pathology Report Available - S. Miller' },
    { id: 5, type: 'review', text: 'Drug Interaction Warning: Paxlovid' },
    { id: 6, type: 'info', text: 'Clinical Trial Match Found - A. Garcia' },
    { id: 7, type: 'info', text: 'Insurance Pre-Auth Approved - T. Brown' },
  ];

  return (
    <div className="clinical-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
          Severity Alerts
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Demo Data</span>
      </div>

      {/* Tiers Summary */}
      <div className="flex space-x-2 mb-4">
        <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-red-400">2</div>
          <div className="text-[10px] text-red-400/80 uppercase font-bold">Critical</div>
        </div>
        <div className="flex-1 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-amber-400">5</div>
          <div className="text-[10px] text-amber-400/80 uppercase font-bold">Needs Review</div>
        </div>
        <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center">
          <div className="text-lg font-black text-emerald-400">8</div>
          <div className="text-[10px] text-emerald-400/80 uppercase font-bold">Info</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[250px]">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-start space-x-2 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
            {alert.type === 'critical' && <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
            {alert.type === 'review' && <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />}
            {alert.type === 'info' && <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0" />}
            
            <span className="text-xs text-[var(--text-secondary)] font-medium leading-tight">{alert.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
