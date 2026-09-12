import React, { useState, useEffect } from 'react';
import type { Person, Absence, AbsenceReason } from '../types';
import { format, addDays, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  X, 
  Sparkles, 
  Calendar, 
  UserMinus, 
  Clock, 
  ShieldAlert
} from 'lucide-react';

interface QuickAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  defaultDate?: Date;
  onAddAbsenceAndRecalculate: (absence: Omit<Absence, 'id'>) => void;
}

const PRESET_DAYS = [
  { label: '3 zile', days: 3 },
  { label: '7 zile (1 săpt.)', days: 7 },
  { label: '14 zile (2 săpt.)', days: 14 },
  { label: '21 zile (3 săpt.)', days: 21 },
  { label: '30 zile (1 lună)', days: 30 },
];

export const QuickAbsenceModal: React.FC<QuickAbsenceModalProps> = ({
  isOpen,
  onClose,
  persons,
  defaultDate = new Date(),
  onAddAbsenceAndRecalculate,
}) => {
  const activePersons = persons.filter(p => p.active);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [startDateStr, setStartDateStr] = useState<string>(() => format(defaultDate, 'yyyy-MM-dd'));
  const [durationDays, setDurationDays] = useState<number>(7);
  const [reason, setReason] = useState<AbsenceReason>('Învoire / Misiune');
  const [preferredSubstituteId, setPreferredSubstituteId] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStartDateStr(format(defaultDate, 'yyyy-MM-dd'));
      setDurationDays(7);
      if (!selectedPersonId && activePersons.length > 0) {
        setSelectedPersonId(activePersons[0].id);
      }
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const startDate = parseISO(startDateStr);
  const endDate = addDays(startDate, Math.max(1, durationDays) - 1);
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  const selectedPerson = persons.find(p => p.id === selectedPersonId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;

    onAddAbsenceAndRecalculate({
      personId: selectedPersonId,
      startDate: startDateStr,
      endDate: endDateStr,
      reason,
      details: details.trim() || `Plecat ${durationDays} zile`,
      preferredSubstituteId: preferredSubstituteId || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="apple-glass rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col border border-white/15 shadow-2xl overflow-hidden text-[#f5f5f7] transform transition-all duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center space-x-2">
                <span>Părinte Plecat (X zile)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Auto-Recalculare
                </span>
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Înregistrați perioada de absență; algoritmul va înlocui automat slujitorul.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Select Person */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Părintele / Fratele plecat:
            </label>
            <select
              value={selectedPersonId}
              onChange={e => setSelectedPersonId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              {activePersons.map(p => (
                <option key={p.id} value={p.id} className="bg-stone-900 text-white">
                  {p.name} ({p.rank}) {p.weekendOnly ? '• Weekend' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Days X */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Câte zile este plecat (X zile)?</span>
              </label>
              <div className="flex items-center space-x-1 bg-white/[0.08] px-2.5 py-1 rounded-full border border-white/10">
                <span className="text-xs font-bold text-amber-300 font-mono">{durationDays}</span>
                <span className="text-[11px] text-white/60">{durationDays === 1 ? 'zi' : 'zile'}</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {PRESET_DAYS.map(preset => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setDurationDays(preset.days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    durationDays === preset.days
                      ? 'bg-amber-400 text-stone-950 font-semibold shadow-md scale-105'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border border-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Number Input / Stepper */}
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={e => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-28 px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white font-mono text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
              <span className="text-xs text-white/50">
                sau introduceți numărul exact de zile dorit
              </span>
            </div>
          </div>

          {/* Date Picker & Range Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Data plecării:</span>
              </label>
              <input
                type="date"
                value={startDateStr}
                onChange={e => setStartDateStr(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                Până la data:
              </label>
              <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-xs font-medium flex items-center justify-between">
                <span>{format(endDate, 'd MMMM yyyy', { locale: ro })}</span>
                <span className="text-[10px] text-amber-400/80 font-mono">inclusiv</span>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="rounded-2xl p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs space-y-1 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-semibold text-amber-200">
                {selectedPerson?.name || 'Părintele'} este plecat {durationDays} {durationDays === 1 ? 'zi' : 'zile'}
              </p>
              <p className="text-[11px] text-amber-300/70">
                Interval: {format(startDate, 'dd.MM.yyyy')} — {format(endDate, 'dd.MM.yyyy')}.
                Toate ascultările (Altar, Predică, Strană, În Biserică) vor fi redistribuite către înlocuitorii desemnați.
              </p>
            </div>
          </div>

          {/* Reason & Substitute */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Motivul absenței:</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as AbsenceReason)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white text-xs focus:outline-none"
              >
                <option value="Învoire / Misiune" className="bg-stone-900">Învoire / Misiune</option>
                <option value="Săptămână de chilie" className="bg-stone-900">Săptămână de chilie</option>
                <option value="Spital / Medical" className="bg-stone-900">Spital / Medical</option>
                <option value="Deplasare / Aprovizionare" className="bg-stone-900">Deplasare / Aprovizionare</option>
                <option value="Alt motiv" className="bg-stone-900">Alt motiv</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Înlocuitor preferat (opțional):</label>
              <select
                value={preferredSubstituteId}
                onChange={e => setPreferredSubstituteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white text-xs focus:outline-none"
              >
                <option value="" className="bg-stone-900">Alegere automată (Tipic)</option>
                {activePersons
                  .filter(p => p.id !== selectedPersonId)
                  .map(p => (
                    <option key={p.id} value={p.id} className="bg-stone-900">
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Optional Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70">Observații / Notă (opțional):</label>
            <input
              type="text"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Ex: Misiune mănăstirească, pelerinaj, chitanță binecuvântare..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              Anulează
            </button>

            <button
              type="submit"
              className="apple-gold-button flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold text-stone-950 shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Salvează și Recalculează Programul</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
