import React, { useState } from 'react';
import type { Person, Module, ScheduleAssignment, Absence, SubstitutionRule, MonasterySettings } from '../types';
import { generateSchedule, getMonasticWeekIndex, getCommunityWeeklyDuties } from '../services/scheduler';
import { getDayLiturgicalInfo } from '../services/orthodoxCalendar';
import { EditEntryModal } from './EditEntryModal';
import { QuickAbsenceModal } from './QuickAbsenceModal';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks, 
  eachDayOfInterval, 
  isToday 
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Trash2, 
  Printer, 
  AlertCircle, 
  Plus, 
  Repeat, 
  Info,
  CheckCircle2,
  UserMinus,
  X,
  Layers
} from 'lucide-react';
import { renderModuleIcon } from '../utils/iconHelper';

interface ScheduleGridProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  persons: Person[];
  modules: Module[];
  absences: Absence[];
  rules: SubstitutionRule[];
  schedule: ScheduleAssignment[];
  setSchedule: (updater: ScheduleAssignment[] | ((prev: ScheduleAssignment[]) => ScheduleAssignment[])) => void;
  settings: MonasterySettings;
  onNavigateToPrint: () => void;
  addAbsence?: (absence: Omit<Absence, 'id'>) => Absence;
  deleteAbsence?: (id: string) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  currentDate,
  setCurrentDate,
  persons,
  modules,
  absences,
  rules,
  schedule,
  setSchedule,
  settings,
  onNavigateToPrint,
  addAbsence,
  deleteAbsence,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    module: Module;
    role: Module['roles'][0];
    slotIndex: number;
    assignment?: ScheduleAssignment;
  } | null>(null);

  const [isQuickAbsenceOpen, setIsQuickAbsenceOpen] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [generationAlerts, setGenerationAlerts] = useState<string[] | null>(null);

  // Week calculation (defaults to Saturday = 6 monastic typikon)
  const weekStartsOn = settings.weekStartDay ?? 6;
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 4-Week Monastic Rotation State
  const monasticWeekIndex = getMonasticWeekIndex(weekStart);
  const communityDuties = getCommunityWeeklyDuties(weekStart, persons);

  const weekRangeTitle = `${format(weekStart, 'd MMMM', { locale: ro })} – ${format(weekEnd, 'd MMMM yyyy', { locale: ro })}`;
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // Active absences during this viewed week
  const activeWeekAbsences = absences.filter(a => {
    return a.startDate <= weekEndStr && a.endDate >= weekStartStr;
  });

  // Find assignment helper
  const getAssignment = (dateStr: string, moduleId: string, roleId: string, slotIndex: number) => {
    return schedule.find(
      a => a.date === dateStr && a.moduleId === moduleId && a.roleId === roleId && a.slotIndex === slotIndex
    );
  };

  // Get person helper
  const getPerson = (personId: string | null | undefined) => {
    if (!personId) return null;
    return persons.find(p => p.id === personId);
  };

  // Check double bookings on same day
  const isDoubleBooked = (dateStr: string, personId: string) => {
    const dayAssignments = schedule.filter(a => a.date === dateStr && a.personId === personId);
    return dayAssignments.length > 1;
  };

  // Trigger automatic generation
  const handleAutoGenerate = () => {
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
    if (result.warnings.length > 0) {
      setGenerationAlerts(result.warnings);
    } else {
      setGenerationAlerts([]);
    }
  };

  // Quick absence handler: adds absence and recalculates schedule immediately
  const handleQuickAbsenceAndRecalculate = (newAbsenceData: Omit<Absence, 'id'>) => {
    let createdAbsence: Absence;
    if (addAbsence) {
      createdAbsence = addAbsence(newAbsenceData);
    } else {
      createdAbsence = {
        ...newAbsenceData,
        id: `abs_${Date.now()}`,
      };
    }
    const updatedAbsences = [...absences, createdAbsence];

    const result = generateSchedule({
      startDate: weekStart,
      endDate: weekEnd,
      persons,
      modules,
      absences: updatedAbsences,
      substitutionRules: rules,
      existingAssignments: schedule,
      avoidDoubleBooking: settings.autoAvoidDoubleBooking,
    });

    setSchedule(result.assignments);
    const personObj = persons.find(p => p.id === newAbsenceData.personId);
    setGenerationAlerts([
      `Învoire înregistrată: ${personObj?.name || 'Părintele'} este plecat (${newAbsenceData.startDate} – ${newAbsenceData.endDate}). Programul a fost recalculat cu înlocuitori!`,
      ...result.warnings,
    ]);
  };

  // Cancel/remove absence and recalculate week
  const handleRemoveAbsence = (absenceId: string) => {
    if (deleteAbsence) {
      deleteAbsence(absenceId);
    }
    const updatedAbsences = absences.filter(a => a.id !== absenceId);
    const result = generateSchedule({
      startDate: weekStart,
      endDate: weekEnd,
      persons,
      modules,
      absences: updatedAbsences,
      substitutionRules: rules,
      existingAssignments: schedule,
      avoidDoubleBooking: settings.autoAvoidDoubleBooking,
    });
    setSchedule(result.assignments);
    setGenerationAlerts([
      'Învoirea a fost ștearsă. Programul a fost recalculat.',
      ...result.warnings,
    ]);
  };

  // Clear current week
  const handleClearWeek = () => {
    if (window.confirm('Sigur doriți să ștergeți toate programările pentru această săptămână?')) {
      const weekDates = weekDays.map(d => format(d, 'yyyy-MM-dd'));
      setSchedule(prev => prev.filter(a => !weekDates.includes(a.date)));
      setGenerationAlerts(null);
    }
  };

  // Save edit slot
  const handleSaveSlot = (newPersonId: string | null, notes?: string) => {
    if (!selectedSlot) return;
    const { date, module, role, slotIndex, assignment } = selectedSlot;

    setSchedule(prev => {
      const filtered = prev.filter(
        a => !(a.date === date && a.moduleId === module.id && a.roleId === role.id && a.slotIndex === slotIndex)
      );

      if (newPersonId === null && !notes) {
        return filtered;
      }

      const updated: ScheduleAssignment = {
        id: assignment ? assignment.id : `${date}_${module.id}_${role.id}_${slotIndex}`,
        date,
        moduleId: module.id,
        roleId: role.id,
        slotIndex,
        personId: newPersonId,
        status: 'manual',
        notes,
      };

      return [...filtered, updated];
    });

    setSelectedSlot(null);
  };

  return (
    <div className="space-y-5">
      {/* Apple-style Calendar Header Toolbar */}
      <div className="apple-glass rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
        
        {/* Date Scrubber */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center p-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              title="Săptămâna anterioară"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 rounded-full text-xs font-semibold text-amber-300/90 hover:text-amber-200 hover:bg-white/10 active:scale-95 transition-all"
            >
              Astăzi
            </button>

            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              title="Săptămâna viitoare"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-amber-400/90" />
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white capitalize">
                {weekRangeTitle}
              </h2>
            </div>
            <p className="text-[11px] text-white/40 font-sans mt-0.5">
              Rânduiala liturgică și graficul săptămânal de rând
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-y-2">
          <button
            onClick={() => setIsQuickAbsenceOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-semibold shadow-sm active:scale-95 transition-all"
            title="Înregistrează părinte plecat (X zile) și recalculează"
          >
            <UserMinus className="w-3.5 h-3.5 text-amber-400" />
            <span>Părinte Plecat (X zile)</span>
          </button>

          <button
            onClick={handleAutoGenerate}
            className="apple-gold-button flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
            <span>Generează Automat</span>
          </button>

          <button
            onClick={onNavigateToPrint}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] text-white text-xs font-medium active:scale-95 transition-all"
            title="Afișaj Avizier A4"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Tipărește</span>
          </button>

          <button
            onClick={handleClearWeek}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-300 text-white/40 border border-white/[0.08] flex items-center justify-center active:scale-95 transition-all"
            title="Curăță săptămâna"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4-Week Monastic Rotation Banner */}
      <div className="apple-glass rounded-3xl p-4 sm:p-5 border border-white/[0.08] shadow-xl bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-stone-900/90">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Rânduiala Canonică a Obștei pe 4 Săptămâni
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Săptămâna {monasticWeekIndex} din 4
                </span>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">
                Canonul mănăstiresc: 1 săpt. Altar, 1 săpt. Strană, 1 săpt. Ascultări, 1 săpt. Liberă pe lună
              </p>
            </div>
          </div>

          {/* Quick Duty Summary Cards for the 4 Hieromonks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
            {/* Altar */}
            <div className="px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-amber-400/90 tracking-wider">
                Altar (Preot de rând)
              </span>
              <span className="text-xs font-semibold text-white mt-0.5 truncate">
                {persons.find(p => p.id === communityDuties.find(d => d.category === 'altar' && ['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'].includes(d.personId))?.personId)?.name || 'Nespecificat'}
              </span>
            </div>

            {/* Strană */}
            <div className="px-3 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-sky-400/90 tracking-wider">
                La Strană
              </span>
              <span className="text-xs font-semibold text-white mt-0.5 truncate">
                {persons.find(p => p.id === communityDuties.find(d => d.category === 'strana' && ['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'].includes(d.personId))?.personId)?.name || 'Nespecificat'}
              </span>
            </div>

            {/* Ascultări */}
            <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-emerald-400/90 tracking-wider">
                Ascultări / Biserică
              </span>
              <span className="text-xs font-semibold text-white mt-0.5 truncate">
                {persons.find(p => p.id === communityDuties.find(d => d.category === 'ascultari' && ['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'].includes(d.personId))?.personId)?.name || 'Nespecificat'}
              </span>
            </div>

            {/* Liber */}
            <div className="px-3 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-purple-400/90 tracking-wider">
                Săpt. Liberă
              </span>
              <span className="text-xs font-semibold text-white mt-0.5 truncate">
                {persons.find(p => p.id === communityDuties.find(d => d.category === 'liber' && ['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'].includes(d.personId))?.personId)?.name || 'Nespecificat'}
              </span>
            </div>
          </div>

          {/* Detail Button */}
          <button
            onClick={() => setIsMonthlyModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 hover:text-white text-xs font-medium transition-all active:scale-95 flex-shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Detalii Rotație</span>
          </button>
        </div>
      </div>

      {/* Active Absences in Current Week */}
      {activeWeekAbsences.length > 0 && (
        <div className="apple-glass rounded-2xl p-3 sm:p-4 border border-amber-500/25 bg-amber-950/20 shadow-lg animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Părinți plecați în această săptămână ({activeWeekAbsences.length}):
              </span>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {activeWeekAbsences.map(abs => {
                const person = persons.find(p => p.id === abs.personId);
                return (
                  <div 
                    key={abs.id} 
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-stone-900/80 border border-amber-500/30 text-xs text-white shadow-sm"
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: person?.colorTag || '#d97706' }} 
                    />
                    <span className="font-semibold text-amber-200">
                      {person?.name || 'Părinte'}
                    </span>
                    <span className="text-[10px] text-white/50">
                      ({abs.startDate.slice(5)} – {abs.endDate.slice(5)})
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {abs.reason}
                    </span>
                    {deleteAbsence && (
                      <button
                        onClick={() => handleRemoveAbsence(abs.id)}
                        className="w-4 h-4 rounded-full hover:bg-rose-500/20 text-white/40 hover:text-rose-300 flex items-center justify-center transition-all ml-1"
                        title="Șterge învoirea și re-integrează în program"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Generation Alerts (Apple Toast / Banner style) */}
      {generationAlerts && (
        <div className={`p-4 rounded-3xl backdrop-blur-2xl border transition-all duration-300 text-xs shadow-xl ${
          generationAlerts.length > 0 
            ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' 
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 font-medium">
              {generationAlerts.length > 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Grafic completat cu {generationAlerts.length} ajustări de rotație / substituție:</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Grafic generat fără conflicte! Toate ascultările au fost rânduite armonios.</span>
                </>
              )}
            </div>
            <button
              onClick={() => setGenerationAlerts(null)}
              className="text-white/40 hover:text-white text-[11px] underline ml-4"
            >
              Închide
            </button>
          </div>
          {generationAlerts.length > 0 && (
            <ul className="mt-2 pl-6 list-disc space-y-0.5 text-[11px] text-amber-200/80 max-h-32 overflow-y-auto">
              {generationAlerts.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* The Grid Table (Apple Health / Calendar Matrix) */}
      <div className="apple-glass rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[860px]">
            {/* Table Header: Days of the week */}
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.06] text-white/70">
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider w-44 text-white/40">
                  Ascultare
                </th>
                {weekDays.map(day => {
                  const dayIsToday = isToday(day);
                  const isSunday = day.getDay() === 0;
                  const isSaturday = day.getDay() === 6;
                  const litInfo = getDayLiturgicalInfo(day);

                  return (
                    <th
                      key={day.toISOString()}
                      className={`p-2.5 text-center border-l border-white/[0.04] transition-colors min-w-[125px] ${
                        dayIsToday ? 'bg-white/[0.03]' : litInfo.isRedCross ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            litInfo.isRedCross ? 'text-rose-400 font-extrabold' : isSunday ? 'text-rose-400' : isSaturday ? 'text-amber-300' : 'text-white/40'
                          }`}>
                            {format(day, 'EEE', { locale: ro })}
                          </span>
                          {isSaturday && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-semibold border border-amber-500/30">
                              Rând
                            </span>
                          )}
                        </div>
                        
                        {/* Apple Date Badge Circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${
                          dayIsToday 
                            ? 'bg-amber-400 text-black font-extrabold shadow-[0_0_12px_rgba(251,191,36,0.6)]' 
                            : litInfo.isRedCross
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                            : isSunday 
                            ? 'text-rose-400 hover:bg-white/[0.06]' 
                            : 'text-white hover:bg-white/[0.06]'
                        }`}>
                          {format(day, 'd', { locale: ro })}
                        </div>

                        {/* Liturgical Feast Badge */}
                        {litInfo.isRedCross && (
                          <div 
                            className="mt-1 px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[9px] font-semibold max-w-[115px] truncate flex items-center space-x-1 cursor-default"
                            title={litInfo.feastTitle}
                          >
                            <span className="text-rose-400 font-black">✝</span>
                            <span className="truncate">{litInfo.feastTitle}</span>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: Modules & Roles */}
            <tbody className="divide-y divide-white/[0.05]">
              {modules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-white/40">
                    <p className="text-sm font-medium">Nu este definită nicio ascultare.</p>
                    <p className="text-xs text-white/30 mt-1">Accesați secțiunea „Ascultări” pentru a adăuga modulele comunității.</p>
                  </td>
                </tr>
              ) : (
                modules.map(module => (
                  <React.Fragment key={module.id}>
                    {/* Module Subheader */}
                    <tr className="bg-white/[0.02]">
                      <td colSpan={8} className="px-4 py-2.5 border-y border-white/[0.06]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span 
                              className="w-7 h-7 rounded-[9px] flex items-center justify-center shadow-xs"
                              style={{ 
                                backgroundColor: `${module.color}25`, 
                                color: module.color,
                                border: `1px solid ${module.color}40`
                              }}
                            >
                              {renderModuleIcon(module.iconName, { className: 'w-4 h-4' })}
                            </span>
                            <span className="font-semibold text-white text-xs sm:text-sm tracking-tight">
                              {module.name}
                            </span>
                            <span className="text-[10px] font-medium tracking-tight px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 border border-white/[0.05]">
                              {module.rotationCycle === 'weekly' ? 'Săptămânal' : 'Zilnic'}
                            </span>
                          </div>
                          {module.description && (
                            <span className="text-[11px] text-white/40 hidden md:inline truncate max-w-md">
                              {module.description}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Roles rows */}
                    {module.roles.map(role => (
                      <React.Fragment key={role.id}>
                        {Array.from({ length: role.requiredCount }).map((_, slotIdx) => (
                          <tr key={`${role.id}_${slotIdx}`} className="hover:bg-white/[0.015] transition-colors">
                            {/* Role label column */}
                            <td className="p-3 text-xs text-white/70 font-medium pl-6 border-r border-white/[0.04] bg-white/[0.01]">
                              <div className="flex flex-col">
                                <span className="text-white/80 font-medium">{role.name}</span>
                                {role.requiredCount > 1 && (
                                  <span className="text-[10px] text-white/35 font-mono">Post #{slotIdx + 1}</span>
                                )}
                              </div>
                            </td>

                            {/* 7 Days columns */}
                            {weekDays.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const assignment = getAssignment(dateStr, module.id, role.id, slotIdx);
                              const person = getPerson(assignment?.personId);
                              const doubleBooked = person ? isDoubleBooked(dateStr, person.id) : false;
                              const isCurrentDay = isToday(day);

                              return (
                                <td
                                  key={dateStr}
                                  onClick={() =>
                                    setSelectedSlot({
                                      date: dateStr,
                                      module,
                                      role,
                                      slotIndex: slotIdx,
                                      assignment,
                                    })
                                  }
                                  className={`p-1.5 border-l border-white/[0.04] align-top cursor-pointer group transition-all duration-200 ${
                                    isCurrentDay ? 'bg-white/[0.015]' : ''
                                  }`}
                                >
                                  {person ? (
                                    <div 
                                      className="apple-card p-2.5 rounded-2xl text-left relative overflow-hidden transition-all duration-200 group-hover:scale-[1.02] group-active:scale-[0.98]"
                                      style={{
                                        borderLeft: `3px solid ${person.colorTag}`,
                                        background: `linear-gradient(135deg, ${person.colorTag}15 0%, rgba(24,24,27,0.7) 100%)`
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center space-x-1.5">
                                          <span 
                                            className="w-2 h-2 rounded-full flex-shrink-0 shadow-xs"
                                            style={{ backgroundColor: person.colorTag }}
                                          />
                                          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                                            {person.rank}
                                          </span>
                                        </div>

                                        {assignment?.status === 'substituted' && (
                                          <span 
                                            title="Înlocuitor automat"
                                            className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center space-x-0.5"
                                          >
                                            <Repeat className="w-2.5 h-2.5" />
                                            <span>Subst</span>
                                          </span>
                                        )}
                                        {doubleBooked && (
                                          <span 
                                            title="Atenție: are două ascultări în aceeași zi!"
                                            className="text-[9px] p-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                                          >
                                            <AlertCircle className="w-3 h-3" />
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs font-semibold text-white truncate tracking-tight">
                                        {person.name}
                                      </p>

                                      {assignment?.notes && (
                                        <p className="text-[10px] text-amber-300/80 mt-1 truncate flex items-center space-x-1">
                                          <Info className="w-2.5 h-2.5 flex-shrink-0" />
                                          <span>{assignment.notes}</span>
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-16 rounded-2xl border border-dashed border-white/[0.08] hover:border-amber-400/40 hover:bg-white/[0.03] flex flex-col items-center justify-center text-white/30 hover:text-amber-300 transition-all duration-200">
                                      <Plus className="w-3.5 h-3.5" />
                                      <span className="text-[10px] mt-0.5 font-medium">Liber</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Entry Modal */}
      {selectedSlot && (
        <EditEntryModal
          date={selectedSlot.date}
          module={selectedSlot.module}
          role={selectedSlot.role}
          slotIndex={selectedSlot.slotIndex}
          currentAssignment={selectedSlot.assignment}
          persons={persons}
          absences={absences}
          allDayAssignments={schedule.filter(a => a.date === selectedSlot.date)}
          onSave={handleSaveSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* Quick Absence Modal (Pr. e plecat X zile) */}
      <QuickAbsenceModal
        isOpen={isQuickAbsenceOpen}
        onClose={() => setIsQuickAbsenceOpen(false)}
        persons={persons}
        defaultDate={weekStart}
        onAddAbsenceAndRecalculate={handleQuickAbsenceAndRecalculate}
      />

      {/* 4-Week Canonic Monastic Rotation Modal */}
      {isMonthlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="apple-glass rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-white/[0.12] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Close Button */}
            <button
              onClick={() => setIsMonthlyModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Rânduiala Lunară a Obștei — Ciclul Canonic pe 4 Săptămâni
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Mănăstirea Bogdănești • Fiecare ieromonah are garantat: 1 săpt. Altar, 1 săpt. Strană, 1 săpt. Ascultări, 1 săpt. Liberă pe lună
                </p>
              </div>
            </div>

            {/* 4-Week Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/20 my-5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.05] border-b border-white/[0.08] text-white/50 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3.5">Săptămâna</th>
                    <th className="p-3.5 text-amber-300">🟡 Altar (Preot de rând)</th>
                    <th className="p-3.5 text-sky-300">🔵 Strană (Tipic / Cântare)</th>
                    <th className="p-3.5 text-emerald-300">🟢 În Biserică / Ascultări</th>
                    <th className="p-3.5 text-purple-300">🟣 Săpt. Liberă (Chilie / Odihnă)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {[
                    {
                      week: 1,
                      altar: 'Pr. Pantelimon',
                      strana: 'Pr. Avacum',
                      ascultari: 'Pr. Sebastian',
                      liber: 'Pr. Mina',
                    },
                    {
                      week: 2,
                      altar: 'Pr. Avacum',
                      strana: 'Pr. Mina',
                      ascultari: 'Pr. Pantelimon',
                      liber: 'Pr. Sebastian',
                    },
                    {
                      week: 3,
                      altar: 'Pr. Sebastian',
                      strana: 'Pr. Pantelimon',
                      ascultari: 'Pr. Mina',
                      liber: 'Pr. Avacum',
                    },
                    {
                      week: 4,
                      altar: 'Pr. Mina',
                      strana: 'Pr. Sebastian',
                      ascultari: 'Pr. Avacum',
                      liber: 'Pr. Pantelimon',
                    },
                  ].map(row => {
                    const isCurrentWeek = row.week === monasticWeekIndex;
                    return (
                      <tr
                        key={row.week}
                        className={`transition-colors ${
                          isCurrentWeek 
                            ? 'bg-amber-500/10 border-l-4 border-amber-400 font-semibold' 
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="p-3.5 flex items-center space-x-2">
                          <span className="text-white font-bold">Săptămâna {row.week}</span>
                          {isCurrentWeek && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/30 text-amber-300 font-bold uppercase tracking-wider border border-amber-500/40">
                              Curentă
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-amber-200 font-medium">{row.altar}</td>
                        <td className="p-3.5 text-sky-200 font-medium">{row.strana}</td>
                        <td className="p-3.5 text-emerald-200 font-medium">{row.ascultari}</td>
                        <td className="p-3.5 text-purple-200 font-medium">{row.liber}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Roles and Responsibilities Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <h4 className="font-semibold text-amber-300 flex items-center space-x-2">
                  <span>Rânduiala Slujitorilor și Conducerii</span>
                </h4>
                <ul className="space-y-1.5 text-white/70 text-[11px] leading-relaxed">
                  <li>
                    <strong className="text-white">Protos. Pamvo Dima (Starețul):</strong> Binecuvântare (<i>Din încredințarea Pr. Stareț</i>), Liturghii arhierești și mari Praznice.
                  </li>
                  <li>
                    <strong className="text-white">Ierom. Pantelimon (Eclesiarh):</strong> Întocmește graficul săptămânal (<i>Întocmit Pr. Eclesiarh</i>) și slujește conform rotației.
                  </li>
                  <li>
                    <strong className="text-white">Protos. Mina (Econom):</strong> Răspunde de gospodărie și slujește conform rotației lunare.
                  </li>
                  <li>
                    <strong className="text-white">Pr. Iliescu (Weekend Protos):</strong> Protos sâmbăta, proscomidie, predică 2 sâmbete/lună și stat în biserică.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <h4 className="font-semibold text-sky-300 flex items-center space-x-2">
                  <span>Strană, Diaconie & Ascultări</span>
                </h4>
                <ul className="space-y-1.5 text-white/70 text-[11px] leading-relaxed">
                  <li>
                    <strong className="text-white">Strana Permanentă:</strong> Pr. Grichentie (Strana 1) & Fr. Ioan (Ajutor permanent Strană / cititor).
                  </li>
                  <li>
                    <strong className="text-white">Diaconi:</strong> Pr. Ciprian, Pr. Modest (Secretar & Șofer), Pr. Petru (Șofer). Predică alternativ în 2 sâmbete și la sărbători de sfinți.
                  </li>
                  <li>
                    <strong className="text-white">Paracliserie & Șoferie:</strong> Fr. Arghir, Pr. Spiridon, Pr. Damaschin.
                  </li>
                  <li>
                    <strong className="text-white">În Biserică (Zilnic):</strong> S: Pr. Iliescu, D: Pr. Pantelimon, L: Pr. Avacum, M: Pr. Ciprian, M: Pr. Avacum, J: Pr. Ciprian, V: Fr. Arghir.
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsMonthlyModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-white text-xs font-semibold transition-all"
              >
                Închide fereastra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
