import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAppSelector, useAppDispatch } from './store';
import { setUser, setInitialized } from './store/authSlice';
import { api } from './shared/api';
import { DashboardLayout } from './components/DashboardLayout';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelector from './pages/RoleSelector';
import AdminDashboard from './pages/AdminDashboard';
import InviteStaff from './pages/admin/InviteStaff';
import CredentialingDashboard from './pages/admin/CredentialingDashboard';
import DoctorOnboarding from './pages/admin/DoctorOnboarding';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfileSetup from './pages/doctor/DoctorProfileSetup';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorReferrals from './pages/doctor/DoctorReferrals';
import DoctorTreatmentPlans from './pages/doctor/DoctorTreatmentPlans';
import InfusionCenter from './pages/doctor/InfusionCenter';
import LabReviewCenter from './pages/doctor/LabReviewCenter';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import NewPatient from './pages/receptionist/NewPatient';
import IntakeDashboard from './pages/receptionist/IntakeDashboard';
import PatientRegistry from './pages/receptionist/PatientRegistry';
import ReferralsQueue from './pages/receptionist/ReferralsQueue';
import IntakeManagement from './pages/receptionist/IntakeManagement';
import AppointmentScheduling from './pages/receptionist/AppointmentScheduling';
import CheckInWaitingRoom from './pages/receptionist/CheckInWaitingRoom';
import InsuranceAuth from './pages/receptionist/InsuranceAuth';
import NurseDashboard from './pages/NurseDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientDetails from './pages/PatientDetails';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-cyan-400">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-cyan-400">Loading session...</div>;
  }

  if (isAuthenticated && user) {
    const routes: Record<string, string> = {
      ADMIN: '/admin',
      DOCTOR: '/doctor',
      RECEPTIONIST: '/receptionist',
      NURSE: '/nurse',
      PATIENT: '/patient',
    };
    return <Navigate to={routes[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt to fetch user profile. If an HttpOnly session cookie exists, this will succeed!
        const response = await api.get('/users/me');
        const profile = response.data;
        dispatch(setUser({
          id: String(profile.id),
          name: profile.full_name,
          email: profile.email,
          role: profile.role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`,
        }));
      } catch (error) {
        // No session cookie or expired
        dispatch(setInitialized());
      }
    };
    initAuth();
  }, [dispatch]);

  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="/login"
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <AuthRoute>
                <Signup />
              </AuthRoute>
            }
          />

          <Route
            path="/role-selector"
            element={
              <ProtectedRoute>
                <RoleSelector />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/staff/invite"
            element={
              <ProtectedRoute>
                <InviteStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/credentialing"
            element={
              <ProtectedRoute>
                <CredentialingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors/new"
            element={
              <ProtectedRoute>
                <DoctorOnboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile-setup"
            element={
              <ProtectedRoute>
                <DoctorProfileSetup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute>
                <DoctorPatients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/schedule"
            element={
              <ProtectedRoute>
                <DoctorSchedule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/referrals"
            element={
              <ProtectedRoute>
                <DoctorReferrals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/treatment-plans"
            element={
              <ProtectedRoute>
                <DoctorTreatmentPlans />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/infusions"
            element={
              <ProtectedRoute>
                <InfusionCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/labs"
            element={
              <ProtectedRoute>
                <LabReviewCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist"
            element={
              <ProtectedRoute>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist/registry"
            element={
              <ProtectedRoute>
                <PatientRegistry />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist/referrals"
            element={
              <ProtectedRoute>
                <ReferralsQueue />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist/intakes"
            element={
              <ProtectedRoute>
                <IntakeManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist/scheduling"
            element={
              <ProtectedRoute>
                <AppointmentScheduling />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist/check-in"
            element={
              <ProtectedRoute>
                <CheckInWaitingRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist/insurance"
            element={
              <ProtectedRoute>
                <InsuranceAuth />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/receptionist/patients/new"
            element={
              <ProtectedRoute>
                <NewPatient />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receptionist/intake/:patientId"
            element={
              <ProtectedRoute>
                <IntakeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nurse"
            element={
              <ProtectedRoute>
                <NurseDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients/:patientId"
            element={
              <ProtectedRoute>
                <PatientDetails />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}