import { useState, useEffect } from 'react';
import { Clock, AlertCircle, FileText, Pill, CheckCircle, Sparkles, FlaskConical, Timer, CalendarDays, FilePlus, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../shared/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';

const richAppointments = [
  {
    id: 1,
    patientName: 'John Anderson',
    time: '09:00 AM',
    urgency: 'Urgent',
    chiefComplaint: 'Severe chest pain post-infusion',
    predictedDuration: 'High Complexity (30m)',
    aiSummary: 'Patient presents with acute chest pain 48 hours post-doxorubicin infusion. Recent history indicates rising troponin levels. AI detects a 78% risk of anthracycline-induced cardiotoxicity. Requires immediate ECG review and cardiology consult.',
    vitals: { bp: '145/95', hr: '98', temp: '98.6°F', weight: '185 lbs' },
    history: 'Type 2 Diabetes, Hypertension, Stage 2 Lung Cancer',
  },
  {
    id: 2,
    patientName: 'Maria Garcia',
    time: '09:30 AM',
    urgency: 'Routine',
    chiefComplaint: 'Post-cycle checkup',
    predictedDuration: 'Routine (15m)',
    aiSummary: 'Patient is stable post-cycle 3 of Paclitaxel. AI analysis of latest scan showed no disease progression and 15% tumor shrinkage. Proceed with standard anti-nausea protocols for next cycle.',
    vitals: { bp: '120/80', hr: '72', temp: '98.4°F', weight: '140 lbs' },
    history: 'Breast Cancer (ER/PR+)',
  },
  {
    id: 3,
    patientName: 'Robert Kim',
    time: '10:00 AM',
    urgency: 'Urgent',
    chiefComplaint: 'Fever and severe fatigue',
    predictedDuration: 'High Complexity (45m)',
    aiSummary: 'Neutropenic fever alert! AI flagged patient based on latest CBC (ANC < 500). High risk of sepsis. Immediate broad-spectrum IV antibiotics recommended.',
    vitals: { bp: '108/65', hr: '110', temp: '102.1°F', weight: '172 lbs' },
    history: 'Non-Hodgkin Lymphoma, Asthma',
  },
  {
    id: 4,
    patientName: 'Lisa Thompson',
    time: '10:30 AM',
    urgency: 'Routine',
    chiefComplaint: 'Follow-up on MRI results',
    predictedDuration: 'Review (20m)',
    aiSummary: 'MRI indicates stable meningioma. No significant growth detected over 6 months. Symptoms of localized headache align with radiological findings. Consider adjusting pain management.',
    vitals: { bp: '118/76', hr: '68', temp: '98.3°F', weight: '128 lbs' },
    history: 'Benign Meningioma, Hypothyroidism',
  },
];

const chemoSchedule = [
  { patient: 'Sarah Jenkins', time: '11:00 AM', regimen: 'FOLFOX (Cycle 4)', status: 'Preparing' },
  { patient: 'David Miller', time: '01:30 PM', regimen: 'R-CHOP (Cycle 2)', status: 'Scheduled' },
  { patient: 'Emily Chen', time: '03:00 PM', regimen: 'Keytruda', status: 'Scheduled' },
];

const labAlerts = [
  { patient: 'Robert Kim', alert: 'ANC < 500 (Neutropenia)', severity: 'Critical', time: '10 mins ago' },
  { patient: 'Lisa Thompson', alert: 'Hemoglobin 8.2 g/dL', severity: 'High', time: '1 hr ago' },
  { patient: 'John Anderson', alert: 'Elevated Troponin', severity: 'Critical', time: '2 hrs ago' },
];

export default function DoctorDashboard() {
  const [appointmentsList, setAppointmentsList] = useState(richAppointments);
  const [selectedPatient, setSelectedPatient] = useState(richAppointments[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/doctor');
        const backendAppointments = response.data.today_appointments || [];
        if (backendAppointments.length > 0) {
          const merged = backendAppointments.map((apt: any, index: number) => {
            const richMock = richAppointments[index % richAppointments.length];
            return {
              id: index + 1,
              patientName: apt.patient_name,
              time: apt.time + ' AM',
              urgency: index === 0 ? 'Urgent' : 'Routine',
              chiefComplaint: richMock.chiefComplaint,
              predictedDuration: richMock.predictedDuration,
              aiSummary: richMock.aiSummary,
              vitals: richMock.vitals,
              history: richMock.history,
            };
          });
          setAppointmentsList(merged);
          setSelectedPatient(merged[0]);
        }
      } catch (err) {
        console.error('Error fetching doctor dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleCompleteConsultation = () => {
    console.log('Completing consultation:', { diagnosis, prescription, notes });
    setDiagnosis('');
    setPrescription('');
    setNotes('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Doctor Portal
        </h1>
        <p className="text-slate-400">Today's consultation queue and AI-driven clinical insights</p>
      </div>

      {/* Top Row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CalendarDays className="w-16 h-16 text-indigo-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm text-indigo-300 font-medium mb-1">Today's Appointments</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">{appointmentsList.length}</h2>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">+2 Add-ons</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/20 backdrop-blur-xl relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity animate-pulse">
            <Activity className="w-16 h-16 text-rose-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm text-rose-300 font-medium mb-1">Critical Lab Alerts</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">3</h2>
              <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full animate-pulse">Requires Action</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FilePlus className="w-16 h-16 text-emerald-400" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm text-emerald-300 font-medium mb-1">New Reports Uploaded</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">8</h2>
              <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">Since yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Consultation Queue (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                Patient Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-slate-400 text-center py-12">
                    <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                    Loading patient queue and predicting durations...
                  </div>
                ) : appointmentsList.map((appointment, index) => (
                  <Dialog key={appointment.id}>
                    <DialogTrigger asChild>
                      <div
                        onClick={() => setSelectedPatient(appointment)}
                        className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-violet-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-violet-500/10 group animate-in slide-in-from-left duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                              <span className="text-white font-medium">
                                {appointment.patientName && typeof appointment.patientName === 'string' ? appointment.patientName.split(' ').filter(Boolean).map(n => n[0]).join('') : 'P'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-medium">{appointment.patientName}</h4>
                                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 text-[10px]">
                                  <Timer className="w-3 h-3 mr-1 inline" />
                                  {appointment.predictedDuration}
                                </Badge>
                              </div>
                              <p className="text-slate-400 text-sm line-clamp-1">{appointment.chiefComplaint}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <Badge
                              variant="outline"
                              className={
                                appointment.urgency === 'Urgent'
                                  ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse'
                                  : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              }
                            >
                              {appointment.urgency}
                            </Badge>
                            <p className="text-cyan-400 text-sm font-medium">{appointment.time}</p>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700/30 max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2 text-xl">
                          <FileText className="w-6 h-6 text-violet-400" />
                          Patient Clinical Profile - {selectedPatient.patientName}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6 mt-4">
                        {/* AI Summary Highlight Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/30 shadow-lg shadow-indigo-500/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                          <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            AI Patient Summary
                          </h4>
                          <p className="text-slate-200 leading-relaxed text-sm">
                            {selectedPatient.aiSummary}
                          </p>
                        </div>

                        {/* Patient Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Chief Complaint</p>
                            <p className="text-white text-sm">{selectedPatient.chiefComplaint}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Predicted Duration</p>
                            <p className="text-indigo-300 text-sm font-medium flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {selectedPatient.predictedDuration}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Appointment Time</p>
                            <p className="text-cyan-400 text-sm font-medium">{selectedPatient.time}</p>
                          </div>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Vitals */}
                        <div>
                          <h4 className="text-white mb-3 flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 text-emerald-400" />
                            Current Vitals
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600 transition-colors">
                              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Blood Pressure</p>
                              <p className="text-white font-medium">{selectedPatient.vitals.bp}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600 transition-colors">
                              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Heart Rate</p>
                              <p className="text-white font-medium">{selectedPatient.vitals.hr} <span className="text-slate-500 text-sm">bpm</span></p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600 transition-colors">
                              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Temperature</p>
                              <p className="text-white font-medium">{selectedPatient.vitals.temp}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600 transition-colors">
                              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Weight</p>
                              <p className="text-white font-medium">{selectedPatient.vitals.weight}</p>
                            </div>
                          </div>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Medical History */}
                        <div>
                          <h4 className="text-white mb-2 font-medium">Medical History</h4>
                          <p className="text-slate-300 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-sm">
                            {selectedPatient.history}
                          </p>
                        </div>

                        <Separator className="bg-slate-700/30" />

                        {/* Clinical Action Form */}
                        <div className="space-y-5">
                          <h4 className="text-white flex items-center gap-2 font-medium">
                            <Pill className="w-4 h-4 text-cyan-400" />
                            Clinical Action
                          </h4>

                          <div className="space-y-2">
                            <Label htmlFor="diagnosis" className="text-slate-300">Diagnosis</Label>
                            <Input
                              id="diagnosis"
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              placeholder="Enter diagnosis..."
                              className="bg-slate-800/50 border-slate-700/30 text-white focus-visible:ring-violet-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="prescription" className="text-slate-300">Prescription</Label>
                            <Textarea
                              id="prescription"
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              placeholder="Enter medications and dosages..."
                              className="bg-slate-800/50 border-slate-700/30 text-white min-h-[100px] focus-visible:ring-violet-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="notes" className="text-slate-300">Treatment Notes</Label>
                            <Textarea
                              id="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Enter treatment plan and follow-up instructions..."
                              className="bg-slate-800/50 border-slate-700/30 text-white min-h-[120px] focus-visible:ring-violet-500/50"
                            />
                          </div>

                          <Button
                            onClick={handleCompleteConsultation}
                            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Consultation
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Alerts and Schedules (1/3 width) */}
        <div className="space-y-6">
          
          {/* Critical Lab Alerts */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-rose-500/20 bg-rose-500/5">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <FlaskConical className="w-4 h-4 text-rose-400" />
                Critical Lab Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {labAlerts.map((alert, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-rose-500/20 flex flex-col gap-1 hover:border-rose-500/40 transition-colors cursor-default">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-white">{alert.patient}</h5>
                      <span className="text-[10px] text-slate-400">{alert.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-rose-300 font-medium">{alert.alert}</p>
                      <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10 text-[10px] py-0 px-1.5 h-4">
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chemotherapy Schedule */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <CalendarDays className="w-4 h-4 text-cyan-400" />
                Chemotherapy Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {chemoSchedule.map((session, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {/* Timeline line */}
                    {idx !== chemoSchedule.length - 1 && (
                      <div className="absolute left-[5px] top-6 bottom-[-16px] w-[2px] bg-slate-700/50" />
                    )}
                    {/* Timeline dot */}
                    <div className="mt-1.5">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <p className="text-xs text-cyan-400 font-medium mb-0.5">{session.time}</p>
                      <p className="text-sm text-white font-medium">{session.patient}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-400">{session.regimen}</p>
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px] py-0 px-1.5 h-4">
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
