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
  Info,
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock
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
    <div className="space-y-10 font-sf animate-in fade-in duration-300">
      {/* SECTION 1: ÎNVOIRI & CONCEDII (Apple Focus / Reminders Style) */}
      <div className="space-y-4">
        <div className="apple-glass rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10 shadow-lg">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-inner">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Învoiri & Excepții de la Rânduială
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-medium border border-rose-500/20">
                  {absences.length} active
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Înregistrați perioadele de chilie, spital sau misiuni externe pentru repartizare corectă
              </p>
            </div>
          </div>

          <button
            onClick={openAddAbsence}
            className="apple-button flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-[0_4px_16px_rgba(225,29,72,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Învoire</span>
          </button>
        </div>

        {absences.length === 0 ? (
          <div className="apple-glass rounded-3xl p-10 text-center border border-white/5 border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40 shadow-inner">
              <CalendarOff className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-white/90">Nicio învoire înregistrată</p>
            <p className="text-xs text-white/40 max-w-md mx-auto mt-1 leading-relaxed">
              Toți slujitorii sunt activi și disponibili. Algoritmul de rotație va asigura o distribuire optimă între toți membrii obștii.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {absences.map(abs => {
              const person = getPerson(abs.personId);
              const substitute = abs.preferredSubstituteId ? getPerson(abs.preferredSubstituteId) : null;
              const formattedStart = format(parseISO(abs.startDate), 'd MMM', { locale: ro });
              const formattedEnd = format(parseISO(abs.endDate), 'd MMM yyyy', { locale: ro });

              return (
                <div
                  key={abs.id}
                  className="apple-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between border border-white/10 hover:border-white/20 group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-md ring-1 ring-white/15"
                          style={{
                            background: `linear-gradient(135deg, ${person?.colorTag || '#888'}, ${person?.colorTag || '#888'}88)`,
                            color: '#ffffff',
                          }}
                        >
                          {person?.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm tracking-tight">
                            {person?.name || 'Necunoscut'}
                          </h4>
                          <span className="text-[11px] text-white/50">
                            {person?.rank}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAbsence(abs.id)}
                        className="opacity-60 hover:opacity-100 p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Șterge învoirea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dates & Reason */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between bg-white/[0.04] px-3 py-2 rounded-xl border border-white/5">
                        <div className="flex items-center space-x-2 text-white/50 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Perioada:</span>
                        </div>
                        <span className="text-xs font-semibold text-amber-300">
                          {formattedStart} – {formattedEnd}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs text-white/50">Motiv:</span>
                        <span className="text-[11px] font-medium text-rose-300 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          {abs.reason}
                        </span>
                      </div>

                      {abs.details && (
                        <p className="text-white/60 italic text-xs px-1 pt-1 leading-relaxed">
                          „{abs.details}”
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preferred Substitute */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider block mb-1.5">
                      Înlocuitor desemnat:
                    </span>
                    {substitute ? (
                      <div className="flex items-center space-x-2 text-xs bg-amber-500/10 text-amber-200 px-3 py-2 rounded-xl border border-amber-500/20">
                        <Repeat className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="font-semibold">{substitute.name}</span>
                        <span className="text-white/40 text-[10px]">({substitute.rank})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-white/40 italic flex items-center space-x-1.5 px-1">
                        <Clock className="w-3.5 h-3.5 text-white/30" />
                        <span>Se alege automat prin rotație</span>
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
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="apple-glass rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10 shadow-lg">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400 shadow-inner">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Lanț de Priorități la Înlocuire
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-medium border border-violet-500/20">
                  {rules.length} reguli
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Rânduieli automate de tip: „Dacă Părintele X nu poate, intră Y, apoi Z”
              </p>
            </div>
          </div>

          <button
            onClick={openAddRule}
            className="apple-button flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Regulă</span>
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="apple-glass rounded-3xl p-10 text-center border border-white/5 border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-white/90">Nicio regulă de înlocuire prestabilită</p>
            <p className="text-xs text-white/40 max-w-md mx-auto mt-1 leading-relaxed">
              În caz de învoire, motorul inteligent va repartiza automat persoana calificată cu cele mai puține ture pentru echitate maximă.
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
                  className="apple-card rounded-2xl p-5 border border-white/10 hover:border-white/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                          Ascultare:
                        </span>
                        {targetModule ? (
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-lg flex items-center space-x-1.5 border font-medium"
                            style={{
                              backgroundColor: `${targetModule.color}20`,
                              borderColor: `${targetModule.color}40`,
                              color: targetModule.color,
                            }}
                          >
                            {renderModuleIcon(targetModule.iconName, { className: 'w-3 h-3' })}
                            <span>{targetModule.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-lg bg-white/10 text-white/80 font-medium border border-white/10">
                            Toate ascultările
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="opacity-60 hover:opacity-100 p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Șterge regula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Target and Replacement Flow */}
                    <div className="mt-4 bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-[11px] text-rose-400 font-semibold uppercase tracking-wide">Când lipsește:</span>
                        <span className="font-bold text-amber-200">{target?.name || 'Persoană'}</span>
                        <span className="text-xs text-white/40">({target?.rank})</span>
                      </div>

                      <div className="text-xs text-white/50 flex items-center space-x-1.5 pt-1">
                        <ArrowRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="font-semibold text-violet-300 uppercase tracking-wider text-[10px]">
                          Ordinea înlocuitorilor:
                        </span>
                      </div>

                      <div className="pl-3 space-y-2">
                        {rule.substituteIds.map((subId, idx) => {
                          const subPerson = getPerson(subId);
                          return (
                            <div key={subId} className="flex items-center space-x-2.5 text-xs">
                              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-[10px] border border-violet-500/30">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-white/90">{subPerson?.name}</span>
                              <span className="text-white/40 text-[11px]">({subPerson?.rank})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {rule.notes && (
                      <p className="mt-3 text-white/50 text-xs italic flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
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

      {/* MODAL 1: ADAUGĂ ÎNVOIRE (Apple Action Sheet) */}
      {isAbsenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="apple-glass rounded-3xl max-w-lg w-full overflow-hidden text-white border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <CalendarOff className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-white">
                  Înregistrare Învoire / Excepție
                </h3>
              </div>
              <button
                onClick={() => setIsAbsenceModalOpen(false)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAbsence} className="p-5 space-y-4">
              {/* Person */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  Slujitorul care va lipsi *
                </label>
                <select
                  value={absPersonId}
                  onChange={e => setAbsPersonId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                >
                  {persons.map(p => (
                    <option key={p.id} value={p.id} className="bg-stone-900 text-white">
                      {p.name} ({p.rank})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                    De la data *
                  </label>
                  <input
                    type="date"
                    required
                    value={absStartDate}
                    onChange={e => setAbsStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                    Până la data *
                  </label>
                  <input
                    type="date"
                    required
                    value={absEndDate}
                    onChange={e => setAbsEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  Motivul absenței
                </label>
                <select
                  value={absReason}
                  onChange={e => setAbsReason(e.target.value as AbsenceReason)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                >
                  {ABSENCE_REASONS.map(r => (
                    <option key={r} value={r} className="bg-stone-900 text-white">{r}</option>
                  ))}
                </select>
              </div>

              {/* Preferred Substitute */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5 block">
                  Înlocuitor preferat direct (opțional)
                </label>
                <select
                  value={absPreferredSubstitute}
                  onChange={e => setAbsPreferredSubstitute(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                >
                  <option value="" className="bg-stone-900 text-white">-- Se alege automat prin rotație echitabilă --</option>
                  {persons
                    .filter(p => p.id !== absPersonId)
                    .map(p => (
                      <option key={p.id} value={p.id} className="bg-stone-900 text-white">
                        {p.name} ({p.rank})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-white/40 mt-1">
                  Dacă alegeți un înlocuitor, algoritmul îi va da prioritate maximă la generare.
                </p>
              </div>

              {/* Details */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  Detalii suplimentare (opțional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consult medical, binecuvântare primită de la Stareț..."
                  value={absDetails}
                  onChange={e => setAbsDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAbsenceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="apple-button px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-[0_4px_16px_rgba(225,29,72,0.35)]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="apple-glass rounded-3xl max-w-lg w-full overflow-hidden text-white border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-white">
                  Rânduială de Înlocuire Automată
                </h3>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-5 space-y-4">
              {/* Target Person */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  Când lipsește slujitorul: *
                </label>
                <select
                  value={ruleTargetPersonId}
                  onChange={e => setRuleTargetPersonId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                >
                  {persons.map(p => (
                    <option key={p.id} value={p.id} className="bg-stone-900 text-white">
                      {p.name} ({p.rank})
                    </option>
                  ))}
                </select>
              </div>

              {/* Module */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  La ascultarea:
                </label>
                <select
                  value={ruleModuleId}
                  onChange={e => setRuleModuleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                >
                  <option value="any" className="bg-stone-900 text-white">Toate ascultările</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id} className="bg-stone-900 text-white">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Substitutes Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1.5 block">
                  Selectează înlocuitorii (în ordinea priorității):
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
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-violet-500/20 border-violet-500/50 text-white shadow-sm'
                              : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-white/70'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: p.colorTag }}
                            />
                            <span className="text-xs font-semibold">{p.name}</span>
                            <span className="text-white/40 text-[11px]">({p.rank})</span>
                          </div>
                          {isSelected && (
                            <span className="text-[11px] font-bold text-violet-300 bg-violet-500/30 px-2.5 py-0.5 rounded-full border border-violet-500/30">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  Notițe / Tipic particular
                </label>
                <input
                  type="text"
                  placeholder="Ex: Primul înlocuitor conform rânduielii..."
                  value={ruleNotes}
                  onChange={e => setRuleNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={ruleSubstituteIds.length === 0}
                  className="apple-button px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 disabled:opacity-40 text-white text-xs font-semibold shadow-[0_4px_16px_rgba(139,92,246,0.35)]"
                >
                  Salvează Rânduiala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

