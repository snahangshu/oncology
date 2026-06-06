import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { api } from '../../shared/api';
import { PatientAssistantChat } from '../../components/PatientAssistantChat';

export default function PatientLabResults() {
  const [labResults, setLabResults] = useState<any[]>([]);
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
        setLabResults(data.lab_results || []);
      } catch (err) {
        console.error('Error fetching lab results:', err);
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
          Lab Results
        </h1>
        <p className="text-slate-500">View your latest laboratory tests and metrics</p>
      </div>

      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-rose-400" />
            Recent Lab Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-slate-500 text-center py-8">
              <Loader2 className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-2" />
              Loading lab results...
            </div>
          ) : labResults.length === 0 ? (
            <div className="text-slate-500 text-center py-8">No recent lab results found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 text-slate-500 text-sm">
                    <th className="py-3 px-4 font-medium">Test Name</th>
                    <th className="py-3 px-4 font-medium">Result</th>
                    <th className="py-3 px-4 font-medium hidden md:table-cell">Reference Range</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {labResults.map((lab, i) => (
                    <tr key={lab.id || i} className="border-b border-slate-200/50 hover:bg-slate-50/20 transition-colors">
                      <td className="py-4 px-4 text-slate-900 font-medium">{lab.test_name}</td>
                      <td className="py-4 px-4 text-slate-900 font-bold">
                        {lab.result_value} <span className="text-slate-500 font-normal text-sm ml-1">{lab.unit}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 hidden md:table-cell">{lab.reference_range}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={
                          lab.status === 'Normal' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                          lab.status === 'High' ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' :
                          'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        }>
                          {lab.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-sm hidden sm:table-cell">
                        {lab.date_collected ? new Date(lab.date_collected).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {intake?.patient_id && <PatientAssistantChat patientId={intake.patient_id} />}
    </div>
  );
}
