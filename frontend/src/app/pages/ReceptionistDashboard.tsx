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
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    insurance: '',
    primaryDiagnosis: '',
    comments: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegisterPatient = async () => {
    setIsRegistering(true);
    toast.info('Submitting patient intake...', { id: 'intake-toast' });
    try {
      // 1. Submit Patient Intake (Triggers Urgency Classifier AI)
      const intakeRes = await api.post('/intake', {
        first_name: newPatient.firstName || 'Unknown',
        last_name: newPatient.lastName || 'Unknown',
        date_of_birth: '1990-01-01', // Mock DOB
        email: newPatient.email || 'patient@example.com',
        phone: newPatient.phone || '0000000000',
        primary_diagnosis: newPatient.primaryDiagnosis,
        patient_comments: newPatient.comments,
        insurance_details: {
          provider_name: newPatient.insurance || 'Other',
          policy_number: '123456789'
        }
      });
      
      const patientId = intakeRes.data.patient_id;
      const urgency = intakeRes.data.urgency_level;
      
      // 2. Upload Document if selected
      if (selectedFile) {
        toast.loading('Uploading document...', { id: 'intake-toast' });
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        await api.post(`/intake/upload?patient_id=${patientId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        toast.loading('AI analyzing document...', { id: 'intake-toast' });
        await api.post(`/intake/${patientId}/analyze-insurance`, {
          document_id: patientId,
          document_text: "Mock text for OCR extraction..."
        });
      }
      
      toast.success('Patient registered! AI has triaged the patient.', { id: 'intake-toast' });
      
      // Update queue dynamically
      setWaitingRoomList(prev => [
        { id: patientId, name: `${newPatient.firstName || 'New'} ${newPatient.lastName || 'Patient'}`, type: 'Walk-in', waitTime: '0 min', status: urgency === 'EMERGENT' ? 'Urgent' : 'Waiting' },
        ...prev
      ]);
      
      setNewPatient({ firstName: '', lastName: '', email: '', phone: '', insurance: '', primaryDiagnosis: '', comments: '' });
      setSelectedFile(null);
      setIsRegistering(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to register patient.', { id: 'intake-toast' });
      setIsRegistering(false);
    }
  };

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
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white shadow-lg shadow-cyan-500/20">
                <UserPlus className="w-4 h-4 mr-2" />
                New Patient Intake
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700/30 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                Unified Patient Intake
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Patient Details */}
              <div className="space-y-4">
                <h4 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Patient Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                    <Input id="firstName" value={newPatient.firstName} onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })} className="bg-slate-800/50 border-slate-700/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                    <Input id="lastName" value={newPatient.lastName} onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })} className="bg-slate-800/50 border-slate-700/30 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input id="email" type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} className="bg-slate-800/50 border-slate-700/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                    <Input id="phone" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} className="bg-slate-800/50 border-slate-700/30 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance" className="text-slate-300">Insurance Provider</Label>
                  <Select onValueChange={(value) => setNewPatient({ ...newPatient, insurance: value })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/30 text-white">
                      <SelectValue placeholder="Select insurance" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700/30">
                      <SelectItem value="blue-cross">Blue Cross Blue Shield</SelectItem>
                      <SelectItem value="aetna">Aetna</SelectItem>
                      <SelectItem value="united">United Healthcare</SelectItem>
                      <SelectItem value="cigna">Cigna</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Clinical Triage */}
              <div className="space-y-4 pt-4 border-t border-slate-700/30">
                <h4 className="text-violet-400 font-semibold text-sm uppercase tracking-wider">Clinical Triage & Documents</h4>
                <div className="space-y-2">
                  <Label htmlFor="primaryDiagnosis" className="text-slate-300">Primary Diagnosis (If Known)</Label>
                  <Input id="primaryDiagnosis" placeholder="e.g. Breast Cancer Stage II" value={newPatient.primaryDiagnosis} onChange={(e) => setNewPatient({ ...newPatient, primaryDiagnosis: e.target.value })} className="bg-slate-800/50 border-slate-700/30 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-slate-300">Chief Complaint / Reason for Visit</Label>
                  <textarea 
                    id="comments" 
                    placeholder="Describe patient symptoms or reason for visit..."
                    value={newPatient.comments} 
                    onChange={(e) => setNewPatient({ ...newPatient, comments: e.target.value })} 
                    className="w-full rounded-md bg-slate-800/50 border-slate-700/30 text-white p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500/50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Clinical Documents</Label>
                  <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-slate-300 text-sm font-medium text-center">
                      {selectedFile ? selectedFile.name : "Drag & drop referral or pathology report"}
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleRegisterPatient}
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20 py-6 text-lg mt-4"
              >
                {isRegistering ? "Processing Intake..." : "Submit Unified Intake"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
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
