import { useState, useEffect } from 'react';
import { useAppState } from '../../shared/store';
import { 
  Stethoscope, 
  Maximize2, 
  Minimize2, 
  Search, 
  LayoutDashboard, 
  CalendarDays, 
  UsersRound
} from 'lucide-react';
import { useGlobalSearch } from './dashboard/hooks/useGlobalSearch';
import { GlobalSearchModal } from './dashboard/widgets/GlobalSearchModal';
import { KPIWidget } from './dashboard/widgets/KPIWidget';
import { AlertWidget } from './dashboard/widgets/AlertWidget';
import { TaskWidget } from './dashboard/widgets/TaskWidget';
import { QueueWidget } from './dashboard/widgets/QueueWidget';
import { AIInsightWidget } from './dashboard/widgets/AIInsightWidget';
import { WorkstreamWidget } from './dashboard/widgets/WorkstreamWidget';
import { ClinicalSummaryPanel } from './dashboard/widgets/ClinicalSummaryPanel';
import { AnalyticsChartWidget } from './dashboard/widgets/AnalyticsChartWidget';
import { VisualCalendarWidget } from './dashboard/widgets/VisualCalendarWidget';

export function DoctorPortalPage() {
  const {
    doctors,
    fetchDoctors,
    fetchDoctorAppointments,
    fetchDoctorSchedules,
  } = useAppState();

  const [activeDoctorId, setActiveDoctorId] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  
  // "Doctor Focus Mode" toggle
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Sub-tab state for clinical portal: 'dashboard' | 'scheduler' | 'patients'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'scheduler' | 'patients'>('dashboard');

  // Cmd+K Search Hook
  const { isSearchOpen, openSearch, closeSearch } = useGlobalSearch();

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    if (doctors.length > 0 && !activeDoctorId) {
      setActiveDoctorId(doctors[0].id);
    }
  }, [doctors, activeDoctorId]);

  useEffect(() => {
    if (activeDoctorId) {
      fetchDoctorAppointments(activeDoctorId, '');
      fetchDoctorSchedules(activeDoctorId);
      setSelectedPatientId(null);
      setIsFocusMode(false);
      setActiveSubTab('dashboard');
    }
  }, [activeDoctorId, fetchDoctorAppointments, fetchDoctorSchedules]);

  // Handle patient selection from Queue, Calendar, or Search
  const handleSelectPatient = (id: number) => {
    setSelectedPatientId(id);
    setActiveSubTab('patients');
    setIsFocusMode(true); // Auto-enter focus mode for clinical action
  };

  const handleExitFocus = () => {
    setIsFocusMode(false);
  };

  if (!activeDoctorId) {
    return <div className="text-center py-20 text-[var(--text-muted)] animate-pulse font-bold">Loading Clinical Command Center...</div>;
  }

  // Active doctor details
  const currentDoc = doctors.find(d => d.id === activeDoctorId);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={closeSearch} 
        onSelectPatient={handleSelectPatient} 
      />

      {/* Global Clinical Command Center Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between border border-slate-800 bg-[#020617]/90 backdrop-blur-md sticky top-0 z-40 gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-[var(--accent-cyan)] shadow-md shadow-cyan-900/10">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
              Clinical Command Center 
              {isFocusMode && (
                <span className="text-[10px] bg-cyan-500/25 text-cyan-300 px-2 py-0.5 rounded font-black uppercase tracking-wider animate-pulse border border-cyan-500/30">
                  Focus Mode Active
                </span>
              )}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              {currentDoc ? `Dr. ${currentDoc.lastName} • Department of ${currentDoc.specialty}` : 'OncologyAI Smart Dashboard'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-end">
          {/* Quick Search */}
          <button 
            onClick={openSearch}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-slate-400 hover:text-white px-4 py-2 rounded-xl transition-all text-xs whitespace-nowrap shadow-inner"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Find Patient...</span>
            <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[9px] ml-2 border border-slate-700 text-slate-400 font-bold">⌘K</kbd>
          </button>

          {/* Focus Mode Toggle */}
          <button 
            onClick={() => {
              if (isFocusMode) {
                handleExitFocus();
              } else {
                setIsFocusMode(true);
                setActiveSubTab('patients');
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${
              isFocusMode 
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30 shadow-lg shadow-cyan-950/40' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}</span>
          </button>

          <div className="hidden sm:block w-px h-6 bg-slate-800"></div>

          {/* Doctor Switcher */}
          <select 
            value={activeDoctorId || ''}
            onChange={(e) => setActiveDoctorId(Number(e.target.value))}
            className="clinical-input bg-slate-900 w-44 text-xs py-2 px-3 border-slate-800 cursor-pointer hover:border-slate-700 focus:border-cyan-500/50 rounded-xl"
          >
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>Dr. {doc.lastName} ({doc.specialty})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-Navigation Tabs (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900 shadow-md">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              activeSubTab === 'dashboard' 
                ? 'bg-slate-900 text-cyan-400 border border-slate-800 shadow-lg shadow-cyan-950/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Command Dashboard</span>
          </button>
          <button
            onClick={() => setActiveSubTab('scheduler')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              activeSubTab === 'scheduler' 
                ? 'bg-slate-900 text-cyan-400 border border-slate-800 shadow-lg shadow-cyan-950/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Visual Scheduler</span>
          </button>
          <button
            onClick={() => setActiveSubTab('patients')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              activeSubTab === 'patients' 
                ? 'bg-slate-900 text-cyan-400 border border-slate-800 shadow-lg shadow-cyan-950/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <UsersRound className="w-4 h-4" />
            <span>Patient Queue & Focus</span>
          </button>
        </div>
      )}

      {/* Main Workspace Render Engine */}
      <div className="space-y-6">
        
        {/* CASE A: FOCUS MODE OR PATIENTS TAB IS ACTIVE */}
        {(isFocusMode || activeSubTab === 'patients') ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px] animate-fade-in items-stretch">
            {/* Left Queue Panel */}
            <div className="lg:col-span-4 h-full">
              <QueueWidget onSelectPatient={handleSelectPatient} />
            </div>
            
            {/* Right Treatment Workspace */}
            <div className="lg:col-span-8 h-full bg-slate-950/20 rounded-2xl">
              {selectedPatientId ? (
                <ClinicalSummaryPanel patientId={selectedPatientId} />
              ) : (
                <div className="clinical-card h-full flex items-center justify-center text-[var(--text-muted)] flex-col space-y-4 text-center p-8 bg-slate-900/25">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-bold text-base">Select Clinical Case</h4>
                  <p className="max-w-md text-xs text-slate-400 leading-relaxed">
                    Select an active patient from the scheduled queue on the left, or use the Command search bar to start drafting treatment logs.
                  </p>
                  {isFocusMode && (
                    <button 
                      onClick={handleExitFocus} 
                      className="clinical-btn-secondary px-5 py-2 text-xs font-bold mt-2"
                    >
                      Return to Command Center
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeSubTab === 'scheduler' ? (
          /* CASE B: VISUAL SCHEDULER VIEW */
          <div className="animate-fade-in">
            <VisualCalendarWidget onSelectPatient={handleSelectPatient} />
          </div>
        ) : (
          /* CASE C: COMMAND DASHBOARD VIEW (Default) */
          <div className="space-y-6 animate-fade-in">
            
            {/* KPIs & Sparklines Header */}
            <KPIWidget />

            {/* Interactive SVG Workload and Capacity Trends */}
            <AnalyticsChartWidget />

            {/* Lower Details Deck: Alerts, Tasks, and AI Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-fr">
              {/* Severity Alerts Feed */}
              <div className="h-full">
                <AlertWidget />
              </div>
              
              {/* Daily Tasks Queue */}
              <div className="h-full">
                <TaskWidget />
              </div>

              {/* Live Intelligence Feed */}
              <div className="h-full">
                <AIInsightWidget />
              </div>
            </div>

            {/* Bottom Row Feed: Live updates audit stream */}
            <div className="bg-slate-950/40 rounded-2xl border border-slate-900 p-4">
              <WorkstreamWidget />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
