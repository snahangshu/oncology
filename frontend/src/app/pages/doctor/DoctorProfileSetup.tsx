import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { api } from '../../shared/api';
import { Stethoscope, User, Activity, Clock, ShieldCheck, MapPin, CheckCircle, ChevronRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function DoctorProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
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
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        disease_expertise: [
          ...formData.disease_expertise_oncology.split(',').map(s => ({ disease: s.trim(), category: 'Oncology' })),
          ...formData.disease_expertise_hematology.split(',').map(s => ({ disease: s.trim(), category: 'Hematology' }))
        ].filter(d => d.disease),
        treatment_expertise: formData.treatment_expertise.split(',').map(s => s.trim()).filter(Boolean)
      };

      await api.post('/doctors/me/profile', payload);
      toast.success('Profile setup complete! Pending admin verification.');
      navigate('/doctor');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 mt-8">
      <div>
        <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-3xl font-bold">
          Complete Your Profile
        </h1>
        <p className="text-slate-400">Step {step} of 4: Setup your clinical profile for AI matching.</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full mt-4">
          <div 
            className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {step === 1 && (
          <Card className="bg-slate-900/50 border-slate-700/50 animate-in slide-in-from-right-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" /> Professional Details
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
        )}

        {step === 2 && (
          <Card className="bg-slate-900/50 border-slate-700/50 animate-in slide-in-from-right-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-400" /> Clinical Expertise
              </CardTitle>
              <CardDescription>Comma-separated values for AI routing.</CardDescription>
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
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
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

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" /> AI Matching Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <Label>Accepts New Patients</Label>
                    <Switch checked={formData.accepts_new_patients} onCheckedChange={(v) => handleSwitchChange('accepts_new_patients', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Accepts Emergency</Label>
                    <Switch checked={formData.accepts_emergency} onCheckedChange={(v) => handleSwitchChange('accepts_emergency', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rare Cancers</Label>
                    <Switch checked={formData.accepts_rare_cancers} onCheckedChange={(v) => handleSwitchChange('accepts_rare_cancers', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Clinical Trials</Label>
                    <Switch checked={formData.accepts_clinical_trial_referrals} onCheckedChange={(v) => handleSwitchChange('accepts_clinical_trial_referrals', v)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <Card className="bg-slate-900/50 border-slate-700/50 animate-in slide-in-from-right-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" /> Upload Documents
              </CardTitle>
              <CardDescription>Upload your required credentials for verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center flex flex-col items-center">
                <Upload className="w-10 h-10 text-slate-500 mb-4" />
                <h3 className="text-white font-medium mb-1">Upload Medical License</h3>
                <p className="text-slate-400 text-sm mb-4">PDF, JPG, PNG up to 10MB</p>
                <Button variant="outline" className="border-cyan-500/30 text-cyan-400">
                  Select File
                </Button>
              </div>

              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center flex flex-col items-center">
                <Upload className="w-10 h-10 text-slate-500 mb-4" />
                <h3 className="text-white font-medium mb-1">Upload Board Certification</h3>
                <p className="text-slate-400 text-sm mb-4">PDF, JPG, PNG up to 10MB</p>
                <Button variant="outline" className="border-cyan-500/30 text-cyan-400">
                  Select File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between border-t border-slate-800 pt-6">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white min-w-[150px]">
            {loading ? "Saving..." : step === 4 ? "Submit Profile" : "Continue"}
            {!loading && step < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
