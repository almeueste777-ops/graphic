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
  Maximize2
} from 'lucide-react';
import { ByzantineCross } from './Ornament';

type PrintLayoutMode = 'split' | 'matrix' | 'cards';
type PrintFontSizeMode = 'compact' | 'normal' | 'large';

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
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>('split');
  const [fontSizeMode, setFontSizeMode] = useState<PrintFontSizeMode>('large');
  const [mergeWeeklyInMatrix, setMergeWeeklyInMatrix] = useState<boolean>(true);
  const [showAnnouncements, setShowAnnouncements] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showOrnamentalBorder, setShowOrnamentalBorder] = useState<boolean>(true);

  const [customAnnouncement, setCustomAnnouncement] = useState(
    'Toți părinții și frații sunt rugați să fie prezenți la rânduiala Ceasurilor și a Sfintei Liturghii conform tipicului. Pentru orice schimb de tură binecuvântat, anunțați din timp pe Eclesiarh.'
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: settings.weekStartDay ?? 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: settings.weekStartDay ?? 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekRangeFormatted = `${format(weekStart, 'd MMMM', { locale: ro })} – ${format(weekEnd, 'd MMMM yyyy', { locale: ro })}`;

  const getPersonName = (personId: string | null | undefined, fullForm: boolean = false) => {
    if (!personId) return '—';
    const person = persons.find(p => p.id === personId);
    if (!person) return '—';
    const cleanName = person.name.replace(/^(Părintele|Fratele|Maica|Sora|Ierom\.|Arhim\.)\s*/gi, '').trim();
    if (fullForm) {
      return `${person.rank} ${cleanName}`;
    }
    return `${person.rank} ${cleanName}`;
  };

  const getAssignment = (dateStr: string, moduleId: string, roleId: string, slotIndex: number) => {
    return schedule.find(
      a => a.date === dateStr && a.moduleId === moduleId && a.roleId === roleId && a.slotIndex === slotIndex
    );
  };

  // Group modules into weekly and daily
  const weeklyModules = modules.filter(m => m.rotationCycle === 'weekly');
  const dailyModules = modules.filter(m => m.rotationCycle === 'daily');

  // Font sizing styles
  const fontStyles = {
    compact: {
      name: 'text-[11px] sm:text-xs font-bold',
      role: 'text-[10px] font-semibold',
      cell: 'p-1 text-[10px]',
      title: 'text-sm font-bold',
      header: 'text-xs',
    },
    normal: {
      name: 'text-xs sm:text-sm font-bold',
      role: 'text-[11px] font-semibold',
      cell: 'p-1.5 text-xs',
      title: 'text-base font-bold',
      header: 'text-sm',
    },
    large: {
      name: 'text-sm sm:text-base font-bold',
      role: 'text-xs font-semibold',
      cell: 'p-2 text-sm',
      title: 'text-lg font-bold',
      header: 'text-base',
    },
  }[fontSizeMode];

  return (
    <div className="space-y-6">
      {/* ================= APPLE PRINT CONTROLS TOOLBAR (HIDDEN WHEN PRINTING) ================= */}
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
              title="Afișare aerisită: Ascultări săptămânale într-o coloană cu font mare + Ascultări zilnice în matrice"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Sinteză Monahală</span>
              <span className="text-[10px] px-1 rounded bg-amber-400/20 text-amber-300 ml-1">Recomandat</span>
            </button>

            <button
              onClick={() => setLayoutMode('matrix')}
              className={`apple-segmented-item flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                layoutMode === 'matrix' ? 'active' : 'text-white/60 hover:text-white'
              }`}
              title="Tabel tradițional complet pe 7 zile"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matrice 7 Zile</span>
            </button>

            <button
              onClick={() => setLayoutMode('cards')}
              className={`apple-segmented-item flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                layoutMode === 'cards' ? 'active' : 'text-white/60 hover:text-white'
              }`}
              title="7 coloane calendaristice zilnice"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tablou pe Zile</span>
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="apple-gold-button flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md w-full lg:w-auto"
          >
            <Printer className="w-4 h-4 text-stone-950" />
            <span>Tipărește A4 / Salvează PDF</span>
          </button>
        </div>

        {/* Sub-toolbar: Font Size & Toggles */}
        <div className="apple-glass rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border border-white/10">
          {/* Font Size Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-white/50 font-semibold text-[11px] uppercase tracking-wider flex items-center space-x-1">
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>Mărime Litere:</span>
            </span>
            <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px]">
              <button
                onClick={() => setFontSizeMode('compact')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  fontSizeMode === 'compact' ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setFontSizeMode('normal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  fontSizeMode === 'normal' ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setFontSizeMode('large')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  fontSizeMode === 'large' ? 'bg-amber-400/25 text-amber-300 font-bold shadow' : 'text-white/50 hover:text-white'
                }`}
              >
                Mare (Lizibilitate Max.)
              </button>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-wrap items-center gap-4 text-white/80 text-[11px]">
            {layoutMode === 'matrix' && (
              <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={mergeWeeklyInMatrix}
                  onChange={e => setMergeWeeklyInMatrix(e.target.checked)}
                  className="rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
                />
                <span>Unifică rândurile pe săptămână (Litere mari)</span>
              </label>
            )}

            <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showAnnouncements}
                onChange={e => setShowAnnouncements(e.target.checked)}
                className="rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
              />
              <span>Arată Rânduieli & Tipic</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={e => setShowSignatures(e.target.checked)}
                className="rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
              />
              <span>Arată Semnături (Stareț / Eclesiarh)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showOrnamentalBorder}
                onChange={e => setShowOrnamentalBorder(e.target.checked)}
                className="rounded bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
              />
              <span>Chenar Festiv</span>
            </label>
          </div>
        </div>

        {/* Editable Announcement for the board */}
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
      <div className="print-sheet-landscape bg-[#ffffff] text-[#0c0a09] p-4 sm:p-7 rounded-2xl shadow-2xl border border-stone-300 font-serif print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Outer and Inner Traditional Ecclesiastical Framing */}
        <div className={`p-4 relative ${
          showOrnamentalBorder 
            ? 'border-[3px] border-[#1f1915] outline outline-1 outline-[#78141c] outline-offset-[-5px]' 
            : 'border border-stone-800'
        }`}>
          
          {/* COMPACT & MAJESTIC MONASTERY HEADER */}
          <div className="flex items-center justify-between border-b-2 border-stone-900 pb-2.5">
            <div className="flex items-center space-x-2.5">
              <ByzantineCross className="w-6 h-6 text-[#78141c] flex-shrink-0" color="#78141c" />
              <div>
                <span className="font-cinzel text-[10px] font-black uppercase tracking-[0.25em] text-[#78141c] block leading-none">
                  Biserica Ortodoxă Română
                </span>
                <h1 className="font-cinzel font-black text-xl sm:text-2xl uppercase tracking-wider text-stone-950 leading-tight mt-0.5">
                  {settings.monasteryName}
                </h1>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-0.5 border border-stone-900 bg-stone-50">
                <h2 className="font-cinzel font-bold text-xs uppercase tracking-widest text-stone-900">
                  Graficul Slujbelor & Ascultărilor
                </h2>
              </div>
              <p className="font-sans text-xs text-stone-800 mt-0.5 font-medium">
                Săptămâna: <strong className="font-bold underline text-stone-950">{weekRangeFormatted}</strong>
              </p>
            </div>
          </div>

          {/* ================= LAYOUT 1: SINTEZĂ MONAHALĂ (SĂPTĂMÂNAL VS ZILNIC) ================= */}
          {layoutMode === 'split' && (
            <div className="mt-3 grid grid-cols-12 gap-3">
              {/* LEFT COLUMN: RÂNDUL PE TOATĂ SĂPTĂMÂNA (46% width) */}
              <div className="col-span-12 lg:col-span-6 print:col-span-6 flex flex-col space-y-2">
                <div className="bg-[#1f1915] text-amber-100 px-3 py-1.5 text-center font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2">
                  <span>❖</span>
                  <span>RÂNDUL PE TOATĂ SĂPTĂMÂNA</span>
                  <span>❖</span>
                </div>

                <div className="border-2 border-stone-900 divide-y-2 divide-stone-900 bg-stone-50/50 flex-1">
                  {weeklyModules.map(module => (
                    <div key={module.id} className="p-2 space-y-1">
                      {/* Module Sub-header */}
                      <div className="font-cinzel font-bold text-xs uppercase tracking-wide text-[#78141c] flex items-center space-x-1.5 pb-0.5 border-b border-stone-300">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: module.color }} />
                        <span>{module.name}</span>
                        <span className="font-sans text-[10px] text-stone-500 font-normal lowercase">(rând pe săptămână)</span>
                      </div>

                      {/* Module Roles */}
                      <div className="space-y-1.5 pt-1">
                        {module.roles.map(role => (
                          <div key={role.id} className="space-y-1">
                            {Array.from({ length: role.requiredCount }).map((_, slotIdx) => {
                              // Weekly assignment is uniform, take from Monday (or first assigned day)
                              const dateStr = format(weekDays[0], 'yyyy-MM-dd');
                              const assignment = getAssignment(dateStr, module.id, role.id, slotIdx);
                              const personName = getPersonName(assignment?.personId, true);

                              return (
                                <div
                                  key={slotIdx}
                                  className="flex items-baseline justify-between bg-white px-2.5 py-1.5 rounded border border-stone-300 shadow-xs"
                                >
                                  <div className="flex items-center space-x-1.5">
                                    <span className={`${fontStyles.role} text-stone-700 uppercase tracking-wide`}>
                                      {role.name}
                                      {role.requiredCount > 1 && (
                                        <span className="text-[10px] text-stone-500 font-mono ml-1">#{slotIdx + 1}</span>
                                      )}
                                      :
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <span className={`${fontStyles.name} ${personName === '—' ? 'text-stone-400 italic' : 'text-stone-950 font-serif'}`}>
                                      {personName}
                                    </span>
                                    {assignment?.notes && (
                                      <div className="text-[10px] text-stone-600 font-sans italic">
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

              {/* RIGHT COLUMN: RÂNDUL PE ZILE (54% width) */}
              <div className="col-span-12 lg:col-span-6 print:col-span-6 flex flex-col space-y-2">
                <div className="bg-[#78141c] text-white px-3 py-1.5 text-center font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2">
                  <span>❖</span>
                  <span>RÂNDUL PE ZILE (LUNI – DUMINICĂ)</span>
                  <span>❖</span>
                </div>

                {dailyModules.length > 0 ? (
                  <div className="border-2 border-stone-900 bg-white flex-1 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-200 border-b-2 border-stone-900 text-stone-900">
                          <th className="border border-stone-900 p-1.5 text-left font-cinzel font-bold uppercase text-[11px] w-28">
                            Ascultare
                          </th>
                          {weekDays.map(day => {
                            const isSunday = day.getDay() === 0;
                            return (
                              <th
                                key={day.toISOString()}
                                className={`border border-stone-900 p-1 text-center uppercase ${
                                  isSunday ? 'bg-red-100 text-red-950 font-black' : 'font-bold'
                                }`}
                              >
                                <div className="font-sans text-[10px]">{format(day, 'EEE', { locale: ro })}</div>
                                <div className="text-xs font-cinzel font-bold">{format(day, 'd MMM', { locale: ro })}</div>
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
                                className="border border-stone-900 px-2 py-0.5 text-stone-900 font-cinzel font-bold uppercase text-[10px]"
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
                                          className={`border border-stone-900 p-1.5 text-center align-middle ${
                                            isSunday ? 'bg-red-50/60' : ''
                                          }`}
                                        >
                                          <span className={`${fontStyles.name} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950 font-serif'}`}>
                                            {name}
                                          </span>
                                          {assignment?.notes && (
                                            <div className="text-[9px] text-stone-600 font-sans italic">
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
                    <th className="border border-stone-900 p-2 text-left font-cinzel font-bold uppercase tracking-wider w-40">
                      Ascultare / Post
                    </th>
                    {weekDays.map(day => {
                      const isSunday = day.getDay() === 0;
                      return (
                        <th
                          key={day.toISOString()}
                          className={`border border-stone-900 p-1.5 text-center font-bold uppercase ${
                            isSunday ? 'bg-red-100 text-red-950 font-black' : ''
                          }`}
                        >
                          <div className="font-sans text-[10px] tracking-wide">{format(day, 'EEEE', { locale: ro })}</div>
                          <div className="text-xs font-cinzel font-bold">{format(day, 'd MMM', { locale: ro })}</div>
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
                        <tr className="bg-stone-200 border-t-2 border-stone-900 font-sans font-bold">
                          <td
                            colSpan={8}
                            className="border border-stone-900 px-3 py-1 text-stone-900 tracking-wider text-[11px] font-cinzel font-bold uppercase"
                          >
                            {module.name} ({isWeekly ? 'Rând pe săptămână' : 'Rând pe zile'})
                          </td>
                        </tr>

                        {/* Module Roles */}
                        {module.roles.map(role => (
                          <React.Fragment key={role.id}>
                            {Array.from({ length: role.requiredCount }).map((_, slotIdx) => {
                              // If weekly and merged
                              if (isWeekly && mergeWeeklyInMatrix) {
                                const firstDayStr = format(weekDays[0], 'yyyy-MM-dd');
                                const assignment = getAssignment(firstDayStr, module.id, role.id, slotIdx);
                                const name = getPersonName(assignment?.personId, true);

                                return (
                                  <tr key={`${role.id}_${slotIdx}`} className="border-b border-stone-400">
                                    <td className="border border-stone-900 p-2 font-semibold text-stone-900 bg-stone-50 font-sans text-xs">
                                      {role.name}
                                      {role.requiredCount > 1 && (
                                        <span className="text-[10px] text-stone-600 font-mono ml-1">#{slotIdx + 1}</span>
                                      )}
                                    </td>
                                    <td
                                      colSpan={7}
                                      className="border border-stone-900 p-2.5 text-center align-middle bg-stone-50/50"
                                    >
                                      <span className={`${fontStyles.name} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950 font-serif'}`}>
                                        {name}
                                      </span>
                                      <span className="text-[10px] font-sans uppercase tracking-wider text-stone-500 ml-2 font-normal">
                                        (Toată Săptămâna)
                                      </span>
                                      {assignment?.notes && (
                                        <div className="text-[10px] text-stone-600 font-sans italic mt-0.5">
                                          {assignment.notes}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              }

                              // Standard 7-day row
                              return (
                                <tr key={`${role.id}_${slotIdx}`} className="border-b border-stone-400">
                                  <td className="border border-stone-900 p-1.5 font-semibold text-stone-900 bg-stone-50 font-sans text-[11px]">
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
                                        className={`border border-stone-900 ${fontStyles.cell} text-center align-middle ${
                                          isSunday ? 'bg-red-50/70' : ''
                                        }`}
                                      >
                                        <span className={`${fontStyles.name} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950 font-serif'}`}>
                                          {name}
                                        </span>
                                        {assignment?.notes && (
                                          <div className="text-[9px] text-stone-600 font-sans italic mt-0.5">
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
                const dateStr = format(day, 'yyyy-MM-dd');

                return (
                  <div
                    key={dateStr}
                    className={`border-2 flex flex-col ${
                      isSunday ? 'border-[#78141c] bg-red-50/20' : 'border-stone-900 bg-white'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div
                      className={`p-1.5 text-center border-b-2 ${
                        isSunday ? 'bg-[#78141c] text-white border-[#78141c]' : 'bg-stone-200 text-stone-900 border-stone-900'
                      }`}
                    >
                      <div className="font-sans text-[10px] font-bold uppercase tracking-wider">
                        {format(day, 'EEEE', { locale: ro })}
                      </div>
                      <div className="font-cinzel font-black text-xs">
                        {format(day, 'd MMM', { locale: ro })}
                      </div>
                    </div>

                    {/* Daily Duties List */}
                    <div className="p-1.5 space-y-1.5 flex-1 divide-y divide-stone-200">
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
                                    <span className={`${fontStyles.name} ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950 font-serif'} block leading-snug`}>
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

          {/* ================= ANNOUNCEMENTS / TIPIC FOOTER ================= */}
          {showAnnouncements && customAnnouncement && (
            <div className="mt-3 p-2.5 border border-stone-900 bg-stone-50/90 font-sans text-xs rounded-xs">
              <span className="font-cinzel font-bold text-stone-950 block mb-0.5 tracking-wider text-[10px]">
                ❖ RÂNDUIELI & ÎNDATORIRI SPECIALE PENTRU ACEASTĂ SĂPTĂMÂNĂ:
              </span>
              <p className="text-stone-900 leading-relaxed italic font-serif text-[11px] sm:text-xs">
                {customAnnouncement}
              </p>
            </div>
          )}

          {/* ================= SIGNATURES BLOCK ================= */}
          {showSignatures && (
            <div className="mt-4 pt-2.5 border-t border-stone-400 flex items-center justify-between font-sans text-xs text-stone-950 px-8">
              <div className="text-center">
                <p className="font-cinzel font-bold uppercase tracking-wider text-stone-600 text-[10px]">Binecuvântează,</p>
                <p className="font-cinzel font-black text-xs sm:text-sm">Stareț,</p>
                <div className="h-6 flex items-center justify-center">
                  <span className="text-[9px] text-stone-400 italic">(Semnătura)</span>
                </div>
                <p className="font-bold text-xs text-stone-900">{settings.abbotName}</p>
              </div>

              <div className="text-center opacity-40">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone-400 flex items-center justify-center mx-auto text-[8px] uppercase tracking-widest text-stone-500 font-cinzel">
                  Pecetea
                </div>
              </div>

              <div className="text-center">
                <p className="font-cinzel font-bold uppercase tracking-wider text-stone-600 text-[10px]">Întocmit,</p>
                <p className="font-cinzel font-black text-xs sm:text-sm">Eclesiarh,</p>
                <div className="h-6 flex items-center justify-center">
                  <span className="text-[9px] text-stone-400 italic">(Semnătura)</span>
                </div>
                <p className="font-bold text-xs text-stone-900">{settings.ecclesiarchName}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

