import { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { useQuery } from '@tanstack/react-query';
import { logout } from '../store/authSlice';
import { api } from '../shared/api';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  FileText,
  Stethoscope,
  ClipboardList,
  Heart,
  LogOut,
  Menu,
  Shield,
  Clock,
  UserPlus,
  FlaskConical,
  Upload
} from 'lucide-react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState } from 'react';


interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await api.post('/users/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationByRole = {
    ADMIN: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Staff & Credentialing', href: '/admin/credentialing', icon: Shield },
    ],
    DOCTOR: [
      { name: 'Dashboard', href: '/doctor', icon: Stethoscope },
      { name: 'My Patients', href: '/doctor/patients', icon: Users },
      { name: 'Schedule', href: '/doctor/schedule', icon: Calendar },
      { name: 'Referrals & Cases', href: '/doctor/referrals', icon: ClipboardList },
      { name: 'Treatment Plans', href: '/doctor/treatment-plans', icon: Heart },
      { name: 'Infusion Center', href: '/doctor/infusions', icon: Activity },
      { name: 'Lab Review', href: '/doctor/labs', icon: FileText },
    ],
    RECEPTIONIST: [
      { name: 'Dashboard', href: '/receptionist', icon: LayoutDashboard },
      { name: 'Patient Registry', href: '/receptionist/registry', icon: Users },
      { name: 'New Patient Registration', href: '/receptionist/patients/new', icon: UserPlus },
      { name: 'Referrals Queue', href: '/receptionist/referrals', icon: ClipboardList },
      { name: 'Intake Management', href: '/receptionist/intakes', icon: FileText },
      { name: 'Appointment Scheduling', href: '/receptionist/scheduling', icon: Calendar },
      { name: 'Check-In & Waiting Room', href: '/receptionist/check-in', icon: Clock },
      { name: 'Insurance & Auth', href: '/receptionist/insurance', icon: Shield },
    ],
    NURSE: [
      { name: 'Dashboard', href: '/nurse', icon: Activity },
    ],
    PATIENT: [
      { name: 'My Dashboard', href: '/patient', icon: LayoutDashboard },
      { name: 'Appointments', href: '/patient/appointments', icon: Calendar },
      { name: 'Medical History', href: '/patient/medical-history', icon: FileText },
      { name: 'Treatment Plans', href: '/patient/treatment-plan', icon: Heart },
      { name: 'Lab Results', href: '/patient/lab-results', icon: FlaskConical },
      { name: 'Documents', href: '/patient/documents', icon: Upload },
    ],
  };

  const navItems = (user && user.role) ? (navigationByRole[user.role] || []) : [];

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard_layout_data', user?.role],
    queryFn: async () => {
      if (user?.role === 'NURSE') return (await api.get('/dashboards/nurse')).data;
      if (user?.role === 'RECEPTIONIST') return (await api.get('/dashboards/receptionist')).data;
      return null;
    },
    enabled: !!user && (user.role === 'NURSE' || user.role === 'RECEPTIONIST'),
    refetchInterval: 30000
  });

  const stuckCount = dashboardData?.stuck_patients_count || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-white border-r border-slate-200 shadow-sm">
          {/* Logo */}
          <div className="mb-8 px-4 mt-2">
            <h1 className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent text-xl font-bold">
              Oncology AI
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Clinical Optimizer</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)} // Auto-close sidebar on mobile nav
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200 shadow-sm text-blue-700'
                      : 'hover:bg-slate-100 border border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  />
                  <span className={`flex-1 ${isActive ? 'font-medium' : ''}`}>
                    {item.name}
                  </span>
                  {stuckCount > 0 && (user?.role === 'NURSE' && item.name === 'Dashboard' || user?.role === 'RECEPTIONIST' && item.name === 'Patient Registry') && (
                    <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {stuckCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-4 left-3 right-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 border-2 border-blue-100 shadow-sm">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-medium">
                    {user?.name && typeof user.name === 'string' ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-blue-600 truncate">{user?.role}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="outline"
          size="icon"
          className="bg-white border-slate-200 shadow-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <main className="transition-all duration-300 ease-in-out lg:pl-64">
        {/* pt-20 on mobile to push content below the floating hamburger menu. pt-4/8 on desktop. */}
        <div className="p-4 pt-20 lg:p-8 lg:pt-8">
          {children}
          <Outlet />
        </div>
      </main>


    </div>
  );
}
