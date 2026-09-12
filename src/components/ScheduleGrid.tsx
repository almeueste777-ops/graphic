import React, { useState } from 'react';
import type { Person, Module, ScheduleAssignment, Absence, SubstitutionRule, MonasterySettings } from '../types';
import { generateSchedule } from '../services/scheduler';
import { EditEntryModal } from './EditEntryModal';
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
  Calendar, 
  Sparkles, 
  Trash2, 
  Printer, 
  AlertCircle, 
  Plus, 
  Repeat, 
  Info,
  CheckCircle2
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
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    module: Module;
    role: Module['roles'][0];
    slotIndex: number;
    assignment?: ScheduleAssignment;
  } | null>(null);

  const [generationAlerts, setGenerationAlerts] = useState<string[] | null>(null);

  // Week calculation (Monday to Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: settings.weekStartDay ?? 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: settings.weekStartDay ?? 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekRangeTitle = `${format(weekStart, 'd MMMM', { locale: ro })} – ${format(weekEnd, 'd MMMM yyyy', { locale: ro })}`;

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
    <div className="space-y-6">
      {/* Week Navigator & Actions Toolbar with Glassmorphism */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Date Selector Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-white transition-all shadow-sm"
            title="Săptămâna anterioară"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-xs font-bold text-amber-300 uppercase tracking-widest transition-all shadow-xs"
          >
            Astăzi
          </button>

          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-cinzel font-bold tracking-wide text-amber-100 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-400 inline-block" />
              <span>{weekRangeTitle}</span>
            </h2>
            <p className="text-xs text-stone-400 font-sans mt-0.5">
              Rânduiala liturgică și a ascultărilor obștii
            </p>
          </div>

          <button
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-white transition-all shadow-sm"
            title="Săptămâna viitoare"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleAutoGenerate}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.5)] transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-stone-950 text-stone-950" />
            <span>Generează Grafic</span>
          </button>

          <button
            onClick={onNavigateToPrint}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-rose-500/40 text-stone-200 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm"
            title="Format de tipărit A4 pentru avizier"
          >
            <Printer className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Tipărește A4</span>
          </button>

          <button
            onClick={handleClearWeek}
            className="p-2.5 rounded-xl bg-stone-900/60 hover:bg-rose-950/60 border border-stone-800/80 hover:border-rose-800/50 hover:text-rose-300 text-stone-400 transition-colors"
            title="Curăță programările din această săptămână"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generation Alerts / Success Banner */}
      {generationAlerts && (
        <div className={`p-4 rounded-2xl border backdrop-blur-md text-sm transition-all shadow-lg ${
          generationAlerts.length > 0 
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5 font-semibold">
              {generationAlerts.length > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Grafic generat cu {generationAlerts.length} ajustări / înlocuiri:</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Grafic completat cu succes! Toate ascultările au fost rânduite echitabil.</span>
                </>
              )}
            </div>
            <button
              onClick={() => setGenerationAlerts(null)}
              className="text-stone-400 hover:text-white text-xs underline ml-4"
            >
              Închide
            </button>
          </div>
          {generationAlerts.length > 0 && (
            <ul className="mt-2.5 pl-7 list-disc space-y-1 text-xs text-amber-300/90 max-h-36 overflow-y-auto">
              {generationAlerts.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* The Schedule Matrix */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[850px]">
            {/* Table Header: Days of the week */}
            <thead>
              <tr className="bg-black/60 border-b border-stone-800/80 text-stone-300">
                <th className="p-3.5 text-left font-cinzel font-bold text-xs uppercase tracking-wider w-48 text-stone-400">
                  Ascultare / Post
                </th>
                {weekDays.map(day => {
                  const dayIsToday = isToday(day);
                  const isSunday = day.getDay() === 0;
                  return (
                    <th
                      key={day.toISOString()}
                      className={`p-3 text-center border-l border-stone-800/60 transition-colors ${
                        dayIsToday ? 'bg-amber-950/25 border-t-2 border-t-amber-400' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-[11px] uppercase tracking-wider font-semibold ${
                          isSunday ? 'text-red-400 font-bold' : 'text-stone-400'
                        }`}>
                          {format(day, 'EEEE', { locale: ro })}
                        </span>
                        <span className={`text-sm font-cinzel font-extrabold mt-0.5 ${
                          dayIsToday ? 'gold-text-gradient drop-shadow-sm' : 'text-stone-200'
                        }`}>
                          {format(day, 'd MMM', { locale: ro })}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: Modules and Roles */}
            <tbody className="divide-y divide-stone-800/60">
              {modules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-400">
                    <p className="text-base font-cinzel">Nu există nicio ascultare definită.</p>
                    <p className="text-xs text-stone-500 mt-1">Mergeți în secțiunea „Ascultări” pentru a crea modulele dorite.</p>
                  </td>
                </tr>
              ) : (
                modules.map(module => (
                  <React.Fragment key={module.id}>
                    {/* Module Subheader Row */}
                    <tr className="bg-gradient-to-r from-stone-950/90 via-stone-900/60 to-stone-950/90">
                      <td colSpan={8} className="px-4 py-2 border-y border-stone-800/60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span 
                              className="w-7 h-7 rounded-lg flex items-center justify-center shadow-inner"
                              style={{ 
                                backgroundColor: `${module.color}25`, 
                                color: module.color,
                                boxShadow: `0 0 10px ${module.color}30`
                              }}
                            >
                              {renderModuleIcon(module.iconName, { className: 'w-4 h-4' })}
                            </span>
                            <span className="font-cinzel font-bold text-stone-100 text-sm tracking-wider">
                              {module.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-stone-800/80 text-stone-300 border border-stone-700/80">
                              {module.rotationCycle === 'weekly' ? 'Săptămână de rând' : 'Rotație zilnică'}
                            </span>
                          </div>
                          {module.description && (
                            <span className="text-[11px] text-stone-400 italic hidden md:inline">
                              {module.description}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Roles for this module */}
                    {module.roles.map(role => (
                      <React.Fragment key={role.id}>
                        {Array.from({ length: role.requiredCount }).map((_, slotIdx) => (
                          <tr key={`${role.id}_${slotIdx}`} className="hover:bg-stone-800/20 transition-colors">
                            {/* Role label column */}
                            <td className="p-3 text-xs text-stone-300 font-medium pl-6 border-r border-stone-800/60 bg-stone-950/30">
                              <div className="flex flex-col">
                                <span className="font-semibold text-stone-200">{role.name}</span>
                                {role.requiredCount > 1 && (
                                  <span className="text-[10px] text-stone-500 font-mono">Post #{slotIdx + 1}</span>
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
                                  className={`p-1.5 border-l border-stone-800/60 align-top cursor-pointer group transition-all ${
                                    isCurrentDay ? 'bg-amber-950/15' : ''
                                  } hover:bg-stone-800/40`}
                                >
                                  {person ? (
                                    <div 
                                      className="p-2.5 rounded-xl border text-left relative overflow-hidden transition-all duration-200 group-hover:scale-[1.02] shadow-sm"
                                      style={{
                                        backgroundColor: `${person.colorTag}18`,
                                        borderColor: `${person.colorTag}45`,
                                        boxShadow: `0 4px 14px ${person.colorTag}15`
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span 
                                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                          style={{ 
                                            backgroundColor: person.colorTag,
                                            boxShadow: `0 0 6px ${person.colorTag}`
                                          }}
                                        />
                                        {assignment?.status === 'substituted' && (
                                          <span 
                                            title="Înlocuitor desemnat"
                                            className="text-[9px] font-bold px-1.5 py-0.5 bg-violet-950 text-violet-300 rounded border border-violet-700/80 flex items-center space-x-0.5"
                                          >
                                            <Repeat className="w-2.5 h-2.5" />
                                            <span>Înlocuit</span>
                                          </span>
                                        )}
                                        {doubleBooked && (
                                          <span 
                                            title="Atenție: dublă ascultare în această zi!"
                                            className="text-[9px] p-0.5 bg-rose-950 text-rose-300 rounded animate-pulse"
                                          >
                                            <AlertCircle className="w-3.5 h-3.5" />
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs font-bold text-stone-100 truncate tracking-tight">
                                        {person.name}
                                      </p>
                                      <p className="text-[10px] text-stone-400 truncate mt-0.5">
                                        {person.rank}
                                      </p>

                                      {assignment?.notes && (
                                        <p className="text-[10px] text-amber-300/90 mt-1 truncate flex items-center space-x-1">
                                          <Info className="w-2.5 h-2.5 flex-shrink-0 text-amber-400" />
                                          <span>{assignment.notes}</span>
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-16 rounded-xl border border-dashed border-stone-800/80 flex flex-col items-center justify-center text-stone-500 group-hover:border-amber-500/40 group-hover:text-amber-300 transition-colors bg-stone-950/20">
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
    </div>
  );
};
