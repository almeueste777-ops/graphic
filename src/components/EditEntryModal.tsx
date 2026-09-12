import React, { useState } from 'react';
import type { Person, Module, ModuleRole, ScheduleAssignment, Absence } from '../types';
import { isPersonAbsent } from '../services/scheduler';
import { parseISO, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { X, UserCheck, AlertTriangle, Check, UserX, Calendar } from 'lucide-react';
import { renderModuleIcon } from '../utils/iconHelper';

interface EditEntryModalProps {
  date: string;
  module: Module;
  role: ModuleRole;
  slotIndex: number;
  currentAssignment?: ScheduleAssignment;
  persons: Person[];
  absences: Absence[];
  allDayAssignments: ScheduleAssignment[];
  onSave: (newPersonId: string | null, notes?: string, applyToWholeWeek?: boolean) => void;
  onClose: () => void;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  date,
  module,
  role,
  slotIndex: _slotIndex,
  currentAssignment,
  persons,
  absences,
  allDayAssignments,
  onSave,
  onClose,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    currentAssignment?.personId || null
  );
  const [notes, setNotes] = useState<string>(currentAssignment?.notes || '');
  const [applyToWholeWeek, setApplyToWholeWeek] = useState<boolean>(
    module.rotationCycle === 'weekly'
  );

  const parsedDate = parseISO(date);
  const formattedDate = format(parsedDate, 'EEEE, d MMMM yyyy', { locale: ro });

  // Filter persons who have this skill
  const qualifiedPersons = persons.filter(p => p.active && p.skills.includes(module.id));
  const otherPersons = persons.filter(p => p.active && !p.skills.includes(module.id));

  // Find who is assigned to other duties on this day
  const getOtherDuty = (personId: string) => {
    return allDayAssignments.find(
      a => a.personId === personId && a.id !== currentAssignment?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 font-sf">
      <div className="apple-glass rounded-3xl max-w-lg w-full overflow-hidden text-white border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div 
          className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]"
        >
          <div className="flex items-center space-x-3.5">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner border border-white/15"
              style={{ backgroundColor: `${module.color}25`, color: module.color }}
            >
              {renderModuleIcon(module.iconName, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h3 className="font-semibold text-base text-white tracking-tight">{module.name}</h3>
              <p className="text-xs text-white/50 capitalize flex items-center space-x-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                <span>{formattedDate} • {role.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[62vh] overflow-y-auto">
          {/* Unassign option */}
          <div
            onClick={() => setSelectedPersonId(null)}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              selectedPersonId === null
                ? 'bg-white/10 border-amber-400 text-white shadow-sm'
                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <UserX className="w-4 h-4 text-white/40" />
              <span className="text-xs font-semibold italic">Neatribuit (Loc liber)</span>
            </div>
            {selectedPersonId === null && <Check className="w-4 h-4 text-amber-400" />}
          </div>

          {/* Qualified Members */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90 mb-2 block">
              Slujitori calificați ({qualifiedPersons.length})
            </label>
            <div className="space-y-2">
              {qualifiedPersons.map(person => {
                const absence = isPersonAbsent(person.id, parsedDate, absences);
                const otherDuty = getOtherDuty(person.id);
                const isSelected = selectedPersonId === person.id;

                return (
                  <div
                    key={person.id}
                    onClick={() => setSelectedPersonId(person.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/80 text-white shadow-[0_2px_12px_rgba(212,175,55,0.15)] ring-1 ring-amber-400/40'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-white/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md ring-1 ring-white/15"
                        style={{
                          background: `linear-gradient(135deg, ${person.colorTag}, ${person.colorTag}88)`,
                          color: '#ffffff',
                        }}
                      >
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-white">{person.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                            {person.rank}
                          </span>
                        </div>

                        {/* Status warning alerts */}
                        {absence && (
                          <div className="flex items-center space-x-1 text-[11px] text-rose-300 mt-1 font-medium">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>Învoit: {absence.reason}</span>
                          </div>
                        )}
                        {!absence && otherDuty && (
                          <div className="flex items-center space-x-1 text-[11px] text-amber-300 mt-1 font-medium">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>Are deja ascultare în această zi!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!absence && !otherDuty && (
                        <span className="text-[11px] text-emerald-300 flex items-center space-x-1 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/25 font-medium">
                          <UserCheck className="w-3 h-3" />
                          <span>Disponibil</span>
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other members of the obște */}
          {otherPersons.length > 0 && (
            <details className="text-xs text-white/50 pt-1">
              <summary className="cursor-pointer hover:text-white/80 py-1 font-medium text-[11px]">
                Arată și ceilalți membri ai obștii ({otherPersons.length})
              </summary>
              <div className="space-y-1.5 mt-2">
                {otherPersons.map(person => {
                  const isSelected = selectedPersonId === person.id;
                  return (
                    <div
                      key={person.id}
                      onClick={() => setSelectedPersonId(person.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-white/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: person.colorTag }}
                        />
                        <span className="text-xs font-medium text-white/80">{person.name} ({person.rank})</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          {/* Weekly scope toggle */}
          {module.rotationCycle === 'weekly' && (
            <div 
              onClick={() => setApplyToWholeWeek(!applyToWholeWeek)}
              className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={applyToWholeWeek}
                  onChange={e => setApplyToWholeWeek(e.target.checked)}
                  className="rounded bg-black/40 border-amber-500/40 text-amber-400 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-amber-200 block">
                    Aplică pentru toată săptămâna (Sâmbătă – Vineri)
                  </span>
                  <span className="text-[10px] text-white/50 block mt-0.5">
                    Această ascultare are rânduială săptămânală. Se va actualiza automat pe toată foaia A4 și în toate modulele.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes input */}
          <div className="pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
              Observații / Mențiuni particulare
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Doar la Sfânta Liturghie, sau schimbat de la Vecernie..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Anulează
          </button>
          <button
            onClick={() => onSave(selectedPersonId, notes, applyToWholeWeek)}
            className="apple-gold-button px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md"
          >
            Salvează Modificarea
          </button>
        </div>
      </div>
    </div>
  );
};

