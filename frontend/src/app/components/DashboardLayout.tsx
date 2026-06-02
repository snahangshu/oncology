import { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
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
  Menu
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
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
      { name: 'Manage Users', href: '/admin/users', icon: Users },
      { name: 'System Health', href: '/admin/health', icon: Activity },
    ],
    DOCTOR: [
      { name: 'Dashboard', href: '/doctor', icon: Stethoscope },
      { name: 'Consultation Queue', href: '/doctor/queue', icon: ClipboardList },
      { name: 'My Patients', href: '/doctor/patients', icon: Users },
    ],
    RECEPTIONIST: [
      { name: 'Dashboard', href: '/receptionist', icon: LayoutDashboard },
      { name: 'Waiting Room', href: '/receptionist/waiting', icon: Users },
      { name: 'Appointments', href: '/receptionist/appointments', icon: Calendar },
    ],
    NURSE: [
      { name: 'Dashboard', href: '/nurse', icon: Activity },
      { name: 'Vitals Queue', href: '/nurse/queue', icon: Heart },
      { name: 'Patient Prep', href: '/nurse/prep', icon: ClipboardList },
    ],
    PATIENT: [
      { name: 'My Dashboard', href: '/patient', icon: LayoutDashboard },
      { name: 'Appointments', href: '/patient/appointments', icon: Calendar },
      { name: 'Medical Records', href: '/patient/records', icon: FileText },
    ],
  };

  const navItems = (user && user.role) ? (navigationByRole[user.role] || []) : [];

  return (
    <div className="min-h-screen bg-[#070a13]">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl border-r border-slate-700/30">
          {/* Logo */}
          <div className="mb-8 px-4 mt-2">
            <h1 className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent text-xl font-bold">
              Oncology AI
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Clinical Optimizer</p>
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
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                      : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}
                  />
                  <span className={isActive ? 'text-cyan-100 font-medium' : 'text-slate-300'}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-4 left-3 right-3">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white font-medium">
                    {user?.name && typeof user.name === 'string' ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-cyan-400 truncate">{user?.role}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-colors"
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
          className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-lg text-slate-200 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <main className="transition-all duration-300 ease-in-out lg:pl-64">
        {/* pt-20 on mobile to push content below the floating hamburger menu. pt-4/8 on desktop. */}
        <div className="p-4 pt-20 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
