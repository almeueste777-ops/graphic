import React, { useState } from 'react';
import type { Person, Module, Absence, AbsenceReason, SubstitutionRule } from '../types';
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  CalendarOff, 
  Repeat, 
  Plus, 
  Trash2, 
  X, 
  ArrowRight,
  Info
} from 'lucide-react';
import { renderModuleIcon } from '../utils/iconHelper';

const ABSENCE_REASONS: AbsenceReason[] = [
  'Învoire / Misiune',
  'Săptămână de chilie',
  'Spital / Medical',
  'Deplasare / Aprovizionare',
  'Ascultare externă',
  'Alt motiv',
];

interface AbsencesViewProps {
  persons: Person[];
  modules: Module[];
  absences: Absence[];
  setAbsences: (updater: Absence[] | ((prev: Absence[]) => Absence[])) => void;
  rules: SubstitutionRule[];
  setRules: (updater: SubstitutionRule[] | ((prev: SubstitutionRule[]) => SubstitutionRule[])) => void;
}

export const AbsencesView: React.FC<AbsencesViewProps> = ({
  persons,
  modules,
  absences,
  setAbsences,
  rules,
  setRules,
}) => {
  // Absence Modal State
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [absPersonId, setAbsPersonId] = useState('');
  const [absStartDate, setAbsStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absEndDate, setAbsEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absReason, setAbsReason] = useState<AbsenceReason>('Învoire / Misiune');
  const [absPreferredSubstitute, setAbsPreferredSubstitute] = useState('');
  const [absDetails, setAbsDetails] = useState('');

  // Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleTargetPersonId, setRuleTargetPersonId] = useState('');
  const [ruleModuleId, setRuleModuleId] = useState('any');
  const [ruleSubstituteIds, setRuleSubstituteIds] = useState<string[]>([]);
  const [ruleNotes, setRuleNotes] = useState('');

  const openAddAbsence = () => {
    if (persons.length > 0) {
      setAbsPersonId(persons[0].id);
    }
    setAbsStartDate(format(new Date(), 'yyyy-MM-dd'));
    setAbsEndDate(format(new Date(), 'yyyy-MM-dd'));
    setAbsReason('Învoire / Misiune');
    setAbsPreferredSubstitute('');
    setAbsDetails('');
    setIsAbsenceModalOpen(true);
  };

  const handleSaveAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absPersonId) return;

    const newAbsence: Absence = {
      id: `abs_${Date.now()}`,
      personId: absPersonId,
      startDate: absStartDate,
      endDate: absEndDate,
      reason: absReason,
      preferredSubstituteId: absPreferredSubstitute || undefined,
      details: absDetails.trim() || undefined,
    };

    setAbsences(prev => [...prev, newAbsence]);
    setIsAbsenceModalOpen(false);
  };

  const handleDeleteAbsence = (id: string) => {
    setAbsences(prev => prev.filter(a => a.id !== id));
  };

  const openAddRule = () => {
    if (persons.length > 0) {
      setRuleTargetPersonId(persons[0].id);
      setRuleSubstituteIds(persons.length > 1 ? [persons[1].id] : []);
    }
    setRuleModuleId('any');
    setRuleNotes('');
    setIsRuleModalOpen(true);
  };

  const toggleRuleSubstitute = (personId: string) => {
    setRuleSubstituteIds(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTargetPersonId || ruleSubstituteIds.length === 0) return;

    const newRule: SubstitutionRule = {
      id: `rule_${Date.now()}`,
      moduleId: ruleModuleId,
      targetPersonId: ruleTargetPersonId,
      substituteIds: ruleSubstituteIds,
      notes: ruleNotes.trim() || undefined,
    };

    setRules(prev => [...prev, newRule]);
    setIsRuleModalOpen(false);
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const getPerson = (id: string) => persons.find(p => p.id === id);

  return (
    <div className="space-y-8">
      {/* SECTION 1: ÎNVOIRI & CONCEDII (PUNCTUALE) */}
      <div className="space-y-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center space-x-2">
              <CalendarOff className="w-5 h-5 text-rose-400 inline-block" />
              <span>Învoiri & Excepții de la Regulă</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-sans font-normal border border-stone-700">
                {absences.length} învoiri
              </span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Înregistrați perioadele când un slujitor lipsește și desemnați înlocuitorul preferat
            </p>
          </div>

          <button
            onClick={openAddAbsence}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-sm font-semibold shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Învoire</span>
          </button>
        </div>

        {absences.length === 0 ? (
          <div className="bg-stone-900/60 border border-dashed border-stone-800 rounded-xl p-8 text-center text-stone-400">
            <CalendarOff className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Nicio învoire înregistrată în acest moment</p>
            <p className="text-xs text-stone-500 mt-1">
              Toți slujitorii sunt considerați disponibili pentru repartizarea automată a ascultărilor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {absences.map(abs => {
              const person = getPerson(abs.personId);
              const substitute = abs.preferredSubstituteId ? getPerson(abs.preferredSubstituteId) : null;
              const formattedStart = format(parseISO(abs.startDate), 'd MMM yyyy', { locale: ro });
              const formattedEnd = format(parseISO(abs.endDate), 'd MMM yyyy', { locale: ro });

              return (
                <div
                  key={abs.id}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: person?.colorTag || '#999' }}
                        />
                        <div>
                          <h4 className="font-semibold text-stone-100 text-sm">
                            {person?.name || 'Necunoscut'}
                          </h4>
                          <span className="text-[11px] text-stone-400">
                            {person?.rank}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAbsence(abs.id)}
                        className="p-1 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors"
                        title="Șterge învoirea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dates & Reason */}
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between bg-stone-950/40 p-2 rounded border border-stone-800">
                        <span className="text-stone-400">Perioada:</span>
                        <span className="font-medium text-amber-300">
                          {formattedStart} – {formattedEnd}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-stone-400">Motiv:</span>
                        <span className="font-medium text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                          {abs.reason}
                        </span>
                      </div>

                      {abs.details && (
                        <p className="text-stone-400 italic text-[11px] pt-1">
                          „{abs.details}”
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preferred Substitute */}
                  <div className="mt-3 pt-3 border-t border-stone-800/80">
                    <span className="text-[10px] uppercase font-semibold text-stone-500 block mb-1">
                      Înlocuitor desemnat:
                    </span>
                    {substitute ? (
                      <div className="flex items-center space-x-2 text-xs bg-amber-950/20 text-amber-200 p-1.5 rounded border border-amber-900/30">
                        <Repeat className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-medium">{substitute.name} ({substitute.rank})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-500 italic">
                        Se alege automat conform regulilor generale
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: REGULI DE SUBSTITUȚIE & PRIORITĂȚI GENERALE */}
      <div className="space-y-4 pt-4 border-t border-stone-800">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center space-x-2">
              <Repeat className="w-5 h-5 text-violet-400 inline-block" />
              <span>Reguli de Înlocuire Automată (Lanț de Priorități)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-sans font-normal border border-stone-700">
                {rules.length} reguli
              </span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Definiți cine pe cine înlocuiește: „Dacă Părintele X nu poate, intră Y, apoi Z”
            </p>
          </div>

          <button
            onClick={openAddRule}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-violet-800 hover:bg-violet-700 text-white text-sm font-semibold shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Regulă</span>
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="bg-stone-900/60 border border-dashed border-stone-800 rounded-xl p-8 text-center text-stone-400">
            <Repeat className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Nicio regulă de înlocuire prestabilită</p>
            <p className="text-xs text-stone-500 mt-1">
              În caz de învoire, algoritmul va alege automat persoana calificată cu cele mai puține ture (echitate).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map(rule => {
              const target = getPerson(rule.targetPersonId);
              const targetModule = modules.find(m => m.id === rule.moduleId);

              return (
                <div
                  key={rule.id}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                          Ascultare:
                        </span>
                        {targetModule ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-md flex items-center space-x-1 border"
                            style={{
                              backgroundColor: `${targetModule.color}15`,
                              borderColor: `${targetModule.color}40`,
                              color: targetModule.color,
                            }}
                          >
                            {renderModuleIcon(targetModule.iconName, { className: 'w-3 h-3' })}
                            <span>{targetModule.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                            Toate ascultările
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors"
                        title="Șterge regula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Target and Replacement Flow */}
                    <div className="mt-3 bg-stone-950/60 p-3 rounded-lg border border-stone-800 space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-stone-200">
                        <span className="text-xs text-rose-400 font-semibold uppercase">Când lipsește:</span>
                        <span className="font-bold text-amber-200">{target?.name || 'Persoană'}</span>
                        <span className="text-xs text-stone-400">({target?.rank})</span>
                      </div>

                      <div className="text-xs text-stone-400 flex items-center space-x-1 pt-1">
                        <ArrowRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="font-semibold text-violet-300 uppercase tracking-wider">
                          Ordinea înlocuitorilor:
                        </span>
                      </div>

                      <div className="pl-4 space-y-1">
                        {rule.substituteIds.map((subId, idx) => {
                          const subPerson = getPerson(subId);
                          return (
                            <div key={subId} className="flex items-center space-x-2 text-xs">
                              <span className="w-4 h-4 rounded-full bg-violet-950 text-violet-300 font-bold flex items-center justify-center text-[10px] border border-violet-800">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-stone-200">{subPerson?.name}</span>
                              <span className="text-stone-500">({subPerson?.rank})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {rule.notes && (
                      <p className="mt-2 text-stone-400 text-xs italic flex items-center space-x-1">
                        <Info className="w-3 h-3 text-stone-500 flex-shrink-0" />
                        <span>{rule.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ADAUGĂ ÎNVOIRE */}
      {isAbsenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-100">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
              <h3 className="font-serif font-bold text-lg text-amber-100">
                Înregistrare Învoire / Excepție
              </h3>
              <button
                onClick={() => setIsAbsenceModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAbsence} className="p-4 space-y-4">
              {/* Person */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Slujitorul care va lipsi *
                </label>
                <select
                  value={absPersonId}
                  onChange={e => setAbsPersonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {persons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.rank})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                    De la data *
                  </label>
                  <input
                    type="date"
                    required
                    value={absStartDate}
                    onChange={e => setAbsStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                    Până la data *
                  </label>
                  <input
                    type="date"
                    required
                    value={absEndDate}
                    onChange={e => setAbsEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Motivul absenței
                </label>
                <select
                  value={absReason}
                  onChange={e => setAbsReason(e.target.value as AbsenceReason)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {ABSENCE_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Preferred Substitute */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1 block">
                  Înlocuitor preferat direct (opțional)
                </label>
                <select
                  value={absPreferredSubstitute}
                  onChange={e => setAbsPreferredSubstitute(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Se alege automat prin rotație --</option>
                  {persons
                    .filter(p => p.id !== absPersonId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.rank})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-stone-400 mt-1">
                  Dacă alegeți un înlocuitor, algoritmul îi va da prioritate maximă la generare.
                </p>
              </div>

              {/* Details */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Detalii suplimentare (opțional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consult medical la Cluj, binecuvântare primită de la Stareț..."
                  value={absDetails}
                  onChange={e => setAbsDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAbsenceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-sm font-semibold shadow transition-colors"
                >
                  Salvează Învoirea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADAUGĂ REGULĂ DE SUBSTITUȚIE */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-100">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
              <h3 className="font-serif font-bold text-lg text-amber-100">
                Adăugare Regulă de Înlocuire Automată
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-4 space-y-4">
              {/* Target Person */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Când lipsește slujitorul: *
                </label>
                <select
                  value={ruleTargetPersonId}
                  onChange={e => setRuleTargetPersonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {persons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.rank})
                    </option>
                  ))}
                </select>
              </div>

              {/* Module */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  La ascultarea:
                </label>
                <select
                  value={ruleModuleId}
                  onChange={e => setRuleModuleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="any">Toate ascultările</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Substitutes Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1 block">
                  Selectează înlocuitorii (în ordinea preferinței):
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {persons
                    .filter(p => p.id !== ruleTargetPersonId)
                    .map(p => {
                      const isSelected = ruleSubstituteIds.includes(p.id);
                      const priorityIndex = ruleSubstituteIds.indexOf(p.id);

                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleRuleSubstitute(p.id)}
                          className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-violet-950/40 border-violet-500 text-white'
                              : 'border-stone-800 hover:bg-stone-800/40 text-stone-400'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: p.colorTag }}
                            />
                            <span className="text-xs font-medium">{p.name} ({p.rank})</span>
                          </div>
                          {isSelected && (
                            <span className="text-xs font-bold text-violet-300 bg-violet-900/60 px-2 py-0.5 rounded">
                              Prioritate #{priorityIndex + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Notițe / Explicație
                </label>
                <input
                  type="text"
                  placeholder="Ex: Părintele X este primul înlocuitor conform tipicului..."
                  value={ruleNotes}
                  onChange={e => setRuleNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={ruleSubstituteIds.length === 0}
                  className="px-5 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-semibold shadow transition-colors"
                >
                  Salvează Regula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
