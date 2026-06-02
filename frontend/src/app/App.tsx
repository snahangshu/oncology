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
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import NewPatient from './pages/receptionist/NewPatient';
import IntakeDashboard from './pages/receptionist/IntakeDashboard';
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
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-cyan-400">Loading session...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/role-selector" replace />;
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
            path="/doctor"
            element={
              <ProtectedRoute>
                <DoctorDashboard />
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