import { useState, useEffect } from 'react';
import { Heart, Activity, CheckCircle, AlertCircle, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
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

interface PatientInQueue {
  id: number;
  name: string;
  appointmentTime: string;
  status: string;
  arrived: string;
}

export default function NurseDashboard() {
  const [patientList, setPatientList] = useState<PatientInQueue[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientInQueue | null>(null);
  const [pendingVitalsCount, setPendingVitalsCount] = useState(0);
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
          const mapped = queue.map((p: any, index: number) => {
            return {
              id: index + 1,
              name: p.patient_name,
              appointmentTime: '--',
              status: p.status,
              arrived: '--',
            };
          });
          setPatientList(mapped);
          setSelectedPatient(mapped[0]);
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

  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [isAssessingToxicity, setIsAssessingToxicity] = useState(false);

  const mockRegimen = {
    proposed_regimen: "Doxorubicin 60 mg/m2",
    allergies: "None",
    current_meds: "Lisinopril",
    renal_function: "CrCl > 60",
    hepatic_function: "Normal AST/ALT"
  };

  const handleRunSafetyCheck = async () => {
    setIsCheckingSafety(true);
    toast.info('Drug Safety Agent is reviewing regimen...', { id: 'safety-toast' });
    try {
      await api.post(`/infusion/${selectedPatient.id}/safety-check`, mockRegimen);
      setTimeout(() => {
        toast.success('Regimen is safe to administer!', { id: 'safety-toast' });
        setIsCheckingSafety(false);
      }, 3000);
    } catch (err) {
      toast.error('Failed to run safety check', { id: 'safety-toast' });
      setIsCheckingSafety(false);
    }
  };

  const handleAssessToxicity = async () => {
    if (!vitals.complaints) {
      toast.error('Please enter patient complaints first.');
      return;
    }
    setIsAssessingToxicity(true);
    toast.info('Toxicity Assessment Agent is analyzing symptoms...', { id: 'toxicity-toast' });
    try {
      await api.post(`/infusion/${selectedPatient.id}/assess-toxicity`, {
        clinical_note: vitals.complaints
      });
      setTimeout(() => {
        toast.success('Toxicity assessment complete! No severe side effects detected.', { id: 'toxicity-toast' });
        setIsAssessingToxicity(false);
      }, 3000);
    } catch (err) {
      toast.error('Failed to assess toxicity', { id: 'toxicity-toast' });
      setIsAssessingToxicity(false);
    }
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
                <h3 className="text-white mt-2">0</h3>
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
                <h3 className="text-white mt-2">0</h3>
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
            ) : patientList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-300">Queue is empty</p>
                <p className="mt-1">No patients currently waiting for vitals.</p>
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
                      Record Vitals - {selectedPatient?.name}
                    </DialogTitle>
                  </DialogHeader>

                  {selectedPatient && (
                  <div className="space-y-6 mt-4">
                    {/* Infusion Safety Block */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/30 shadow-lg shadow-indigo-500/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-indigo-300 font-semibold flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          Pre-Infusion Safety Checklist
                        </h4>
                        <Button 
                          size="sm" 
                          onClick={handleRunSafetyCheck}
                          disabled={isCheckingSafety}
                          className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-white border border-indigo-500/30"
                        >
                          {isCheckingSafety ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                          {isCheckingSafety ? "Reviewing..." : "Run AI Safety Check"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 text-sm gap-2">
                        <div><span className="text-slate-400">Regimen:</span> <span className="text-white">{mockRegimen.proposed_regimen}</span></div>
                        <div><span className="text-slate-400">Allergies:</span> <span className="text-white">{mockRegimen.allergies}</span></div>
                        <div><span className="text-slate-400">Renal:</span> <span className="text-white">{mockRegimen.renal_function}</span></div>
                        <div><span className="text-slate-400">Hepatic:</span> <span className="text-white">{mockRegimen.hepatic_function}</span></div>
                      </div>
                    </div>

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
                        onClick={handleAssessToxicity}
                        disabled={isAssessingToxicity}
                        className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white shadow-lg shadow-violet-500/20"
                      >
                        {isAssessingToxicity ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isAssessingToxicity ? "Assess Toxicity" : "Assess Toxicity (AI)"}
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-lg shadow-rose-500/20"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ready for Doctor
                      </Button>
                    </div>
                  </div>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
