import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Users, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api } from '../../shared/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

interface CredentialStats {
  pending_reviews: number;
  expired_documents: number;
  expiring_soon: number;
}

export default function CredentialingDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CredentialStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingStaff, setPendingStaff] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboards/admin/credentialing');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load credentialing stats', err);
        setStats({ pending_reviews: 0, expired_documents: 0, expiring_soon: 0 }); // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold">
            Staff Credentialing
          </h1>
          <p className="text-slate-500">Review onboarding applications and track expiring documents</p>
        </div>
        <Button onClick={() => navigate('/admin/staff/invite')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900">
          <Users className="w-4 h-4 mr-2" /> Invite Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm">Pending Reviews</p>
                <h3 className="text-slate-900 mt-2 mb-1 text-3xl font-semibold">{loading ? '...' : stats?.pending_reviews}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Clock className="w-5 h-5 text-slate-900" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:border-rose-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm">Expired Documents</p>
                <h3 className="text-rose-400 mt-2 mb-1 text-3xl font-semibold">{loading ? '...' : stats?.expired_documents}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-slate-900" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm">Expiring Soon (30 Days)</p>
                <h3 className="text-emerald-400 mt-2 mb-1 text-3xl font-semibold">{loading ? '...' : stats?.expiring_soon}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                <FileText className="w-5 h-5 text-slate-900" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> Action Required: Onboarding Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500">Applicant Name</TableHead>
                <TableHead className="text-slate-500">Role</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500">Submitted</TableHead>
                <TableHead className="text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingStaff.map(staff => (
                <TableRow key={staff.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-slate-200">{staff.name}</TableCell>
                  <TableCell className="text-slate-500">{staff.role}</TableCell>
                  <TableCell>
                    {staff.status === 'PENDING_REVIEW' ? (
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Review Ready</Badge>
                    ) : (
                      <Badge className="bg-slate-500/20 text-slate-500 border border-slate-500/30">Missing Info</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500">{staff.submitted_at}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      disabled={staff.status !== 'PENDING_REVIEW'}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Verify Documents
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingStaff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No pending applications to review.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
