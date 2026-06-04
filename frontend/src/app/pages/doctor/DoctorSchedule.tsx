import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Video, Users, Stethoscope, Droplet, AlertCircle } from 'lucide-react';
import { api } from '../../shared/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

// State interface
interface Event {
  id: number;
  title: string;
  time: string;
  duration: string;
  type: string;
  color: string;
  urgency?: string;
}

export default function DoctorSchedule() {
  const [view, setView] = useState('day');
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctorId, setDoctorId] = useState<number | null>(null);

  // Dialog states
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isAvailOpen, setIsAvailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [endDate, setEndDate] = useState<string>('');

  const handleDeleteSchedule = async (id: string | number) => {
    if (!doctorId) return;
    try {
      const scheduleId = String(id).replace('sched_', '');
      await api.delete(`/doctors/${doctorId}/schedule/${scheduleId}`);
      toast.success('Schedule block removed');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error('Failed to remove schedule block');
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
        if (docId) {
          try {
            const schedResponse = await api.get(`/doctors/${docId}/schedule`);
            schedEvents = (schedResponse.data || []).map((s: any) => {
              // Create a date object. If it's recurring, we just show it on current date for now.
              let eDate = currentDate;
              if (s.specific_date) {
                eDate = new Date(s.specific_date);
              } else if (s.day_of_week !== null && s.day_of_week !== undefined) {
                // If recurring on a specific day, align it to that day in the current week
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
          } catch (e) {
            console.error('Error fetching schedules:', e);
          }
        }
        
        const allAppts = [...today, ...upcoming];
        const mappedEvents = [...schedEvents, ...allAppts.map((appt: any, index: number) => ({
          id: appt.appointment_id || index,
          title: `Consultation - ${appt.patient_name || 'Patient'}`,
          time: appt.time,
          duration: '30 min',
          type: 'Consultation',
          color: 'cyan',
          urgency: appt.urgency_level || 'Routine',
          date: new Date(appt.full_time)
        }))];
        
        // Filter based on selected view
        const filteredEvents = mappedEvents.filter(e => {
          const eDate = e.date;
          if (view === 'day') {
            return eDate.getDate() === currentDate.getDate() && 
                   eDate.getMonth() === currentDate.getMonth() && 
                   eDate.getFullYear() === currentDate.getFullYear();
          } else if (view === 'week') {
            // Check if it's within roughly a week
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            startOfWeek.setHours(0,0,0,0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23,59,59,999);
            return eDate >= startOfWeek && eDate <= endOfWeek;
          } else {
            // Month view
            return eDate.getMonth() === currentDate.getMonth() && 
                   eDate.getFullYear() === currentDate.getFullYear();
          }
        });
        
        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, [currentDate, view, isBlockOpen, isAvailOpen, refreshTrigger]);

  const handleQuickAdd = async (start: string, end: string, isRecurring: boolean) => {
    if (!doctorId) {
      toast.error('Doctor profile not found. Please complete profile setup.');
      return;
    }
    
    try {
      const payload = {
        start_time: start,
        end_time: end,
        is_recurring: isRecurring,
        specific_date: !isRecurring ? currentDate.toISOString().split('T')[0] : null,
        day_of_week: isRecurring ? currentDate.getDay() : null,
      };
      
      await api.post(`/doctors/${doctorId}/schedule`, payload);
      toast.success(`Quick Availability added for ${start} - ${end}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add availability');
    }
  };

  const handleCreateSchedule = async () => {
    if (!doctorId) {
      toast.error('Doctor profile not found. Please complete profile setup.');
      return;
    }
    
    try {
      if (!isRecurring && endDate && endDate > currentDate.toISOString().split('T')[0]) {
        // Multi-day block
        let curr = new Date(currentDate);
        const end = new Date(endDate);
        while (curr <= end) {
          await api.post(`/doctors/${doctorId}/schedule`, {
            start_time: startTime,
            end_time: endTime,
            is_recurring: false,
            specific_date: curr.toISOString().split('T')[0],
            day_of_week: null
          });
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        // Single block or recurring
        const payload = {
          start_time: startTime,
          end_time: endTime,
          is_recurring: isRecurring,
          specific_date: !isRecurring ? currentDate.toISOString().split('T')[0] : null,
          day_of_week: isRecurring ? currentDate.getDay() : null,
        };
        await api.post(`/doctors/${doctorId}/schedule`, payload);
      }
      
      toast.success('Schedule updated successfully');
      setIsBlockOpen(false);
      setIsAvailOpen(false);
      setEndDate('');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to update schedule');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold tracking-tight">
            Schedule & Calendar
          </h1>
          <p className="text-slate-400">Manage your consultations, meetings, and clinical blocks</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                Block Time
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Block Time</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Start Time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">End Time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700" />
                </div>
                {!isRecurring && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">End Date (Opt.)</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={currentDate.toISOString().split('T')[0]} className="col-span-3 bg-slate-800 border-slate-700 text-slate-300" />
                  </div>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <input type="checkbox" id="recurringBlock" checked={isRecurring} onChange={e => { setIsRecurring(e.target.checked); setEndDate(''); }} className="rounded border-slate-700 bg-slate-800" />
                  <Label htmlFor="recurringBlock">Make Recurring (Every {currentDate.toLocaleDateString('en-US', { weekday: 'long' })})</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSchedule} className="bg-rose-600 hover:bg-rose-500 text-white">Save Block</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAvailOpen} onOpenChange={setIsAvailOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                <Plus className="w-4 h-4 mr-2" />
                Create Availability
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Create Availability</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Start Time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">End Time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700" />
                </div>
                {!isRecurring && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">End Date (Opt.)</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={currentDate.toISOString().split('T')[0]} className="col-span-3 bg-slate-800 border-slate-700 text-slate-300" />
                  </div>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <input type="checkbox" id="recurringAvail" checked={isRecurring} onChange={e => { setIsRecurring(e.target.checked); setEndDate(''); }} className="rounded border-slate-700 bg-slate-800" />
                  <Label htmlFor="recurringAvail">Make Recurring (Every {currentDate.toLocaleDateString('en-US', { weekday: 'long' })})</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSchedule} className="bg-cyan-600 hover:bg-cyan-500 text-white">Save Availability</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))} variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-white font-bold text-lg min-w-[140px] text-center">
            {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </h2>
          <Button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))} variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="day" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 px-6">Day</TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 px-6">Week</TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 px-6">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Mini Calendar & Filters */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-800/50">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-cyan-400" />
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-slate-500 font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {/* Mock days */}
                {Array.from({length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}).map((_, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setDate(i + 1);
                      setCurrentDate(newDate);
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      i + 1 === currentDate.getDate() ? 'bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/30' : 
                      'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-800/50">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Quick Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-slate-400 mb-2">Click to instantly add availability for {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              
              <Button 
                variant="outline" 
                onClick={() => handleQuickAdd('09:00', '17:00', false)}
                className="w-full justify-start text-slate-300 border-slate-700 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Full Day (9 AM - 5 PM)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleQuickAdd('08:00', '12:00', false)}
                className="w-full justify-start text-slate-300 border-slate-700 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Morning (8 AM - 12 PM)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleQuickAdd('13:00', '17:00', false)}
                className="w-full justify-start text-slate-300 border-slate-700 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Afternoon (1 PM - 5 PM)
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-800/50">
              <CardTitle className="text-white text-base">Calendars</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-cyan-500 bg-cyan-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-cyan-400" />
                </div>
                <span className="text-slate-300 text-sm group-hover:text-white transition-colors">Consultations</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-violet-500 bg-violet-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-violet-400" />
                </div>
                <span className="text-slate-300 text-sm group-hover:text-white transition-colors">Tumor Board Meetings</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-emerald-400" />
                </div>
                <span className="text-slate-300 text-sm group-hover:text-white transition-colors">Infusion Sessions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-rose-500 bg-rose-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-rose-400" />
                </div>
                <span className="text-slate-300 text-sm group-hover:text-white transition-colors">Urgent / ER</span>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline View */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-900/50 border-slate-700/30 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden min-h-[600px]">
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
                      slate: 'border-slate-600/30 bg-slate-800/50 text-slate-400',
                    };

                    const iconMap: any = {
                      Consultation: <Stethoscope className="w-4 h-4" />,
                      Meeting: <Users className="w-4 h-4" />,
                      Infusion: <Droplet className="w-4 h-4" />,
                      Urgent: <AlertCircle className="w-4 h-4" />,
                      Block: <Clock className="w-4 h-4" />
                    };

                    return (
                      <div 
                        key={event.id} 
                        className="p-4 flex gap-6 hover:bg-slate-800/30 transition-colors group animate-in slide-in-from-right duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="w-24 shrink-0 text-right">
                          <span className="text-white font-medium block">{event.time}</span>
                          <span className="text-xs text-slate-500">{event.duration}</span>
                        </div>
                        <div className="flex-1">
                          <div className={`p-4 rounded-xl border ${colorMap[event.color]} flex flex-col sm:flex-row sm:items-center justify-between gap-4 group-hover:scale-[1.01] transition-transform`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 opacity-80">
                                {iconMap[event.type]}
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
                              {event.type === 'Block' ? (
                                <Button size="sm" variant="outline" onClick={() => handleDeleteSchedule(event.id)} className="h-8 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                                  Delete Block
                                </Button>
                              ) : (
                                <>
                                  {event.type === 'Consultation' && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20" title="Start Telehealth">
                                      <Video className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" className="h-8 text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
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
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium text-slate-300">No events scheduled</p>
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
