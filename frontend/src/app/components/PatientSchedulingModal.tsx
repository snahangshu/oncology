import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Calendar, Clock, Loader2, Sparkles, Activity, Plus, CheckCircle2, AlertCircle, Award, Stethoscope } from 'lucide-react';
import { api } from '../shared/api';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calendar as CalendarComponent } from './ui/calendar';

interface PatientSchedulingModalProps {
  patientId: number;
  trigger?: React.ReactNode;
}

export function PatientSchedulingModal({ patientId, trigger }: PatientSchedulingModalProps) {
  const [open, setOpen] = useState(false);
  const [bookingType, setBookingType] = useState<"consultation" | "infusion">("consultation");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [forceOverbook, setForceOverbook] = useState(false);
  const queryClient = useQueryClient();

  const specialty = bookingType === "consultation" ? "Medical Oncology" : "Infusion Center";

  const { data: slots, isLoading } = useQuery({
    queryKey: ['available_slots', patientId, specialty, selectedDate?.toISOString()],
    queryFn: async () => {
      const res = await api.get(`/slots`, {
        params: { 
          patient_id: patientId, 
          specialty,
          preferred_start_date: selectedDate ? selectedDate.toISOString() : undefined,
          appointment_type: bookingType === "consultation" ? "initial-consult" : "infusion"
        }
      });
      return res.data;
    },
    enabled: open
  });

  const confirmMutation = useMutation({
    mutationFn: async (slot: any) => {
      const res = await api.post('/slots/confirm', {
        slot_id: slot.slot_id,
        patient_id: patientId,
        doctor_id: slot.doctor_id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        force_overbook: forceOverbook
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Appointment scheduled successfully!');
      setOpen(false);
      setForceOverbook(false);
      queryClient.invalidateQueries({ queryKey: ['patient_dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to confirm appointment');
    }
  });

  const handleConfirm = () => {
    if (!selectedSlot) return;
    confirmMutation.mutate(selectedSlot);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-900">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Now
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] bg-white border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500" />
        
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Smart Appointment Scheduling
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Select the type of appointment you need. Our AI automatically surfaces the most suitable slots based on your clinical urgency and resource availability.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2">
            {/* The Infusion Therapy tab has been strictly removed from patient self-scheduling.
                 Infusions can only be scheduled by the clinical AI after doctor clearance. */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[350px]">
              {/* Left Column: Calendar */}
              <div className="bg-slate-950/30 rounded-xl border border-slate-800 p-2 flex justify-center items-start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="bg-transparent border-none text-slate-900 rounded-lg p-3"
                  classNames={{
                    day_selected: "bg-emerald-500 text-slate-900 hover:bg-emerald-600 focus:bg-emerald-600",
                    day_today: "bg-slate-100 text-emerald-400",
                    nav_button: "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-slate-900 w-7 h-7 flex items-center justify-center rounded-md",
                  }}
                />
              </div>

              {/* Right Column: Slots */}
              <div className="space-y-4">
                {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin w-12 h-12" />
                    <div className="absolute inset-2 border-t-2 border-cyan-500 rounded-full animate-spin w-8 h-8 direction-reverse" />
                    <Sparkles className="w-6 h-6 text-emerald-400 absolute top-3 left-3 animate-pulse" />
                  </div>
                  <p className="text-emerald-400/80 text-sm animate-pulse">AI evaluating urgency & availability...</p>
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {slots.map((slot: any, index: number) => {
                    const isSelected = selectedSlot?.slot_id === slot.slot_id;
                    const isHighPriority = slot.ai_score > 0.8;
                    const isRecommended = slot.ai_score > 0.6;
                    
                    return (
                      <div
                        key={slot.slot_id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all animate-in zoom-in-95 duration-300 ${
                          isSelected 
                            ? 'bg-slate-100/80 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : isHighPriority
                              ? 'bg-white/40 border-rose-500/30 hover:border-rose-500/50'
                              : 'bg-white/40 border-slate-200 hover:border-cyan-500/50'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <span className="text-slate-200 font-medium">
                              {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {isHighPriority && (
                            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                              Urgent
                            </Badge>
                          )}
                          {!isHighPriority && isRecommended && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span className="text-slate-600">
                            {new Date(slot.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 border-t border-slate-200 pt-2 mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-medium">{slot.doctor_name || "Assigned Provider"}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
                          </div>
                          {(slot.qualifications || slot.experience_years) && (
                            <div className="flex flex-col gap-1 mt-1">
                              {slot.qualifications && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Award className="w-3.5 h-3.5 text-violet-400" />
                                  <span className="truncate">{slot.qualifications}</span>
                                </div>
                              )}
                              {slot.experience_years && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{slot.experience_years} Years Experience</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] space-y-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800 p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-slate-600" />
                  <p className="text-slate-500">No suitable slots found for this date.</p>
                  <p className="text-xs text-slate-500 mt-2">Try selecting a different date from the calendar or wait for our AI to suggest nearby openings.</p>
                </div>
              )}
              </div>
            </div>

          <div className="mt-6 flex flex-col gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="force-overbook"
                checked={forceOverbook}
                onChange={(e) => setForceOverbook(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 bg-white text-rose-500 focus:ring-rose-500/50"
              />
              <label htmlFor="force-overbook" className="text-sm text-slate-500">
                <span className="text-rose-400 font-medium">Admin Override:</span> Force Overbook this slot (Bypass overlap checks)
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900">
                Cancel
              </Button>
            <Button 
              disabled={!selectedSlot || confirmMutation.isPending}
              onClick={handleConfirm}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 min-w-[140px]"
            >
              {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {confirmMutation.isPending ? "Confirming..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}
