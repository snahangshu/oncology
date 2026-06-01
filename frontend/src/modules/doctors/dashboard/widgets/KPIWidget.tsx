import { Activity, AlertCircle, MessageSquare, CheckCircle, TrendingUp, TrendingDown, Users } from 'lucide-react';

export function KPIWidget() {
  // Sparkline data lines (custom paths for premium visualization)
  const sparklines = {
    patients: "M0 25 Q15 28 30 15 T60 10 T90 2 L100 2",
    treatments: "M0 15 Q25 20 50 12 T85 10 L100 12",
    reviews: "M0 8 Q20 22 40 5 T75 18 L100 15",
    alerts: "M0 2 Q20 8 40 22 T80 25 L100 28",
    messages: "M0 25 Q20 20 40 8 T80 5 L100 12",
  };

  return (
    <div className="space-y-6">
      {/* Infusion Center Status Banner */}
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Infusion Center Status</span>
            <span className="text-[10px] text-slate-500 font-medium">Real-time capacity tracking</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 md:gap-12">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Chair Occupancy:</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-white">18</span>
              <span className="text-xs text-slate-500">/</span>
              <span className="text-xs text-slate-500 font-bold">24</span>
            </div>
            {/* Simple mini progress bar */}
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Active Delays:</span>
            <span className="bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-500/25">
              2 Patients
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Escalations:</span>
            <span className="bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-500/25 animate-pulse">
              1 Critical
            </span>
          </div>
        </div>

        <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
          Demo Data
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Patients Today */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Patients Today</div>
              <div className="text-3xl font-black text-white font-display">18</div>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-4 z-10">
            <div className="flex items-center text-xs text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% vs LW
            </div>
          </div>

          {/* SVG Sparkline Background */}
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-patients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={sparklines.patients} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.patients} L100 30 L0 30 Z`} fill="url(#gradient-patients)" />
            </svg>
          </div>
        </div>

        {/* Active Treatments */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Active Treatments</div>
              <div className="text-3xl font-black text-white font-display">46</div>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-4 z-10">
            <div className="text-xs text-slate-400 font-medium">
              Steady state • 4 discharged
            </div>
          </div>

          {/* SVG Sparkline Background */}
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-treatments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={sparklines.treatments} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.treatments} L100 30 L0 30 Z`} fill="url(#gradient-treatments)" />
            </svg>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Pending Reviews</div>
              <div className="text-3xl font-black text-white font-display">7</div>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-4 z-10">
            <div className="flex items-center text-xs text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10">
              Needs immediate action
            </div>
          </div>

          {/* SVG Sparkline Background */}
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-reviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={sparklines.reviews} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.reviews} L100 30 L0 30 Z`} fill="url(#gradient-reviews)" />
            </svg>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden group hover:border-red-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Critical Alerts</div>
              <div className="text-3xl font-black text-red-400 font-display">2</div>
            </div>
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 animate-pulse">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-4 z-10">
            <div className="flex items-center text-xs text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
              <TrendingDown className="w-3 h-3 mr-1" />
              -3 from yesterday
            </div>
          </div>

          {/* SVG Sparkline Background */}
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-alerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={sparklines.alerts} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.alerts} L100 30 L0 30 Z`} fill="url(#gradient-alerts)" />
            </svg>
          </div>
        </div>

        {/* Messages */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Messages</div>
              <div className="text-3xl font-black text-white font-display">12</div>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-4 z-10">
            <div className="flex items-center text-xs text-purple-400 font-bold bg-purple-500/5 px-2 py-0.5 rounded-md border border-purple-500/10">
              4 Unread
            </div>
          </div>

          {/* SVG Sparkline Background */}
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-messages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={sparklines.messages} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.messages} L100 30 L0 30 Z`} fill="url(#gradient-messages)" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
