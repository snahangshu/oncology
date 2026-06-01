import { useState } from 'react';
import { Calendar, Search, Stethoscope, Video, FileText } from 'lucide-react';
import { useAppState } from '../../../../shared/store';

interface QueueWidgetProps {
  onSelectPatient: (patientId: number) => void;
}

export function QueueWidget({ onSelectPatient }: QueueWidgetProps) {
  const { doctorAppointments } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'URGENT' | 'ROUTINE'>('ALL');

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "09:30 AM"; // Realistic visual fallback
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Filter queue items
  const filteredAppointments = doctorAppointments.filter(apt => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.primaryDiagnosis || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isAptUrgent = apt.urgencyLevel === 'EMERGENT' || apt.urgencyLevel === 'URGENT';
    const matchesUrgency = 
      urgencyFilter === 'ALL' ||
      (urgencyFilter === 'URGENT' && isAptUrgent) ||
      (urgencyFilter === 'ROUTINE' && !isAptUrgent);

    return matchesSearch && matchesUrgency;
  });

  return (
    <div className="clinical-card h-full flex flex-col shadow-xl bg-slate-900/40 relative overflow-hidden">
      {/* Widget Title */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
          Scheduled Patient Queue
        </h3>
        <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
          Active Cases: {filteredAppointments.length}
        </span>
      </div>

      {/* Search Input Block */}
      <div className="relative mb-3.5">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-3.5 h-3.5 text-slate-500" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter queue by name, diagnosis..."
          className="clinical-input pl-9 text-xs py-2 bg-slate-950/60 border-slate-800 focus:border-cyan-500/50"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-950/80 border border-slate-900 rounded-xl mb-4 text-[10px] font-bold">
        <button
          onClick={() => setUrgencyFilter('ALL')}
          className={`flex-1 py-1 rounded-lg text-center transition-all ${
            urgencyFilter === 'ALL' ? 'bg-slate-900 text-cyan-400 border border-slate-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Cards
        </button>
        <button
          onClick={() => setUrgencyFilter('URGENT')}
          className={`flex-1 py-1 rounded-lg text-center transition-all ${
            urgencyFilter === 'URGENT' ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'text-slate-400 hover:text-white'
          }`}
        >
          Priority (Urgent/Emergent)
        </button>
        <button
          onClick={() => setUrgencyFilter('ROUTINE')}
          className={`flex-1 py-1 rounded-lg text-center transition-all ${
            urgencyFilter === 'ROUTINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'text-slate-400 hover:text-white'
          }`}
        >
          Routine
        </button>
      </div>

      {/* Queue Cards List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 max-h-[580px]">
        {filteredAppointments.length === 0 ? (
          <div className="text-center text-xs text-slate-500 italic py-16 border border-dashed border-slate-800 rounded-2xl flex flex-col justify-center items-center space-y-3">
            <Stethoscope className="w-8 h-8 text-slate-700" />
            <span>No patients match the filters.</span>
          </div>
        ) : (
          filteredAppointments.map((apt, idx) => {
            const isEmergent = apt.urgencyLevel === 'EMERGENT';
            const isUrgent = apt.urgencyLevel === 'URGENT';
            
            // Assign mock styles for display variety
            const appointmentTypes = ["In-Clinic Follow-up", "Pre-Treatment Review", "Toxicity Check", "Post-Infusion Assessment"];
            const type = apt.specialty || appointmentTypes[idx % appointmentTypes.length];
            const isVirtual = idx % 3 === 0;

            return (
              <div 
                key={apt.id}
                onClick={() => onSelectPatient(apt.patientId)}
                className="glass-panel p-4 border border-slate-800 bg-slate-950/20 hover:bg-slate-900/30 hover:border-cyan-500/40 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-900/10 group flex flex-col justify-between min-h-[120px]"
              >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg shadow-inner">
                      <span className="text-xs font-black text-cyan-400">{formatTime(apt.startTime)}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{apt.patientName}</h4>
                      <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 font-mono mt-0.5">
                        <span>MRN: {apt.patientId}</span>
                        <span>•</span>
                        {isVirtual ? (
                          <span className="flex items-center text-indigo-400/90 font-bold"><Video className="w-2.5 h-2.5 mr-0.5" /> Virtual</span>
                        ) : (
                          <span className="flex items-center text-slate-400/90 font-bold"><FileText className="w-2.5 h-2.5 mr-0.5" /> Room 102</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md border ${
                    isEmergent ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    isUrgent ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {apt.urgencyLevel || 'ROUTINE'}
                  </span>
                </div>
                
                {/* Clinical Context Row */}
                <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/80 text-[10px]">
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Diagnosis</div>
                    <div className="font-bold text-slate-300 truncate">{apt.primaryDiagnosis || 'Invasive Ductal Carcinoma'}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Clinical Protocol</div>
                    <div className="font-bold text-slate-300 truncate">{type}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
