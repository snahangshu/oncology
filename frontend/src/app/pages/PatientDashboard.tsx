import { useState, useCallback, useEffect } from 'react';
import { Calendar, FileText, Clock, Upload, Plus, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../shared/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';

const upcomingAppointments = [
  {
    id: 1,
    date: 'June 15, 2026',
    time: '10:00 AM',
    doctor: 'Dr. Sarah Chen',
    type: 'Follow-up Consultation',
    status: 'Confirmed',
  },
  {
    id: 2,
    date: 'July 3, 2026',
    time: '2:30 PM',
    doctor: 'Dr. Michael Rodriguez',
    type: 'Annual Physical',
    status: 'Confirmed',
  },
];

const medicalHistory = [
  {
    id: 1,
    date: 'May 28, 2026',
    doctor: 'Dr. Sarah Chen',
    diagnosis: 'Seasonal Allergies',
    notes: 'Prescribed antihistamines. Patient responded well to treatment.',
    prescriptions: ['Cetirizine 10mg - Once daily'],
  },
  {
    id: 2,
    date: 'March 15, 2026',
    doctor: 'Dr. Michael Rodriguez',
    diagnosis: 'Annual Physical - Routine Checkup',
    notes: 'All vitals normal. Continue current exercise routine.',
    prescriptions: ['Multivitamin - Once daily'],
  },
  {
    id: 3,
    date: 'January 10, 2026',
    doctor: 'Dr. Sarah Chen',
    diagnosis: 'Upper Respiratory Infection',
    notes: 'Rest recommended. Follow-up if symptoms persist beyond 7 days.',
    prescriptions: ['Amoxicillin 500mg - Three times daily for 7 days'],
  },
];

const activePrescriptions = [
  { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', refillsLeft: 3 },
  { name: 'Multivitamin', dosage: 'Standard', frequency: 'Once daily', refillsLeft: 5 },
];

export default function PatientDashboard() {
  const [appointmentsList, setAppointmentsList] = useState(upcomingAppointments);
  const [prescriptionsList, setPrescriptionsList] = useState(activePrescriptions);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/patient');
        const appointments = response.data.upcoming_appointments || [];
        const prescriptions = response.data.recent_prescriptions || [];
        
        if (appointments.length > 0) {
          const merged = appointments.map((apt: any, index: number) => {
            return {
              id: index + 1,
              date: apt.date,
              time: '10:00 AM',
              doctor: apt.doctor,
              type: apt.department + ' Consultation',
              status: 'Confirmed',
            };
          });
          setAppointmentsList(merged);
        }
        
        if (prescriptions.length > 0) {
          const merged = prescriptions.map((rx: any, index: number) => {
            return {
              name: rx.medication,
              dosage: 'Standard',
              frequency: 'Once daily',
              refillsLeft: 3,
            };
          });
          setPrescriptionsList(merged);
        }
      } catch (err) {
        console.error('Error fetching patient dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const fileNames = files.map(f => f.name);
    setUploadedFiles(prev => [...prev, ...fileNames]);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent mb-2">
          Welcome Back!
        </h1>
        <p className="text-slate-400">Manage your health journey with ease</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white">Next Appointment</h3>
                <p className="text-slate-400 text-sm">June 15, 2026 at 10:00 AM</p>
              </div>
            </div>
            <Separator className="bg-slate-700/30 mb-4" />
            <div className="space-y-2 mb-4">
              <p className="text-slate-300">Dr. Sarah Chen</p>
              <p className="text-slate-400 text-sm">Follow-up Consultation</p>
            </div>
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white">
              View Details
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white">Schedule Appointment</h3>
                <p className="text-slate-400 text-sm">Book your next visit</p>
              </div>
            </div>
            <Separator className="bg-slate-700/30 mb-4" />
            <p className="text-slate-300 text-sm mb-4">
              Need to see a doctor? Schedule a new appointment with your preferred healthcare provider.
            </p>
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
              Schedule Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
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
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                Loading appointments...
              </div>
            ) : appointmentsList.map((apt, index) => (
              <div
                key={apt.id}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/50 transition-all animate-in slide-in-from-left duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white mb-1">{apt.type}</h4>
                    <p className="text-slate-400 text-sm">{apt.doctor}</p>
                    <p className="text-cyan-400 text-sm mt-2">
                      {apt.date} at {apt.time}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                  >
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical Records Timeline */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Medical Records Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {medicalHistory.map((record, index) => (
              <Dialog key={record.id}>
                <DialogTrigger asChild>
                  <div
                    className="relative pl-8 pb-6 border-l-2 border-slate-700/30 cursor-pointer hover:border-violet-500/50 transition-all last:border-transparent animate-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/50" />
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 hover:border-violet-500/50 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white">{record.diagnosis}</h4>
                          <p className="text-slate-400 text-sm">{record.doctor}</p>
                        </div>
                        <p className="text-slate-400 text-sm">{record.date}</p>
                      </div>
                      <p className="text-slate-300 text-sm mt-2">{record.notes}</p>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700/30 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-400" />
                      Visit Details - {record.date}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Doctor</Label>
                      <p className="text-white mt-1">{record.doctor}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-400 text-sm">Diagnosis</Label>
                      <p className="text-white mt-1">{record.diagnosis}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-400 text-sm">Doctor's Notes</Label>
                      <p className="text-slate-300 mt-1">{record.notes}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-400 text-sm">Prescriptions</Label>
                      <div className="space-y-2 mt-2">
                        {record.prescriptions.map((rx, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                          >
                            <p className="text-slate-300">{rx}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Prescriptions */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Active Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="text-slate-400 text-center py-8 col-span-2">
                <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-2" />
                Loading prescriptions...
              </div>
            ) : prescriptionsList.map((rx, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-rose-500/50 transition-all animate-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h4 className="text-white mb-1">{rx.name}</h4>
                <p className="text-slate-400 text-sm mb-2">{rx.dosage}</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-300 text-sm">{rx.frequency}</p>
                  <Badge
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                  >
                    {rx.refillsLeft} refills left
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Documents */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            Upload Medical Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700/50 hover:border-slate-600/50'
            }`}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-white mb-2">Drop files here or click to upload</h4>
            <p className="text-slate-400 text-sm mb-4">
              Upload lab results, imaging, or other medical documents
            </p>
            <Button
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              Choose Files
            </Button>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-slate-400 text-sm">Uploaded Files:</p>
              {uploadedFiles.map((file, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-300 text-sm"
                >
                  {file}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
