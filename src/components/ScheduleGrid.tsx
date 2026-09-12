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
  Info 
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
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
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
      {/* Week Navigator & Actions Toolbar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 shadow-md backdrop-blur-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Date Selector Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Săptămâna anterioară"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-amber-300 uppercase tracking-wider transition-colors"
          >
            Astăzi
          </button>

          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-100 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-500 inline-block" />
              <span>{weekRangeTitle}</span>
            </h2>
            <p className="text-xs text-stone-400">
              Rândul slujbelor și ascultărilor monahale
            </p>
          </div>

          <button
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Săptămâna viitoare"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={handleAutoGenerate}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Generează Grafic</span>
          </button>

          <button
            onClick={onNavigateToPrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-sm font-medium transition-colors"
            title="Format de tipărit A4 pentru avizier"
          >
            <Printer className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Tipărește</span>
          </button>

          <button
            onClick={handleClearWeek}
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-red-950/60 hover:text-red-400 text-stone-400 transition-colors"
            title="Curăță programările din această săptămână"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generation Alerts / Notes */}
      {generationAlerts && (
        <div className={`p-4 rounded-xl border text-sm transition-all ${
          generationAlerts.length > 0 
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' 
            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 font-semibold">
              {generationAlerts.length > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Grafic generat cu {generationAlerts.length} ajustări / înlocuiri:</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Grafic generat cu succes! Toate ascultările au fost acoperite fără conflicte.</span>
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
            <ul className="mt-2 pl-7 list-disc space-y-1 text-xs text-amber-300/90 max-h-36 overflow-y-auto">
              {generationAlerts.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* The Schedule Matrix */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[850px]">
            {/* Table Header: Days of the week */}
            <thead>
              <tr className="bg-stone-950/80 border-b border-stone-800 text-stone-300">
                <th className="p-3 text-left font-serif font-bold text-sm w-48 text-stone-400">
                  Ascultare / Modul
                </th>
                {weekDays.map(day => {
                  const dayIsToday = isToday(day);
                  const isSunday = day.getDay() === 0;
                  return (
                    <th
                      key={day.toISOString()}
                      className={`p-2.5 text-center border-l border-stone-800/60 ${
                        dayIsToday ? 'bg-amber-950/30' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-xs uppercase tracking-wider font-semibold ${
                          isSunday ? 'text-red-400' : 'text-stone-400'
                        }`}>
                          {format(day, 'EEEE', { locale: ro })}
                        </span>
                        <span className={`text-base font-bold mt-0.5 ${
                          dayIsToday ? 'text-amber-400 underline underline-offset-4' : 'text-stone-200'
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
            <tbody className="divide-y divide-stone-800/70">
              {modules.map(module => (
                <React.Fragment key={module.id}>
                  {/* Module Header Bar Row */}
                  <tr className="bg-stone-950/40">
                    <td colSpan={8} className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span 
                            className="w-7 h-7 rounded-md flex items-center justify-center shadow-inner"
                            style={{ backgroundColor: `${module.color}25`, color: module.color }}
                          >
                            {renderModuleIcon(module.iconName, { className: 'w-4 h-4' })}
                          </span>
                          <span className="font-serif font-bold text-stone-200 tracking-wide">
                            {module.name}
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                            {module.rotationCycle === 'weekly' ? 'Rotație Săptămânală' : 'Rotație Zilnică'}
                          </span>
                        </div>
                        {module.description && (
                          <span className="text-xs text-stone-500 hidden md:inline">
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
                          <td className="p-3 text-xs text-stone-300 font-medium pl-6 border-r border-stone-800/60 bg-stone-900/40">
                            <div className="flex flex-col">
                              <span>{role.name}</span>
                              {role.requiredCount > 1 && (
                                <span className="text-[10px] text-stone-500">Post #{slotIdx + 1}</span>
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
                                className={`p-1.5 border-l border-stone-800/60 align-top cursor-pointer group transition-colors ${
                                  isCurrentDay ? 'bg-amber-950/10' : ''
                                } hover:bg-stone-800/50`}
                              >
                                {person ? (
                                  <div 
                                    className="p-2 rounded-lg border text-left relative overflow-hidden transition-all group-hover:border-amber-500/50 group-hover:shadow-md"
                                    style={{
                                      backgroundColor: `${person.colorTag}15`,
                                      borderColor: `${person.colorTag}40`,
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span 
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: person.colorTag }}
                                      />
                                      {assignment?.status === 'substituted' && (
                                        <span 
                                          title="Înlocuitor automat"
                                          className="text-[10px] px-1 py-0.2 bg-violet-950 text-violet-300 rounded border border-violet-700 flex items-center space-x-0.5"
                                        >
                                          <Repeat className="w-2.5 h-2.5" />
                                          <span>Înlocuit</span>
                                        </span>
                                      )}
                                      {doubleBooked && (
                                        <span 
                                          title="Atenție: dublă ascultare în această zi!"
                                          className="text-[10px] p-0.5 bg-rose-950 text-rose-300 rounded"
                                        >
                                          <AlertCircle className="w-3 h-3" />
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-1">
                                      <p className="text-xs font-semibold text-stone-100 truncate">
                                        {person.name}
                                      </p>
                                      <p className="text-[10px] text-stone-400 truncate">
                                        {person.rank}
                                      </p>
                                    </div>

                                    {assignment?.notes && (
                                      <p className="text-[10px] text-amber-300/80 mt-1 truncate flex items-center space-x-0.5">
                                        <Info className="w-2.5 h-2.5 flex-shrink-0" />
                                        <span>{assignment.notes}</span>
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-14 rounded-lg border border-dashed border-stone-800/80 flex flex-col items-center justify-center text-stone-500 group-hover:border-stone-600 group-hover:text-stone-300 transition-colors">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-[10px] mt-0.5">Liber</span>
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
