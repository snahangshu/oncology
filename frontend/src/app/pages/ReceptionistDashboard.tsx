import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Plus, UserPlus, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../shared/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    
    // Simulate getting a patient ID
    const patientId = 999;
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      toast.info('Uploading document to secure vault...', { id: 'upload-toast' });
      await api.post(`/intake/upload?patient_id=${patientId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.loading('AI Agents analyzing document...', { id: 'upload-toast' });
      await api.post(`/intake/${patientId}/analyze-insurance`, {
        document_id: patientId,
        document_text: "Mock text for OCR extraction..."
      });
      
      setTimeout(() => {
        toast.success('Document processed! AI extracted Insurance Auth details.', { id: 'upload-toast' });
        setIsUploading(false);
        setSelectedFile(null);
      }, 3000);
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to process document.', { id: 'upload-toast' });
      setIsUploading(false);
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

  const handleRegisterPatient = () => {
    console.log('Registering patient:', newPatient);
    setNewPatient({ firstName: '', lastName: '', email: '', phone: '', insurance: '' });
  };

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
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 shadow-lg shadow-cyan-500/5">
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700/30">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-cyan-400" />
                  Upload Clinical Document
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-slate-300 font-medium text-center">
                    {selectedFile ? selectedFile.name : "Drag & drop file or click to browse"}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">Supports PDF, JPG, PNG (Max 10MB)</p>
                </div>
                
                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  {isUploading ? "Processing via AI..." : "Upload & Analyze"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white shadow-lg shadow-cyan-500/20">
                <UserPlus className="w-4 h-4 mr-2" />
                Register Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700/30">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                Register New Patient
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                  <Input
                    id="firstName"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    className="bg-slate-800/50 border-slate-700/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    className="bg-slate-800/50 border-slate-700/30 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                <Input
                  id="phone"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/30 text-white"
                />
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
              <Button
                onClick={handleRegisterPatient}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
              >
                Register Patient
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
