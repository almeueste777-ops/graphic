import React, { useState } from 'react';
import type { Person, Module, ScheduleAssignment } from '../types';
import { 
  UserPlus, 
  Phone, 
  Check, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Sparkles,
  Palette
} from 'lucide-react';
import { renderModuleIcon } from '../utils/iconHelper';

const PRESET_RANKS = [
  'Arhimandrit',
  'Protosinghel',
  'Ieromonah',
  'Ierodiacon',
  'Stareț',
  'Stareță',
  'Monah',
  'Monahie',
  'Rasofor',
  'Rasoforă',
  'Frate',
  'Soră',
  'Maică',
  'Voluntar / Miren',
  'Alt rang...'
];

const PRESET_COLORS = [
  '#8b1d24', '#b38210', '#1d4ed8', '#047857', '#d97706',
  '#7c3aed', '#db2777', '#0891b2', '#4b5563', '#4338ca',
  '#be123c', '#0f766e', '#0369a1', '#581c87'
];

interface MembersViewProps {
  persons: Person[];
  setPersons: (updater: Person[] | ((prev: Person[]) => Person[])) => void;
  modules: Module[];
  schedule: ScheduleAssignment[];
  setSchedule?: (updater: ScheduleAssignment[] | ((prev: ScheduleAssignment[]) => ScheduleAssignment[])) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  persons,
  setPersons,
  modules,
  schedule,
  setSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRankSelect, setFormRankSelect] = useState('Ieromonah');
  const [formCustomRank, setFormCustomRank] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);

  const openAddModal = () => {
    setEditingPerson(null);
    setFormName('');
    setFormRankSelect('Ieromonah');
    setFormCustomRank('');
    setFormPhone('');
    setFormSkills(modules.slice(0, 2).map(m => m.id));
    setFormColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setFormNotes('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    setFormName(person.name);
    if (PRESET_RANKS.includes(person.rank)) {
      setFormRankSelect(person.rank);
      setFormCustomRank('');
    } else {
      setFormRankSelect('Alt rang...');
      setFormCustomRank(person.rank);
    }
    setFormPhone(person.phone || '');
    setFormSkills(person.skills || []);
    setFormColor(person.colorTag);
    setFormNotes(person.notes || '');
    setFormActive(person.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const finalRank = formRankSelect === 'Alt rang...' 
      ? (formCustomRank.trim() || 'Slujitor') 
      : formRankSelect;

    if (editingPerson) {
      if (setSchedule && !formActive) {
        setSchedule(prev => prev.filter(a => a.personId !== editingPerson.id));
      }
      setPersons(prev =>
        prev.map(p =>
          p.id === editingPerson.id
            ? {
                ...p,
                name: formName.trim(),
                rank: finalRank,
                phone: formPhone.trim() || undefined,
                skills: formSkills,
                colorTag: formColor,
                notes: formNotes.trim() || undefined,
                active: formActive,
              }
            : p
        )
      );
    } else {
      const newPerson: Person = {
        id: `person_${Date.now()}`,
        name: formName.trim(),
        rank: finalRank,
        phone: formPhone.trim() || undefined,
        skills: formSkills,
        colorTag: formColor,
        notes: formNotes.trim() || undefined,
        active: formActive,
      };
      setPersons(prev => [...prev, newPerson]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Sigur doriți să îl eliminați pe ${name} din evidența obștii?`)) {
      setPersons(prev => prev.filter(p => p.id !== id));
      if (setSchedule) {
        setSchedule(prev => prev.filter(a => a.personId !== id));
      }
    }
  };

  const toggleSkill = (moduleId: string) => {
    setFormSkills(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  // Filtered persons
  const filteredPersons = persons.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRank = selectedRank === 'all' || p.rank === selectedRank;
    return matchesSearch && matchesRank;
  });

  // Calculate duty count for each person in total schedule
  const getDutyCount = (personId: string) => {
    return schedule.filter(s => s.personId === personId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header & Apple-style Search Toolbar */}
      <div className="apple-glass rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Obștea Mănăstirii
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-mono border border-white/5">
              {persons.length}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            Evidența părinților și fraților, rangurile și ascultările încredințate
          </p>
        </div>

        {/* Search, Filter, Add */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Apple Search Pill */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Caută slujitor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:bg-white/[0.09] transition-all"
            />
          </div>

          {/* Rank Filter */}
          <select
            value={selectedRank}
            onChange={e => setSelectedRank(e.target.value)}
            className="px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/80 focus:outline-none focus:border-amber-400/50 transition-all"
          >
            <option value="all" className="bg-neutral-900">Toate rangurile</option>
            {PRESET_RANKS.filter(r => r !== 'Alt rang...').map(r => (
              <option key={r} value={r} className="bg-neutral-900">{r}</option>
            ))}
          </select>

          {/* Add Member Button */}
          <button
            onClick={openAddModal}
            className="apple-gold-button flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 fill-black text-black" />
            <span>Adaugă Slujitor</span>
          </button>
        </div>
      </div>

      {/* Members Grid (Apple Contacts Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersons.map(person => {
          const dutyCount = getDutyCount(person.id);
          const initials = person.name
            .replace(/Părintele|Fratele|Maica|Sora|Ierom\.|Arhim\./g, '')
            .trim()
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'M';

          return (
            <div
              key={person.id}
              className={`apple-card rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                person.active ? 'opacity-100' : 'opacity-50 grayscale'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    {/* Apple Contact Avatar with Gradient Ring */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md flex-shrink-0 relative overflow-hidden"
                      style={{ 
                        backgroundColor: person.colorTag,
                        boxShadow: `0 4px 14px ${person.colorTag}40`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/30 pointer-events-none" />
                      <span className="relative z-10">{initials}</span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-base tracking-tight leading-snug">
                        {person.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/5">
                          {person.rank}
                        </span>
                        {!person.active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Inactiv
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(person)}
                      className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-all"
                      title="Modifică slujitor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(person.id, person.name)}
                      className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-rose-500/20 text-white/40 hover:text-rose-300 flex items-center justify-center transition-all"
                      title="Șterge slujitor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details / Phone */}
                <div className="mt-3.5 text-xs space-y-1.5 text-white/50">
                  {person.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-white/40" />
                      <span className="font-mono text-[11px]">{person.phone}</span>
                    </div>
                  )}
                  {person.notes && (
                    <p className="text-white/60 italic text-[11px] bg-white/[0.03] p-2 rounded-2xl border border-white/[0.04]">
                      „{person.notes}”
                    </p>
                  )}
                </div>
              </div>

              {/* Skills Tags */}
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px] text-white/40 mb-2">
                  <span className="font-medium">Ascultări compatibile</span>
                  <span className="text-amber-300/90 font-mono flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{dutyCount} ture</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {person.skills.length > 0 ? (
                    person.skills.map(modId => {
                      const mod = modules.find(m => m.id === modId);
                      if (!mod) return null;
                      return (
                        <span
                          key={modId}
                          className="text-[11px] px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 border transition-all"
                          style={{
                            backgroundColor: `${mod.color}15`,
                            borderColor: `${mod.color}35`,
                            color: mod.color,
                          }}
                        >
                          {renderModuleIcon(mod.iconName, { className: 'w-3 h-3' })}
                          <span>{mod.name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-white/30 italic">Nicio ascultare asignată</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Member Modal (Apple Sheet Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="apple-glass rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-white border border-white/15">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] shrink-0">
              <h3 className="font-semibold text-lg text-white">
                {editingPerson ? 'Modificare Slujitor' : 'Adăugare Slujitor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/60 hover:text-white flex items-center justify-center transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Nume Monahal sau de Mirean *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Părintele Paisie, Maica Teodora..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              {/* Rank & Custom Rank Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                    Rang / Statut
                  </label>
                  <select
                    value={formRankSelect}
                    onChange={e => setFormRankSelect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-neutral-900 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-amber-400/50 transition-all"
                  >
                    {PRESET_RANKS.map(r => (
                      <option key={r} value={r} className="bg-neutral-900">{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                    {formRankSelect === 'Alt rang...' ? 'Specifică Rangul *' : 'Telefon (opțional)'}
                  </label>
                  {formRankSelect === 'Alt rang...' ? (
                    <input
                      type="text"
                      required
                      placeholder="Ex: Egumen, Diacon..."
                      value={formCustomRank}
                      onChange={e => setFormCustomRank(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-amber-400/50 text-sm text-white placeholder-white/30 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Ex: 0740 000 000"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  )}
                </div>
              </div>

              {/* Color Tag with Custom Picker */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 flex items-center justify-between">
                  <span>Culoare Identificare</span>
                  <span className="text-[10px] font-mono text-white/40">{formColor}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label 
                    className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center cursor-pointer relative shadow-sm hover:scale-110 transition-transform"
                    title="Alege orice culoare"
                  >
                    <input
                      type="color"
                      value={formColor}
                      onChange={e => setFormColor(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    />
                    <Palette className="w-3.5 h-3.5 text-white/70" />
                  </label>
                </div>
              </div>

              {/* Module Qualifications / Skills */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-2 block">
                  Ascultări la care poate fi programat:
                </label>
                {modules.length === 0 ? (
                  <p className="text-xs text-white/40 italic">Nu există nicio ascultare definită încă.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modules.map(mod => {
                      const isChecked = formSkills.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleSkill(mod.id)}
                          className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-amber-500/15 border-amber-400/50 text-white shadow-xs'
                              : 'border-white/[0.08] hover:bg-white/[0.04] text-white/60'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span style={{ color: mod.color }}>
                              {renderModuleIcon(mod.iconName, { className: 'w-4 h-4' })}
                            </span>
                            <span className="text-xs font-medium">{mod.name}</span>
                          </div>
                          {isChecked && <Check className="w-4 h-4 text-amber-400" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Observații / Mențiuni (permis, tipic, sănătate etc.)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Permis categoria B & D..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              {/* Active Toggle (Apple Switch Style) */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-white/80 font-medium">
                  Membru activ în obște (poate primi ascultări)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="apple-gold-button px-5 py-2 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  {editingPerson ? 'Salvează' : 'Adaugă'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
