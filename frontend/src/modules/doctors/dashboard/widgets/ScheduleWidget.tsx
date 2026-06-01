import { Clock, Users, Video, FileCheck2, AlertTriangle } from 'lucide-react';
import { useAppState } from '../../../../shared/store';

export function ScheduleWidget() {
  const { doctorSchedules, doctorAppointments } = useAppState();

  const totalAppts = doctorAppointments.length;
  // Mock data for breakdown to show premium design
  const telehealth = Math.floor(totalAppts * 0.2);
  const procedure = Math.floor(totalAppts * 0.1);
  const freeSlots = 3;

  return (
    <div className="clinical-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <Clock className="w-4 h-4 mr-2 text-blue-400" />
          Today's Schedule Metrics
        </h3>
      </div>

      <div className="flex-1 space-y-4">
        {doctorSchedules.length === 0 ? (
          <div className="text-center text-xs text-[var(--text-muted)] italic py-8 border border-dashed border-slate-800 rounded-xl">
            No active shift scheduled for today.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Shift Block */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-blue-900/10">
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Active Shift Block</div>
                <div className="text-lg font-black text-white font-display flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-400" />
                  {doctorSchedules[0].startTime} - {doctorSchedules[0].endTime}
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-center">
                <div className="text-xl font-black text-emerald-400">{freeSlots}</div>
                <div className="text-[9px] uppercase font-bold text-emerald-500/80">Free Slots</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center text-xs font-bold text-white">
                  <Users className="w-4 h-4 mr-2 text-cyan-400" />
                  Total Appts
                </div>
                <span className="font-black text-lg text-white">{totalAppts}</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center text-xs font-bold text-white">
                  <Video className="w-4 h-4 mr-2 text-indigo-400" />
                  Telehealth
                </div>
                <span className="font-black text-lg text-white">{telehealth}</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center justify-between col-span-2">
                <div className="flex items-center text-xs font-bold text-white">
                  <FileCheck2 className="w-4 h-4 mr-2 text-amber-400" />
                  Procedures & Consults
                </div>
                <span className="font-black text-lg text-white">{procedure}</span>
              </div>
            </div>
            
            {totalAppts > 10 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-400 text-xs font-bold flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                Overbooked Warning: Clinic running 15m behind average.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
