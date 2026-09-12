import React, { useState } from 'react';
import type { Person, Module, ModuleRole, ScheduleAssignment, Absence } from '../types';
import { isPersonAbsent } from '../services/scheduler';
import { parseISO, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { X, UserCheck, AlertTriangle, Check, UserX } from 'lucide-react';
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
  onSave: (newPersonId: string | null, notes?: string) => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-100">
        {/* Header */}
        <div 
          className="p-4 border-b border-stone-800 flex items-center justify-between"
          style={{ borderTop: `4px solid ${module.color}` }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-inner"
              style={{ backgroundColor: `${module.color}25`, color: module.color }}
            >
              {renderModuleIcon(module.iconName, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">{module.name}</h3>
              <p className="text-xs text-stone-400 capitalize">{formattedDate} • {role.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Unassign option */}
          <div
            onClick={() => setSelectedPersonId(null)}
            className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
              selectedPersonId === null
                ? 'bg-stone-800 border-amber-500/60'
                : 'border-stone-800 hover:bg-stone-800/40'
            }`}
          >
            <div className="flex items-center space-x-2 text-stone-400">
              <UserX className="w-4 h-4 text-stone-500" />
              <span className="text-sm italic">Neatribuit (Loc liber)</span>
            </div>
            {selectedPersonId === null && <Check className="w-4 h-4 text-amber-400" />}
          </div>

          {/* Qualified Members */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2 block">
              Slujitori calificați pentru {module.name} ({qualifiedPersons.length})
            </label>
            <div className="space-y-1.5">
              {qualifiedPersons.map(person => {
                const absence = isPersonAbsent(person.id, parsedDate, absences);
                const otherDuty = getOtherDuty(person.id);
                const isSelected = selectedPersonId === person.id;

                return (
                  <div
                    key={person.id}
                    onClick={() => setSelectedPersonId(person.id)}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                        : 'border-stone-800/80 hover:bg-stone-800/50 text-stone-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: person.colorTag }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{person.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                            {person.rank}
                          </span>
                        </div>

                        {/* Status warning alerts */}
                        {absence && (
                          <div className="flex items-center space-x-1 text-xs text-rose-400 mt-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>Învoit: {absence.reason}</span>
                          </div>
                        )}
                        {!absence && otherDuty && (
                          <div className="flex items-center space-x-1 text-xs text-amber-400 mt-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>Atenție: Are deja ascultare în această zi!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!absence && !otherDuty && (
                        <span className="text-xs text-emerald-400 flex items-center space-x-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
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
            <details className="text-xs text-stone-400">
              <summary className="cursor-pointer hover:text-stone-300 py-1 font-medium">
                Arată și ceilalți membri ai obștii ({otherPersons.length})
              </summary>
              <div className="space-y-1.5 mt-2">
                {otherPersons.map(person => {
                  const isSelected = selectedPersonId === person.id;
                  return (
                    <div
                      key={person.id}
                      onClick={() => setSelectedPersonId(person.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 text-white'
                          : 'border-stone-800/60 hover:bg-stone-800/30 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: person.colorTag }}
                        />
                        <span className="text-xs font-medium">{person.name} ({person.rank})</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          {/* Notes input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
              Observații / Mențiuni particulare
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Doar la Sfânta Liturghie, sau schimbat de la Vecernie..."
              className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/80 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Anulează
          </button>
          <button
            onClick={() => onSave(selectedPersonId, notes)}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium shadow transition-colors"
          >
            Salvează Modificarea
          </button>
        </div>
      </div>
    </div>
  );
};
