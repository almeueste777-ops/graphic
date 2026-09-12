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
  Moon
} from 'lucide-react';
import { ByzantineCross } from './Ornament';

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
    <header className="no-print sticky top-0 z-30 backdrop-blur-md bg-[#120f0e]/85 border-b border-amber-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Monastery Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setCurrentTab('schedule')}
          >
            {/* Illuminated Monastery Crest */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/40 via-red-600/30 to-amber-600/40 rounded-xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#78141c] to-[#40090d] border border-amber-400/50 flex items-center justify-center shadow-inner">
                <ByzantineCross className="w-6 h-6 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-cinzel font-black text-xl tracking-widest gold-text-gradient drop-shadow-sm">
                  GRAPHIC
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30">
                  Monahal
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-sans truncate max-w-[180px] sm:max-w-xs group-hover:text-amber-200/80 transition-colors">
                {monasteryName}
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs with Glassmorphic Pills */}
          <nav className="hidden md:flex items-center space-x-1.5 p-1 rounded-xl bg-black/40 border border-stone-800/80 backdrop-blur-md">
            <button
              onClick={() => setCurrentTab('schedule')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === 'schedule'
                  ? 'bg-gradient-to-r from-amber-950/80 to-stone-900 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span>Grafic</span>
            </button>

            <button
              onClick={() => setCurrentTab('members')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === 'members'
                  ? 'bg-gradient-to-r from-amber-950/80 to-stone-900 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Obștea</span>
            </button>

            <button
              onClick={() => setCurrentTab('modules')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === 'modules'
                  ? 'bg-gradient-to-r from-amber-950/80 to-stone-900 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Ascultări</span>
            </button>

            <button
              onClick={() => setCurrentTab('absences')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === 'absences'
                  ? 'bg-gradient-to-r from-amber-950/80 to-stone-900 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <UserCheck className="w-4 h-4 text-violet-400" />
              <span>Învoiri & Reguli</span>
            </button>

            <button
              onClick={() => setCurrentTab('print')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === 'print'
                  ? 'bg-gradient-to-r from-amber-950/80 to-stone-900 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Afișaj Avizier</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onGenerateClick}
              title="Generează automat graficul pentru săptămâna selectată"
              className="relative group overflow-hidden flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-stone-950 font-bold text-xs sm:text-sm shadow-[0_2px_15px_rgba(212,175,55,0.35)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.5)] transition-all active:scale-95"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-4 h-4 text-stone-950 fill-amber-900" />
              <span className="hidden sm:inline">Generează</span>
            </button>

            <button
              onClick={onBackupClick}
              title="Setări, Backup & Restaurare date"
              className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Comută pe Mod Luminos' : 'Comută pe Mod Întunecat'}
              className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 transition-colors shadow-sm"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-stone-800/80 text-xs overflow-x-auto">
          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
              currentTab === 'schedule' ? 'text-amber-400 font-bold bg-amber-950/40' : 'text-stone-400'
            }`}
          >
            <CalendarDays className="w-4 h-4 mb-0.5" />
            <span>Grafic</span>
          </button>
          <button
            onClick={() => setCurrentTab('members')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
              currentTab === 'members' ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-stone-400'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Obștea</span>
          </button>
          <button
            onClick={() => setCurrentTab('modules')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
              currentTab === 'modules' ? 'text-sky-400 font-bold bg-sky-950/40' : 'text-stone-400'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Ascultări</span>
          </button>
          <button
            onClick={() => setCurrentTab('absences')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
              currentTab === 'absences' ? 'text-violet-400 font-bold bg-violet-950/40' : 'text-stone-400'
            }`}
          >
            <UserCheck className="w-4 h-4 mb-0.5" />
            <span>Învoiri</span>
          </button>
          <button
            onClick={() => setCurrentTab('print')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
              currentTab === 'print' ? 'text-rose-400 font-bold bg-rose-950/40' : 'text-stone-400'
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
