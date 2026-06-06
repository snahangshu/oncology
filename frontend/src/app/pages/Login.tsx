import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAppDispatch } from '../store';
import { login } from '../store/authSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../shared/api';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('doctor@hospital.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      await api.post('/users/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Fetch user profile detail immediately after successful login
      // The HttpOnly cookies are automatically sent!
      const userResponse = await api.get('/users/me');

      const profile = userResponse.data;
      const userObj = {
        id: String(profile.id),
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`,
        verificationStatus: profile.verification_status,
      };

      dispatch(login({ user: userObj }));
      toast.success('Login successful!');
      
      // Smart redirect
      if (profile.role === 'DOCTOR') {
        if (profile.verification_status === 'REJECTED' || profile.verification_status === 'PROFILE_INCOMPLETE') {
          navigate('/doctor/profile-setup');
          return;
        }
      }
      
      const routes: Record<string, string> = {
        ADMIN: '/admin',
        DOCTOR: '/doctor',
        RECEPTIONIST: '/receptionist',
        NURSE: '/nurse',
        PATIENT: '/patient',
      };
      navigate(routes[profile.role] || '/login');
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'The email or password is incorrect';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom duration-700">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/50">
              <Activity className="w-8 h-8 text-slate-900" />
            </div>
            <div className="text-left">
              <h1 className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent text-3xl font-bold">
                Oncology AI
              </h1>
              <p className="text-slate-500 text-sm">Clinical Optimizer</p>
            </div>
          </div>
          <p className="text-slate-500">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-slate-900 text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20"
                  required
                />
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500/50 focus:ring-violet-500/20"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20"
                  />
                  Remember me
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or continue with</span>
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
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  Sign up
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
