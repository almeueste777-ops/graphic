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
  Crown,
  Church,
  Bell,
  BookOpen,
  Car,
  Scroll,
  Eye,
  Calendar
} from 'lucide-react';
import { 
  ByzantineCross, 
  ByzantineCorner, 
  ByzantineHeadpiece, 
  ByzantineDivider 
} from './Ornament';
import { getDayLiturgicalInfo } from '../services/orthodoxCalendar';

type PrintLayoutMode = 'modular' | 'split' | 'matrix' | 'cards';
type PageOrientation = 'landscape' | 'portrait';
type NameFormatMode = 'traditional' | 'canonical' | 'short_rank';
type FontTheme = 'merriweather' | 'eb_garamond' | 'lora' | 'playfair' | 'inter';
type PrintFontSizeMode = 'compact' | 'normal' | 'large' | 'extra_large';
type FontWeightMode = 'bold' | 'black' | 'normal';
type OrnamentStyle = 'voievodal' | 'classic' | 'minimal';
type OrnamentColorMode = 'ruby' | 'black' | 'gold';
type PrintInkMode = 'laser_bw' | 'color';

export const cleanMonasticName = (rawName: string): string => {
  return rawName
    .replace(/^(Părintele|Parintele|Fratele|Maica|Sora|Arhimandrit|Arhim\.|Arhim|Protosinghel|Protos\.|Protos|Ieromonah|Ierom\.|Ierom|Ierodiacon|Ierod\.|Ierod|Arhidiacon|Arhid\.|Arhid|Preot|Diacon|Diac\.|Diac|Monahul|Monah|Pr\.|Pr|Fr\.)\s*/gi, '')
    .trim();
};

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
  // Layout & View State - Default to 'modular' (Large Byzantine Boxes)
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>('modular');
  
  // Page Orientation - Landscape (Vedere) or Portrait (Vertical A4)
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('landscape');

  // Name Formatting Mode - Traditional (Pr. / Fr.), Canonical (Protosinghel / Ieromonah), or Short (Ierom.)
  const [nameFormatMode, setNameFormatMode] = useState<NameFormatMode>('traditional');
  
  // High-Contrast Laser vs Color Profile (Default to 'laser_bw' for crisp physical printing)
  const [printInkMode, setPrintInkMode] = useState<PrintInkMode>('laser_bw');
  const [showPrintGuide, setShowPrintGuide] = useState<boolean>(true);

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
  const [showOtherModules, setShowOtherModules] = useState<boolean>(false);

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

  const getPersonName = (personId: string | null | undefined, modeOrFull?: NameFormatMode | boolean) => {
    if (!personId) return '—';
    const person = persons.find(p => p.id === personId);
    if (!person) return '—';
    const cleanName = cleanMonasticName(person.name);
    const activeMode: NameFormatMode = typeof modeOrFull === 'string' ? modeOrFull : nameFormatMode;

    let formatted = '';
    if (activeMode === 'traditional') {
      // Tradițional Monahal (Pr. / Fr. / Diac.)
      if (person.rank === 'Frate' || person.name.startsWith('Fr.') || person.rank === 'Monah') {
        formatted = `Fr. ${cleanName}`;
      } else if (person.rank === 'Diacon') {
        formatted = `Diac. ${cleanName}`;
      } else {
        formatted = `Pr. ${cleanName}`;
      }
    } else if (activeMode === 'canonical') {
      // Canonic Eclezial (Ieromonah Pantelimon, Protosinghel Mina, Ierodiacon Modest, Frate Arghir, Preot Iliescu)
      let rank = person.rank;
      if (!rank) {
        rank = (person.name.startsWith('Fr.') || person.name.toLowerCase().includes('frate')) ? 'Frate' : 'Ieromonah';
      }
      formatted = `${rank} ${cleanName}`;
    } else {
      // Scurt Liturgic (Protos. Mina, Ierom. Pantelimon, Ierod. Modest, Pr. Iliescu, Fr. Arghir)
      let shortRank = 'Pr.';
      if (person.rank === 'Protosinghel') shortRank = 'Protos.';
      else if (person.rank === 'Ieromonah') shortRank = 'Ierom.';
      else if (person.rank === 'Ierodiacon') shortRank = 'Ierod.';
      else if (person.rank === 'Arhimandrit') shortRank = 'Arhim.';
      else if (person.rank === 'Diacon') shortRank = 'Diac.';
      else if (person.rank === 'Frate' || person.rank === 'Monah') shortRank = 'Fr.';
      else if (person.rank === 'Preot') shortRank = 'Pr.';
      formatted = `${shortRank} ${cleanName}`;
    }

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

  // Dedicated modules lookup for the Modular A4 Layout
  const altarModule = modules.find(m => m.id === 'altar') || modules.find(m => m.name.toLowerCase().includes('altar'));
  const stranaModule = modules.find(m => m.id === 'strana') || modules.find(m => m.name.toLowerCase().includes('stran'));
  const paracliserieModule = modules.find(m => m.id === 'paracliserie') || modules.find(m => m.name.toLowerCase().includes('paraclis'));
  const soferieModule = modules.find(m => m.id === 'soferie') || modules.find(m => m.name.toLowerCase().includes('șofer') || m.name.toLowerCase().includes('sofer'));
  const predicaModule = modules.find(m => m.id === 'predica') || modules.find(m => m.name.toLowerCase().includes('predic'));
  const bisericaModule = modules.find(m => m.id === 'biserica') || modules.find(m => m.name.toLowerCase().includes('biseric'));

  const otherModules = modules.filter(m => 
    m.id !== altarModule?.id && 
    m.id !== stranaModule?.id && 
    m.id !== paracliserieModule?.id && 
    m.id !== soferieModule?.id && 
    m.id !== predicaModule?.id && 
    m.id !== bisericaModule?.id
  );

  // Liturgical days mapping for the week
  const weekLiturgicalDays = weekDays.map(day => {
    const litInfo = getDayLiturgicalInfo(day);
    const dayOfWeek = day.getDay();
    const dateStr = format(day, 'yyyy-MM-dd');
    return {
      day,
      dateStr,
      dayName: format(day, 'EEEE', { locale: ro }),
      dayShort: format(day, 'EEE', { locale: ro }),
      dateFormatted: format(day, 'd MMM', { locale: ro }),
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
      isFastDay: dayOfWeek === 3 || dayOfWeek === 5,
      litInfo,
    };
  });

  // Assignments for Core Modular Boxes
  const altarPreotRole = altarModule?.roles.find(r => r.id === 'altar_preot' || r.name.toLowerCase().includes('preot')) || altarModule?.roles[0];
  const altarPreotAssignment = altarModule && altarPreotRole ? getWeeklyAssignment(altarModule.id, altarPreotRole.id, 0) : null;

  const altarDiaconRole = altarModule?.roles.find(r => r.id === 'altar_diacon' || r.name.toLowerCase().includes('diacon')) || altarModule?.roles[1];
  const altarDiaconAssignment = altarModule && altarDiaconRole ? getWeeklyAssignment(altarModule.id, altarDiaconRole.id, 0) : null;

  const altarProtosRole = altarModule?.roles.find(r => r.id === 'altar_protos_sambata' || r.name.toLowerCase().includes('protos')) || altarModule?.roles[2];
  const altarProtosAssignment = altarModule && altarProtosRole ? getWeeklyAssignment(altarModule.id, altarProtosRole.id, 0) : null;

  const stranaPsaltRole = stranaModule?.roles.find(r => r.id === 'strana_psalt' || r.name.toLowerCase().includes('psalt') || r.name.toLowerCase().includes('strana 1')) || stranaModule?.roles[0];
  const stranaPsaltAssignment = stranaModule && stranaPsaltRole ? getWeeklyAssignment(stranaModule.id, stranaPsaltRole.id, 0) : null;

  const stranaAjutorRole = stranaModule?.roles.find(r => r.id === 'strana_ajutor' || r.name.toLowerCase().includes('ajutor') || r.name.toLowerCase().includes('strana 2') || r.name.toLowerCase().includes('cititor')) || stranaModule?.roles[1];
  const stranaAjutorAssignment = stranaModule && stranaAjutorRole ? getWeeklyAssignment(stranaModule.id, stranaAjutorRole.id, 0) : null;

  const paracliserRole = paracliserieModule?.roles.find(r => r.id === 'paracliser_principal' || r.name.toLowerCase().includes('paracliser')) || paracliserieModule?.roles[0];
  const paracliserAssignment = paracliserieModule && paracliserRole ? getWeeklyAssignment(paracliserieModule.id, paracliserRole.id, 0) : null;

  const soferRole = soferieModule?.roles.find(r => r.id === 'sofer_garda' || r.name.toLowerCase().includes('șofer') || r.name.toLowerCase().includes('sofer')) || soferieModule?.roles[0];
  const soferAssignment = soferieModule && soferRole ? getWeeklyAssignment(soferieModule.id, soferRole.id, 0) : null;

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
  const activeOrnamentColor = printInkMode === 'laser_bw' ? '#000000' : ornamentColors[ornamentColor];

  const contrastClasses = (isHighContrast || printInkMode === 'laser_bw')
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
              onClick={() => setLayoutMode('modular')}
              className={`apple-segmented-item flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                layoutMode === 'modular' ? 'active' : 'text-white/60 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>Panouri & Casete Mari</span>
              <span className="text-[10px] px-1 rounded bg-amber-400/20 text-amber-300 ml-1">Recomandat A4</span>
            </button>

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
            {/* Print Profile Switcher (Laser B&W vs Color) */}
            <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setPrintInkMode('laser_bw')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  printInkMode === 'laser_bw'
                    ? 'bg-amber-400/25 border border-amber-400/50 text-amber-300 shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Recomandat: contrast maxim pe hârtie, negru pur, fără griuri șterse la imprimante laser B&W"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Laser Alb-Negru</span>
                <span className="text-[9px] bg-amber-400/25 text-amber-200 px-1 rounded font-bold">Contrast Maxim</span>
              </button>
              <button
                onClick={() => setPrintInkMode('color')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  printInkMode === 'color'
                    ? 'bg-rose-500/25 border border-rose-400/50 text-rose-300 shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Profil color cu nuanțe de rubiniu bisericesc, auriu și accente liturgice"
              >
                <span>🎨 Color Liturgic</span>
              </button>
            </div>

            {/* Page Orientation Switcher (Landscape vs Portrait) */}
            <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setPageOrientation('landscape')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pageOrientation === 'landscape'
                    ? 'bg-amber-400/25 border border-amber-400/50 text-amber-300 shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Format Vedere (Landscape) - 4 coloane orizontale pentru avizier (Recomandat)"
              >
                <span>🖼️ Vedere (Landscape)</span>
              </button>
              <button
                onClick={() => setPageOrientation('portrait')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pageOrientation === 'portrait'
                    ? 'bg-amber-400/25 border border-amber-400/50 text-amber-300 shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Format Portret (A4 Vertical) - 2x2 casete mari una sub alta pe 1 pagină A4"
              >
                <span>📄 Portret (Vertical)</span>
              </button>
            </div>

            {/* Name Formatting Mode Switcher */}
            <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <span className="text-white/40 text-[10px] pl-1 font-semibold uppercase hidden sm:inline">Nume:</span>
              <button
                onClick={() => setNameFormatMode('traditional')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nameFormatMode === 'traditional'
                    ? 'bg-amber-400/25 border border-amber-400/50 text-amber-300 shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Tradițional monahal: Pr. Avacum, Pr. Modest, Fr. Arghir"
              >
                <span>Pr. / Fr.</span>
              </button>
              <button
                onClick={() => setNameFormatMode('canonical')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nameFormatMode === 'canonical'
                    ? 'bg-amber-400/25 border border-amber-400/50 text-amber-300 shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Rang canonic complet: Protosinghel Avacum, Ieromonah Pantelimon, Ierodiacon Modest, Frate Arghir"
              >
                <span>Canonic</span>
              </button>
              <button
                onClick={() => setNameFormatMode('short_rank')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nameFormatMode === 'short_rank'
                    ? 'bg-amber-400/25 border border-amber-400/50 text-amber-300 shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Prescurtat liturgic: Protos. Mina, Ierom. Pantelimon, Ierod. Modest"
              >
                <span>Prescurtat</span>
              </button>
            </div>

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

              {otherModules.length > 0 && (
                <label className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start space-x-3 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={showOtherModules}
                    onChange={e => setShowOtherModules(e.target.checked)}
                    className="mt-0.5 rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-white block">Afișează Alte Ascultări</span>
                    <span className="text-[11px] text-white/50 block mt-0.5">Module suplimentare create manual ({otherModules.length} găsite).</span>
                  </div>
                </label>
              )}

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

        {/* PRINT ADVICE BANNER (A4 1 PAGE OPTIMIZATION) */}
        {showPrintGuide && (
          <div className="apple-glass rounded-2xl p-3.5 border border-amber-400/30 flex items-start justify-between gap-3 text-xs bg-black/40 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-400/15 text-amber-400 shrink-0 mt-0.5 border border-amber-400/30">
                <Printer className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-amber-200 text-xs flex items-center space-x-2">
                  <span>💡 Ghid pentru tipărire impecabilă pe 1 singură foaie A4 (LaserJet & Inkjet):</span>
                  <span className="text-[9.5px] font-semibold text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">Garantat 1 pagină</span>
                </div>
                <p className="text-[11px] text-white/80 leading-relaxed">
                  Când apăsați <strong className="text-amber-200">Tipărește A4 / PDF</strong> (sau tastați <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl + P</kbd>), asigurați-vă că aveți aceste setări în fereastra imprimantei:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-white/90 font-medium">
                  <div className="flex items-center space-x-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-amber-400 font-black">1.</span>
                    <span><strong>Orientare:</strong> {pageOrientation === 'landscape' ? 'Vedere (Landscape)' : 'Portret (Vertical)'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-amber-400 font-black">2.</span>
                    <span><strong>Margini:</strong> Minime (sau Fără / None)</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-amber-400 font-black">3.</span>
                    <span><strong>Debifați:</strong> Anteturi și subsoluri</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPrintGuide(false)}
              className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 text-xs"
              title="Închide sfatul"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Dynamic @page style for browser print engine based on chosen orientation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${pageOrientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 4mm 5mm 4mm 5mm;
        }
      `}} />

      {/* ================= PRINTABLE SHEET AREA (OPTIMIZED FOR A4 LANDSCAPE OR PORTRAIT) ================= */}
      <div className={`print-sheet-${pageOrientation} bg-[#ffffff] text-[#0c0a09] p-4 sm:p-6 rounded-2xl shadow-2xl border ${contrastClasses} ${fontThemeClasses[fontTheme].body} print:p-0 print:border-none print:shadow-none print:rounded-none relative ${printInkMode === 'laser_bw' ? 'laser-bw-print' : ''}`}>
        
        {/* Outer Frame with Byzantine Ornaments */}
        <div className={`p-3 sm:p-4 relative min-h-[500px] flex flex-col justify-between print-frame-contain ${
          ornamentStyle !== 'minimal'
            ? printInkMode === 'laser_bw'
              ? 'border-[3px] border-black outline outline-1 outline-black outline-offset-[-5px]'
              : 'border-[3px] border-[#1f1915] outline outline-1 outline-[#78141c] outline-offset-[-5px]' 
            : 'border-2 border-stone-900'
        }`}>

          {/* BYZANTINE CORNERS (VOIEVODAL STYLE) */}
          {ornamentStyle === 'voievodal' && (
            <>
              <ByzantineCorner position="top-left" color={activeOrnamentColor} className="absolute top-1 left-1 w-8 h-8 sm:w-10 sm:h-10 print:w-6 print:h-6 pointer-events-none" />
              <ByzantineCorner position="top-right" color={activeOrnamentColor} className="absolute top-1 right-1 w-8 h-8 sm:w-10 sm:h-10 print:w-6 print:h-6 pointer-events-none" />
              <ByzantineCorner position="bottom-left" color={activeOrnamentColor} className="absolute bottom-1 left-1 w-8 h-8 sm:w-10 sm:h-10 print:w-6 print:h-6 pointer-events-none" />
              <ByzantineCorner position="bottom-right" color={activeOrnamentColor} className="absolute bottom-1 right-1 w-8 h-8 sm:w-10 sm:h-10 print:w-6 print:h-6 pointer-events-none" />
            </>
          )}

          {/* TOP SECTION */}
          <div>
            {/* BYZANTINE HEADPIECE / FRONTISPICIU */}
            {ornamentStyle === 'voievodal' && (
              <div className="flex justify-center -mt-1 mb-1 print:-mt-1.5 print:mb-0.5">
                <ByzantineHeadpiece color={activeOrnamentColor} crossColor={activeOrnamentColor} className="w-80 sm:w-[480px] h-5 sm:h-6 print:h-3 print:w-64" />
              </div>
            )}

            {/* MONASTERY HEADER */}
            <div className="flex items-center justify-between border-b-2 border-stone-900 pb-2 px-2 print:pb-0.5 print:px-1">
              <div className="flex items-center space-x-2.5">
                {ornamentStyle !== 'minimal' && (
                  <ByzantineCross className="w-5 h-5 sm:w-6 sm:h-6 print:w-4 print:h-4 flex-shrink-0" color={activeOrnamentColor} />
                )}
                <div>
                  <span className={`${fontThemeClasses[fontTheme].header} text-[10px] print:text-[8px] font-black uppercase tracking-[0.25em] block leading-none`} style={{ color: printInkMode === 'laser_bw' ? '#000000' : activeOrnamentColor }}>
                    Biserica Ortodoxă Română
                  </span>
                  <h1 className={`${fontThemeClasses[fontTheme].header} font-black text-xl sm:text-2xl print:text-base uppercase tracking-wider text-stone-950 leading-tight mt-0.5`}>
                    {settings.monasteryName}
                  </h1>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-0.5 print:px-2 print:py-0 border border-stone-900 bg-stone-50">
                  <h2 className={`${fontThemeClasses[fontTheme].header} font-bold text-xs print:text-[10px] uppercase tracking-widest text-stone-900`}>
                    Graficul Slujbelor & Ascultărilor
                  </h2>
                </div>
                <p className="text-xs print:text-[9.5px] text-stone-800 mt-0.5 print:mt-0 font-medium font-sans">
                  Săptămâna: <strong className="font-bold underline text-stone-950">{weekRangeFormatted}</strong>
                </p>
              </div>
            </div>

            {/* ================= LAYOUT 0: DREPTUNGHIURI MONAHALE (RECOMANDAT A4) ================= */}
            {layoutMode === 'modular' && (
              <div className="mt-2.5 space-y-2.5">
                {/* 4 DREPTUNGHIURI PRINCIPALE (ALTAR & PARACLISERIE, PREDICA, STAT ÎN BISERICĂ, ȘOFERIE) */}
                <div className={`grid gap-2.5 print:gap-1.5 mt-2 print:mt-1 ${
                  pageOrientation === 'landscape'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
                }`}>
                  
                  {/* DREPTUNGHIUL 1: ALTARUL & PARACLISERIA (cu STRANA) */}
                  <div className="border-2 border-stone-900 bg-white flex flex-col justify-between shadow-xs print:border-[1.5px] print:shadow-none">
                    <div>
                      <div 
                        className="text-white print-inv-text px-2.5 py-1 print:py-0.5 print:px-1.5 text-xs print:text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-b-2 border-stone-900"
                        style={{ backgroundColor: printInkMode === 'laser_bw' ? '#000000' : activeOrnamentColor }}
                      >
                        <div className="flex items-center space-x-1.5">
                          <Church className="w-3.5 h-3.5 text-amber-200" />
                          <span className={fontThemeClasses[fontTheme].header}>ALTARUL & PARACLISERIA</span>
                        </div>
                        <span className="text-[9px] print:text-[7.5px] font-sans font-normal opacity-90 lowercase bg-white/20 text-white px-1.5 py-0.2 rounded">săptămână</span>
                      </div>

                      <div className="p-2 print:p-1 space-y-1.5 print:space-y-0.5">
                        {/* Secțiunea SFÂNTUL ALTAR */}
                        <div className="border-b border-stone-200 print:border-black pb-1.5 print:pb-1 space-y-1 print:space-y-0.5">
                          <div className={`text-[10px] print:text-[8px] font-black uppercase tracking-wider flex items-center space-x-1 ${printInkMode === 'laser_bw' ? 'text-black' : 'text-[#78141c]'}`}>
                            <span>❖</span>
                            <span>SFÂNTUL ALTAR:</span>
                          </div>

                          {/* Preot de rând */}
                          <div className={`p-1.5 print:p-1 rounded-xs ${printInkMode === 'laser_bw' ? 'bg-stone-50 border-2 border-stone-900 print:border-black' : 'bg-stone-50 border border-stone-300'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] print:text-[8px] uppercase font-bold text-stone-800 tracking-wider">
                                Preot Slujitor de Rând:
                              </span>
                              <span className="text-[8.5px] print:text-[7.5px] text-stone-600 font-sans">Toată săpt.</span>
                            </div>
                            <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug print:text-[11.5px] print:leading-tight`}>
                              {getPersonName(altarPreotAssignment?.personId)}
                            </div>
                            {altarPreotAssignment?.notes && (
                              <div className="text-[8.5px] print:text-[7px] text-stone-600 italic mt-0.5">{altarPreotAssignment.notes}</div>
                            )}
                          </div>

                          {/* Diacon slujitor */}
                          <div className={`p-1.5 print:p-1 rounded-xs ${printInkMode === 'laser_bw' ? 'bg-stone-50 border border-stone-800 print:border-black' : 'bg-stone-50 border border-stone-300'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] print:text-[8px] uppercase font-bold text-stone-800 tracking-wider">
                                Diacon Slujitor:
                              </span>
                              <span className="text-[8.5px] print:text-[7.5px] text-stone-600 font-sans">Sf. Liturghie</span>
                            </div>
                            <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug print:text-[11.5px] print:leading-tight`}>
                              {altarDiaconAssignment?.personId ? getPersonName(altarDiaconAssignment.personId) : 'Pr. Ciprian / Pr. Modest'}
                            </div>
                          </div>

                          {/* Sâmbătă Protos */}
                          <div className={`p-1.5 print:p-1 rounded-xs ${printInkMode === 'laser_bw' ? 'bg-stone-50 border-2 border-stone-900 print:border-black' : 'bg-amber-50/40 border border-amber-300/80'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[9.5px] print:text-[8px] uppercase font-bold tracking-wider ${printInkMode === 'laser_bw' ? 'text-black' : 'text-amber-950'}`}>
                                Sâmbătă Protos & Proscomidie:
                              </span>
                              <span className={`text-[8.5px] print:text-[7.5px] font-sans font-semibold ${printInkMode === 'laser_bw' ? 'text-black' : 'text-amber-900'}`}>Weekend</span>
                            </div>
                            <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug print:text-[11.5px] print:leading-tight`}>
                              {altarProtosAssignment?.personId 
                                ? getPersonName(altarProtosAssignment.personId) 
                                : getPersonName(persons.find(p => p.id === 'p_iliescu')?.id) || 'Pr. Iliescu'}
                            </div>
                          </div>
                        </div>

                        {/* Secțiunea PARACLISERIE */}
                        <div className="border-b border-stone-200 print:border-black pb-1.5 print:pb-1 space-y-1 print:space-y-0.5">
                          <div className={`text-[10px] print:text-[8px] font-black uppercase tracking-wider flex items-center space-x-1 ${printInkMode === 'laser_bw' ? 'text-black' : 'text-[#c2410c]'}`}>
                            <Bell className="w-3 h-3 text-[#c2410c]" />
                            <span>PARACLISERIE:</span>
                          </div>

                          <div className={`p-1.5 print:p-1 rounded-xs ${printInkMode === 'laser_bw' ? 'bg-stone-50 border-2 border-stone-900 print:border-black' : 'bg-stone-50 border border-stone-300'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] print:text-[8px] uppercase font-bold text-stone-800 tracking-wider">
                                Paracliser de Rând:
                              </span>
                              <span className="text-[8.5px] print:text-[7.5px] text-stone-600 font-sans">Toată săpt.</span>
                            </div>
                            <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug print:text-[11.5px] print:leading-tight`}>
                              {getPersonName(paracliserAssignment?.personId)}
                            </div>
                            <div className="text-[8px] print:text-[7px] text-stone-600 italic mt-0.5">
                              Toaca, clopotele, cădelnița & Altar
                            </div>
                          </div>
                        </div>

                        {/* Secțiunea CÂNTARE LA STRANĂ */}
                        <div className="space-y-1 print:space-y-0.5 pt-0.5">
                          <div className={`text-[10px] print:text-[8px] font-black uppercase tracking-wider flex items-center space-x-1 ${printInkMode === 'laser_bw' ? 'text-black' : 'text-[#8c6b12]'}`}>
                            <BookOpen className="w-3 h-3 text-[#8c6b12]" />
                            <span>CÂNTARE LA STRANĂ:</span>
                          </div>

                          <div className={`p-1 print:p-0.5 rounded-xs ${printInkMode === 'laser_bw' ? 'bg-stone-50 border border-stone-800 print:border-black' : 'bg-stone-50 border border-stone-300'}`}>
                            <div className="flex items-center justify-between text-[9px] print:text-[7.5px] text-stone-700 font-bold uppercase">
                              <span>Protopsalt (Strana 1):</span>
                            </div>
                            <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} leading-snug print:text-[11px] print:leading-tight`}>
                              {getPersonName(stranaPsaltAssignment?.personId)}
                            </div>
                          </div>

                          <div className={`p-1 print:p-0.5 rounded-xs ${printInkMode === 'laser_bw' ? 'bg-stone-50 border border-stone-800 print:border-black' : 'bg-stone-50 border border-stone-300'}`}>
                            <div className="flex items-center justify-between text-[9px] print:text-[7.5px] text-stone-700 font-bold uppercase">
                              <span>Ajutor Permanent / Cititor:</span>
                            </div>
                            <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} leading-snug print:text-[11px] print:leading-tight`}>
                              {getPersonName(stranaAjutorAssignment?.personId)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-1 print:py-0.5 print:px-1 bg-stone-100/70 border-t border-stone-300 print:border-black text-[9px] print:text-[7.5px] text-stone-600 font-sans italic text-center">
                      Slujbele celor 7 Laude bisericești și Sfânta Liturghie
                    </div>
                  </div>

                  {/* DREPTUNGHIUL 2: DOAR ZILELE ÎN CARE SE PREDICĂ ȘI CINE O FACE */}
                  <div className="border-2 border-stone-900 bg-white flex flex-col justify-between shadow-xs print:border-[1.5px] print:shadow-none">
                    <div>
                      <div 
                        className="text-white print-inv-text px-2.5 py-1 print:py-0.5 print:px-1.5 text-xs print:text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-b-2 border-stone-900"
                        style={{ backgroundColor: printInkMode === 'laser_bw' ? '#000000' : '#b45309' }}
                      >
                        <div className="flex items-center space-x-1.5">
                          <Scroll className="w-3.5 h-3.5 text-amber-200" />
                          <span className={fontThemeClasses[fontTheme].header}>CINE PREDICĂ PE ZILE</span>
                        </div>
                        <span className="text-[9px] print:text-[7.5px] font-sans font-normal opacity-90 lowercase bg-white/20 text-white px-1.5 py-0.2 rounded">amvon</span>
                      </div>

                      <div className="p-2 print:p-1 space-y-1.5 print:space-y-0.5">
                        <div className={`text-[10px] print:text-[8px] font-black uppercase tracking-wider p-1 print:p-0.5 border text-center rounded-xs ${
                          printInkMode === 'laser_bw' ? 'bg-stone-100 border-stone-800 text-stone-950' : 'bg-amber-50 border-amber-200 text-amber-950'
                        }`}>
                          Doar zilele cu predică la Liturghie
                        </div>

                        {/* 1. DUMINICĂ */}
                        {weekLiturgicalDays.filter(d => d.isSunday).map(d => {
                          const assign = predicaModule ? getAssignment(d.dateStr, predicaModule.id, predicaModule.roles[0]?.id, 0) : null;
                          const name = getPersonName(assign?.personId);
                          const fallbackName = getPersonName(altarPreotAssignment?.personId);
                          return (
                            <div key={d.dateStr} className={`p-2 print:p-1 rounded-xs space-y-0.5 ${
                              printInkMode === 'laser_bw' ? 'bg-stone-50 border-2 border-stone-900 print:border-black' : 'bg-red-50/70 border-2 border-red-300'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10.5px] print:text-[8px] font-black uppercase tracking-wider flex items-center space-x-1 ${
                                  printInkMode === 'laser_bw' ? 'text-black' : 'text-red-900'
                                }`}>
                                  <span className="text-red-600 text-xs print:text-[10px]">✝</span>
                                  <span>Duminică (Sf. Liturghie):</span>
                                </span>
                                <span className="text-[9.5px] print:text-[7.5px] font-bold text-stone-800 font-mono">{d.dateFormatted}</span>
                              </div>
                              <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug text-sm sm:text-base print:text-[11.5px] print:leading-tight`}>
                                {name !== '—' ? name : `${fallbackName} (Preot de rând)`}
                              </div>
                              <div className="text-[9px] print:text-[7px] text-stone-600 italic">
                                Preotul de rând predică duminica la Sfânta Liturghie
                              </div>
                            </div>
                          );
                        })}

                        {/* 2. SÂMBĂTĂ */}
                        {weekLiturgicalDays.filter(d => d.isSaturday).map(d => {
                          const assign = predicaModule ? getAssignment(d.dateStr, predicaModule.id, predicaModule.roles[0]?.id, 0) : null;
                          const name = getPersonName(assign?.personId);
                          const iliescu = persons.find(p => p.id === 'p_iliescu');
                          return (
                            <div key={d.dateStr} className={`p-2 print:p-1 rounded-xs space-y-0.5 ${
                              printInkMode === 'laser_bw' ? 'bg-stone-50 border-2 border-stone-900 print:border-black' : 'bg-amber-50/60 border-2 border-amber-300'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10.5px] print:text-[8px] font-black uppercase tracking-wider ${
                                  printInkMode === 'laser_bw' ? 'text-black' : 'text-amber-950'
                                }`}>
                                  Sâmbătă:
                                </span>
                                <span className="text-[9.5px] print:text-[7.5px] font-bold text-stone-800 font-mono">{d.dateFormatted}</span>
                              </div>
                              <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug text-sm sm:text-base print:text-[11.5px] print:leading-tight`}>
                                {name !== '—' ? name : iliescu ? getPersonName(iliescu.id) : 'Pr. Iliescu / Diacon de rând'}
                              </div>
                              <div className="text-[9px] print:text-[7px] text-stone-600 italic">
                                2 sâmbete Pr. Iliescu, 2 sâmbete diacon prin rotație
                              </div>
                            </div>
                          );
                        })}

                        {/* 3. PRAZNICE ÎMPĂRĂTEȘTI / SĂRBĂTORI CU CRUCE ROȘIE ÎN CURSUL SĂPTĂMÂNII */}
                        {weekLiturgicalDays.filter(d => !d.isSunday && !d.isSaturday && d.litInfo.isRedCross).map(d => {
                          const assign = predicaModule ? getAssignment(d.dateStr, predicaModule.id, predicaModule.roles[0]?.id, 0) : null;
                          const name = getPersonName(assign?.personId);
                          return (
                            <div key={d.dateStr} className={`p-2 print:p-1 rounded-xs space-y-0.5 ${
                              printInkMode === 'laser_bw' ? 'bg-stone-50 border-2 border-stone-900 print:border-black' : 'bg-amber-50 border-2 border-amber-400'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10.5px] print:text-[8px] font-black uppercase tracking-wider flex items-center space-x-1 ${
                                  printInkMode === 'laser_bw' ? 'text-black' : 'text-red-900'
                                }`}>
                                  <span className="text-red-600 text-xs print:text-[10px]">✝</span>
                                  <span>Praznic ({d.dayShort} {format(d.day, 'd')}):</span>
                                </span>
                                <span className="text-[9.5px] print:text-[7.5px] font-bold text-stone-800 font-mono">{d.litInfo.feastTitle}</span>
                              </div>
                              <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug text-sm sm:text-base print:text-[11.5px] print:leading-tight`}>
                                {name !== '—' ? name : 'Pr. Mina / Pr. Sebastian / Preot de rând'}
                              </div>
                              <div className="text-[9px] print:text-[7px] text-stone-600 italic">
                                Predică de praznic la amvon prin rotație
                              </div>
                            </div>
                          );
                        })}

                        {/* Mențiune pentru celelalte zile din săptămână */}
                        <div className={`p-2 print:p-1 rounded-xs text-[9.5px] print:text-[7.5px] space-y-0.5 ${
                          printInkMode === 'laser_bw' ? 'bg-stone-50 border border-stone-800 print:border-black text-stone-950' : 'bg-stone-50 border border-stone-200 text-stone-700'
                        }`}>
                          <span className="font-bold text-stone-900 block uppercase tracking-wide">
                            Zilele de rând (Luni – Vineri):
                          </span>
                          <p className="leading-tight text-stone-600">
                            Fără sărbătoare mare <strong>nu se ține predică la amvon</strong>. Se citește Cazania / cateheză.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-1 print:py-0.5 print:px-1 bg-stone-100/70 border-t border-stone-300 print:border-black text-[9px] print:text-[7.5px] text-stone-600 font-sans italic text-center">
                      Cuvântul de învățătură se rostește după Sf. Evanghelie
                    </div>
                  </div>

                  {/* DREPTUNGHIUL 3: ZILELE DE STAT ÎN BISERICĂ ȘI CINE STĂ ÎMPĂRȚIT PE ZILELE DIN SĂPTĂMÂNĂ */}
                  <div className="border-2 border-stone-900 bg-white flex flex-col justify-between shadow-xs print:border-[1.5px] print:shadow-none">
                    <div>
                      <div 
                        className="text-white print-inv-text px-2.5 py-1 print:py-0.5 print:px-1.5 text-xs print:text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-b-2 border-stone-900"
                        style={{ backgroundColor: printInkMode === 'laser_bw' ? '#000000' : '#059669' }}
                      >
                        <div className="flex items-center space-x-1.5">
                          <Eye className="w-3.5 h-3.5 text-emerald-200" />
                          <span className={fontThemeClasses[fontTheme].header}>ÎN BISERICĂ PE ZILE</span>
                        </div>
                        <span className="text-[9px] print:text-[7.5px] font-sans font-normal opacity-90 lowercase bg-white/20 text-white px-1.5 py-0.2 rounded">pomelnice</span>
                      </div>

                      <div className="p-2 print:p-1 space-y-1 print:space-y-0.5">
                        <div className={`text-[10px] print:text-[8px] font-black uppercase tracking-wider p-1 print:p-0.5 border text-center rounded-xs flex items-center justify-center space-x-1.5 ${
                          printInkMode === 'laser_bw' ? 'bg-stone-100 border-stone-800 text-stone-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        }`}>
                          <Calendar className="w-3 h-3 text-emerald-700" />
                          <span>Primire Pomelnice & Pelerini (7 Zile)</span>
                        </div>

                        {weekLiturgicalDays.map(item => {
                          const assign = bisericaModule ? getAssignment(item.dateStr, bisericaModule.id, bisericaModule.roles[0]?.id, 0) : null;
                          const personName = getPersonName(assign?.personId);
                          const isWeekend = item.isSunday || item.isSaturday;

                          return (
                            <div
                              key={item.dateStr}
                              className={`flex items-center justify-between px-1.5 py-1 print:py-0.5 rounded-xs border text-xs print:text-[9.5px] ${
                                printInkMode === 'laser_bw'
                                  ? 'bg-white border-stone-800 print:border-black'
                                  : item.isSunday
                                  ? 'bg-red-50/80 border-red-300'
                                  : item.isSaturday
                                  ? 'bg-amber-50/60 border-amber-300'
                                  : 'bg-stone-50 border-stone-200'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5">
                                <span className={`w-10 print:w-8 text-[10.5px] print:text-[8px] font-black uppercase tracking-wider ${isWeekend ? 'text-amber-950 font-black' : 'text-stone-800'}`}>
                                  {item.dayShort}
                                </span>
                                <span className="text-[9.5px] print:text-[7.5px] text-stone-500 font-mono">
                                  {format(item.day, 'd MMM')}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className={`${fontSizes.name} ${weightClass} ${personName === '—' ? 'text-stone-400 italic' : printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} text-xs sm:text-sm print:text-[11px] print:leading-tight`}>
                                  {personName}
                                </span>
                                {assign?.notes && (
                                  <span className="text-[8px] print:text-[7px] text-stone-500 italic ml-1 block sm:inline">
                                    ({assign.notes})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="px-2 py-1 print:py-0.5 print:px-1 bg-stone-100/70 border-t border-stone-300 print:border-black text-[9px] print:text-[7.5px] text-stone-600 font-sans italic text-center">
                      Primirea pomelnicelor, pelerini & bună-cuviință
                    </div>
                  </div>

                  {/* DREPTUNGHIUL 4: ȘOFERUL DE RÂND */}
                  <div className="border-2 border-stone-900 bg-white flex flex-col justify-between shadow-xs print:border-[1.5px] print:shadow-none">
                    <div>
                      <div 
                        className="text-white print-inv-text px-2.5 py-1 print:py-0.5 print:px-1.5 text-xs print:text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-b-2 border-stone-900"
                        style={{ backgroundColor: printInkMode === 'laser_bw' ? '#000000' : '#1d4ed8' }}
                      >
                        <div className="flex items-center space-x-1.5">
                          <Car className="w-3.5 h-3.5 text-blue-200" />
                          <span className={fontThemeClasses[fontTheme].header}>ȘOFERUL DE RÂND</span>
                        </div>
                        <span className="text-[9px] print:text-[7.5px] font-sans font-normal opacity-90 lowercase bg-white/20 text-white px-1.5 py-0.2 rounded">săptămână</span>
                      </div>

                      <div className="p-2 print:p-1 space-y-1.5 print:space-y-0.5">
                        <div className={`text-[10px] print:text-[8px] font-black uppercase tracking-wider p-1 print:p-0.5 border text-center rounded-xs ${
                          printInkMode === 'laser_bw' ? 'bg-stone-100 border-stone-800 text-stone-950' : 'bg-blue-50 border-blue-200 text-blue-950'
                        }`}>
                          Transport Operativ & Auto (Toată Săpt.)
                        </div>

                        {/* Șofer de serviciu */}
                        <div className={`p-1.5 print:p-1 rounded-xs space-y-0.5 ${
                          printInkMode === 'laser_bw' ? 'bg-stone-50 border-2 border-stone-900 print:border-black' : 'bg-stone-50 border-2 border-blue-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] print:text-[8px] uppercase font-bold text-stone-800 tracking-wider">
                              Șofer de Serviciu:
                            </span>
                            <span className="text-[8.5px] print:text-[7.5px] text-blue-700 font-bold font-sans">Toată Săpt.</span>
                          </div>
                          <div className={`${fontSizes.name} ${weightClass} ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-950'} mt-0.5 leading-snug text-sm sm:text-base print:text-[11.5px] print:leading-tight`}>
                            {getPersonName(soferAssignment?.personId)}
                          </div>
                          {soferAssignment?.notes && (
                            <div className="text-[8.5px] print:text-[7px] text-stone-600 italic mt-0.5">{soferAssignment.notes}</div>
                          )}
                        </div>

                        {/* De gardă / Urgențe */}
                        <div className={`p-1.5 print:p-1 rounded-xs space-y-0.5 ${
                          printInkMode === 'laser_bw' ? 'bg-stone-50 border border-stone-800 print:border-black' : 'bg-blue-50/40 border border-blue-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] print:text-[8px] uppercase font-bold text-blue-950 tracking-wider">
                              De Gardă & Urgențe:
                            </span>
                            <span className="text-[8.5px] print:text-[7.5px] text-blue-800 font-sans font-bold">24h / 7</span>
                          </div>
                          <div className={`text-xs sm:text-sm print:text-[10.5px] font-bold mt-0.5 ${printInkMode === 'laser_bw' ? 'text-black' : 'text-stone-900'}`}>
                            Pr. Modest / Pr. Petru
                          </div>
                          <div className="text-[8px] print:text-[7px] text-stone-600 italic">Disponibili pentru urgențe și drumuri lungi</div>
                        </div>

                        {/* Domenii de deplasare */}
                        <div className={`p-1.5 print:p-1 rounded border space-y-0.5 text-[9px] print:text-[7.5px] ${
                          printInkMode === 'laser_bw' ? 'bg-stone-50 border-stone-800 print:border-black text-stone-950' : 'bg-stone-50 border border-stone-200 text-stone-700'
                        }`}>
                          <span className="font-bold text-stone-900 block uppercase tracking-wide">
                            Domenii de deplasare:
                          </span>
                          <ul className="space-y-0.5 list-disc list-inside text-stone-600 text-[8.5px] print:text-[7px]">
                            <li>Aprovizionare mănăstirească</li>
                            <li>Transport aeroport, gară, spitale</li>
                            <li>Pelerinaje și deplasări bisericești</li>
                          </ul>
                        </div>

                        {/* Notă canonică */}
                        <div className={`p-1 print:p-0.5 rounded-xs text-[8px] print:text-[7px] italic text-center font-semibold ${
                          printInkMode === 'laser_bw' ? 'bg-stone-100 border border-stone-800 print:border-black text-stone-950' : 'bg-amber-50/60 border border-amber-200 text-amber-950'
                        }`}>
                          Plecarea din mănăstire se face exclusiv cu binecuvântarea Pr. Stareț.
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-1 print:py-0.5 print:px-1 bg-stone-100/70 border-t border-stone-300 print:border-black text-[9px] print:text-[7.5px] text-stone-600 font-sans italic text-center">
                      Responsabil parc auto & deplasări monahale
                    </div>
                  </div>

                </div>

                {/* ROW 2: ALTE ASCULTĂRI (NUMAI DACĂ ESTE ACTIVAT EXPLICIT ÎN OPȚIUNI) */}
                {showOtherModules && otherModules.length > 0 && (
                  <div className="border-2 border-stone-900 bg-white p-2 shadow-xs mt-2">
                    <div className="font-bold text-xs uppercase tracking-wider text-stone-900 pb-1 border-b border-stone-300 flex items-center space-x-1.5">
                      <span className="text-amber-700">❖</span>
                      <span className={fontThemeClasses[fontTheme].header}>ALTE ASCULTĂRI MĂNĂSTIREȘTI</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1.5">
                      {otherModules.map(mod => {
                        const assignment = getWeeklyAssignment(mod.id, mod.roles[0]?.id, 0);
                        return (
                          <div key={mod.id} className="bg-stone-50 border border-stone-300 p-1.5 rounded-xs flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-stone-700 block">
                                {mod.name}:
                              </span>
                              <span className="text-[9px] text-stone-500">{mod.roles[0]?.name || 'Responsabil'}</span>
                            </div>
                            <div className={`${fontSizes.name} ${weightClass} text-stone-950 font-bold`}>
                              {getPersonName(assignment?.personId)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

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
                                const personName = getPersonName(assignment?.personId);

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
          <div className="mt-2 print:mt-1">
            {/* ANNOUNCEMENTS / TIPIC FOOTER */}
            {showAnnouncements && customAnnouncement && (
              <div className="p-2 print:p-1 border border-stone-900 bg-stone-50 font-sans text-xs rounded-xs print:mt-0.5">
                <span className={`${fontThemeClasses[fontTheme].header} font-bold text-stone-950 block mb-0.5 tracking-wider text-[10px] print:text-[8px]`}>
                  ❖ RÂNDUIELI & ÎNDATORIRI SPECIALE PENTRU ACEASTĂ SĂPTĂMÂNĂ:
                </span>
                <p className="text-stone-900 leading-tight italic text-[11px] print:text-[8.5px]">
                  {customAnnouncement}
                </p>
              </div>
            )}

            {/* ORNAMENTAL BYZANTINE DIVIDER BEFORE SIGNATURES */}
            {showSignatures && (
              <div className="my-1.5 print:my-0.5">
                <ByzantineDivider color={activeOrnamentColor} />
              </div>
            )}

            {/* SIGNATURES BLOCK */}
            {showSignatures && (
              <div className="pt-1.5 print:pt-0.5 flex items-center justify-between font-sans text-xs text-stone-950 px-8 sm:px-16 print:px-8">
                <div className="text-center min-w-[130px] print:min-w-[100px]">
                  <p className={`${fontThemeClasses[fontTheme].header} font-bold tracking-wider text-stone-600 text-[10px] print:text-[8px]`}>
                    Din încredințarea
                  </p>
                  <p className={`${fontThemeClasses[fontTheme].header} font-black text-xs sm:text-sm print:text-[10px] text-stone-900`}>
                    Pr. Stareț,
                  </p>
                  <div className="h-5 print:h-2 flex items-center justify-center">
                    <span className="text-[9px] print:text-[7.5px] text-stone-400 italic">(Semnătura)</span>
                  </div>
                  <p className={`font-bold text-xs sm:text-sm print:text-[10.5px] ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-900'} ${weightClass}`}>{settings.abbotName}</p>
                </div>

                <div className="text-center opacity-60 px-4">
                  <div className="w-11 h-11 print:w-7 print:h-7 rounded-full border-2 border-dashed border-stone-500 print:border-black flex items-center justify-center mx-auto text-[8px] print:text-[6px] uppercase tracking-widest text-stone-700 print:text-black font-cinzel">
                    Pecetea
                  </div>
                </div>

                <div className="text-center min-w-[130px] print:min-w-[100px]">
                  <p className={`${fontThemeClasses[fontTheme].header} font-bold tracking-wider text-stone-600 text-[10px] print:text-[8px]`}>
                    Întocmit,
                  </p>
                  <p className={`${fontThemeClasses[fontTheme].header} font-black text-xs sm:text-sm print:text-[10px] text-stone-900`}>
                    Pr. Eclesiarh,
                  </p>
                  <div className="h-5 print:h-2 flex items-center justify-center">
                    <span className="text-[9px] print:text-[7.5px] text-stone-400 italic">(Semnătura)</span>
                  </div>
                  <p className={`font-bold text-xs sm:text-sm print:text-[10.5px] ${printInkMode === 'laser_bw' ? 'text-black font-black' : 'text-stone-900'} ${weightClass}`}>{settings.ecclesiarchName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


