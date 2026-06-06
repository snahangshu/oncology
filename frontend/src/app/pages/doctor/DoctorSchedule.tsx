import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Video, Users, Stethoscope, Droplet, AlertCircle, CalendarRange, ShieldAlert, Check } from 'lucide-react';
import { api } from '../../shared/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

// State interface
interface Event {
  id: string | number;
  title: string;
  time: string;
  duration: string;
  type: string;
  color: string;
  urgency?: string;
  date: Date;
}

export default function DoctorSchedule() {
  const [view, setView] = useState('day');
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Shift Generator State
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('13:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [shiftStartDate, setShiftStartDate] = useState('');
  const [shiftEndDate, setShiftEndDate] = useState('');

  // Time Off State
  const [timeOffReason, setTimeOffReason] = useState('Vacation');
  const [timeOffStart, setTimeOffStart] = useState('');
  const [timeOffEnd, setTimeOffEnd] = useState('');

  // Emergency Block State
  const [emergencyTime, setEmergencyTime] = useState('');
  const [emergencyDesc, setEmergencyDesc] = useState('');

  const handleDeleteSchedule = async (id: string | number, type: string) => {
    if (!doctorId) return;
    try {
      if (type === 'Block') {
        const scheduleId = String(id).replace('sched_', '');
        await api.delete(`/doctors/${doctorId}/schedule/${scheduleId}`);
        toast.success('Schedule block removed');
      } else if (type === 'TimeOff') {
        const toId = String(id).replace('toff_', '');
        await api.delete(`/doctors/${doctorId}/time_off/${toId}`);
        toast.success('Time off removed');
      } else if (type === 'Emergency') {
        const ebId = String(id).replace('eb_', '');
        await api.delete(`/doctors/${doctorId}/emergency_blocks/${ebId}`);
        toast.success('Emergency block removed');
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error('Failed to remove block');
    }
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await api.get('/dashboards/doctor');
        const today = response.data.today_appointments || [];
        const upcoming = response.data.upcoming_appointments || [];
        const docId = response.data.doctor_id;
        
        if (docId) setDoctorId(docId);
        
        let schedEvents: any[] = [];
        let timeOffEvents: any[] = [];
        let emergencyEvents: any[] = [];

        if (docId) {
          try {
            const [schedRes, toffRes, ebRes] = await Promise.all([
              api.get(`/doctors/${docId}/schedule`),
              api.get(`/doctors/${docId}/time_off`),
              api.get(`/doctors/${docId}/emergency_blocks`)
            ]);

            schedEvents = (schedRes.data || []).map((s: any) => {
              let eDate = currentDate;
              if (s.specific_date) {
                eDate = new Date(s.specific_date);
              } else if (s.day_of_week !== null && s.day_of_week !== undefined) {
                eDate = new Date(currentDate);
                const dayDiff = s.day_of_week - eDate.getDay();
                eDate.setDate(eDate.getDate() + dayDiff);
              }
              return {
                id: `sched_${s.id}`,
                title: 'Availability Block',
                time: s.start_time,
                duration: `${s.start_time} - ${s.end_time}`,
                type: 'Block',
                color: 'slate',
                date: eDate
              };
            });

            timeOffEvents = (toffRes.data || []).map((t: any) => {
               return {
                 id: `toff_${t.id}`,
                 title: `Time Off: ${t.reason || 'Unavailable'}`,
                 time: t.start_time.split('T')[1].substring(0,5),
                 duration: 'Time Off Block',
                 type: 'TimeOff',
                 color: 'violet',
                 date: new Date(t.start_time)
               };
            });

            emergencyEvents = (ebRes.data || []).map((e: any) => {
               return {
                 id: `eb_${e.id}`,
                 title: `Emergency Block: ${e.description || 'Reserved'}`,
                 time: e.time_slot,
                 duration: '15 min',
                 type: 'Emergency',
                 color: 'rose',
                 date: currentDate // shown every day for simplicity in MVP
               };
            });

          } catch (e) {
            console.error('Error fetching schedules:', e);
          }
        }
        
        const allAppts = [...today, ...upcoming];
        const mappedAppts = allAppts.map((appt: any, index: number) => ({
          id: appt.appointment_id || index,
          title: `Consultation - ${appt.patient_name || 'Patient'}`,
          time: appt.time,
          duration: '30 min',
          type: 'Consultation',
          color: 'cyan',
          urgency: appt.urgency_level || 'Routine',
          date: new Date(appt.full_time)
        }));

        const allEvents = [...schedEvents, ...timeOffEvents, ...emergencyEvents, ...mappedAppts];
        
        // Filter based on selected view
        const filteredEvents = allEvents.filter(e => {
          const eDate = e.date;
          if (view === 'day') {
            return eDate.getDate() === currentDate.getDate() && 
                   eDate.getMonth() === currentDate.getMonth() && 
                   eDate.getFullYear() === currentDate.getFullYear();
          } else if (view === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            startOfWeek.setHours(0,0,0,0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23,59,59,999);
            return eDate >= startOfWeek && eDate <= endOfWeek;
          } else {
            return eDate.getMonth() === currentDate.getMonth() && 
                   eDate.getFullYear() === currentDate.getFullYear();
          }
        });
        
        // sort by time
        filteredEvents.sort((a,b) => a.time.localeCompare(b.time));

        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, [currentDate, view, refreshTrigger]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleGenerateShift = async () => {
    if (!doctorId) return;
    if (selectedDays.length === 0) {
      toast.error('Please select at least one day for the shift.');
      return;
    }

    try {
      const promises = [];
      
      if (shiftStartDate && shiftEndDate) {
        // Date range specific shifts
        let curr = new Date(shiftStartDate);
        const end = new Date(shiftEndDate);
        
        while (curr <= end) {
          if (selectedDays.includes(curr.getDay())) {
            const specificDate = curr.toISOString().split('T')[0];
            
            // Morning Block
            if (shiftStart < lunchStart) {
              promises.push(api.post(`/doctors/${doctorId}/schedule`, {
                start_time: shiftStart,
                end_time: lunchStart,
                is_recurring: false,
                specific_date: specificDate,
                day_of_week: null
              }));
            }
            // Afternoon Block
            if (lunchEnd < shiftEnd) {
              promises.push(api.post(`/doctors/${doctorId}/schedule`, {
                start_time: lunchEnd,
                end_time: shiftEnd,
                is_recurring: false,
                specific_date: specificDate,
                day_of_week: null
              }));
            }
          }
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        // Recurring shifts
        for (const day of selectedDays) {
          // Morning Block
          if (shiftStart < lunchStart) {
            promises.push(api.post(`/doctors/${doctorId}/schedule`, {
              start_time: shiftStart,
              end_time: lunchStart,
              is_recurring: true,
              day_of_week: day
            }));
          }
          // Afternoon Block
          if (lunchEnd < shiftEnd) {
            promises.push(api.post(`/doctors/${doctorId}/schedule`, {
              start_time: lunchEnd,
              end_time: shiftEnd,
              is_recurring: true,
              day_of_week: day
            }));
          }
        }
      }
      
      await Promise.all(promises);
      toast.success('Shift Schedule Generated');
      setRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to generate shift');
    }
  };

  const handleAddTimeOff = async () => {
    if (!doctorId || !timeOffStart || !timeOffEnd) return;
    try {
      await api.post(`/doctors/${doctorId}/time_off`, {
        start_time: new Date(timeOffStart).toISOString(),
        end_time: new Date(timeOffEnd).toISOString(),
        reason: timeOffReason
      });
      toast.success('Time off added successfully');
      setRefreshTrigger(prev => prev + 1);
      setTimeOffStart('');
      setTimeOffEnd('');
    } catch (e: any) {
      toast.error('Failed to add time off');
    }
  };

  const handleAddEmergencyBlock = async () => {
    if (!doctorId || !emergencyTime) return;
    try {
      await api.post(`/doctors/${doctorId}/emergency_blocks`, {
        time_slot: emergencyTime,
        description: emergencyDesc
      });
      toast.success('Emergency block added');
      setRefreshTrigger(prev => prev + 1);
      setEmergencyTime('');
      setEmergencyDesc('');
    } catch (e: any) {
      toast.error('Failed to add emergency block');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Schedule & Availability
          </h1>
          <p className="text-slate-500">Manage your shifts, time off, and protected emergency blocks</p>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 p-4 rounded-2xl border border-slate-200/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))} variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-700">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-slate-900 font-bold text-lg min-w-[140px] text-center">
            {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </h2>
          <Button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))} variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-700">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto">
          <TabsList className="bg-slate-50/50 border border-slate-200/50">
            <TabsTrigger value="day" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 px-6">Day</TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 px-6">Week</TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 px-6">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Management Configuration */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-white/50 border-slate-200 shadow-sm backdrop-blur-xl shadow-2xl rounded-2xl">
             <Tabs defaultValue="schedule" className="w-full">
               <CardHeader className="pb-0 border-b border-slate-200/50">
                  <TabsList className="w-full bg-slate-50/50 border border-slate-200/50 grid grid-cols-3 mb-3">
                    <TabsTrigger value="schedule" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Shifts</TabsTrigger>
                    <TabsTrigger value="timeoff" className="text-xs data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">Time Off</TabsTrigger>
                    <TabsTrigger value="emergency" className="text-xs data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300">Protected</TabsTrigger>
                  </TabsList>
               </CardHeader>
               <CardContent className="pt-4">
                  
                  {/* Shifts Tab */}
                  <TabsContent value="schedule" className="space-y-4 animate-in fade-in zoom-in-95 mt-0">
                    <div className="space-y-1 mb-4">
                       <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400"/> Shift Generator</h3>
                       <p className="text-xs text-slate-500">Generate recurring availability shifts.</p>
                    </div>

                    <div className="space-y-3">
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <Label className="text-xs text-slate-500">Shift Start</Label>
                             <Input type="time" value={shiftStart} onChange={e=>setShiftStart(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                             <Label className="text-xs text-slate-500">Shift End</Label>
                             <Input type="time" value={shiftEnd} onChange={e=>setShiftEnd(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <Label className="text-xs text-slate-500">Lunch Start</Label>
                             <Input type="time" value={lunchStart} onChange={e=>setLunchStart(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                             <Label className="text-xs text-slate-500">Lunch End</Label>
                             <Input type="time" value={lunchEnd} onChange={e=>setLunchEnd(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <Label className="text-xs text-slate-500">Valid From (Optional)</Label>
                             <Input type="date" value={shiftStartDate} onChange={e=>setShiftStartDate(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm text-slate-700" />
                          </div>
                          <div className="space-y-1">
                             <Label className="text-xs text-slate-500">Valid Until (Optional)</Label>
                             <Input type="date" value={shiftEndDate} onChange={e=>setShiftEndDate(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm text-slate-700" />
                          </div>
                       </div>
                       
                       <div className="pt-2">
                          <Label className="text-xs text-slate-500 mb-2 block">Days of Week</Label>
                          <div className="flex flex-wrap gap-1">
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
                               <Badge 
                                 key={d} 
                                 variant={selectedDays.includes(i) ? "default" : "outline"}
                                 className={`cursor-pointer ${selectedDays.includes(i) ? 'bg-cyan-600 hover:bg-cyan-500' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}
                                 onClick={() => toggleDay(i)}
                               >
                                 {d}
                               </Badge>
                            ))}
                          </div>
                       </div>

                       <Button onClick={handleGenerateShift} className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-900 mt-2 h-8 text-xs">
                          Generate Shift
                       </Button>
                    </div>
                  </TabsContent>

                  {/* Time Off Tab */}
                  <TabsContent value="timeoff" className="space-y-4 animate-in fade-in zoom-in-95 mt-0">
                    <div className="space-y-1 mb-4">
                       <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><CalendarRange className="w-4 h-4 text-violet-400"/> Time Off</h3>
                       <p className="text-xs text-slate-500">Manage vacations and leaves. Overlays on shifts.</p>
                    </div>

                    <div className="space-y-3">
                       <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Reason / Type</Label>
                          <select 
                            value={timeOffReason} 
                            onChange={e=>setTimeOffReason(e.target.value)}
                            className="w-full flex h-8 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                             <option>Vacation</option>
                             <option>Conference</option>
                             <option>Medical Leave</option>
                             <option>Personal Leave</option>
                             <option>Other</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Start Date & Time</Label>
                          <Input type="datetime-local" value={timeOffStart} onChange={e=>setTimeOffStart(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-xs text-slate-500">End Date & Time</Label>
                          <Input type="datetime-local" value={timeOffEnd} onChange={e=>setTimeOffEnd(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                       </div>
                       <Button onClick={handleAddTimeOff} className="w-full bg-violet-600 hover:bg-violet-500 text-slate-900 mt-2 h-8 text-xs">
                          Add Time Off
                       </Button>
                    </div>
                  </TabsContent>

                  {/* Emergency Blocks Tab */}
                  <TabsContent value="emergency" className="space-y-4 animate-in fade-in zoom-in-95 mt-0">
                    <div className="space-y-1 mb-4">
                       <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-400"/> Protected Slots</h3>
                       <p className="text-xs text-slate-500">Reserve slots for emergencies. Hidden from normal availability.</p>
                    </div>

                    <div className="space-y-3">
                       <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Reserved Time Slot</Label>
                          <Input type="time" value={emergencyTime} onChange={e=>setEmergencyTime(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Description</Label>
                          <Input placeholder="e.g. Leukemia ER" value={emergencyDesc} onChange={e=>setEmergencyDesc(e.target.value)} className="bg-slate-50 border-slate-200 h-8 text-sm" />
                       </div>
                       <Button onClick={handleAddEmergencyBlock} className="w-full bg-rose-600 hover:bg-rose-500 text-white mt-2 h-8 text-xs">
                          Reserve Protected Block
                       </Button>
                    </div>
                  </TabsContent>

               </CardContent>
             </Tabs>
          </Card>
        </div>

        {/* Right Column: Timeline View */}
        <div className="lg:col-span-3">
          <Card className="bg-white/50 border-slate-200 shadow-sm backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden min-h-[600px]">
            <div className="flex flex-col h-full">
              {/* Day Timeline Header */}
              <div className="grid grid-cols-1 divide-y divide-slate-800/50">
                {events.length > 0 ? (
                  events.map((event, index) => {
                    
                    const colorMap: any = {
                      cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
                      violet: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
                      emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                      rose: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
                      slate: 'border-slate-600/30 bg-slate-50/50 text-slate-500',
                    };

                    const iconMap: any = {
                      Consultation: <Stethoscope className="w-4 h-4" />,
                      TimeOff: <CalendarRange className="w-4 h-4" />,
                      Emergency: <ShieldAlert className="w-4 h-4" />,
                      Meeting: <Users className="w-4 h-4" />,
                      Infusion: <Droplet className="w-4 h-4" />,
                      Urgent: <AlertCircle className="w-4 h-4" />,
                      Block: <Clock className="w-4 h-4" />
                    };

                    return (
                      <div 
                        key={event.id} 
                        className="p-4 flex gap-6 hover:bg-slate-50 transition-colors group animate-in slide-in-from-right duration-500"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-24 shrink-0 text-right">
                          <span className="text-slate-900 font-medium block">{event.time}</span>
                          <span className="text-xs text-slate-500">{event.duration}</span>
                        </div>
                        <div className="flex-1">
                          <div className={`p-4 rounded-xl border ${colorMap[event.color]} flex flex-col sm:flex-row sm:items-center justify-between gap-4 group-hover:scale-[1.01] transition-transform`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 opacity-80">
                                {iconMap[event.type] || <Check className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold">{event.title}</h4>
                                  {event.urgency && (
                                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 ${event.urgency === 'Critical' ? 'border-rose-500 text-rose-400 animate-pulse' : 'border-orange-500 text-orange-400'}`}>
                                      {event.urgency}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs opacity-80">{event.type}</p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {(event.type === 'Block' || event.type === 'TimeOff' || event.type === 'Emergency') ? (
                                <Button size="sm" variant="outline" onClick={() => handleDeleteSchedule(event.id, event.type)} className="h-8 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                                  Delete
                                </Button>
                              ) : (
                                <>
                                  {event.type === 'Consultation' && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20" title="Start Telehealth">
                                      <Video className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" className="h-8 text-xs border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-slate-900">
                                    Reschedule
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 h-full text-center min-h-[400px]">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">No events scheduled</p>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">Your calendar is clear for this selected view.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
