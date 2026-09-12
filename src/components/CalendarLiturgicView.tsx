import React, { useState } from 'react';
import type { ScheduleAssignment, Person, Module } from '../types';
import { getDayLiturgicalInfo } from '../services/orthodoxCalendar';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ExternalLink,
  Flame
} from 'lucide-react';
import { ByzantineCross, ByzantineDivider } from './Ornament';

interface CalendarLiturgicViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  persons: Person[];
  modules: Module[];
  schedule: ScheduleAssignment[];
  onNavigateToWeek: (date: Date) => void;
}

export const CalendarLiturgicView: React.FC<CalendarLiturgicViewProps> = ({
  currentDate,
  setCurrentDate,
  persons,
  modules,
  schedule,
  onNavigateToWeek,
}) => {
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(currentDate);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedLitInfo = getDayLiturgicalInfo(selectedDayDate);
  const selectedDateStr = format(selectedDayDate, 'yyyy-MM-dd');
  const selectedAssignments = schedule.filter(a => a.date === selectedDateStr);

  const getPersonName = (personId: string | null | undefined) => {
    if (!personId) return 'Neatribuit';
    const p = persons.find(x => x.id === personId);
    return p ? p.name : 'Necunoscut';
  };

  const getModuleName = (moduleId: string) => {
    const m = modules.find(x => x.id === moduleId);
    return m ? m.name : moduleId;
  };

  const getRoleName = (moduleId: string, roleId: string) => {
    const m = modules.find(x => x.id === moduleId);
    const r = m?.roles.find(x => x.id === roleId);
    return r ? r.name : roleId;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="apple-card p-4 sm:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b1d24] to-[#551015] flex items-center justify-center text-amber-300 shadow-[0_4px_16px_rgba(139,29,36,0.3)]">
            <ByzantineCross className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-cinzel font-bold text-white tracking-wide">
              Calendar Bisericesc Liturgic
            </h1>
            <p className="text-xs sm:text-sm text-white/50">
              Rânduieli, praznice împărătești, sărbători cu cruce roșie ✝ și ascultări
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center space-x-2 bg-white/[0.06] p-1.5 rounded-full border border-white/10">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 font-cinzel font-semibold text-sm sm:text-base text-amber-200 capitalize tracking-wider min-w-[140px] text-center">
            {format(currentDate, 'LLLL yyyy', { locale: ro })}
          </div>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors font-medium border border-amber-500/30"
          >
            Azi
          </button>
        </div>
      </div>

      {/* Main Grid & Day Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Calendar Matrix */}
        <div className="lg:col-span-2 apple-card p-4 sm:p-6 rounded-3xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
            {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((d, i) => (
              <div 
                key={d} 
                className={`text-[11px] font-semibold uppercase tracking-wider py-1.5 ${
                  i === 5 ? 'text-amber-300/80' : i === 6 ? 'text-rose-400 font-bold' : 'text-white/50'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const litInfo = getDayLiturgicalInfo(day);
              const inMonth = isSameMonth(day, currentDate);
              const isTodayDay = isToday(day);
              const isSelected = format(selectedDayDate, 'yyyy-MM-dd') === dateStr;
              const dayAssignments = schedule.filter(a => a.date === dateStr && a.personId);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayDate(day)}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative overflow-hidden group ${
                    isSelected
                      ? 'ring-2 ring-amber-400/80 bg-white/[0.14] border-amber-400/40 shadow-[0_4px_20px_rgba(245,214,116,0.15)]'
                      : inMonth
                      ? litInfo.isRedCross
                        ? 'bg-rose-950/20 border-rose-500/30 hover:bg-rose-950/30'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]'
                      : 'bg-black/20 border-white/[0.02] opacity-35'
                  }`}
                >
                  {/* Top Bar: Date number + Cross */}
                  <div className="flex items-start justify-between">
                    <span 
                      className={`text-xs sm:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        isTodayDay
                          ? 'bg-amber-400 text-black font-bold shadow-sm'
                          : litInfo.isRedCross
                          ? 'text-rose-400 font-bold'
                          : 'text-white/90'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {litInfo.isRedCross && (
                      <span className="text-rose-500 font-bold text-sm leading-none" title={litInfo.feastTitle}>
                        ✝
                      </span>
                    )}
                  </div>

                  {/* Feast Snippet */}
                  {litInfo.feastTitle && (
                    <div className="my-1">
                      <p 
                        className={`text-[10px] sm:text-[11px] leading-tight font-medium line-clamp-2 ${
                          litInfo.isRedCross 
                            ? 'text-rose-300 font-semibold' 
                            : litInfo.isSaturday
                            ? 'text-amber-300/80'
                            : 'text-white/60'
                        }`}
                      >
                        {litInfo.feastTitle}
                      </p>
                    </div>
                  )}

                  {/* Liturgical Duties Count / Avatars */}
                  <div className="mt-auto flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/[0.05]">
                    {dayAssignments.length > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/[0.08] text-white/70 font-mono text-[9px]">
                        {dayAssignments.length} slujitori
                      </span>
                    ) : (
                      <span className="text-[9px] italic opacity-40">-</span>
                    )}

                    {litInfo.fasting && (
                      <span className="text-[9px] text-amber-400/80 flex items-center space-x-0.5">
                        <Flame className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Liturgical & Duties Card */}
        <div className="apple-card p-6 rounded-3xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header of selected day */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-semibold text-amber-400/90 tracking-widest">
                  {format(selectedDayDate, 'EEEE', { locale: ro })}
                </span>
                <h2 className="text-2xl font-cinzel font-bold text-white tracking-wide mt-0.5">
                  {format(selectedDayDate, 'd MMMM yyyy', { locale: ro })}
                </h2>
              </div>

              {selectedLitInfo.isRedCross && (
                <div className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-1.5">
                  <span>✝</span>
                  <span>Cruce Roșie</span>
                </div>
              )}
            </div>

            <ByzantineDivider className="my-2" />

            {/* Liturgical Rank and Title */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Pomenirea Zilei</span>
              </div>
              <p className="text-sm font-semibold text-amber-100 font-cinzel leading-relaxed">
                {selectedLitInfo.feastTitle}
              </p>
              {selectedLitInfo.fasting && (
                <div className="mt-2 text-xs text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-flex items-center space-x-1">
                  <Flame className="w-3 h-3" />
                  <span>Rânduială: {selectedLitInfo.fasting}</span>
                </div>
              )}
            </div>

            {/* Scheduled Assignments on this Day */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                Slujitori Rânduiți ({selectedAssignments.length})
              </h3>

              {selectedAssignments.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/40 italic">
                  Nu există slujitori programați încă pentru această zi. Puteți genera graficul automat.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 apple-scrollbar">
                  {selectedAssignments.map(a => {
                    const person = persons.find(p => p.id === a.personId);
                    return (
                      <div 
                        key={a.id}
                        className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: person?.colorTag || '#b45309' }}
                          />
                          <div>
                            <p className="text-xs font-semibold text-white tracking-tight">
                              {getPersonName(a.personId)}
                            </p>
                            <p className="text-[11px] text-white/50">
                              {getModuleName(a.moduleId)} • {getRoleName(a.moduleId, a.roleId)}
                            </p>
                          </div>
                        </div>

                        {a.notes && (
                          <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 max-w-[120px] truncate" title={a.notes}>
                            {a.notes}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action to Jump to Weekly Grid */}
          <button
            onClick={() => onNavigateToWeek(selectedDayDate)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/30 text-amber-200 font-semibold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <span>Deschide Graficul Săptămânii</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
