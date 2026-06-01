import { MessageCircle, Users, Activity, FlaskConical } from 'lucide-react';

export function MessageWidget() {
  return (
    <div className="clinical-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-indigo-400" />
          Communications
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Demo Data</span>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center text-sm font-bold text-white">
            <Users className="w-4 h-4 mr-3 text-emerald-400" />
            Patient Messages
          </div>
          <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">6</div>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center text-sm font-bold text-white">
            <Activity className="w-4 h-4 mr-3 text-cyan-400" />
            Nursing Staff
          </div>
          <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">4</div>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center text-sm font-bold text-white">
            <FlaskConical className="w-4 h-4 mr-3 text-amber-400" />
            Pharmacy / Labs
          </div>
          <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2</div>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center text-sm font-bold text-white">
            <Users className="w-4 h-4 mr-3 text-purple-400" />
            Tumor Board
          </div>
          <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">1</div>
        </div>
      </div>
    </div>
  );
}
