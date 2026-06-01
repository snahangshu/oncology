import { useState } from 'react';
import { useAppState } from '../../../../shared/store';
import { Clock, Calendar, Video, FileText, ChevronLeft, ChevronRight, CheckCircle2, Activity } from 'lucide-react';

interface VisualCalendarWidgetProps {
  onSelectPatient: (patientId: number) => void;
}

export function VisualCalendarWidget({ onSelectPatient }: VisualCalendarWidgetProps) {
  const { doctorAppointments } = useAppState();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const currentTime = new Date('2026-05-30T10:15:00');

  // Scale: 1.2px per minute (10 hours = 600 mins = 720px height)
  const scale = 1.25; 
  const startHour = 8; // 8:00 AM
  const endHour = 18;  // 6:00 PM
  const totalMinutes = (endHour - startHour) * 60; // 600 minutes

  // Generate hours list for Y-axis labels
  const hours = [];
  for (let h = startHour; h <= endHour; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h;
    hours.push({ raw: h, label: `${displayHour}:00 ${period}` });
  }

  // Pre-process appointments to fit today's visual view grid
  const processedAppointments = doctorAppointments.map((apt, idx) => {
    const start = new Date(apt.startTime);
    const end = new Date(apt.endTime);
    
    // Fallback: If DB contains stale times or dates in past, mock them for visual display on "May 30, 2026"
    let startMins = start.getHours() * 60 + start.getMinutes();
    let endMins = end.getHours() * 60 + end.getMinutes();

    // If times are invalid or identical, distribute them as mocks
    if (isNaN(startMins) || isNaN(endMins) || startMins === endMins) {
      const mockSlots = [
        { start: 540, end: 600 },  // 09:00 - 10:00
        { start: 630, end: 690 },  // 10:30 - 11:30
        { start: 780, end: 840 },  // 13:00 - 14:00
        { start: 900, end: 960 },  // 15:00 - 16:00
        { start: 990, end: 1050 }  // 16:30 - 17:30
      ];
      const slot = mockSlots[idx % mockSlots.length];
      startMins = slot.start;
      endMins = slot.end;
    }

    const duration = endMins - startMins;
    const top = (startMins - startHour * 60) * scale;
    const height = duration * scale;

    // Distribute into columns: Telehealth, Consultation, Infusion Review
    let lane = 1; // Default: consults
    if (apt.specialty?.toLowerCase().includes('telehealth') || idx % 3 === 0) {
      lane = 0; // Telehealth
    } else if (apt.urgencyLevel === 'EMERGENT' || idx % 3 === 2) {
      lane = 2; // Infusion Reviews / High Urgency
    }

    return {
      ...apt,
      top,
      height,
      lane,
      startTimeDisplay: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      endTimeDisplay: end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
  });

  // Calculate current time line offset
  const nowHour = currentTime.getHours();
  const nowMins = currentTime.getMinutes();
  const currentTimeOffset = (nowHour * 60 + nowMins - startHour * 60) * scale;
  const isTimeMarkerInBounds = currentTimeOffset >= 0 && currentTimeOffset <= (totalMinutes * scale);

  // Month navigation mock
  const [selectedCalDay, setSelectedCalDay] = useState(30);
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
      
      {/* Calendar Control Sidebar (Left 3 Columns) */}
      <div className="xl:col-span-3 space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-5 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
              Scheduler Focus
            </span>
          </div>

          {/* Mini Month Grid */}
          <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-900">
            <div className="flex justify-between items-center text-xs text-white font-bold">
              <span>May 2026</span>
              <div className="flex space-x-1.5">
                <button className="p-1 hover:bg-slate-800 rounded transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:bg-slate-800 rounded transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-bold uppercase">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Padding for May starting on Friday (5 blank slots) */}
              {Array.from({ length: 5 }).map((_, i) => <span key={`b-${i}`} className="p-1" />)}
              {calendarDays.map((d) => {
                const isSelected = selectedCalDay === d;
                const hasAppts = d === 28 || d === 29 || d === 30; // Mark days with appts
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedCalDay(d)}
                    className={`p-1.5 rounded-lg font-bold text-center transition-all ${
                      isSelected 
                        ? 'bg-cyan-500 text-white font-black shadow-lg shadow-cyan-500/20' 
                        : hasAppts 
                        ? 'text-cyan-400 hover:bg-slate-800 border border-cyan-500/20' 
                        : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Schedule Summary Metrics */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Shift Statistics</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between bg-slate-950/50 p-2.5 rounded-lg border border-slate-900">
                <span className="text-slate-400 font-medium">Scheduled Block:</span>
                <span className="font-bold text-white">09:00 - 17:00</span>
              </div>
              <div className="flex justify-between bg-slate-950/50 p-2.5 rounded-lg border border-slate-900">
                <span className="text-slate-400 font-medium">Completed Encounters:</span>
                <span className="font-bold text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 2 cases
                </span>
              </div>
              <div className="flex justify-between bg-slate-950/50 p-2.5 rounded-lg border border-slate-900">
                <span className="text-slate-400 font-medium">Remaining Appointments:</span>
                <span className="font-bold text-cyan-400">{doctorAppointments.length} cases</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Calendar Timeline (Right 9 Columns) */}
      <div className="xl:col-span-9 flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Calendar Day Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-display">
              Saturday, May 30, 2026
            </h3>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button 
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg transition-colors ${viewMode === 'day' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/10' : 'text-slate-400 hover:text-white'}`}
            >
              Day
            </button>
            <button 
              onClick={() => alert("Weekly planning mode is currently in mock mode.")}
              className={`px-3 py-1 rounded-lg transition-colors text-slate-500 cursor-not-allowed`}
              disabled
            >
              Week
            </button>
          </div>
        </div>

        {/* Timeline Columns Header */}
        <div className="grid grid-cols-12 border-b border-slate-800 text-[10px] uppercase font-black text-slate-500 tracking-wider text-center py-2 bg-slate-950/20">
          <div className="col-span-2 border-r border-slate-800/50">Timeline</div>
          <div className="col-span-3 border-r border-slate-800/50 text-indigo-400 flex items-center justify-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Virtual Telehealth
          </div>
          <div className="col-span-4 border-r border-slate-800/50 text-cyan-400 flex items-center justify-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> In-Clinic Consults
          </div>
          <div className="col-span-3 text-emerald-400 flex items-center justify-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Infusion Reviews
          </div>
        </div>

        {/* Scrollable Timeline Grid */}
        <div className="flex-1 overflow-y-auto relative min-h-[550px]" style={{ height: `${totalMinutes * scale + 40}px` }}>
          
          {/* Hourly gridlines */}
          {hours.map((hour, idx) => {
            const topPos = idx * 60 * scale;
            return (
              <div 
                key={hour.raw} 
                className="absolute left-0 right-0 border-b border-slate-800/40 flex items-center"
                style={{ top: `${topPos}px`, height: `${60 * scale}px` }}
              >
                <div className="w-[16.6666%] pr-4 text-right text-[10px] font-bold text-slate-500 select-none">
                  {hour.label}
                </div>
                <div className="flex-1 h-full border-l border-slate-800/50" />
              </div>
            );
          })}

          {/* Lane Divider Overlay */}
          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
            <div className="col-span-2 border-r border-slate-800/50" />
            <div className="col-span-3 border-r border-slate-800/50" />
            <div className="col-span-4 border-r border-slate-800/50" />
            <div className="col-span-3" />
          </div>

          {/* Current Time Laser Indicator Line */}
          {isTimeMarkerInBounds && (
            <div 
              className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: `${currentTimeOffset}px` }}
            >
              <div className="w-[16.6666%] pr-2 text-right">
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-lg">
                  10:15 AM
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 to-transparent relative">
                <div className="absolute left-0 w-2 h-2 -translate-y-1/2 rounded-full bg-red-400 shadow-[0_0_8px_#f43f5e]" />
              </div>
            </div>
          )}

          {/* Appointment blocks */}
          {processedAppointments.map((apt) => {
            // Determine grid column offsets depending on the lane index
            let gridColClass = "";
            if (apt.lane === 0) gridColClass = "left-[16.6666%] w-[25%]";      // Telehealth
            else if (apt.lane === 1) gridColClass = "left-[41.6666%] w-[33.3333%]"; // Consults
            else gridColClass = "left-[75%] w-[25%]";                       // Infusions

            // Select color coding styling based on urgency level
            const isEmergent = apt.urgencyLevel === 'EMERGENT';
            const isUrgent = apt.urgencyLevel === 'URGENT';
            const badgeColor = 
              isEmergent ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:border-red-400/50 hover:shadow-red-950/20' : 
              isUrgent ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400/50 hover:shadow-amber-950/20' : 
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400/50 hover:shadow-emerald-950/20';

            return (
              <div
                key={apt.id}
                onClick={() => onSelectPatient(apt.patientId)}
                className={`absolute p-3 border rounded-xl cursor-pointer transition-all duration-300 shadow-md flex flex-col justify-between overflow-hidden group hover:scale-[1.01] hover:shadow-xl hover:z-10 select-none ${gridColClass} ${badgeColor}`}
                style={{ 
                  top: `${apt.top}px`, 
                  height: `${apt.height}px`,
                }}
              >
                {/* Background glow gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                      {apt.startTimeDisplay} - {apt.endTimeDisplay}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                      isEmergent ? 'bg-red-500/20 text-red-400' : isUrgent ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {apt.urgencyLevel || 'ROUTINE'}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                    {apt.patientName}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium truncate">
                    {apt.primaryDiagnosis || 'Clinical Review'}
                  </p>
                </div>

                <div className="relative z-10 flex justify-between items-center text-[8px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                  <span>MRN: {apt.patientId}</span>
                  {apt.lane === 0 && <span className="flex items-center text-indigo-400"><Video className="w-2.5 h-2.5 mr-0.5" /> Virtual</span>}
                  {apt.lane === 1 && <span className="flex items-center text-cyan-400"><FileText className="w-2.5 h-2.5 mr-0.5" /> Room 102</span>}
                  {apt.lane === 2 && <span className="flex items-center text-emerald-400"><Activity className="w-2.5 h-2.5 mr-0.5" /> Chair 04</span>}
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
