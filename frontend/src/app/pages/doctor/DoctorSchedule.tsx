import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Video, Users, Stethoscope, Droplet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

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
          <Button variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
            Block Time
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Availability
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-white font-bold text-lg min-w-[140px] text-center">Today, Oct 24</h2>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700">
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
                October 2026
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
                {Array.from({length: 31}).map((_, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      i + 1 === 24 ? 'bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/30' : 
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
                            {event.type !== 'Block' && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              </div>
                            )}
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
