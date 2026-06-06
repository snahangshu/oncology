import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { api } from '../../shared/api';
import { User, CreditCard, ArrowRight, Activity, Calendar } from 'lucide-react';

const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'DOB is required'),
  gender: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional(),
  primary_diagnosis: z.string().optional(),
  patient_comments: z.string().optional(),
  insurance_details: z.object({
    provider_name: z.string().min(1, 'Provider name is required'),
    policy_number: z.string().min(1, 'Policy number is required'),
    group_number: z.string().optional()
  })
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function NewPatient() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema)
  });

  const onSubmit = async (data: PatientFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await api.post('/patients', data);
      toast.success(response.data.message);
      navigate(`/receptionist/intake/${response.data.patient_id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Register New Patient
        </h1>
        <p className="text-slate-500 mt-2">Initialize a new patient profile and open an oncology intake case.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Demographics Card */}
        <Card className="bg-white/50 border-slate-200/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Patient Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700">First Name <span className="text-rose-500">*</span></Label>
              <Input {...register('first_name')} className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              {errors.first_name && <p className="text-sm text-rose-400">{errors.first_name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700">Last Name <span className="text-rose-500">*</span></Label>
              <Input {...register('last_name')} className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              {errors.last_name && <p className="text-sm text-rose-400">{errors.last_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Date of Birth <span className="text-rose-500">*</span></Label>
              <Input type="date" {...register('date_of_birth')} className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              {errors.date_of_birth && <p className="text-sm text-rose-400">{errors.date_of_birth.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Gender</Label>
              <Select onValueChange={(val) => setValue('gender', val)}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Email Address <span className="text-rose-500">*</span></Label>
              <Input type="email" {...register('email')} className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              {errors.email && <p className="text-sm text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Phone Number <span className="text-rose-500">*</span></Label>
              <Input {...register('phone')} placeholder="+1 (555) 000-0000" className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              {errors.phone && <p className="text-sm text-rose-400">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-700">Physical Address</Label>
              <Input {...register('address')} placeholder="123 Main St, City, State, ZIP" className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
            </div>
          </CardContent>
        </Card>

        {/* Clinical Information Card */}
        <Card className="bg-white/50 border-slate-200/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Clinical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Primary Diagnosis</Label>
              <Input {...register('primary_diagnosis')} placeholder="e.g. Stage IV Lung Cancer" className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              <p className="text-xs text-slate-500">This helps our AI system automatically triage and allocate the correct appointment duration.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Presenting Symptoms / Notes</Label>
              <textarea 
                {...register('patient_comments')} 
                placeholder="Patient is experiencing severe pain..." 
                className="w-full min-h-[100px] rounded-md bg-slate-50/50 border border-slate-200 shadow-sm text-slate-900 p-3 text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 outline-none transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* Insurance Card */}
        <Card className="bg-white/50 border-slate-200/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Insurance Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-1">
              <Label className="text-slate-700">Provider Name <span className="text-rose-500">*</span></Label>
              <Input {...register('insurance_details.provider_name')} className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              {errors.insurance_details?.provider_name && <p className="text-sm text-rose-400">{errors.insurance_details.provider_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Policy Number <span className="text-rose-500">*</span></Label>
              <Input {...register('insurance_details.policy_number')} className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
              {errors.insurance_details?.policy_number && <p className="text-sm text-rose-400">{errors.insurance_details.policy_number.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Group Number</Label>
              <Input {...register('insurance_details.group_number')} className="bg-slate-50/50 border-slate-200 shadow-sm text-slate-900" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="border-slate-200/50 text-slate-700 hover:bg-slate-50/50 hover:text-slate-900">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-slate-900 shadow-lg shadow-cyan-500/20">
            {isSubmitting ? "Creating Patient..." : "Create Patient & Proceed to Intake"}
            {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
