import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAppDispatch } from '../store';
import { login, UserRole } from '../store/authSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Activity, Lock, Mail, User, ArrowRight, Stethoscope, Users as UsersIcon, Heart, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { api } from '../shared/api';

const roleOptions = [
  { value: 'DOCTOR' as UserRole, label: 'Doctor', icon: Stethoscope, color: 'text-violet-400' },
  { value: 'NURSE' as UserRole, label: 'Nurse', icon: Heart, color: 'text-rose-400' },
  { value: 'RECEPTIONIST' as UserRole, label: 'Receptionist', icon: UsersIcon, color: 'text-emerald-400' },
  { value: 'PATIENT' as UserRole, label: 'Patient', icon: User, color: 'text-cyan-400' },
  { value: 'ADMIN' as UserRole, label: 'Administrator', icon: UserCog, color: 'text-amber-400' },
];

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.role) {
      toast.error('Please select your role');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register the user
      const registerResponse = await api.post('/users/register', {
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
        role: formData.role,
      });

      toast.success('Account created successfully!');

      // 2. Automate login on backend
      const loginFormData = new URLSearchParams();
      loginFormData.append('username', formData.email);
      loginFormData.append('password', formData.password);

      await api.post('/users/login', loginFormData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Fetch user profile detail immediately after successful login
      // The HttpOnly cookies are automatically sent!
      const userResponse = await api.get('/users/me');

      const registeredUser = userResponse.data;

      const userObj = {
        id: String(registeredUser.id),
        name: registeredUser.full_name,
        email: registeredUser.email,
        role: registeredUser.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${registeredUser.email}`,
      };

      dispatch(login({ user: userObj }));

      // 3. Smart redirect
      if (registeredUser.role === 'ADMIN') {
        navigate('/role-selector');
      } else {
        const routes: Record<string, string> = {
          DOCTOR: '/doctor',
          RECEPTIONIST: '/receptionist',
          NURSE: '/nurse',
          PATIENT: '/patient',
        };
        navigate(routes[registeredUser.role] || '/login');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'An error occurred during account creation';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom duration-700">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/50">
              <Activity className="w-8 h-8 text-slate-900" />
            </div>
            <div className="text-left">
              <h1 className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent text-3xl font-bold">
                Oncology AI
              </h1>
              <p className="text-slate-500 text-sm">Clinical Optimizer</p>
            </div>
          </div>
          <p className="text-slate-500">Create your account to get started</p>
        </div>

        {/* Signup Card */}
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-slate-900 text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr. Sarah Chen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sarah.chen@clinic.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-600 flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-violet-400" />
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger className="bg-slate-100 border-slate-200 text-slate-900 focus:border-violet-500/50 focus:ring-violet-500/20">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {roleOptions.map((role) => (
                      <SelectItem
                        key={role.value}
                        value={role.value}
                        className="text-slate-600 focus:bg-slate-100 focus:text-slate-900"
                      >
                        <div className="flex items-center gap-2">
                          <role.icon className={`w-4 h-4 ${role.color}`} />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-400" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-600 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-rose-500/50 focus:ring-rose-500/20"
                  required
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 mt-1 rounded border-slate-200 bg-slate-100 text-emerald-500 focus:ring-emerald-500/20"
                  required
                />
                <label htmlFor="terms" className="text-slate-500 text-sm">
                  I agree to the{' '}
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300/50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300/50"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-8">
          Protected by enterprise-grade encryption and HIPAA compliance
        </p>
      </div>
    </div>
  );
}
