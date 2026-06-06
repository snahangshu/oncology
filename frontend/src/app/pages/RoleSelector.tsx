import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setUser, UserRole } from '../store/authSlice';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Activity,
  User,
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router';

const roles: Array<{
  role: UserRole;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  gradient: string;
}> = [
  {
    role: 'ADMIN',
    title: 'Admin',
    description: 'Hospital management and system oversight',
    icon: LayoutDashboard,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    role: 'DOCTOR',
    title: 'Doctor',
    description: 'Patient consultations and treatment',
    icon: Stethoscope,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    role: 'RECEPTIONIST',
    title: 'Receptionist',
    description: 'Front desk and appointment management',
    icon: Users,
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    role: 'NURSE',
    title: 'Nurse',
    description: 'Patient preparation and vitals tracking',
    icon: Activity,
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    role: 'PATIENT',
    title: 'Patient',
    description: 'Personal health dashboard',
    icon: User,
    gradient: 'from-cyan-500 to-emerald-500',
  },
];

export default function RoleSelector() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'ADMIN') {
      const routes: Record<UserRole, string> = {
        ADMIN: '/admin',
        DOCTOR: '/doctor',
        RECEPTIONIST: '/receptionist',
        NURSE: '/nurse',
        PATIENT: '/patient',
      };
      navigate(routes[user.role]);
    }
  }, [user, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleRoleSelect = (role: UserRole) => {
    if (user) {
      // Update the user's role
      dispatch(setUser({
        ...user,
        role,
      }));
    }

    const routes: Record<UserRole, string> = {
      ADMIN: '/admin',
      DOCTOR: '/doctor',
      RECEPTIONIST: '/receptionist',
      NURSE: '/nurse',
      PATIENT: '/patient',
    };

    navigate(routes[role]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-8 animate-in fade-in duration-700">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Oncology AI: Clinical Optimizer
          </h1>
          <p className="text-slate-500 text-lg">Welcome back, {user?.name || 'User'}!</p>
          <p className="text-slate-500 mt-2">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((roleOption, index) => (
            <Card
              key={roleOption.role}
              className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer animate-in slide-in-from-bottom duration-700"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleRoleSelect(roleOption.role)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleOption.gradient} shadow-lg flex items-center justify-center mb-4`}>
                  <roleOption.icon className="w-8 h-8 text-slate-900" />
                </div>
                <CardTitle className="text-slate-900">{roleOption.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 mb-4">{roleOption.description}</p>
                <Button
                  className={`w-full bg-gradient-to-r ${roleOption.gradient} hover:opacity-90 text-slate-900 shadow-lg`}
                >
                  Enter as {roleOption.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
