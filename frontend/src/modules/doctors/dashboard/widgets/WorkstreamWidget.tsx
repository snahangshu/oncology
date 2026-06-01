import { Activity, CheckCircle2, UserCheck, MessageSquare } from 'lucide-react';

export function WorkstreamWidget() {
  return (
    <div className="clinical-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <Activity className="w-4 h-4 mr-2 text-emerald-400" />
          Live Workstream Feed
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Demo Data</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Patient Care Group */}
        <div>
          <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">Patient Care</h4>
          <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-3">
            <div className="flex items-start space-x-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">Sarah M. Checked In</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-mono">09:05 AM</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Activity className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">CBC Resulted: Normal</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-mono">09:12 AM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Approvals Group */}
        <div>
          <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">Approvals</h4>
          <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-3">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">Chemotherapy Order Signed</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-mono">09:18 AM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Communications Group */}
        <div>
          <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">Communications</h4>
          <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-3">
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">Message from Infusion Nurse</div>
                <div className="text-[10px] text-[var(--text-secondary)]">"Patient BP stable, starting cycle."</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">09:22 AM</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
