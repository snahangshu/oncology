import { useAppState, type TabType, type RoleType } from './shared/store';
import { ClipboardList, CalendarDays, Activity, ShieldAlert, Bell, X, UserCircle, Users } from 'lucide-react';
import { IntakePage } from './modules/intake/IntakePage';
import { SchedulingPage } from './modules/scheduling/SchedulingPage';
import { InfusionPage } from './modules/infusion/InfusionPage';
import { AuditPage } from './modules/audit/AuditPage';
import { DoctorManagementPage } from './modules/doctors/DoctorManagementPage';
import { DoctorPortalPage } from './modules/doctors/DoctorPortalPage';

export default function App() {
  const { activeTab, setActiveTab, currentRole, setCurrentRole, notifications, clearNotifications } = useAppState();

  const allTabs = [
    { id: 'intake' as TabType, label: 'Patient Intake & Triage', icon: ClipboardList, roles: ['patient', 'receptionist'] },
    { id: 'doctors' as TabType, label: 'Doctor Management', icon: Users, roles: ['receptionist', 'admin'] },
    { id: 'doctor_portal' as TabType, label: 'My Portal', icon: UserCircle, roles: ['doctor'] },
    { id: 'scheduling' as TabType, label: 'Slot Recommendation', icon: CalendarDays, roles: ['receptionist'] },
    { id: 'infusion' as TabType, label: 'Infusion Board', icon: Activity, roles: ['doctor', 'nurse'] },
    { id: 'audit' as TabType, label: 'Compliance Audit', icon: ShieldAlert, roles: ['admin'] },
  ];

  const tabs = allTabs.filter(t => t.roles.includes(currentRole));


  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Premium Floating Header */}
      <div className="pt-6 sticky top-0 z-50 w-full app-layout-wrapper">
        <header className="glass-panel px-6 py-4 flex flex-col md:flex-row justify-between items-center bg-[var(--bg-glass)] border border-[var(--color-border)] rounded-2xl shadow-xl backdrop-blur-md gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-display">Oncology<span className="text-[var(--accent-cyan)] font-light">AI</span></h1>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Clinical Optimizer Monolith</p>
            </div>
          </div>

          {/* Global Nav */}
          <div className="flex items-center space-x-6">
            <nav className="clinical-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`clinical-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="h-8 w-px bg-[var(--color-border)] hidden md:block"></div>

            {/* Role Switcher */}
            <div className="flex items-center space-x-2 text-xs">
              <UserCircle className="w-4 h-4 text-[var(--text-muted)]" />
              <select 
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as RoleType)}
                className="bg-slate-900 border border-[var(--color-border)] text-[var(--text-secondary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[var(--accent-cyan)] cursor-pointer"
              >
                <option value="patient">Patient Portal</option>
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Charge Nurse</option>
                <option value="admin">Admin Auditor</option>
              </select>
            </div>
          </div>
        </header>
      </div>

      {/* Global Notifications Alert Banner */}
      {notifications.length > 0 && (
        <div className="mt-4 p-4 app-layout-wrapper">
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 border border-[var(--color-border)] rounded-xl flex justify-between items-start shadow-xl animate-fade-in">
            <div className="flex space-x-3">
              <Bell className="w-5 h-5 text-[var(--accent-amber)] mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white font-display">Clinical Updates</h4>
                <ul className="mt-1 space-y-1">
                  {notifications.slice(0, 3).map((note, idx) => (
                    <li key={idx} className="text-xs text-[var(--text-secondary)]">{note}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={clearNotifications}
              className="text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 py-8 app-layout-wrapper">
        {activeTab === 'intake' && <IntakePage />}
        {activeTab === 'doctors' && <DoctorManagementPage />}
        {activeTab === 'doctor_portal' && <DoctorPortalPage />}
        {activeTab === 'scheduling' && <SchedulingPage />}
        {activeTab === 'infusion' && <InfusionPage />}
        {activeTab === 'audit' && <AuditPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--bg-glass)] py-4 text-center text-xs text-[var(--text-muted)]">
        &copy; 2026 Oncology AI Clinical Assistant. CQC & NABH Compliance Safe. Redacted PHI Mode Active.
      </footer>
    </div>
  );
}
