import React from 'react';
import { 
  CalendarDays, 
  Users, 
  Layers, 
  UserCheck, 
  Printer, 
  Sparkles, 
  Database, 
  Sun, 
  Moon,
  Cross
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'schedule' | 'members' | 'modules' | 'absences' | 'print';
  setCurrentTab: (tab: 'schedule' | 'members' | 'modules' | 'absences' | 'print') => void;
  onGenerateClick: () => void;
  onBackupClick: () => void;
  monasteryName: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onGenerateClick,
  onBackupClick,
  monasteryName,
  darkMode,
  toggleDarkMode,
}) => {
  return (
    <header className="no-print bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Monastery Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('schedule')}>
            <div className="w-10 h-10 rounded-lg bg-red-900 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Cross className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-xl tracking-wider text-amber-100">GRAPHIC</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 font-medium">PWA</span>
              </div>
              <p className="text-xs text-stone-400 font-sans truncate max-w-[200px] sm:max-w-xs">{monasteryName}</p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('schedule')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'schedule'
                  ? 'bg-stone-800 text-amber-300 border border-stone-700'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span>Grafic</span>
            </button>

            <button
              onClick={() => setCurrentTab('members')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'members'
                  ? 'bg-stone-800 text-amber-300 border border-stone-700'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Obștea</span>
            </button>

            <button
              onClick={() => setCurrentTab('modules')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'modules'
                  ? 'bg-stone-800 text-amber-300 border border-stone-700'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Ascultări</span>
            </button>

            <button
              onClick={() => setCurrentTab('absences')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'absences'
                  ? 'bg-stone-800 text-amber-300 border border-stone-700'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4 text-violet-400" />
              <span>Învoiri & Reguli</span>
            </button>

            <button
              onClick={() => setCurrentTab('print')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'print'
                  ? 'bg-stone-800 text-amber-300 border border-stone-700'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Afișaj Avizier</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onGenerateClick}
              title="Generează automat graficul pentru săptămâna selectată"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-medium shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span className="hidden sm:inline">Generează</span>
            </button>

            <button
              onClick={onBackupClick}
              title="Setări, Backup & Restaurare date"
              className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Comută pe Mod Luminos' : 'Comută pe Mod Întunecat'}
              className="p-2 rounded-lg text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-stone-800 text-xs overflow-x-auto">
          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex flex-col items-center py-1 px-2 rounded ${
              currentTab === 'schedule' ? 'text-amber-400 font-semibold' : 'text-stone-400'
            }`}
          >
            <CalendarDays className="w-4 h-4 mb-0.5" />
            <span>Grafic</span>
          </button>
          <button
            onClick={() => setCurrentTab('members')}
            className={`flex flex-col items-center py-1 px-2 rounded ${
              currentTab === 'members' ? 'text-emerald-400 font-semibold' : 'text-stone-400'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Obștea</span>
          </button>
          <button
            onClick={() => setCurrentTab('modules')}
            className={`flex flex-col items-center py-1 px-2 rounded ${
              currentTab === 'modules' ? 'text-sky-400 font-semibold' : 'text-stone-400'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Ascultări</span>
          </button>
          <button
            onClick={() => setCurrentTab('absences')}
            className={`flex flex-col items-center py-1 px-2 rounded ${
              currentTab === 'absences' ? 'text-violet-400 font-semibold' : 'text-stone-400'
            }`}
          >
            <UserCheck className="w-4 h-4 mb-0.5" />
            <span>Învoiri</span>
          </button>
          <button
            onClick={() => setCurrentTab('print')}
            className={`flex flex-col items-center py-1 px-2 rounded ${
              currentTab === 'print' ? 'text-rose-400 font-semibold' : 'text-stone-400'
            }`}
          >
            <Printer className="w-4 h-4 mb-0.5" />
            <span>Avizier</span>
          </button>
        </div>
      </div>
    </header>
  );
};
