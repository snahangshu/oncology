import { create } from 'zustand';

const BASE_URL = 'http://localhost:8000/api/v1';

export type TabType = 'intake' | 'scheduling' | 'infusion' | 'audit' | 'doctors' | 'doctor_portal';
export type RoleType = 'patient' | 'receptionist' | 'doctor' | 'nurse' | 'admin';


export interface InsuranceDetails {
  providerName: string;
  policyNumber: string;
  groupNumber?: string;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  patientComments?: string;
  primaryDiagnosis?: string;
  urgencyLevel?: 'ROUTINE' | 'URGENT' | 'EMERGENT';
  status: 'received' | 'processed' | 'incomplete';
}

export interface UploadedDocument {
  id: number;
  patientId: number;
  documentType: string;
  filename: string;
  status: 'processing' | 'processed' | 'incomplete';
  missingSections: string[];
  metadata: Record<string, any>;
}

export interface SlotOption {
  slotId: string;
  doctorId: number;
  doctorName: string;
  startTime: string;
  endTime: string;
  score: number;
  reasoning: string;
}

export interface ProposedAssignment {
  patientId?: number;
  chairId: number;
  nurseId: number;
  startTime: string;
  endTime: string;
}

export interface AuditLog {
  id: number;
  action: string;
  userId: string;
  patientId?: number;
  timestamp: string;
  details: Record<string, any>;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
}

export interface DoctorSchedule {
  id: number;
  doctorId: number;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate: string | null;
}

export interface DoctorAvailabilitySlot {
  doctorId: number;
  doctorName: string;
  specialty: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  startTime: string;
  endTime: string;
  status: string;
  specialty: string;
  urgencyLevel?: string;
  primaryDiagnosis?: string;
  patientComments?: string;
}

interface AppState {
  activeTab: TabType;
  currentRole: RoleType;
  patients: Patient[];
  documents: UploadedDocument[];
  slots: SlotOption[];
  assignments: ProposedAssignment[];
  auditLogs: AuditLog[];
  notifications: string[];
  selectedPatientId: number | null;
  doctors: Doctor[];
  doctorSchedules: DoctorSchedule[];
  selectedDoctorId: number | null;
  doctorAvailability: Record<string, DoctorAvailabilitySlot[]>;
  doctorAppointments: AppointmentResponse[];

  // Actions
  setActiveTab: (tab: TabType) => void;
  setCurrentRole: (role: RoleType) => void;
  setSelectedPatientId: (id: number | null) => void;
  submitIntake: (intakeData: Omit<Patient, 'id' | 'status'> & { insuranceDetails: InsuranceDetails }) => Promise<Patient | undefined>;
  uploadDocument: (patientId: number, files: File[]) => Promise<void>;
  querySlots: (patientId: number, specialty: string) => Promise<void>;
  confirmSlot: (patientId: number, slotId: string, doctorId: number, startTime: string, endTime: string) => Promise<void>;
  applyOverride: (overrideData: { patientId: number; chairId: number; nurseId: number; startTime: string; endTime: string; justification: string }) => Promise<{ success: boolean; conflictDescription?: string }>;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
  // Doctor actions
  fetchDoctors: () => Promise<void>;
  createDoctor: (data: Omit<Doctor, 'id'>) => Promise<Doctor | undefined>;
  setSelectedDoctorId: (id: number | null) => void;
  fetchDoctorSchedules: (doctorId: number) => Promise<void>;
  addDoctorSchedule: (doctorId: number, schedule: { dayOfWeek: number | null; startTime: string; endTime: string; isRecurring: boolean; specificDate?: string }) => Promise<void>;
  removeDoctorSchedule: (doctorId: number, scheduleId: number) => Promise<void>;
  fetchAvailability: (date: string) => Promise<void>;
  fetchDoctorAppointments: (doctorId: number, query?: string) => Promise<void>;
}

export const useAppState = create<AppState>((set, get) => ({
  activeTab: 'intake',
  currentRole: 'patient',
  patients: [],
  documents: [],
  slots: [],
  assignments: [],
  auditLogs: [],
  notifications: [],
  selectedPatientId: null,
  doctors: [],
  doctorSchedules: [],
  selectedDoctorId: null,
  doctorAvailability: {},
  doctorAppointments: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentRole: (role) => {
    // Determine default tab for each role
    let defaultTab: TabType = 'intake';
    if (role === 'nurse') defaultTab = 'infusion';
    if (role === 'admin') defaultTab = 'audit';
    
    set({ currentRole: role, activeTab: defaultTab, selectedPatientId: null });
  },
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),

  submitIntake: async (data) => {
    try {
      const response = await fetch(`${BASE_URL}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          email: data.email,
          phone: data.phone,
          primary_diagnosis: data.primaryDiagnosis,
          patient_comments: data.patientComments,
          insurance_details: {
            provider_name: data.insuranceDetails.providerName,
            policy_number: data.insuranceDetails.policyNumber,
            group_number: data.insuranceDetails.groupNumber
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit intake data');
      }

      const result = await response.json();
      
      const newPatient: Patient = {
        id: result.patient_id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        phone: data.phone,
        primaryDiagnosis: data.primaryDiagnosis,
        patientComments: data.patientComments,
        urgencyLevel: result.urgency_level,
        status: result.status === 'received' ? 'received' : 'incomplete'
      };

      set((state) => ({
        patients: [newPatient, ...state.patients],
        auditLogs: [
          {
            id: state.auditLogs.length + 1,
            action: 'submit_intake',
            userId: 'system',
            patientId: result.patient_id,
            timestamp: new Date().toISOString(),
            details: { urgency_level: result.urgency_level }
          },
          ...state.auditLogs
        ]
      }));

      get().addNotification(`Intake submitted successfully. Patient ID: ${newPatient.id}`);
      return newPatient;
    } catch (error: any) {
      get().addNotification(`Intake Submission Failed: ${error.message}`);
    }
  },

  uploadDocument: async (patientId, files) => {
    try {
      get().addNotification(`Uploading ${files.length} document(s)...`);
      
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch(`${BASE_URL}/documents/upload?patient_id=${patientId}`, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);
        const uploadData = await uploadRes.json();
        return { file, documentId: uploadData.document_id };
      });

      const uploadedResults = await Promise.all(uploadPromises);

      const newDocs: UploadedDocument[] = uploadedResults.map(({ file, documentId }) => ({
        id: documentId,
        patientId,
        documentType: file.name.endsWith('.pdf') ? 'Pathology Report' : 'Medical Image',
        filename: file.name,
        status: 'processing',
        missingSections: [],
        metadata: {}
      }));

      set((state) => ({ documents: [...newDocs, ...state.documents] }));
      get().addNotification(`Documents uploaded. Analyzing completeness...`);

      // Polling mechanism for all documents
      let attempts = 0;
      const maxAttempts = 20;
      
      const poll = async () => {
        if (attempts >= maxAttempts) {
           set((state) => ({
             documents: state.documents.map(d => 
               (d.patientId === patientId && d.status === 'processing') 
                 ? { ...d, status: 'incomplete', missingSections: ['Timeout analyzing document'] } 
                 : d
             )
           }));
           get().addNotification('Document analysis timed out.');
           return;
        }

        try {
          let allProcessed = true;
          for (const { documentId } of uploadedResults) {
            const currentDoc = get().documents.find(d => d.id === documentId);
            if (currentDoc && currentDoc.status === 'processing') {
              const statusRes = await fetch(`${BASE_URL}/documents/${documentId}/status`);
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.status !== "processing") {
                    const isComplete = statusData.is_complete;
                    const missing = statusData.missing_sections || [];
                    set((state) => ({
                        documents: state.documents.map(d => d.id === documentId ? { 
                            ...d, 
                            status: isComplete ? 'processed' : 'incomplete',
                            missingSections: missing,
                            metadata: statusData.extracted_metadata || {}
                        } : d)
                    }));
                } else {
                    allProcessed = false;
                }
              } else {
                allProcessed = false;
              }
            }
          }
          
          if (allProcessed) {
            set((state) => ({
              patients: state.patients.map(p => p.id === patientId ? { ...p, status: 'processed' } : p)
            }));
            get().addNotification('All documents verified!');
            return;
          }
        } catch (e) {
            console.error('Polling error', e);
        }
        
        attempts++;
        setTimeout(poll, 3000);
      };

      setTimeout(poll, 3000);

    } catch (error: any) {
      get().addNotification(`Upload Failed: ${error.message}`);
    }
  },

  querySlots: async (patientId, specialty) => {
    try {
        const response = await fetch(`${BASE_URL}/slots?patient_id=${patientId}&specialty=${specialty}`);
        if (!response.ok) throw new Error('Failed to query slots');
        const slots = await response.json();
        
        const mappedSlots = slots.map((s: any) => ({
            slotId: s.slot_id || s.slotId,
            startTime: s.start_time || s.startTime,
            endTime: s.end_time || s.endTime,
            score: s.score,
            reasoning: s.reasoning
        }));
        
        set({ slots: mappedSlots, selectedPatientId: patientId });
    } catch(error: any) {
        get().addNotification(`Slot Query Failed: ${error.message}`);
    }
  },

  confirmSlot: async (patientId, slotId, doctorId, startTime, endTime) => {
    try {
      const res = await fetch(`${BASE_URL}/slots/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          slot_id: slotId,
          doctor_id: doctorId,
          start_time: startTime,
          end_time: endTime
        })
      });  
        if (!res.ok) throw new Error('Failed to confirm slot');
        
        set((state) => ({
            slots: [],
            patients: state.patients.map(p => p.id === patientId ? { ...p, status: 'processed' } : p),
            auditLogs: [
                {
                    id: state.auditLogs.length + 1,
                    action: 'confirm_slot',
                    userId: 'admin',
                    patientId,
                    timestamp: new Date().toISOString(),
                    details: { slot_id: slotId, start_time: startTime, end_time: endTime }
                },
                ...state.auditLogs
            ]
        }));
        get().addNotification(`Slot ${slotId} confirmed successfully.`);
    } catch (error: any) {
        get().addNotification(`Slot Confirmation Failed: ${error.message}`);
    }
  },

  applyOverride: async ({ patientId, chairId, nurseId, startTime, endTime, justification }) => {
    try {
        const response = await fetch(`${BASE_URL}/infusion/override`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                chair_id: chairId,
                nurse_id: nurseId,
                start_time: startTime,
                end_time: endTime,
                justification: justification
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success || data.conflict_description) {
            set((state) => ({
                auditLogs: [
                    {
                        id: state.auditLogs.length + 1,
                        action: 'override_failed_conflict',
                        userId: 'admin',
                        patientId,
                        timestamp: new Date().toISOString(),
                        details: { chair_id: chairId, nurse_id: nurseId, explanation: data.conflict_description || 'API Error' }
                    },
                    ...state.auditLogs
                ]
            }));
            return { success: false, conflictDescription: data.conflict_description || 'Unknown conflict occurred on backend.' };
        }
        
        const newAssignment: ProposedAssignment = { patientId, chairId, nurseId, startTime, endTime };
        
        set((state) => ({
            assignments: [...state.assignments, newAssignment],
            auditLogs: [
                {
                    id: state.auditLogs.length + 1,
                    action: 'override_applied',
                    userId: 'admin',
                    patientId,
                    timestamp: new Date().toISOString(),
                    details: { chair_id: chairId, nurse_id: nurseId, justification }
                },
                ...state.auditLogs
            ],
            notifications: [`Manual override applied successfully for patient ID ${patientId}.`, ...state.notifications]
        }));
        return { success: true };
    } catch (error: any) {
        get().addNotification(`Override Failed: ${error.message}`);
        return { success: false, conflictDescription: error.message };
    }
  },

  addNotification: (message) => set((state) => ({ notifications: [message, ...state.notifications] })),
  clearNotifications: () => set({ notifications: [] }),

  // ── Doctor Actions ────────────────────────────────────────

  setSelectedDoctorId: (id) => set({ selectedDoctorId: id }),

  fetchDoctors: async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctors`);
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const data = await res.json();
      const doctors: Doctor[] = data.map((d: any) => ({
        id: d.id,
        firstName: d.first_name,
        lastName: d.last_name,
        email: d.email,
        phone: d.phone,
        specialty: d.specialty,
        status: d.status,
      }));
      set({ doctors });
    } catch (error: any) {
      get().addNotification(`Failed to load doctors: ${error.message}`);
    }
  },

  createDoctor: async (data) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          specialty: data.specialty,
          status: data.status,
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create doctor');
      }
      const result = await res.json();
      const newDoctor: Doctor = {
        id: result.id,
        firstName: result.first_name,
        lastName: result.last_name,
        email: result.email,
        phone: result.phone,
        specialty: result.specialty,
        status: result.status,
      };
      set((state) => ({ doctors: [newDoctor, ...state.doctors] }));
      get().addNotification(`Dr. ${newDoctor.lastName} onboarded successfully!`);
      return newDoctor;
    } catch (error: any) {
      get().addNotification(`Doctor Creation Failed: ${error.message}`);
    }
  },

  fetchDoctorSchedules: async (doctorId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/${doctorId}/schedule`);
      if (!res.ok) throw new Error('Failed to fetch schedules');
      const data = await res.json();
      const schedules: DoctorSchedule[] = data.map((s: any) => ({
        id: s.id,
        doctorId: s.doctor_id,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
        endTime: s.end_time,
        isRecurring: s.is_recurring,
        specificDate: s.specific_date,
      }));
      set({ doctorSchedules: schedules });
    } catch (error: any) {
      get().addNotification(`Failed to load schedules: ${error.message}`);
    }
  },

  addDoctorSchedule: async (doctorId, schedule) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/${doctorId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          is_recurring: schedule.isRecurring,
          specific_date: schedule.specificDate || null,
        })
      });
      if (!res.ok) throw new Error('Failed to add schedule');
      get().addNotification('Schedule block added!');
      // Refresh schedules
      await get().fetchDoctorSchedules(doctorId);
    } catch (error: any) {
      get().addNotification(`Schedule Add Failed: ${error.message}`);
    }
  },

  removeDoctorSchedule: async (doctorId, scheduleId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/${doctorId}/schedule/${scheduleId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove schedule');
      set((state) => ({
        doctorSchedules: state.doctorSchedules.filter(s => s.id !== scheduleId)
      }));
      get().addNotification('Schedule block removed.');
    } catch (error: any) {
      get().addNotification(`Schedule Remove Failed: ${error.message}`);
    }
  },

  fetchAvailability: async (date) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/availability?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch availability');
      const data = await res.json();
      const slots: DoctorAvailabilitySlot[] = (data.slots || []).map((s: any) => ({
        doctorId: s.doctor_id,
        doctorName: s.doctor_name,
        specialty: s.specialty,
        startTime: s.start_time,
        endTime: s.end_time,
        isBooked: s.is_booked,
      }));
      set((state) => ({
        doctorAvailability: { ...state.doctorAvailability, [date]: slots }
      }));
    } catch (error: any) {
      get().addNotification(`Availability Fetch Failed: ${error.message}`);
    }
  },

  fetchDoctorAppointments: async (doctorId, query) => {
    try {
      const url = query 
        ? `${BASE_URL}/doctors/${doctorId}/appointments?q=${encodeURIComponent(query)}`
        : `${BASE_URL}/doctors/${doctorId}/appointments`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch doctor appointments');
      const data = await res.json();
      const appointments: AppointmentResponse[] = data.map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        patientName: d.patient_name,
        startTime: d.start_time,
        endTime: d.end_time,
        status: d.status,
        specialty: d.specialty,
        urgencyLevel: d.urgency_level,
        primaryDiagnosis: d.primary_diagnosis,
        patientComments: d.patient_comments,
      }));
      set({ doctorAppointments: appointments });
    } catch (error: any) {
      get().addNotification(`Failed to load assigned appointments: ${error.message}`);
    }
  },
}));
