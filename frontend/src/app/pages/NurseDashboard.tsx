import { useState, useEffect } from 'react';
import { Heart, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../shared/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const vitalsQueue = [
  { id: 1, name: 'Robert Kim', appointmentTime: '10:00 AM', status: 'Waiting', arrived: '9:45 AM' },
  { id: 2, name: 'Lisa Thompson', appointmentTime: '10:30 AM', status: 'Waiting', arrived: '10:15 AM' },
  { id: 3, name: 'James Wilson', appointmentTime: '11:00 AM', status: 'Waiting', arrived: '10:50 AM' },
  { id: 4, name: 'Patricia Martinez', appointmentTime: '11:30 AM', status: 'Waiting', arrived: '11:20 AM' },
];

export default function NurseDashboard() {
  const [patientList, setPatientList] = useState(vitalsQueue);
  const [selectedPatient, setSelectedPatient] = useState(vitalsQueue[0]);
  const [pendingVitalsCount, setPendingVitalsCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    complaints: '',
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboards/nurse');
        const count = response.data.pending_vitals;
        const queue = response.data.patients_queue || [];
        
        if (count !== undefined) setPendingVitalsCount(count);
        
        if (queue.length > 0) {
          const merged = queue.map((p: any, index: number) => {
            const richMock = vitalsQueue[index % vitalsQueue.length];
            return {
              id: index + 1,
              name: p.patient_name,
              appointmentTime: richMock.appointmentTime,
              status: p.status,
              arrived: richMock.arrived,
            };
          });
          setPatientList(merged);
          setSelectedPatient(merged[0]);
        }
      } catch (err) {
        console.error('Error fetching nurse dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleRecordVitals = () => {
    console.log('Recording vitals:', { patient: selectedPatient, vitals });
    setVitals({
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      complaints: '',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
          Nurse Station
        </h1>
        <p className="text-slate-400">Patient preparation and vitals tracking</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">Patients Waiting</p>
                <h3 className="text-white mt-2">{isLoading ? '...' : pendingVitalsCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">Vitals Recorded</p>
                <h3 className="text-white mt-2">12</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">Ready for Doctor</p>
                <h3 className="text-white mt-2">8</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vitals Queue */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-700/30 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-400" />
            Patient Vitals Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-slate-400 text-center py-8">
                <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                Loading vitals queue...
              </div>
            ) : patientList.map((patient, index) => (
              <Dialog key={patient.id}>
                <DialogTrigger asChild>
                  <div
                    onClick={() => setSelectedPatient(patient)}
                    className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-emerald-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 animate-in slide-in-from-left duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <span className="text-white">
                            {patient.name && typeof patient.name === 'string' ? patient.name.split(' ').filter(Boolean).map(n => n[0]).join('') : 'P'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white">{patient.name}</h4>
                          <p className="text-slate-400 text-sm">
                            Arrived: {patient.arrived} • Appt: {patient.appointmentTime}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                      >
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700/30 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-400" />
                      Record Vitals - {selectedPatient.name}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    {/* Vitals Input Form */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bp" className="text-slate-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          Blood Pressure
                        </Label>
                        <Input
                          id="bp"
                          placeholder="120/80"
                          value={vitals.bloodPressure}
                          onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                          className="bg-slate-800/50 border-slate-700/30 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hr" className="text-slate-300 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-rose-400" />
                          Heart Rate (bpm)
                        </Label>
                        <Input
                          id="hr"
                          placeholder="72"
                          value={vitals.heartRate}
                          onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                          className="bg-slate-800/50 border-slate-700/30 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="temp" className="text-slate-300 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          Temperature (°F)
                        </Label>
                        <Input
                          id="temp"
                          placeholder="98.6"
                          value={vitals.temperature}
                          onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                          className="bg-slate-800/50 border-slate-700/30 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-slate-300">
                          Weight (lbs)
                        </Label>
                        <Input
                          id="weight"
                          placeholder="150"
                          value={vitals.weight}
                          onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                          className="bg-slate-800/50 border-slate-700/30 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complaints" className="text-slate-300">
                        Initial Patient Complaints
                      </Label>
                      <Textarea
                        id="complaints"
                        placeholder="Record any patient complaints or concerns..."
                        value={vitals.complaints}
                        onChange={(e) => setVitals({ ...vitals, complaints: e.target.value })}
                        className="bg-slate-800/50 border-slate-700/30 text-white min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleRecordVitals}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Record Vitals
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white shadow-lg shadow-violet-500/20"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ready for Doctor
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
  );
}
