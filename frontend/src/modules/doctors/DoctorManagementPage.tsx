import { useState, useEffect } from 'react';
import { useAppState } from '../../shared/store';
import { UserPlus, Clock, Trash2, ShieldCheck, Stethoscope, Activity, CalendarDays } from 'lucide-react';

export function DoctorManagementPage() {
  const {
    doctors, doctorSchedules, selectedDoctorId, doctorAvailability,
    fetchDoctors, createDoctor, setSelectedDoctorId, fetchDoctorSchedules,
    addDoctorSchedule, removeDoctorSchedule, fetchAvailability
  } = useAppState();

  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: 'Medical Oncology',
  });

  const [schedData, setSchedData] = useState({
    dayOfWeek: '1', // Monday default
    startTime: '09:00',
    endTime: '17:00'
  });

  // Calendar view state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

  // Initialize data
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Fetch availability for the week when week changes
  useEffect(() => {
    const dates = getWeekDates();
    dates.forEach(date => {
      fetchAvailability(date.toISOString().split('T')[0]);
    });
  }, [currentWeekStart, fetchAvailability]);

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId);

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newDoc = await createDoctor({
        ...formData,
        status: 'active'
      });
      if (newDoc) {
        setFormData({
          firstName: '', lastName: '', email: '', phone: '', specialty: 'Medical Oncology'
        });
        setSelectedDoctorId(newDoc.id);
        await fetchDoctorSchedules(newDoc.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDoctor = async (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    await fetchDoctorSchedules(doctorId);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return;
    setIsLoading(true);
    try {
      await addDoctorSchedule(selectedDoctorId, {
        dayOfWeek: parseInt(schedData.dayOfWeek),
        startTime: schedData.startTime,
        endTime: schedData.endTime,
        isRecurring: true
      });
      // Refresh the current week's availability
      const dates = getWeekDates();
      dates.forEach(date => fetchAvailability(date.toISOString().split('T')[0]));
    } finally {
      setIsLoading(false);
    }
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const specialties = ["Medical Oncology", "Radiation Oncology", "Surgical Oncology", "Hematology", "Palliative Care"];

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'Medical Oncology': return 'border-cyan-500 bg-cyan-500/10 text-cyan-400';
      case 'Radiation Oncology': return 'border-amber-500 bg-amber-500/10 text-amber-400';
      case 'Surgical Oncology': return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
      case 'Hematology': return 'border-violet-500 bg-violet-500/10 text-violet-400';
      default: return 'border-slate-500 bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top row: Onboarding & Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Onboarding Form */}
        <div className="lg:col-span-4">
          <section className="clinical-card h-full">
            <div className="flex items-center space-x-2 mb-5">
              <UserPlus className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h2 className="text-lg font-bold text-white font-display">Onboard Doctor</h2>
            </div>
            
            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="clinical-input-label block mb-1">First Name</label>
                  <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="clinical-input" />
                </div>
                <div>
                  <label className="clinical-input-label block mb-1">Last Name</label>
                  <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="clinical-input" />
                </div>
              </div>
              
              <div>
                <label className="clinical-input-label block mb-1">Email address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="clinical-input" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="clinical-input-label block mb-1">Phone</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="clinical-input" />
                </div>
                <div>
                  <label className="clinical-input-label block mb-1">Specialty</label>
                  <select value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="clinical-input">
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button disabled={isLoading} type="submit" className="btn-primary w-full flex items-center justify-center space-x-2 py-2.5 mt-2 text-sm font-bold shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-4 h-4" />
                <span>Provision Doctor Account</span>
              </button>
            </form>
          </section>
        </div>

        {/* Doctor Roster & Schedule Assignment */}
        <div className="lg:col-span-8">
          <section className="clinical-card h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-[var(--accent-cyan)]" />
                <h2 className="text-lg font-bold text-white font-display">Active Clinical Roster</h2>
              </div>
              <span className="text-xs bg-slate-900 border border-[var(--color-border)] px-3 py-1 rounded-xl text-[var(--text-secondary)] font-bold">
                {doctors.length} Doctors
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              
              {/* List */}
              <div className="space-y-3 overflow-y-auto pr-2 max-h-[300px]">
                {doctors.map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => handleSelectDoctor(doc.id)}
                    className={`glass-panel p-3 border rounded-xl cursor-pointer transition-all ${
                      selectedDoctorId === doc.id ? 'border-[var(--accent-cyan)] bg-cyan-950/30' : 'border-[var(--color-border)] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white">Dr. {doc.firstName} {doc.lastName}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{doc.specialty}</p>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-[var(--accent-emerald)] bg-emerald-500/10 px-2 py-1 rounded">
                        <Activity className="w-3 h-3" />
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                ))}
                {doctors.length === 0 && (
                  <div className="text-center text-[var(--text-muted)] text-sm py-8 border border-dashed border-[var(--color-border)] rounded-xl">
                    No doctors provisioned yet.
                  </div>
                )}
              </div>

              {/* Assignment */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-[var(--color-border)] flex flex-col">
                {activeDoctor ? (
                  <>
                    <h3 className="text-sm font-bold text-white mb-4 flex justify-between items-center">
                      <span>Schedule for Dr. {activeDoctor.lastName}</span>
                    </h3>
                    
                    <form onSubmit={handleAddSchedule} className="flex gap-2 mb-5">
                      <select value={schedData.dayOfWeek} onChange={e => setSchedData({...schedData, dayOfWeek: e.target.value})} className="clinical-input py-1.5 px-2 text-xs w-28">
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                        <option value="0">Sunday</option>
                      </select>
                      <input type="time" required value={schedData.startTime} onChange={e => setSchedData({...schedData, startTime: e.target.value})} className="clinical-input py-1.5 px-2 text-xs" />
                      <input type="time" required value={schedData.endTime} onChange={e => setSchedData({...schedData, endTime: e.target.value})} className="clinical-input py-1.5 px-2 text-xs" />
                      <button type="submit" disabled={isLoading} className="btn-primary px-3 py-1.5 text-xs rounded-lg shrink-0">Add</button>
                    </form>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {doctorSchedules.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-4">No schedules assigned.</p>
                      ) : (
                        doctorSchedules.map(sched => (
                          <div key={sched.id} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-[var(--color-border)]">
                            <div className="flex items-center space-x-3 text-xs text-[var(--text-secondary)]">
                              <span className="font-bold text-white w-20">{sched.dayOfWeek !== null ? dayNames[sched.dayOfWeek] : 'Specific'}</span>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{sched.startTime} - {sched.endTime}</span>
                              </div>
                            </div>
                            <button onClick={() => removeDoctorSchedule(activeDoctor.id, sched.id)} className="text-red-400 hover:text-red-300 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)] text-center">
                    Select a doctor from the roster to manage their weekly schedule blocks.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Weekly Calendar */}
      <section className="clinical-card overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold text-white font-display">Weekly Master Calendar</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={() => {
              const d = new Date(currentWeekStart);
              d.setDate(d.getDate() - 7);
              setCurrentWeekStart(d);
            }} className="clinical-btn-secondary px-3 py-1.5 text-xs">Prev Week</button>
            <span className="text-sm font-bold text-white">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - 
              {new Date(currentWeekStart.getTime() + 6*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
            </span>
            <button onClick={() => {
              const d = new Date(currentWeekStart);
              d.setDate(d.getDate() + 7);
              setCurrentWeekStart(d);
            }} className="clinical-btn-secondary px-3 py-1.5 text-xs">Next Week</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
            
            {/* Headers */}
            <div className="grid grid-cols-7 bg-slate-900/80">
              {getWeekDates().map((d, i) => (
                <div key={i} className={`p-3 text-center border-r border-[var(--color-border)] last:border-0 ${d.toDateString() === new Date().toDateString() ? 'bg-[var(--accent-cyan)]/10' : ''}`}>
                  <div className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{dayNames[d.getDay()]}</div>
                  <div className={`text-sm font-black mt-1 ${d.toDateString() === new Date().toDateString() ? 'text-[var(--accent-cyan)]' : 'text-white'}`}>
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 min-h-[400px] bg-slate-950/50">
              {getWeekDates().map((d, colIdx) => {
                const dateStr = d.toISOString().split('T')[0];
                const slots = doctorAvailability[dateStr] || [];
                
                return (
                  <div key={colIdx} className="border-r border-[var(--color-border)] last:border-0 p-2 space-y-2">
                    {slots.length === 0 ? (
                      <div className="text-[10px] text-[var(--text-muted)] text-center py-4 italic">No coverage</div>
                    ) : (
                      slots.map((slot, idx) => {
                        const style = getSpecialtyColor(slot.specialty);
                        return (
                          <div 
                            key={idx} 
                            className={`p-2 rounded-lg border text-xs flex flex-col transition-all ${
                              slot.isBooked ? 'bg-slate-900 border-slate-700 opacity-50' : style
                            }`}
                          >
                            <div className="font-bold truncate">{slot.doctorName}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="opacity-80 text-[10px] font-medium">{slot.startTime} - {slot.endTime}</span>
                              {slot.isBooked && <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-bold">Booked</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
