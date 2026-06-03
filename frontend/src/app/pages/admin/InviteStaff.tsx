import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { api } from '../../shared/api';
import { UserPlus, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InviteStaff() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'DOCTOR'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/staff/invite', formData);
      toast.success(`Invitation sent to ${formData.email}!`);
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 mt-10">
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold">
          Invite New Staff
        </h1>
        <p className="text-slate-400">Send an onboarding invitation to a new team member.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" /> Basic Details
            </CardTitle>
            <CardDescription>The user will complete their full profile during onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input required name="full_name" value={formData.full_name} onChange={handleChange} placeholder="e.g. Dr. Rajesh Sharma" className="bg-slate-950 border-slate-800" />
            </div>
            
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="rajesh@hospital.com" className="bg-slate-950 border-slate-800 pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 border-t border-slate-800 pt-6">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[150px]">
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
