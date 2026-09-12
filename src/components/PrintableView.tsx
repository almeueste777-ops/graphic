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
  FileText
} from 'lucide-react';
import { ByzantineCross, EcclesiasticalDivider } from './Ornament';

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
    'Toți părinții și frații sunt rugați să fie prezenți la rânduiala Ceasurilor și a Sfintei Liturghii conform tipicului. Pentru orice schimb de tură binecuvântat, anunțați din timp pe Eclesiarh.'
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: settings.weekStartDay ?? 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: settings.weekStartDay ?? 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekRangeFormatted = `${format(weekStart, 'd MMMM', { locale: ro })} – ${format(weekEnd, 'd MMMM yyyy', { locale: ro })}`;

  const getPersonName = (personId: string | null | undefined) => {
    if (!personId) return '—';
    const person = persons.find(p => p.id === personId);
    if (!person) return '—';
    return `${person.rank} ${person.name.replace(/Părintele|Fratele|Maica|Sora|Ierom\.|Arhim\./g, '').trim()}`;
  };

  const getAssignment = (dateStr: string, moduleId: string, roleId: string, slotIndex: number) => {
    return schedule.find(
      a => a.date === dateStr && a.moduleId === moduleId && a.roleId === roleId && a.slotIndex === slotIndex
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToGrid}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Înapoi la Grafic</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-stone-800">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-cinzel text-amber-200 font-bold px-2">
              {weekRangeFormatted}
            </span>
            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-stone-950 font-cinzel font-black text-sm shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.6)] transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 fill-stone-950 text-stone-950" />
            <span>Tipărește Foaia (A4 / PDF)</span>
          </button>
        </div>
      </div>

      {/* Editable Announcement for the board (Hidden when printing) */}
      <div className="no-print glass-panel rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-amber-300 font-cinzel font-bold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Mențiuni și rânduieli particulare pentru afișaj:</span>
        </div>
        <textarea
          rows={2}
          value={customAnnouncement}
          onChange={e => setCustomAnnouncement(e.target.value)}
          className="w-full p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
          placeholder="Scrieți aici orice anunț, sărbătoare cu priveghere sau tipic special pentru această săptămână..."
        />
      </div>

      {/* Printable Sheet Area (Standardized for A4 landscape / portrait print) */}
      <div className="bg-[#fffdfa] text-stone-950 p-6 sm:p-10 rounded-2xl shadow-2xl border-2 border-stone-800/20 font-serif print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Outer and Inner Traditional Ecclesiastical Framing */}
        <div className="border-[3px] border-[#1f1915] p-5 outline outline-1 outline-[#78141c] outline-offset-[-6px] relative">
          
          {/* Monastery Header */}
          <div className="text-center pb-3 border-b-2 border-stone-900">
            <div className="flex items-center justify-center space-x-3 mb-1">
              <ByzantineCross className="w-5 h-5 text-[#78141c]" color="#78141c" />
              <span className="font-cinzel text-xs font-black uppercase tracking-[0.25em] text-[#78141c]">
                Biserica Ortodoxă Română
              </span>
              <ByzantineCross className="w-5 h-5 text-[#78141c]" color="#78141c" />
            </div>

            <h1 className="font-cinzel font-black text-2xl sm:text-3xl uppercase tracking-wider text-stone-950 mt-1">
              {settings.monasteryName}
            </h1>
            
            {settings.location && (
              <p className="font-cormorant italic text-sm text-stone-700">
                {settings.location}
              </p>
            )}

            <div className="mt-2 inline-block px-4 py-1 border-y border-stone-900">
              <h2 className="font-cinzel font-bold text-xs sm:text-sm uppercase tracking-widest text-stone-900">
                Graficul Slujbelor și al Ascultărilor Obștii
              </h2>
            </div>

            <p className="font-sans text-xs text-stone-800 mt-1">
              Pentru săptămâna: <strong className="font-bold underline">{weekRangeFormatted}</strong>
            </p>
          </div>

          {/* Schedule Matrix Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border-2 border-stone-900 text-xs">
              <thead>
                <tr className="bg-stone-100 border-b-2 border-stone-900 text-stone-900">
                  <th className="border border-stone-900 p-2 text-left font-cinzel font-bold uppercase tracking-wider w-44">
                    Ascultare / Post
                  </th>
                  {weekDays.map(day => {
                    const isSunday = day.getDay() === 0;
                    return (
                      <th
                        key={day.toISOString()}
                        className={`border border-stone-900 p-1.5 text-center font-bold uppercase ${
                          isSunday ? 'bg-red-100/70 text-red-950 font-black' : ''
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
                {modules.map(module => (
                  <React.Fragment key={module.id}>
                    {/* Module Subheader */}
                    <tr className="bg-stone-200/90 border-t-2 border-stone-900 font-sans font-bold">
                      <td
                        colSpan={8}
                        className="border border-stone-900 px-3 py-1 text-stone-900 tracking-wider text-[11px] font-cinzel font-bold uppercase"
                      >
                        {module.name} ({module.rotationCycle === 'weekly' ? 'Rând pe săptămână' : 'Rând pe zile'})
                      </td>
                    </tr>

                    {/* Module Roles */}
                    {module.roles.map(role => (
                      <React.Fragment key={role.id}>
                        {Array.from({ length: role.requiredCount }).map((_, slotIdx) => (
                          <tr key={`${role.id}_${slotIdx}`} className="border-b border-stone-400">
                            <td className="border border-stone-900 p-1.5 font-semibold text-stone-900 bg-stone-50/80 font-sans text-[11px]">
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
                                  className={`border border-stone-900 p-1.5 text-center align-middle ${
                                    isSunday ? 'bg-red-50/50' : ''
                                  }`}
                                >
                                  <span className={`font-semibold ${name === '—' ? 'text-stone-400 italic' : 'text-stone-950 font-serif text-[12px]'}`}>
                                    {name}
                                  </span>
                                  {assignment?.notes && (
                                    <div className="text-[9px] text-stone-700 font-sans italic mt-0.5">
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

          {/* Custom Announcements Footer with traditional motif */}
          {customAnnouncement && (
            <div className="mt-4 p-3 border border-stone-900 bg-stone-50/80 rounded-sm font-sans text-xs">
              <span className="font-cinzel font-bold text-stone-950 block mb-0.5 tracking-wider">
                ❖ RÂNDUIELI & ÎNDATORIRI SPECIALE:
              </span>
              <p className="text-stone-900 leading-relaxed italic font-cormorant text-sm">{customAnnouncement}</p>
            </div>
          )}

          <EcclesiasticalDivider className="my-6 no-print" />

          {/* Signatures Block with authentic ecclesiastical stamp layout */}
          <div className="mt-8 pt-4 flex items-center justify-between font-sans text-xs text-stone-950 px-8">
            <div className="text-center">
              <p className="font-cinzel font-bold uppercase tracking-wider text-stone-700 text-[11px]">Binecuvântează,</p>
              <p className="font-cinzel font-black text-sm mt-0.5">Stareț,</p>
              <div className="h-10 flex items-center justify-center">
                <span className="text-[10px] text-stone-400 italic">(Semnătura și Pecetea)</span>
              </div>
              <p className="font-bold text-sm text-stone-900">{settings.abbotName}</p>
            </div>

            <div className="text-center">
              <p className="font-cinzel font-bold uppercase tracking-wider text-stone-700 text-[11px]">Întocmit,</p>
              <p className="font-cinzel font-black text-sm mt-0.5">Eclesiarh,</p>
              <div className="h-10 flex items-center justify-center">
                <span className="text-[10px] text-stone-400 italic">(Semnătura)</span>
              </div>
              <p className="font-bold text-sm text-stone-900">{settings.ecclesiarchName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
