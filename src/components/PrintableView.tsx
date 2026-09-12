import React, { useState } from 'react';
import type { Person, Module, ScheduleAssignment, MonasterySettings } from '../types';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks 
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  FileText,
  LayoutGrid,
  Columns,
  CalendarDays,
  Type,
  SlidersHorizontal,
  Crown
} from 'lucide-react';
import { 
  ByzantineCross, 
  ByzantineCorner, 
  ByzantineHeadpiece, 
  ByzantineDivider 
} from './Ornament';
import { getDayLiturgicalInfo } from '../services/orthodoxCalendar';

type PrintLayoutMode = 'split' | 'matrix' | 'cards';
type FontTheme = 'merriweather' | 'eb_garamond' | 'lora' | 'playfair' | 'inter';
type PrintFontSizeMode = 'compact' | 'normal' | 'large' | 'extra_large';
type FontWeightMode = 'bold' | 'black' | 'normal';
type OrnamentStyle = 'voievodal' | 'classic' | 'minimal';
type OrnamentColorMode = 'ruby' | 'black' | 'gold';

interface PrintableViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  persons: Person[];
  modules: Module[];
  schedule: ScheduleAssignment[];
  settings: MonasterySettings;
  onBackToGrid: () => void;
}

export const PrintableView: React.FC<PrintableViewProps> = ({
  currentDate,
  setCurrentDate,
  persons,
  modules,
  schedule,
  settings,
  onBackToGrid,
}) => {
  // Layout & View State
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>('split');
  
  // Typography & Legibility Engine
  const [fontTheme, setFontTheme] = useState<FontTheme>('merriweather');
  const [fontSizeMode, setFontSizeMode] = useState<PrintFontSizeMode>('large');
  const [fontWeight, setFontWeight] = useState<FontWeightMode>('bold');
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(true);

  // Byzantine Ornaments Suite
  const [ornamentStyle, setOrnamentStyle] = useState<OrnamentStyle>('voievodal');
  const [ornamentColor, setOrnamentColor] = useState<OrnamentColorMode>('ruby');

  // Sheet Content Controls
  const [mergeWeeklyInMatrix, setMergeWeeklyInMatrix] = useState<boolean>(true);
  const [showAnnouncements, setShowAnnouncements] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);

  // Active toolbar panel (Apple style expandable controls)
  const [activeToolbarTab, setActiveToolbarTab] = useState<'typography' | 'ornaments' | 'options' | null>(null);

  const [customAnnouncement, setCustomAnnouncement] = useState(
    'Toți părinții și frații sunt rugați să fie prezenți la rânduiala Ceasurilor și a Sfintei Liturghii conform tipicului. Pentru orice schimb de tură binecuvântat, anunțați din timp pe Eclesiarh.'
  );

  const weekStartsOn = settings.weekStartDay ?? 6;
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekRangeFormatted = `${format(weekStart, 'd MMMM', { locale: ro })} – ${format(weekEnd, 'd MMMM yyyy', { locale: ro })}`;

  const getPersonName = (personId: string | null | undefined, fullForm: boolean = false) => {
    if (!personId) return '—';
    const person = persons.find(p => p.id === personId);
    if (!person) return '—';
    const cleanName = person.name.replace(/^(Părintele|Fratele|Maica|Sora|Ierom\.|Arhim\.)\s*/gi, '').trim();
    const formatted = fullForm ? `${person.rank} ${cleanName}` : `${person.rank} ${cleanName}`;
    return isUppercase ? formatted.toUpperCase() : formatted;
  };

  const getAssignment = (dateStr: string, moduleId: string, roleId: string, slotIndex: number) => {
    return schedule.find(
      a => a.date === dateStr && a.moduleId === moduleId && a.roleId === roleId && a.slotIndex === slotIndex
    );
  };

  // Robust resolver for weekly assignments that searches across all days of the viewed week
  const getWeeklyAssignment = (moduleId: string, roleId: string, slotIndex: number) => {
    for (const day of weekDays) {
      const dStr = format(day, 'yyyy-MM-dd');
      const found = schedule.find(
        a => a.date === dStr && a.moduleId === moduleId && a.roleId === roleId && a.slotIndex === slotIndex && a.personId
      );
      if (found) return found;
    }
    return getAssignment(format(weekDays[0], 'yyyy-MM-dd'), moduleId, roleId, slotIndex);
  };

  // Group modules into weekly and daily
  const weeklyModules = modules.filter(m => m.rotationCycle === 'weekly');
  const dailyModules = modules.filter(m => m.rotationCycle === 'daily');

  // Typography definitions
  const fontThemeClasses: Record<FontTheme, { header: string; body: string; label: string }> = {
    merriweather: {
      header: 'font-cinzel',
      body: 'font-merriweather',
      label: 'Mănăstiresc Lizibil (Merriweather)',
    },
    eb_garamond: {
      header: 'font-cinzel',
      body: 'font-eb-garamond',
      label: 'Tipar Vechi Bisericesc (Garamond)',
    },
    lora: {
      header: 'font-cinzel-decorative',
      body: 'font-lora',
      label: 'Solemn Bizantin (Lora)',
    },
    playfair: {
      header: 'font-playfair',
      body: 'font-cormorant',
      label: 'Imperial Liturgic (Playfair)',
    },
    inter: {
      header: 'font-jakarta',
      body: 'font-inter',
      label: 'Claritate Fără Serife (Inter)',
    },
  };

  // Font sizing styles
  const fontSizes = {
    compact: {
      name: 'text-[11px] sm:text-xs',
      role: 'text-[10px]',
      cell: 'p-1 text-[10px]',
      title: 'text-lg',
      dayHeader: 'text-[10px]',
    },
    normal: {
      name: 'text-xs sm:text-sm',
      role: 'text-[11px]',
      cell: 'p-1.5 text-xs',
      title: 'text-xl',
      dayHeader: 'text-xs',
    },
    large: {
      name: 'text-sm sm:text-base',
      role: 'text-xs',
      cell: 'p-2 text-sm',
      title: 'text-2xl',
      dayHeader: 'text-sm',
    },
    extra_large: {
      name: 'text-base sm:text-lg',
      role: 'text-xs sm:text-sm',
      cell: 'p-2.5 text-base',
      title: 'text-2xl sm:text-3xl',
      dayHeader: 'text-base',
    },
  }[fontSizeMode];

  const weightClass = {
    normal: 'font-medium',
    bold: 'font-bold',
    black: 'font-black',
  }[fontWeight];

  const ornamentColors: Record<OrnamentColorMode, string> = {
    ruby: '#78141c',
    black: '#111827',
    gold: '#8c6b12',
  };
  const activeOrnamentColor = ornamentColors[ornamentColor];

  const contrastClasses = isHighContrast
    ? 'text-black border-black'
    : 'text-stone-900 border-stone-800';

  return (
    <div className="space-y-6">
      {/* ================= APPLE PRINT & ACCESSIBILITY CONTROLS TOOLBAR (HIDDEN WHEN PRINTING) ================= */}
      <div className="no-print space-y-3 font-sf">
        {/* Main Bar */}
        <div className="apple-glass rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 border border-white/10 shadow-lg">
          {/* Navigation & Back */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
            <button
              onClick={onBackToGrid}
              className="apple-button flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Grafic</span>
            </button>

            <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Săptămâna precedentă"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-amber-200 font-semibold px-2 tracking-wide whitespace-nowrap">
                {weekRangeFormatted}
              </span>
              <button
                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Săptămâna următoare"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Layout Mode Segmented Picker */}
          <div className="apple-segmented flex items-center p-1 w-full sm:w-auto justify-center">
            <button
              onClick={() => setLayoutMode('split')}
              className={`apple-segmented-item flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                layoutMode === 'split' ? 'active' : 'text-white/60 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Sinteză Monahală</span>
              <span className="text-[10px] px-1 rounded bg-amber-400/20 text-amber-300 ml-1">Litere Mari</span>
            </button>

            <button
              onClick={() => setLayoutMode('matrix')}
              className={`apple-segmented-item flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                layoutMode === 'matrix' ? 'active' : 'text-white/60 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matrice 7 Zile</span>
            </button>

            <button
              onClick={() => setLayoutMode('cards')}
              className={`apple-segmented-item flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                layoutMode === 'cards' ? 'active' : 'text-white/60 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tablou pe Zile</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="apple-gold-button flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md w-full lg:w-auto"
            >
              <Printer className="w-4 h-4 text-stone-950" />
              <span>Tipărește A4 / PDF</span>
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Font System, Accessibility & Byzantine Ornaments Bar */}
        <div className="apple-glass rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs border border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {/* Font Picker Button */}
            <button
              onClick={() => setActiveToolbarTab(activeToolbarTab === 'typography' ? null : 'typography')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                activeToolbarTab === 'typography' 
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs' 
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>Font: {fontThemeClasses[fontTheme].label.split(' ')[0]}</span>
            </button>

            {/* Byzantine Ornaments Button */}
            <button
              onClick={() => setActiveToolbarTab(activeToolbarTab === 'ornaments' ? null : 'ornaments')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                activeToolbarTab === 'ornaments' 
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs' 
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-rose-400" />
              <span>Ornamente Bizantine</span>
            </button>

            {/* Accessibility & Sheet Options Button */}
            <button
              onClick={() => setActiveToolbarTab(activeToolbarTab === 'options' ? null : 'options')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                activeToolbarTab === 'options' 
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs' 
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Setări Avizier & Chenare</span>
            </button>
          </div>

          {/* Quick Font Size Step Picker */}
          <div className="flex items-center space-x-2">
            <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">Lizibilitate:</span>
            <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px]">
              <button
                onClick={() => setFontSizeMode('compact')}
                className={`px-2 py-0.5 rounded font-medium ${fontSizeMode === 'compact' ? 'bg-white/20 text-white font-bold' : 'text-white/50'}`}
                title="Compact (90%)"
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeMode('normal')}
                className={`px-2 py-0.5 rounded font-medium ${fontSizeMode === 'normal' ? 'bg-white/20 text-white font-bold' : 'text-white/50'}`}
                title="Standard (100%)"
              >
                A
              </button>
              <button
                onClick={() => setFontSizeMode('large')}
                className={`px-2 py-0.5 rounded font-medium ${fontSizeMode === 'large' ? 'bg-amber-400/25 text-amber-300 font-bold' : 'text-white/50'}`}
                title="Mare (115%)"
              >
                A+
              </button>
              <button
                onClick={() => setFontSizeMode('extra_large')}
                className={`px-2 py-0.5 rounded font-medium ${fontSizeMode === 'extra_large' ? 'bg-amber-400/35 text-amber-200 font-bold' : 'text-white/50'}`}
                title="Foarte Mare (130%)"
              >
                A++
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDABLE PANEL 1: TYPOGRAPHY & FONT SELECTION */}
        {activeToolbarTab === 'typography' && (
          <div className="apple-glass rounded-2xl p-4 border border-amber-400/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-semibold text-xs text-amber-200 flex items-center space-x-1.5">
                <Type className="w-4 h-4 text-amber-400" />
                <span>Alege Stilul Tipografic al Foii de Tipărit</span>
              </span>
              <span className="text-[11px] text-white/50">Diacritice complete & serife caligrafice optimizate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {(Object.keys(fontThemeClasses) as FontTheme[]).map(themeKey => {
                const item = fontThemeClasses[themeKey];
                const isSelected = fontTheme === themeKey;

                return (
                  <div
                    key={themeKey}
                    onClick={() => setFontTheme(themeKey)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-white ring-1 ring-amber-400 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white/70'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{item.label.split('(')[0]}</div>
                      <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                        {themeKey === 'merriweather' && 'Lizibilitate maximă de la distanță'}
                        {themeKey === 'eb_garamond' && 'Stilul tiparelor clasice de la Neamțu'}
                        {themeKey === 'lora' && 'Litere fluide de carte veche'}
                        {themeKey === 'playfair' && 'Contrast înalt & rafinament nobil'}
                        {themeKey === 'inter' && 'Geometric, fără serife, modern'}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/5">
                      <p className={`${item.body} text-sm font-bold text-white truncate`}>
                        Ierom. Teofan • Strana 1
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Typography Modifiers */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/10 text-[11px] text-white/80">
              <div className="flex items-center space-x-2">
                <span className="text-white/50 font-semibold">Grosime Litere:</span>
                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10">
                  <button
                    onClick={() => setFontWeight('normal')}
                    className={`px-2 py-0.5 rounded ${fontWeight === 'normal' ? 'bg-white/20 text-white font-bold' : 'text-white/50'}`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setFontWeight('bold')}
                    className={`px-2 py-0.5 rounded ${fontWeight === 'bold' ? 'bg-amber-400/25 text-amber-300 font-bold' : 'text-white/50'}`}
                  >
                    Îngroșat
                  </button>
                  <button
                    onClick={() => setFontWeight('black')}
                    className={`px-2 py-0.5 rounded ${fontWeight === 'black' ? 'bg-amber-400/35 text-amber-200 font-bold' : 'text-white/50'}`}
                  >
                    Extra-Îngroșat
                  </button>
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={isUppercase}
                  onChange={e => setIsUppercase(e.target.checked)}
                  className="rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
                />
                <span className="font-semibold text-amber-200">Scrie Numele cu MAJUSCULE (Vizibilitate Avizier)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={isHighContrast}
                  onChange={e => setIsHighContrast(e.target.checked)}
                  className="rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
                />
                <span>Contrast Înalt (Negru Pur Cerneală pe Alb)</span>
              </label>
            </div>
          </div>
        )}

        {/* EXPANDABLE PANEL 2: BYZANTINE ORNAMENTS SUITE */}
        {activeToolbarTab === 'ornaments' && (
          <div className="apple-glass rounded-2xl p-4 border border-rose-500/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-semibold text-xs text-rose-300 flex items-center space-x-1.5">
                <Crown className="w-4 h-4 text-rose-400" />
                <span>Rânduială Ornamentală Bizantină (Frontispiciu, Colțare & Cruci)</span>
              </span>
              <span className="text-[11px] text-white/50">Motive autentice bisericești din cărțile de cult</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setOrnamentStyle('voievodal')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  ornamentStyle === 'voievodal'
                    ? 'bg-rose-500/15 border-rose-400 text-white ring-1 ring-rose-400'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Voievodal / Bogat</span>
                  <Crown className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  Colțare bizantine în toate cele 4 colțuri + Frontispiciu eclezial în antet + Chenar dublu festiv.
                </p>
              </div>

              <div
                onClick={() => setOrnamentStyle('classic')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  ornamentStyle === 'classic'
                    ? 'bg-rose-500/15 border-rose-400 text-white ring-1 ring-rose-400'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Eclezial Tradițional</span>
                  <ByzantineCross className="w-3.5 h-3.5 text-rose-400" color="#e11d48" />
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  Cruci bizantine treflate în antet și separatoare + Chenar clasic mănăstiresc.
                </p>
              </div>

              <div
                onClick={() => setOrnamentStyle('minimal')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  ornamentStyle === 'minimal'
                    ? 'bg-rose-500/15 border-rose-400 text-white ring-1 ring-rose-400'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Sobru / Fără Ornamente</span>
                  <LayoutGrid className="w-3.5 h-3.5 text-white/50" />
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  Chenar tipografic curat, linii negre sobre, spațiu maxim pentru date.
                </p>
              </div>
            </div>

            {/* Ornament Color Switcher */}
            <div className="flex items-center space-x-3 pt-2 border-t border-white/10 text-xs">
              <span className="text-white/60 font-semibold text-[11px]">Nuanță Ornamente:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setOrnamentColor('ruby')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    ornamentColor === 'ruby' ? 'bg-rose-950 border-rose-400 text-rose-200 ring-1 ring-rose-400' : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#78141c]" />
                  <span>Rubiniu Bisericesc</span>
                </button>
                <button
                  onClick={() => setOrnamentColor('black')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    ornamentColor === 'black' ? 'bg-stone-900 border-white/40 text-white ring-1 ring-white/40' : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-white/40" />
                  <span>Negru Cerneală</span>
                </button>
                <button
                  onClick={() => setOrnamentColor('gold')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    ornamentColor === 'gold' ? 'bg-amber-950 border-amber-400 text-amber-200 ring-1 ring-amber-400' : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8c6b12]" />
                  <span>Auriu Patinat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXPANDABLE PANEL 3: SHEET & DISPLAY OPTIONS */}
        {activeToolbarTab === 'options' && (
          <div className="apple-glass rounded-2xl p-4 border border-cyan-400/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-semibold text-xs text-cyan-300 flex items-center space-x-1.5">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span>Elemente de Conținut & Afișaj A4</span>
              </span>
              <span className="text-[11px] text-white/50">Personalizează rânduielile afișate pe foaie</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start space-x-3 cursor-pointer hover:bg-white/[0.06] transition-colors">
                <input
                  type="checkbox"
                  checked={showAnnouncements}
                  onChange={e => setShowAnnouncements(e.target.checked)}
                  className="mt-0.5 rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Caseta de Rânduieli Speciale</span>
                  <span className="text-[11px] text-white/50 block mt-0.5">Anunțuri, sărbători cu priveghere sau tipic particular.</span>
                </div>
              </label>

              <label className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start space-x-3 cursor-pointer hover:bg-white/[0.06] transition-colors">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={e => setShowSignatures(e.target.checked)}
                  className="mt-0.5 rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Caseta de Semnături Oficiale</span>
                  <span className="text-[11px] text-white/50 block mt-0.5">Binecuvântare Stareț, Pecetea Mănăstirii și Eclesiarh.</span>
                </div>
              </label>

              {layoutMode === 'matrix' && (
                <label className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start space-x-3 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={mergeWeeklyInMatrix}
                    onChange={e => setMergeWeeklyInMatrix(e.target.checked)}
                    className="mt-0.5 rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-white block">Unifică Rândurile Săptămânale</span>
                    <span className="text-[11px] text-white/50 block mt-0.5">Litere mari centrate peste cele 7 coloane pentru ascultările săptămânale.</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Editable Announcement Text Box */}
        {showAnnouncements && (
          <div className="apple-glass rounded-2xl p-3.5 text-xs space-y-1.5 border border-white/10">
            <div className="flex items-center space-x-2 text-amber-300 font-semibold text-xs tracking-wide">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Mențiuni și rânduieli particulare pentru avizier:</span>
            </div>
            <textarea
              rows={2}
              value={customAnnouncement}
              onChange={e => setCustomAnnouncement(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition-all"
              placeholder="Scrieți aici orice anunț, sărbătoare cu priveghere sau tipic special pentru această săptămână..."
            />
          </div>
        )}
      </div>

      {/* ================= PRINTABLE SHEET AREA (OPTIMIZED FOR A4 LANDSCAPE) ================= */}
      <div className={`print-sheet-landscape bg-[#ffffff] text-[#0c0a09] p-4 sm:p-6 rounded-2xl shadow-2xl border ${contrastClasses} ${fontThemeClasses[fontTheme].body} print:p-0 print:border-none print:shadow-none print:rounded-none relative`}>
        
        {/* Outer Frame with Byzantine Ornaments */}
        <div className={`p-4 relative min-h-[500px] flex flex-col justify-between ${
          ornamentStyle !== 'minimal'
            ? 'border-[3px] border-[#1f1915] outline outline-1 outline-[#78141c] outline-offset-[-5px]' 
            : 'border border-stone-800'
        }`}>

          {/* BYZANTINE CORNERS (VOIEVODAL STYLE) */}
          {ornamentStyle === 'voievodal' && (
            <>
              <ByzantineCorner position="top-left" color={activeOrnamentColor} className="absolute top-1 left-1 w-9 h-9 sm:w-11 sm:h-11 pointer-events-none" />
              <ByzantineCorner position="top-right" color={activeOrnamentColor} className="absolute top-1 right-1 w-9 h-9 sm:w-11 sm:h-11 pointer-events-none" />
              <ByzantineCorner position="bottom-left" color={activeOrnamentColor} className="absolute bottom-1 left-1 w-9 h-9 sm:w-11 sm:h-11 pointer-events-none" />
              <ByzantineCorner position="bottom-right" color={activeOrnamentColor} className="absolute bottom-1 right-1 w-9 h-9 sm:w-11 sm:h-11 pointer-events-none" />
            </>
          )}

          {/* TOP SECTION */}
          <div>
            {/* BYZANTINE HEADPIECE / FRONTISPICIU */}
            {ornamentStyle === 'voievodal' && (
              <div className="flex justify-center -mt-1 mb-1">
                <ByzantineHeadpiece color={activeOrnamentColor} crossColor={activeOrnamentColor} className="w-80 sm:w-[480px] h-5 sm:h-6" />
              </div>
            )}

            {/* MONASTERY HEADER */}
            <div className="flex items-center justify-between border-b-2 border-stone-900 pb-2 px-2">
              <div className="flex items-center space-x-2.5">
                {ornamentStyle !== 'minimal' && (
                  <ByzantineCross className="w-6 h-6 flex-shrink-0" color={activeOrnamentColor} />
                )}
                <div>
                  <span className={`${fontThemeClasses[fontTheme].header} text-[10px] font-black uppercase tracking-[0.25em] block leading-none`} style={{ color: activeOrnamentColor }}>
                    Biserica Ortodoxă Română
                  </span>
                  <h1 className={`${fontThemeClasses[fontTheme].header} font-black text-xl sm:text-2xl uppercase tracking-wider text-stone-950 leading-tight mt-0.5`}>
                    {settings.monasteryName}
                  </h1>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-0.5 border border-stone-900 bg-stone-50">
                  <h2 className={`${fontThemeClasses[fontTheme].header} font-bold text-xs uppercase tracking-widest text-stone-900`}>
                    Graficul Slujbelor & Ascultărilor
                  </h2>
                </div>
                <p className="text-xs text-stone-800 mt-0.5 font-medium font-sans">
                  Săptămâna: <strong className="font-bold underline text-stone-950">{weekRangeFormatted}</strong>
                </p>
              </div>
            </div>

            {/* ================= LAYOUT 1: SINTEZĂ MONAHALĂ (SĂPTĂMÂNAL VS ZILNIC) ================= */}
            {layoutMode === 'split' && (
              <div className="mt-3 grid grid-cols-12 gap-3">
                {/* LEFT COLUMN: RÂNDUL PE TOATĂ SĂPTĂMÂNA (Weekly Duties) */}
                <div className="col-span-12 lg:col-span-6 print:col-span-6 flex flex-col space-y-1.5">
                  <div 
                    className="text-white px-3 py-1 text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                    style={{ backgroundColor: activeOrnamentColor }}
                  >
                    <span>❖</span>
                    <span className={fontThemeClasses[fontTheme].header}>RÂNDUL PE TOATĂ SĂPTĂMÂNA</span>
                    <span>❖</span>
                  </div>

                  <div className={`border-2 border-stone-900 divide-y-2 border-stone-900 bg-stone-50/40 flex-1`}>
                    {weeklyModules.map(module => (
                      <div key={module.id} className="p-2 space-y-1">
                        {/* Module Sub-header */}
                        <div className="font-bold text-xs uppercase tracking-wide flex items-center space-x-1.5 pb-0.5 border-b border-stone-300" style={{ color: activeOrnamentColor }}>
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: module.color }} />
                          <span className={fontThemeClasses[fontTheme].header}>{module.name}</span>
                          <span className="font-sans text-[10px] text-stone-500 font-normal lowercase">(rând pe săptămână)</span>
                        </div>

                        {/* Module Roles */}
                        <div className="space-y-1 pt-0.5">
                          {module.roles.map(role => (
                            <div key={role.id} className="space-y-1">
                              {Array.from({ length: role.requiredCount }).map((_, slotIdx) => {
                                const assignment = getWeeklyAssignment(module.id, role.id, slotIdx);
                                const personName = getPersonName(assignment?.personId, true);

                                return (
                                  <div
                                    key={slotIdx}
                                    className="flex items-baseline justify-between bg-white px-2.5 py-1 rounded border border-stone-300 shadow-xs"
                                  >
                                    <div className="flex items-center space-x-1.5">
                                      <span className={`${fontSizes.role} text-stone-700 font-semibold uppercase tracking-wide`}>
                                        {role.name}
                                        {role.requiredCount > 1 && (
                                          <span className="text-[10px] text-stone-500 font-mono ml-1">#{slotIdx + 1}</span>
                                        )}
                                        :
                                      </span>
                                    </div>

                                    <div className="text-right">
                                      <span className={`${fontSizes.name} ${weightClass} ${personName === '—' ? 'text-stone-400 italic' : 'text-stone-950'}`}>
                                        {personName}
                                      </span>
                                      {assignment?.notes && (
                                        <div className="text-[10px] text-stone-600 italic">
                                          ({assignment.notes})
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {weeklyModules.length === 0 && (
                      <div className="p-4 text-center text-xs text-stone-500 italic">
                        Toate ascultările au rotație zilnică.
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: RÂNDUL PE ZILE (Daily Duties Matrix) */}
                <div className="col-span-12 lg:col-span-6 print:col-span-6 flex flex-col space-y-1.5">
                  <div 
                    className="text-white px-3 py-1 text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                    style={{ backgroundColor: activeOrnamentColor }}
                  >
                    <span>❖</span>
                    <span className={fontThemeClasses[fontTheme].header}>RÂNDUL PE ZILE (LUNI – DUMINICĂ)</span>
                    <span>❖</span>
                  </div>

                  {dailyModules.length > 0 ? (
                    <div className="border-2 border-stone-900 bg-white flex-1 overflow-x-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-200 border-b-2 border-stone-900 text-stone-900">
                            <th className={`border border-stone-900 p-1.5 text-left font-bold uppercase text-[11px] w-28 ${fontThemeClasses[fontTheme].header}`}>
                              Ascultare
                            </th>
                            {weekDays.map(day => {
                              const isSunday = day.getDay() === 0;
                              const isSaturday = day.getDay() === 6;
                              const litInfo = getDayLiturgicalInfo(day);
                              return (
                                <th
                                  key={day.toISOString()}
                                  className={`border border-stone-900 p-1 text-center uppercase ${
                                    litInfo.isRedCross ? 'bg-red-100 text-red-950 font-black' : isSunday ? 'bg-red-50 text-red-900 font-bold' : isSaturday ? 'bg-amber-50/60 text-stone-900 font-bold' : 'font-bold'
                                  }`}
                                >
                                  <div className="font-sans text-[10px] flex items-center justify-center space-x-0.5">
                                    <span>{format(day, 'EEE', { locale: ro })}</span>
                                    {litInfo.isRedCross && <span className="text-red-700 font-black">✝</span>}
                                  </div>
                                  <div className={`text-xs font-bold ${fontThemeClasses[fontTheme].header}`}>{format(day, 'd MMM', { locale: ro })}</div>
                                  {litInfo.isRedCross && (
                                    <div className="text-[7.5px] font-sans normal-case text-red-800 line-clamp-1 max-w-[65px] mx-auto leading-none mt-0.5" title={litInfo.feastTitle}>
                                      {litInfo.feastTitle}
                                    </div>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {dailyModules.map(module => (
                            <React.Fragment key={module.id}>
                              <tr className="bg-stone-100 border-t border-stone-400">
                                <td
                                  colSpan={8}
                                  className={`border border-stone-900 px-2 py-0.5 text-stone-900 font-bold uppercase text-[10px] ${fontThemeClasses[fontTheme].header}`}
                                >
                                  {module.name} (Rând pe zile)
                                </td>
                              </tr>
                              {module.roles.map(role => (
                                <React.Fragment key={role.id}>
                                  {Array.from({ length: role.requiredCount }).map((_, slotIdx) => (
                                    <tr key={`${role.id}_${slotIdx}`} className="border-b border-stone-300">
                                      <td className="border border-stone-900 p-1.5 font-semibold text-stone-800 bg-stone-50 text-[11px]">
                                        {role.name}
                                      </td>
                                      {weekDays.map(day => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const assignment = getAssignment(dateStr, module.id, role.id, slotIdx);
                                        const name = getPersonName(assignment?.personId);
                                        const isSunday = day.getDay() === 0;

                                        return (
                                          <td
                                            key={dateStr}
                                            className={`border border-stone-900 p-1 text-center align-middle ${
                                              isSunday ? 'bg-red-50/60' : ''
                                            }`}
                                          >
                                            <span className={`${fontSizes.name} ${weightClass} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950'}`}>
                                              {name}
                                            </span>
                                            {assignment?.notes && (
                                              <div className="text-[9px] text-stone-600 italic">
                                                {assignment.notes}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border-2 border-stone-900 p-6 text-center text-xs text-stone-500 italic bg-stone-50 flex items-center justify-center flex-1">
                      Toate ascultările actuale au rândul pe toată săptămâna.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= LAYOUT 2: MATRICE TRADIȚIONALĂ 7 ZILE ================= */}
            {layoutMode === 'matrix' && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse border-2 border-stone-900 text-xs">
                  <thead>
                    <tr className="bg-stone-100 border-b-2 border-stone-900 text-stone-900">
                      <th className={`border border-stone-900 p-2 text-left font-bold uppercase tracking-wider w-40 ${fontThemeClasses[fontTheme].header}`}>
                        Ascultare / Post
                      </th>
                      {weekDays.map(day => {
                        const isSunday = day.getDay() === 0;
                        const isSaturday = day.getDay() === 6;
                        const litInfo = getDayLiturgicalInfo(day);
                        return (
                          <th
                            key={day.toISOString()}
                            className={`border border-stone-900 p-1.5 text-center font-bold uppercase ${
                              litInfo.isRedCross ? 'bg-red-100 text-red-950 font-black' : isSunday ? 'bg-red-50 text-red-900 font-bold' : isSaturday ? 'bg-amber-50/60 text-stone-900' : ''
                            }`}
                          >
                            <div className="font-sans text-[10px] tracking-wide flex items-center justify-center space-x-1">
                              <span>{format(day, 'EEEE', { locale: ro })}</span>
                              {litInfo.isRedCross && <span className="text-red-700 font-black">✝</span>}
                            </div>
                            <div className={`text-xs font-bold ${fontThemeClasses[fontTheme].header}`}>{format(day, 'd MMM', { locale: ro })}</div>
                            {litInfo.isRedCross && (
                              <div className="text-[8px] font-sans normal-case text-red-800 line-clamp-1 max-w-[85px] mx-auto leading-tight mt-0.5" title={litInfo.feastTitle}>
                                {litInfo.feastTitle}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(module => {
                      const isWeekly = module.rotationCycle === 'weekly';

                      return (
                        <React.Fragment key={module.id}>
                          {/* Module Subheader */}
                          <tr className="bg-stone-200 border-t-2 border-stone-900 font-bold">
                            <td
                              colSpan={8}
                              className={`border border-stone-900 px-3 py-1 text-stone-900 tracking-wider text-[11px] uppercase ${fontThemeClasses[fontTheme].header}`}
                            >
                              {module.name} ({isWeekly ? 'Rând pe săptămână' : 'Rând pe zile'})
                            </td>
                          </tr>

                          {/* Module Roles */}
                          {module.roles.map(role => (
                            <React.Fragment key={role.id}>
                              {Array.from({ length: role.requiredCount }).map((_, slotIdx) => {
                                if (isWeekly && mergeWeeklyInMatrix) {
                                  const assignment = getWeeklyAssignment(module.id, role.id, slotIdx);
                                  const name = getPersonName(assignment?.personId, true);

                                  return (
                                    <tr key={`${role.id}_${slotIdx}`} className="border-b border-stone-400">
                                      <td className="border border-stone-900 p-2 font-semibold text-stone-900 bg-stone-50 text-xs">
                                        {role.name}
                                        {role.requiredCount > 1 && (
                                          <span className="text-[10px] text-stone-600 font-mono ml-1">#{slotIdx + 1}</span>
                                        )}
                                      </td>
                                      <td
                                        colSpan={7}
                                        className="border border-stone-900 p-2.5 text-center align-middle bg-stone-50/50"
                                      >
                                        <span className={`${fontSizes.name} ${weightClass} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950'}`}>
                                          {name}
                                        </span>
                                        <span className="text-[10px] font-sans uppercase tracking-wider text-stone-500 ml-2 font-normal">
                                          (Toată Săptămâna)
                                        </span>
                                        {assignment?.notes && (
                                          <div className="text-[10px] text-stone-600 italic mt-0.5">
                                            {assignment.notes}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={`${role.id}_${slotIdx}`} className="border-b border-stone-400">
                                    <td className="border border-stone-900 p-1.5 font-semibold text-stone-900 bg-stone-50 text-[11px]">
                                      {role.name}
                                      {role.requiredCount > 1 && (
                                        <span className="text-[10px] text-stone-600 font-mono ml-1">#{slotIdx + 1}</span>
                                      )}
                                    </td>
                                    {weekDays.map(day => {
                                      const dateStr = format(day, 'yyyy-MM-dd');
                                      const assignment = getAssignment(dateStr, module.id, role.id, slotIdx);
                                      const name = getPersonName(assignment?.personId);
                                      const isSunday = day.getDay() === 0;

                                      return (
                                        <td
                                          key={dateStr}
                                          className={`border border-stone-900 ${fontSizes.cell} text-center align-middle ${
                                            isSunday ? 'bg-red-50/70' : ''
                                          }`}
                                        >
                                          <span className={`${fontSizes.name} ${weightClass} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950'}`}>
                                            {name}
                                          </span>
                                          {assignment?.notes && (
                                            <div className="text-[9px] text-stone-600 italic mt-0.5">
                                              {assignment.notes}
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= LAYOUT 3: TABLOU PE ZILE (7 COLOANE ZILNICE) ================= */}
            {layoutMode === 'cards' && (
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {weekDays.map(day => {
                  const isSunday = day.getDay() === 0;
                  const isSaturday = day.getDay() === 6;
                  const litInfo = getDayLiturgicalInfo(day);
                  const dateStr = format(day, 'yyyy-MM-dd');

                  return (
                    <div
                      key={dateStr}
                      className={`border-2 flex flex-col ${
                        litInfo.isRedCross ? 'border-[#78141c] bg-red-50/25' : isSunday ? 'border-[#78141c] bg-red-50/20' : 'border-stone-900 bg-white'
                      }`}
                    >
                      {/* Day Column Header */}
                      <div
                        className={`p-1 text-center border-b-2 ${
                          litInfo.isRedCross 
                            ? 'bg-[#78141c] text-white border-[#78141c]' 
                            : isSunday 
                            ? 'bg-[#78141c] text-white border-[#78141c]' 
                            : isSaturday 
                            ? 'bg-amber-100 text-stone-900 border-stone-900 font-bold'
                            : 'bg-stone-200 text-stone-900 border-stone-900'
                        }`}
                      >
                        <div className="font-sans text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                          <span>{format(day, 'EEEE', { locale: ro })}</span>
                          {litInfo.isRedCross && <span className="text-amber-300 font-black">✝</span>}
                        </div>
                        <div className={`font-black text-xs ${fontThemeClasses[fontTheme].header}`}>
                          {format(day, 'd MMM', { locale: ro })}
                        </div>
                        {litInfo.isRedCross && (
                          <div className="text-[7.5px] font-sans normal-case text-amber-200/90 line-clamp-1 leading-none mt-0.5" title={litInfo.feastTitle}>
                            {litInfo.feastTitle}
                          </div>
                        )}
                      </div>

                      {/* Daily Duties List */}
                      <div className="p-1 space-y-1 flex-1 divide-y divide-stone-200">
                        {modules.map(module => (
                          <div key={module.id} className="pt-1 first:pt-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 block leading-tight">
                              {module.name}
                            </span>

                            {module.roles.map(role => (
                              <div key={role.id}>
                                {Array.from({ length: role.requiredCount }).map((_, slotIdx) => {
                                  const assignment = getAssignment(dateStr, module.id, role.id, slotIdx);
                                  const name = getPersonName(assignment?.personId);

                                  return (
                                    <div key={slotIdx} className="my-0.5">
                                      <span className="text-[10px] text-stone-700 font-medium block leading-tight">
                                        {role.name}:
                                      </span>
                                      <span className={`${fontSizes.name} ${weightClass} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950'} block leading-snug`}>
                                        {name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTTOM SECTION: ANNOUNCEMENTS, BYZANTINE DIVIDER & SIGNATURES */}
          <div className="mt-3">
            {/* ANNOUNCEMENTS / TIPIC FOOTER */}
            {showAnnouncements && customAnnouncement && (
              <div className="p-2 border border-stone-900 bg-stone-50 font-sans text-xs rounded-xs">
                <span className={`${fontThemeClasses[fontTheme].header} font-bold text-stone-950 block mb-0.5 tracking-wider text-[10px]`}>
                  ❖ RÂNDUIELI & ÎNDATORIRI SPECIALE PENTRU ACEASTĂ SĂPTĂMÂNĂ:
                </span>
                <p className="text-stone-900 leading-relaxed italic text-[11px]">
                  {customAnnouncement}
                </p>
              </div>
            )}

            {/* ORNAMENTAL BYZANTINE DIVIDER BEFORE SIGNATURES */}
            {showSignatures && (
              <div className="my-2">
                <ByzantineDivider color={activeOrnamentColor} />
              </div>
            )}

            {/* SIGNATURES BLOCK */}
            {showSignatures && (
              <div className="pt-2 flex items-center justify-between font-sans text-xs text-stone-950 px-12 sm:px-16">
                <div className="text-center min-w-[140px]">
                  <p className={`${fontThemeClasses[fontTheme].header} font-bold tracking-wider text-stone-600 text-[10px]`}>
                    Din încredințarea
                  </p>
                  <p className={`${fontThemeClasses[fontTheme].header} font-black text-xs sm:text-sm text-stone-900`}>
                    Pr. Stareț,
                  </p>
                  <div className="h-6 flex items-center justify-center">
                    <span className="text-[9px] text-stone-400 italic">(Semnătura)</span>
                  </div>
                  <p className={`font-bold text-xs sm:text-sm text-stone-900 ${weightClass}`}>{settings.abbotName}</p>
                </div>

                <div className="text-center opacity-50 px-4">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone-400 flex items-center justify-center mx-auto text-[8px] uppercase tracking-widest text-stone-500 font-cinzel">
                    Pecetea
                  </div>
                </div>

                <div className="text-center min-w-[140px]">
                  <p className={`${fontThemeClasses[fontTheme].header} font-bold tracking-wider text-stone-600 text-[10px]`}>
                    Întocmit,
                  </p>
                  <p className={`${fontThemeClasses[fontTheme].header} font-black text-xs sm:text-sm text-stone-900`}>
                    Pr. Eclesiarh,
                  </p>
                  <div className="h-6 flex items-center justify-center">
                    <span className="text-[9px] text-stone-400 italic">(Semnătura)</span>
                  </div>
                  <p className={`font-bold text-xs sm:text-sm text-stone-900 ${weightClass}`}>{settings.ecclesiarchName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


