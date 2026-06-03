import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../shared/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar as CalendarComponent } from '../components/ui/calendar';

interface WaitingPatient {
  id: number;
  name: string;
  type: string;
  waitTime: string;
  status: string;
}

interface Appointment {
  id: number;
  time: string;
  patient: string;
  doctor: string;
  status: string;
}

export default function ReceptionistDashboard() {
  const [waitingRoomList, setWaitingRoomList] = useState<WaitingPatient[]>([]);
  const [todayAppointmentsList, setTodayAppointmentsList] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/receptionist');
        if (response.data) {
          setWaitingRoomList(response.data.waiting_patients || []);
          setTodayAppointmentsList(response.data.today_appointments || []);
        }
      } catch (err) {
        console.error('Error fetching receptionist dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2">
            Receptionist Interface
          </h1>
          <p className="text-slate-400">Manage patient flow and appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Room Queue */}
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Waiting Room Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-slate-400 text-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                  Loading waiting queue...
                </div>
              ) : waitingRoomList.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  No patients waiting.
                </div>
              ) : waitingRoomList.map((patient, index) => (
                <div
                  key={patient.id}
                  className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/50 transition-all animate-in slide-in-from-left duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white">{patient.name}</h4>
                    <Badge
                      variant="outline"
                      className={
                        patient.status === 'In Prep'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                      }
                    >
                      {patient.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{patient.type}</span>
                    <span className="text-rose-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {patient.waitTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Calendar */}
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Appointment Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-xl border-slate-700/30 bg-slate-800/20"
            />
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" />
              Today's Schedule
            </CardTitle>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
               <div className="text-slate-400 text-center py-8">
                 <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
                 Loading today's schedule...
               </div>
            ) : todayAppointmentsList.length === 0 ? (
               <div className="text-slate-400 text-center py-8">
                 No appointments scheduled for today.
               </div>
            ) : todayAppointmentsList.map((apt, index) => (
              <div
                key={apt.id}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-violet-500/50 transition-all animate-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-cyan-400">{apt.time}</p>
                    </div>
                    <div>
                      <h4 className="text-white">{apt.patient}</h4>
                      <p className="text-slate-400 text-sm">{apt.doctor}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      apt.status === 'Completed'
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                        : apt.status === 'In Progress'
                        ? 'border-violet-500/50 text-violet-400 bg-violet-500/10 animate-pulse'
                        : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
