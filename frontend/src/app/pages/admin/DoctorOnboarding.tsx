import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { api } from '../../shared/api';
import { Stethoscope, User, Activity, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function DoctorOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: 'Medical Oncology',
    gender: '',
    qualifications: '',
    experience_years: 0,
    license_number: '',
    doctor_role: 'Medical Oncologist',
    
    max_new_consults_per_day: 5,
    max_follow_ups_per_day: 15,
    max_urgent_cases_per_day: 2,
    max_working_hours: 8,

    accepts_new_patients: true,
    accepts_emergency: true,
    accepts_second_opinions: true,
    accepts_rare_cancers: true,
    accepts_pediatric: false,
    accepts_clinical_trial_referrals: true,
    telemedicine_available: true,
    
    // Arrays for multi-select (simplified as comma separated strings for MVP)
    disease_expertise_oncology: '',
    disease_expertise_hematology: '',
    treatment_expertise: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, we would transform the comma-separated strings into arrays
      // and send them in the correct format for the backend to handle junction tables.
      const payload = {
        ...formData,
        disease_expertise: [
          ...formData.disease_expertise_oncology.split(',').map(s => ({ disease: s.trim(), category: 'Oncology' })),
          ...formData.disease_expertise_hematology.split(',').map(s => ({ disease: s.trim(), category: 'Hematology' }))
        ].filter(d => d.disease),
        treatment_expertise: formData.treatment_expertise.split(',').map(s => s.trim()).filter(Boolean)
      };

      await api.post('/doctors', payload);
      toast.success('Doctor successfully onboarded!');
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to onboard doctor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Enterprise Doctor Onboarding
        </h1>
        <p className="text-slate-400">Configure comprehensive AI-matching profiles for new clinicians.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Info */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input required name="first_name" value={formData.first_name} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input required name="last_name" value={formData.last_name} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" name="email" value={formData.email} onChange={handleChange} className="bg-slate-950 border-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input required name="phone" value={formData.phone} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Input name="gender" value={formData.gender} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Profile */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" /> Professional Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Clinical Role</Label>
                <Input required name="doctor_role" value={formData.doctor_role} onChange={handleChange} placeholder="e.g. Medical Oncologist, Hematologist" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label>Primary Specialty</Label>
                <Input required name="specialty" value={formData.specialty} onChange={handleChange} className="bg-slate-950 border-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input required name="license_number" value={formData.license_number} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Experience (Years)</Label>
                  <Input required type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expertise (Simplified UI for MVP) */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-400" /> Clinical Expertise (Comma-separated)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Oncology Disease Expertise</Label>
                <Input name="disease_expertise_oncology" value={formData.disease_expertise_oncology} onChange={handleChange} placeholder="Breast Cancer, Colon Cancer" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label>Hematology Disease Expertise</Label>
                <Input name="disease_expertise_hematology" value={formData.disease_expertise_hematology} onChange={handleChange} placeholder="AML, Multiple Myeloma" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label>Treatment Expertise</Label>
                <Input name="treatment_expertise" value={formData.treatment_expertise} onChange={handleChange} placeholder="Chemotherapy, Immunotherapy" className="bg-slate-950 border-slate-800" />
              </div>
            </CardContent>
          </Card>

          {/* Capacity Limits */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" /> Daily Capacity Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max New Consults / Day</Label>
                  <Input required type="number" name="max_new_consults_per_day" value={formData.max_new_consults_per_day} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Max Follow-ups / Day</Label>
                  <Input required type="number" name="max_follow_ups_per_day" value={formData.max_follow_ups_per_day} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Max Urgent Cases / Day</Label>
                  <Input required type="number" name="max_urgent_cases_per_day" value={formData.max_urgent_cases_per_day} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Max Working Hours</Label>
                  <Input required type="number" name="max_working_hours" value={formData.max_working_hours} onChange={handleChange} className="bg-slate-950 border-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Referral & Appointment Preferences
            </CardTitle>
            <CardDescription>Configure AI matching rules for this clinician.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center justify-between">
                <Label>Accepts New Patients</Label>
                <Switch checked={formData.accepts_new_patients} onCheckedChange={(v) => handleSwitchChange('accepts_new_patients', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Accepts Emergency</Label>
                <Switch checked={formData.accepts_emergency} onCheckedChange={(v) => handleSwitchChange('accepts_emergency', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Second Opinions</Label>
                <Switch checked={formData.accepts_second_opinions} onCheckedChange={(v) => handleSwitchChange('accepts_second_opinions', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Rare Cancers</Label>
                <Switch checked={formData.accepts_rare_cancers} onCheckedChange={(v) => handleSwitchChange('accepts_rare_cancers', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Pediatric Cases</Label>
                <Switch checked={formData.accepts_pediatric} onCheckedChange={(v) => handleSwitchChange('accepts_pediatric', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Clinical Trials</Label>
                <Switch checked={formData.accepts_clinical_trial_referrals} onCheckedChange={(v) => handleSwitchChange('accepts_clinical_trial_referrals', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Telemedicine</Label>
                <Switch checked={formData.telemedicine_available} onCheckedChange={(v) => handleSwitchChange('telemedicine_available', v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 border-t border-slate-800 pt-6">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[150px]">
            {loading ? "Saving..." : "Onboard Doctor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
