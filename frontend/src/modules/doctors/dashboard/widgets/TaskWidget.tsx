import { CheckSquare, FileSignature, Pill, ClipboardCheck } from 'lucide-react';

export function TaskWidget() {
  return (
    <div className="clinical-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <CheckSquare className="w-4 h-4 mr-2 text-cyan-400" />
          My Tasks & Approvals
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Demo Data</span>
      </div>

      <div className="flex-1 space-y-4">
        {/* Approvals */}
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-2">Pending Approvals (12)</div>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center text-xs text-[var(--text-secondary)]">
                <Pill className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Chemo Regimens
              </div>
              <span className="font-bold text-white">4</span>
            </div>
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center text-xs text-[var(--text-secondary)]">
                <ClipboardCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Lab Requests
              </div>
              <span className="font-bold text-white">3</span>
            </div>
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center text-xs text-[var(--text-secondary)]">
                <FileSignature className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Trial Consents
              </div>
              <span className="font-bold text-white">2</span>
            </div>
          </div>
        </div>

        {/* General Tasks */}
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-2">Workflow Tasks (8)</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs p-2 bg-slate-900/50 rounded-lg">
              <span className="text-[var(--text-secondary)]">Review pathology reports</span>
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">2</span>
            </div>
            <div className="flex justify-between text-xs p-2 bg-slate-900/50 rounded-lg">
              <span className="text-[var(--text-secondary)]">Sign clinical notes</span>
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">5</span>
            </div>
            <div className="flex justify-between text-xs p-2 bg-slate-900/50 rounded-lg">
              <span className="text-[var(--text-secondary)]">Patient messages to reply</span>
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
