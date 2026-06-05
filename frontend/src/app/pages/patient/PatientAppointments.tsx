import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { api } from '../../shared/api';
import { PatientAssistantChat } from '../../components/PatientAssistantChat';

export default function PatientAppointments() {
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [pastAppointmentsList, setPastAppointmentsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: intake } = useQuery({
    queryKey: ['my_intake'],
    queryFn: async () => {
      const res = await api.get('/intake/me');
      return res.data;
    }
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/patient');
        const data = response.data;
        
          const formatAppointment = (apt: any) => ({
            id: apt.appointment_id,
            date: new Date(apt.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
            time: new Date(apt.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            doctor: apt.doctor_name,
            type: `${apt.specialty || 'Oncology'} Consultation`,
            status: apt.status.charAt(0).toUpperCase() + apt.status.slice(1),
            notes: apt.prescription_notes,
          });

        if (data.upcoming_appointments && data.upcoming_appointments.length > 0) {
          setAppointmentsList(data.upcoming_appointments.map(formatAppointment));
        } else {
          setAppointmentsList([]);
        }

        if (data.past_appointments && data.past_appointments.length > 0) {
          setPastAppointmentsList(data.past_appointments.map(formatAppointment));
        } else {
          setPastAppointmentsList([]);
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-16">
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2 text-2xl font-bold">
          My Appointments
        </h1>
        <p className="text-slate-400">View your upcoming and past medical appointments</p>
      </div>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-slate-400 text-center py-8">
                  <Loader2 className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                  Loading appointments...
                </div>
              ) : appointmentsList.length === 0 ? (
                <div className="text-slate-400 text-center py-8">No upcoming appointments found.</div>
              ) : appointmentsList.map((apt, index) => (
                <div key={apt.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white mb-1">{apt.type}</h4>
                      <p className="text-slate-400 text-sm">{apt.doctor}</p>
                      <p className="text-cyan-400 text-sm mt-2">{apt.date} at {apt.time}</p>
                      {apt.notes && (
                        <p className="text-emerald-400 text-xs mt-2 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                          <strong>Note:</strong> {apt.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Past Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-slate-400 text-center py-8">Loading...</div>
              ) : pastAppointmentsList.length === 0 ? (
                <div className="text-slate-400 text-center py-8">No past appointments found.</div>
              ) : pastAppointmentsList.map((apt, index) => (
                <div key={apt.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 transition-all opacity-80 hover:opacity-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-slate-300 mb-1">{apt.type}</h4>
                      <p className="text-slate-500 text-sm">{apt.doctor}</p>
                      <p className="text-slate-400 text-sm mt-2">{apt.date} at {apt.time}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-500/50 text-slate-400 bg-slate-500/10">
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}
