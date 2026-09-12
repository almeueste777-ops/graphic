import React from 'react';
import { 
  CalendarDays, 
  Users, 
  Layers, 
  UserCheck, 
  Printer, 
  Sparkles, 
  Settings2, 
  Sun, 
  Moon
} from 'lucide-react';
import { ByzantineCross } from './Ornament';

interface NavbarProps {
  currentTab: 'schedule' | 'calendar' | 'members' | 'modules' | 'absences' | 'print';
  setCurrentTab: (tab: 'schedule' | 'calendar' | 'members' | 'modules' | 'absences' | 'print') => void;
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
    <>
      {/* Top Floating Glass Island (macOS / visionOS style) */}
      <header className="no-print sticky top-3 z-40 max-w-7xl mx-auto px-3 sm:px-6 mb-2">
        <div className="apple-glass rounded-2xl sm:rounded-full px-4 py-2.5 flex items-center justify-between transition-all duration-300">
          
          {/* App Brand / Dynamic Island Badge */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none group"
            onClick={() => setCurrentTab('schedule')}
          >
            {/* Apple Squircle Icon Badge */}
            <div className="relative w-10 h-10 rounded-[11px] bg-gradient-to-b from-[#8b1d24] to-[#4c0d12] p-[1px] shadow-[0_4px_12px_rgba(139,29,36,0.4)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
              <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-[#7a141b] to-[#3a070b] flex items-center justify-center relative overflow-hidden">
                {/* Specular gloss sheen */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <ByzantineCross className="w-5 h-5 text-[#f5d674] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-cinzel font-bold text-base tracking-wider text-white">
                  GRAPHIC
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/10 text-amber-300/90 border border-white/5">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-sans truncate max-w-[150px] sm:max-w-[220px]">
                {monasteryName}
              </p>
            </div>
          </div>

          {/* Apple Segmented Navigation Pill (Desktop) */}
          <nav className="hidden md:flex items-center p-1 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl">
            <button
              onClick={() => setCurrentTab('schedule')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-250 ${
                currentTab === 'schedule'
                  ? 'bg-white/15 text-white font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <CalendarDays className={`w-3.5 h-3.5 ${currentTab === 'schedule' ? 'text-amber-300' : 'text-white/60'}`} />
              <span>Grafic</span>
            </button>

            <button
              onClick={() => setCurrentTab('calendar')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-250 ${
                currentTab === 'calendar'
                  ? 'bg-white/15 text-white font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span className={`text-xs font-bold leading-none ${currentTab === 'calendar' ? 'text-rose-400' : 'text-rose-400/70'}`}>✝</span>
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setCurrentTab('members')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-250 ${
                currentTab === 'members'
                  ? 'bg-white/15 text-white font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${currentTab === 'members' ? 'text-emerald-400' : 'text-white/60'}`} />
              <span>Obștea</span>
            </button>

            <button
              onClick={() => setCurrentTab('modules')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-250 ${
                currentTab === 'modules'
                  ? 'bg-white/15 text-white font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${currentTab === 'modules' ? 'text-sky-400' : 'text-white/60'}`} />
              <span>Ascultări</span>
            </button>

            <button
              onClick={() => setCurrentTab('absences')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-250 ${
                currentTab === 'absences'
                  ? 'bg-white/15 text-white font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${currentTab === 'absences' ? 'text-violet-400' : 'text-white/60'}`} />
              <span>Învoiri</span>
            </button>

            <button
              onClick={() => setCurrentTab('print')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-250 ${
                currentTab === 'print'
                  ? 'bg-white/15 text-white font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Printer className={`w-3.5 h-3.5 ${currentTab === 'print' ? 'text-rose-400' : 'text-white/60'}`} />
              <span>Avizier</span>
            </button>
          </nav>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            {/* Primary Action (Apple Gold Pill) */}
            <button
              onClick={onGenerateClick}
              title="Generează automat graficul săptămânii"
              className="apple-gold-button px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 select-none"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
              <span className="hidden sm:inline">Generează</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onBackupClick}
              title="Setări & Copie de siguranță"
              className="w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] text-white/80 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Dark / Light toggle */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Mod Luminos' : 'Mod Întunecat'}
              className="w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] text-white/80 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom Navigation Bar for Mobile (iOS Tab Bar Style) */}
      <div className="no-print md:hidden fixed bottom-4 left-3 right-3 z-50">
        <div className="apple-glass rounded-full px-2 py-1.5 flex items-center justify-around shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/15">
          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-full transition-all ${
              currentTab === 'schedule' ? 'text-amber-300 bg-white/10 font-semibold' : 'text-white/50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Grafic</span>
          </button>
          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-full transition-all ${
              currentTab === 'calendar' ? 'text-rose-400 bg-white/10 font-semibold' : 'text-white/50'
            }`}
          >
            <span className="text-sm font-bold leading-none">✝</span>
            <span className="text-[10px] mt-0.5">Calendar</span>
          </button>
          <button
            onClick={() => setCurrentTab('members')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-full transition-all ${
              currentTab === 'members' ? 'text-emerald-400 bg-white/10 font-semibold' : 'text-white/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Obștea</span>
          </button>
          <button
            onClick={() => setCurrentTab('modules')}
            className={`flex flex-col items-center py-1 px-3 rounded-full transition-all ${
              currentTab === 'modules' ? 'text-sky-400 bg-white/10 font-semibold' : 'text-white/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Ascultări</span>
          </button>
          <button
            onClick={() => setCurrentTab('absences')}
            className={`flex flex-col items-center py-1 px-3 rounded-full transition-all ${
              currentTab === 'absences' ? 'text-violet-400 bg-white/10 font-semibold' : 'text-white/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Învoiri</span>
          </button>
          <button
            onClick={() => setCurrentTab('print')}
            className={`flex flex-col items-center py-1 px-3 rounded-full transition-all ${
              currentTab === 'print' ? 'text-rose-400 bg-white/10 font-semibold' : 'text-white/50'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Avizier</span>
          </button>
        </div>
      </div>
    </>
  );
};
