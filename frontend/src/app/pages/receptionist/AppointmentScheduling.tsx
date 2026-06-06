import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, UserPlus, Sparkles, User, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { api } from '../../shared/api';

interface OptionPatient {
  id: string;
  name: string;
  mrn: string;
}

interface OptionDoctor {
  id: string;
  name: string;
  specialty: string;
}

export default function AppointmentScheduling() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [patients, setPatients] = useState<OptionPatient[]>([]);
  const [doctors, setDoctors] = useState<OptionDoctor[]>([]);

  useEffect(() => {
    api.get('/dashboards/receptionist/scheduling-options')
      .then(res => {
        setPatients(res.data.patients);
        setDoctors(res.data.doctors);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSimulateAi = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setShowAiRecommendations(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent text-3xl font-bold mb-2">
          Appointment Scheduling
        </h1>
        <p className="text-slate-500">Intelligent scheduling with AI-driven recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                Create Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-slate-700">Select Patient</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900">
                      <SelectValue placeholder="Search patient..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-sm">
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.mrn})</SelectItem>
                      ))}
                      <SelectItem value="new-patient">+ Add New Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700">Appointment Type</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-sm">
                      <SelectItem value="initial-consult">Initial Consult</SelectItem>
                      <SelectItem value="follow-up">Follow-Up</SelectItem>
                      <SelectItem value="infusion">Infusion Session</SelectItem>
                      <SelectItem value="tumor-board">Tumor Board Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700">Diagnosis / Reason for Visit</Label>
                <Input 
                  placeholder="e.g. Stage III Breast Cancer"
                  className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900"
                  defaultValue="Stage III Breast Cancer"
                />
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleSimulateAi}
                  disabled={isAiAnalyzing || showAiRecommendations}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-slate-900 border-0 shadow-lg shadow-violet-500/20"
                >
                  {isAiAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      AI Analyzing Diagnosis...
                    </span>
                  ) : showAiRecommendations ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      AI Recommendations Generated
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Get AI Scheduling Recommendations
                    </span>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* AI Recommendations Panel */}
          {showAiRecommendations && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10 border-violet-500/30 shadow-xl shadow-violet-500/5">
                <CardHeader>
                  <CardTitle className="text-violet-300 flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    AI Scheduling Assistant
                  </CardTitle>
                  <CardDescription className="text-violet-400/70">
                    Based on patient history and "Stage III Breast Cancer" diagnosis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/60 border border-violet-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium">Recommended Doctor</span>
                      </div>
                      <p className="text-slate-900 font-medium text-lg">Dr. Patel</p>
                      <p className="text-xs text-slate-500 mt-1">Specialist: Breast Oncology</p>
                    </div>

                    <div className="bg-white/60 border border-violet-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium">Suggested Duration</span>
                      </div>
                      <p className="text-slate-900 font-medium text-lg">45 Minutes</p>
                      <p className="text-xs text-slate-500 mt-1">Standard for Stage III Initial</p>
                    </div>

                    <div className="bg-white/60 border border-violet-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <CalendarIcon className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-sm font-medium">Next Available</span>
                      </div>
                      <p className="text-slate-900 font-medium text-lg">10:30 AM</p>
                      <p className="text-xs text-slate-500 mt-1">Tomorrow (Jun 11)</p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button className="bg-violet-500 hover:bg-violet-600 text-slate-900 shadow-lg shadow-violet-500/20">
                      Apply Recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column: Mini Calendar & Availability */}
        <div className="space-y-6">
          <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900 text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-xl border border-slate-200 shadow-sm bg-slate-50"
              />
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900 text-lg">Doctor Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <div>
                    <p className="text-sm text-slate-900 font-medium">Dr. Sharma</p>
                    <p className="text-xs text-slate-500">Available</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400">3 slots</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <div>
                    <p className="text-sm text-slate-900 font-medium">Dr. Patel</p>
                    <p className="text-xs text-slate-500">In Consultation</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Free at 11:30 AM</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  <div>
                    <p className="text-sm text-slate-900 font-medium">Dr. Singh</p>
                    <p className="text-xs text-slate-500">Off Today</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">0 slots</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
