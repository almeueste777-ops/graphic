import { useState, useEffect } from 'react';
import { useMonasteryData } from './store/monasteryStore';
import { Navbar } from './components/Navbar';
import { ScheduleGrid } from './components/ScheduleGrid';
import { MembersView } from './components/MembersView';
import { ModulesView } from './components/ModulesView';
import { AbsencesView } from './components/AbsencesView';
import { PrintableView } from './components/PrintableView';
import { CalendarLiturgicView } from './components/CalendarLiturgicView';
import { BackupModal } from './components/BackupModal';
import { generateSchedule } from './services/scheduler';
import { startOfWeek, endOfWeek } from 'date-fns';

export function App() {
  const {
    persons,
    modules,
    absences,
    rules,
    schedule,
    settings,
    setPersons,
    setModules,
    setAbsences,
    addAbsence,
    deleteAbsence,
    setRules,
    setSchedule,
    setSettings,
    deleteModule,
    moveModule,
    resetToDefaults,
    exportAllDataJson,
    importAllDataJson,
  } = useMonasteryData();

  const [currentTab, setCurrentTab] = useState<'schedule' | 'calendar' | 'members' | 'modules' | 'absences' | 'print'>('schedule');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 12));
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('graphic_dark_mode') !== 'false';
  });
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('graphic_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('graphic_dark_mode', 'false');
    }
  }, [darkMode]);

  // Quick auto-generate from header
  const handleQuickGenerate = () => {
    setCurrentTab('schedule');
    const weekStartsOn = settings.weekStartDay ?? 6;
    const weekStart = startOfWeek(currentDate, { weekStartsOn });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn });

    const result = generateSchedule({
      startDate: weekStart,
      endDate: weekEnd,
      persons,
      modules,
      absences,
      substitutionRules: rules,
      existingAssignments: schedule,
      avoidDoubleBooking: settings.autoAvoidDoubleBooking,
    });

    setSchedule(result.assignments);
  };

  return (
    <div className="min-h-screen apple-ambient-bg text-[#f5f5f7] flex flex-col font-sf antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onGenerateClick={handleQuickGenerate}
        onBackupClick={() => setIsBackupOpen(true)}
        monasteryName={settings.monasteryName}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(prev => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 print:p-0 print:m-0 print:max-w-none">
        {currentTab === 'schedule' && (
          <ScheduleGrid
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            persons={persons}
            modules={modules}
            absences={absences}
            rules={rules}
            schedule={schedule}
            setSchedule={setSchedule}
            settings={settings}
            onNavigateToPrint={() => setCurrentTab('print')}
            addAbsence={addAbsence}
            deleteAbsence={deleteAbsence}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarLiturgicView
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            persons={persons}
            modules={modules}
            schedule={schedule}
            onNavigateToWeek={(targetDate) => {
              setCurrentDate(targetDate);
              setCurrentTab('schedule');
            }}
          />
        )}

        {currentTab === 'members' && (
          <MembersView
            persons={persons}
            setPersons={setPersons}
            modules={modules}
            schedule={schedule}
            setSchedule={setSchedule}
          />
        )}

        {currentTab === 'modules' && (
          <ModulesView
            modules={modules}
            setModules={setModules}
            persons={persons}
            deleteModule={deleteModule}
            moveModule={moveModule}
            schedule={schedule}
            setSchedule={setSchedule}
            settings={settings}
            absences={absences}
            rules={rules}
            currentDate={currentDate}
          />
        )}

        {currentTab === 'absences' && (
          <AbsencesView
            persons={persons}
            modules={modules}
            absences={absences}
            setAbsences={setAbsences}
            rules={rules}
            setRules={setRules}
            schedule={schedule}
            setSchedule={setSchedule}
            settings={settings}
            currentDate={currentDate}
          />
        )}

        {currentTab === 'print' && (
          <PrintableView
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            persons={persons}
            modules={modules}
            schedule={schedule}
            settings={settings}
            onBackToGrid={() => setCurrentTab('schedule')}
          />
        )}
      </main>

      {/* Footer (Hidden on print) */}
      <footer className="no-print border-t border-white/5 bg-black/40 backdrop-blur-xl py-6 text-center text-xs text-white/40">
        <p className="font-sf font-medium tracking-tight text-white/60">Graphic • Sistem Monahal Inteligent de Organizare & Ascultări</p>
        <p className="text-[11px] text-white/30 mt-1">Conceput cu standardele de claritate și fluiditate Apple • PWA Offline • {settings.monasteryName}</p>
      </footer>

      {/* Backup & Settings Modal */}
      {isBackupOpen && (
        <BackupModal
          settings={settings}
          setSettings={setSettings}
          exportAllDataJson={exportAllDataJson}
          importAllDataJson={importAllDataJson}
          resetToDefaults={resetToDefaults}
          onClose={() => setIsBackupOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
