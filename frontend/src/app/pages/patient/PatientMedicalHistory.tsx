import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import { api } from '../../shared/api';
import { PatientAssistantChat } from '../../components/PatientAssistantChat';

export default function PatientMedicalHistory() {
  const [medicalHistory, setMedicalHistory] = useState<any[]>([]);
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
        setMedicalHistory(data.medical_history || []);
      } catch (err) {
        console.error('Error fetching medical history:', err);
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
          Medical History
        </h1>
        <p className="text-slate-500">Timeline of your past visits and medical records</p>
      </div>

      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Medical Records Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-slate-500 text-center py-8">
                <Loader2 className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
                Loading medical history...
              </div>
            ) : medicalHistory.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No medical records found.</div>
            ) : medicalHistory.map((record, index) => (
              <Dialog key={record.id}>
                <DialogTrigger asChild>
                  <div className="relative pl-8 pb-6 border-l-2 border-slate-200 shadow-sm cursor-pointer hover:border-violet-500/50 transition-all last:border-transparent">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/50" />
                    <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-4 hover:border-violet-500/50 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-slate-900">{record.diagnosis}</h4>
                          <p className="text-slate-500 text-sm">{record.doctor}</p>
                        </div>
                        <p className="text-slate-500 text-sm">{record.date}</p>
                      </div>
                      <p className="text-slate-700 text-sm mt-2">{record.notes}</p>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-white border-slate-200 shadow-sm max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-400" />
                      Visit Details - {record.date}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-slate-500 text-sm">Doctor</Label>
                      <p className="text-slate-900 mt-1">{record.doctor}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-500 text-sm">Diagnosis</Label>
                      <p className="text-slate-900 mt-1">{record.diagnosis}</p>
                    </div>
                    <Separator className="bg-slate-700/30" />
                    <div>
                      <Label className="text-slate-500 text-sm">Doctor's Notes</Label>
                      <p className="text-slate-700 mt-1">{record.notes}</p>
                    </div>
                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <>
                        <Separator className="bg-slate-700/30" />
                        <div>
                          <Label className="text-slate-500 text-sm">Prescriptions</Label>
                          <div className="space-y-2 mt-2">
                            {record.prescriptions.map((rx: any, i: number) => (
                              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                                <p className="text-slate-700">{rx}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}
