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
  Cross,
  FileText
} from 'lucide-react';

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
  const [customAnnouncement, setCustomAnnouncement] = useState(
    'Toți părinții și frații sunt rugați să fie prezenți la rânduiala Ceasurilor și la Sfânta Liturghie conform tipicului. Pentru orice schimb de tură, anunțați din timp pe Eclesiarh.'
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekRangeFormatted = `${format(weekStart, 'd MMMM', { locale: ro })} – ${format(weekEnd, 'd MMMM yyyy', { locale: ro })}`;

  const getPersonName = (personId: string | null | undefined) => {
    if (!personId) return '—';
    const person = persons.find(p => p.id === personId);
    if (!person) return '—';
    return `${person.rank} ${person.name.replace(/Părintele|Fratele|Ierom\.|Arhim\./g, '').trim()}`;
  };

  const getAssignment = (dateStr: string, moduleId: string, roleId: string, slotIndex: number) => {
    return schedule.find(
      a => a.date === dateStr && a.moduleId === moduleId && a.roleId === roleId && a.slotIndex === slotIndex
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print bg-stone-900 border border-stone-800 rounded-xl p-4 shadow flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToGrid}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Înapoi la Grafic</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-amber-200 font-medium px-2">
              {weekRangeFormatted}
            </span>
            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Tipărește Foaia (A4 / PDF)</span>
          </button>
        </div>
      </div>

      {/* Editable Announcement for the board (Hidden when printing) */}
      <div className="no-print bg-stone-900/70 border border-stone-800 rounded-xl p-4 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-stone-300 font-semibold">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Mențiuni și rânduieli particulare pentru panoul de afișaj:</span>
        </div>
        <textarea
          rows={2}
          value={customAnnouncement}
          onChange={e => setCustomAnnouncement(e.target.value)}
          className="w-full p-2.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 focus:outline-none focus:border-amber-500"
          placeholder="Scrieți aici orice anunț sau tipic special pentru această săptămână..."
        />
      </div>

      {/* Printable Sheet Area (Standardized for A4 landscape / portrait print) */}
      <div className="bg-white text-black p-6 sm:p-8 rounded-xl shadow-2xl border border-stone-300 font-serif print:p-0 print:border-none print:shadow-none print:rounded-none">
        {/* Monastery Header */}
        <div className="text-center pb-4 border-b-2 border-stone-900">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Cross className="w-6 h-6 text-red-900" />
            <span className="text-sm font-bold uppercase tracking-widest text-stone-800">
              {settings.monasteryName.toUpperCase()}
            </span>
            <Cross className="w-6 h-6 text-red-900" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-stone-900">
            Graficul Slujbelor și al Ascultărilor
          </h1>
          <p className="text-xs sm:text-sm font-sans italic text-stone-700 mt-0.5">
            Săptămâna: <strong>{weekRangeFormatted}</strong>
          </p>
        </div>

        {/* Schedule Matrix Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse border-2 border-stone-900 text-xs">
            <thead>
              <tr className="bg-stone-100 border-b-2 border-stone-900 text-stone-900">
                <th className="border border-stone-800 p-2 text-left font-bold uppercase tracking-wider w-40">
                  Ascultare / Post
                </th>
                {weekDays.map(day => {
                  const isSunday = day.getDay() === 0;
                  return (
                    <th
                      key={day.toISOString()}
                      className={`border border-stone-800 p-1.5 text-center font-bold uppercase ${
                        isSunday ? 'bg-red-50 text-red-900' : ''
                      }`}
                    >
                      <div className="font-sans text-[11px]">{format(day, 'EEEE', { locale: ro })}</div>
                      <div className="text-xs font-serif font-bold">{format(day, 'd MMM', { locale: ro })}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {modules.map(module => (
                <React.Fragment key={module.id}>
                  {/* Module Subheader */}
                  <tr className="bg-stone-200 border-t-2 border-stone-900 font-sans font-bold">
                    <td
                      colSpan={8}
                      className="border border-stone-800 px-3 py-1 text-stone-900 tracking-wider text-[11px] uppercase"
                    >
                      {module.name} ({module.rotationCycle === 'weekly' ? 'Rând pe săptămână' : 'Rând pe zile'})
                    </td>
                  </tr>

                  {/* Module Roles */}
                  {module.roles.map(role => (
                    <React.Fragment key={role.id}>
                      {Array.from({ length: role.requiredCount }).map((_, slotIdx) => (
                        <tr key={`${role.id}_${slotIdx}`} className="border-b border-stone-400">
                          <td className="border border-stone-800 p-1.5 font-medium text-stone-800 bg-stone-50 font-sans text-[11px]">
                            {role.name}
                            {role.requiredCount > 1 && (
                              <span className="text-[10px] text-stone-500 ml-1">#{slotIdx + 1}</span>
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
                                className={`border border-stone-800 p-1.5 text-center align-middle ${
                                  isSunday ? 'bg-red-50/40' : ''
                                }`}
                              >
                                <span className={`font-semibold ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950 font-serif'}`}>
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
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custom Announcements Footer */}
        {customAnnouncement && (
          <div className="mt-4 p-3 border border-stone-800 bg-stone-50 rounded-sm font-sans text-xs">
            <span className="font-bold text-stone-900 block mb-0.5">RÂNDUIELI & ÎNDATORIRI SPECIALE:</span>
            <p className="text-stone-800 leading-relaxed italic">{customAnnouncement}</p>
          </div>
        )}

        {/* Signatures Block */}
        <div className="mt-8 pt-4 flex items-center justify-between font-sans text-xs text-stone-900 px-6">
          <div className="text-center">
            <p className="font-semibold uppercase tracking-wider text-stone-600">Binecuvântează,</p>
            <p className="font-serif font-bold text-sm mt-1">Stareț,</p>
            <p className="mt-4 font-semibold">{settings.abbotName}</p>
          </div>

          <div className="text-center">
            <p className="font-semibold uppercase tracking-wider text-stone-600">Întocmit,</p>
            <p className="font-serif font-bold text-sm mt-1">Eclesiarh,</p>
            <p className="mt-4 font-semibold">{settings.ecclesiarchName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
