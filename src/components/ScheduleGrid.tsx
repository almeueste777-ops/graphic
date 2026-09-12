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
  Calendar as CalendarIcon, 
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
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
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
                  return (
                    <th
                      key={day.toISOString()}
                      className={`p-3 text-center border-l border-white/[0.04] transition-colors ${
                        dayIsToday ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${
                          isSunday ? 'text-rose-400' : 'text-white/40'
                        }`}>
                          {format(day, 'EEE', { locale: ro })}
                        </span>
                        
                        {/* Apple Date Badge Circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          dayIsToday 
                            ? 'bg-amber-400 text-black font-extrabold shadow-[0_0_12px_rgba(251,191,36,0.6)]' 
                            : isSunday 
                            ? 'text-rose-400 hover:bg-white/[0.06]' 
                            : 'text-white hover:bg-white/[0.06]'
                        }`}>
                          {format(day, 'd', { locale: ro })}
                        </div>
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
    </div>
  );
};
