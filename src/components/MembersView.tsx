import React, { useState } from 'react';
import type { Person, Module, MonasticRank, ScheduleAssignment } from '../types';
import { 
  UserPlus, 
  Phone, 
  Check, 
  Trash2, 
  Edit3, 
  Search, 
  X,
  Sparkles
} from 'lucide-react';
import { renderModuleIcon } from '../utils/iconHelper';

const RANKS: MonasticRank[] = [
  'Arhimandrit',
  'Protosinghel',
  'Ieromonah',
  'Ierodiacon',
  'Monah',
  'Rasofor',
  'Frate',
  'Voluntar / Miren',
];

const PRESET_COLORS = [
  '#8b1d24', '#b38210', '#1d4ed8', '#047857', '#d97706',
  '#7c3aed', '#db2777', '#0891b2', '#4b5563', '#4338ca'
];

interface MembersViewProps {
  persons: Person[];
  setPersons: (updater: Person[] | ((prev: Person[]) => Person[])) => void;
  modules: Module[];
  schedule: ScheduleAssignment[];
}

export const MembersView: React.FC<MembersViewProps> = ({
  persons,
  setPersons,
  modules,
  schedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRank, setFormRank] = useState<MonasticRank>('Ieromonah');
  const [formPhone, setFormPhone] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);

  const openAddModal = () => {
    setEditingPerson(null);
    setFormName('');
    setFormRank('Ieromonah');
    setFormPhone('');
    setFormSkills(['altar', 'strana']);
    setFormColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setFormNotes('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    setFormName(person.name);
    setFormRank(person.rank);
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

    if (editingPerson) {
      setPersons(prev =>
        prev.map(p =>
          p.id === editingPerson.id
            ? {
                ...p,
                name: formName.trim(),
                rank: formRank,
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
        rank: formRank,
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
      {/* Header & Filter Toolbar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center space-x-2">
            <span>Obștea Mănăstirii</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-sans font-normal border border-stone-700">
              {persons.length} slujitori
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Definiți membrii, rânduiala rangurilor și ascultările pentru fiecare
          </p>
        </div>

        {/* Search, Filter, Add */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Caută după nume..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Rank Filter */}
          <select
            value={selectedRank}
            onChange={e => setSelectedRank(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Toate rangurile</option>
            {RANKS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Add Member Button */}
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium shadow transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adaugă Slujitor</span>
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersons.map(person => {
          const dutyCount = getDutyCount(person.id);
          const initials = person.name
            .replace(/Părintele|Fratele|Ierom\.|Arhim\./g, '')
            .trim()
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'M';

          return (
            <div
              key={person.id}
              className={`bg-stone-900 border rounded-xl p-4 shadow transition-all hover:border-stone-700 relative overflow-hidden ${
                person.active ? 'border-stone-800' : 'border-stone-800/40 opacity-60'
              }`}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{ backgroundColor: person.colorTag }} 
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-serif font-bold text-base text-white shadow-inner flex-shrink-0"
                    style={{ backgroundColor: person.colorTag }}
                  >
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-100 text-base">{person.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-amber-300 font-medium border border-stone-700/60">
                        {person.rank}
                      </span>
                      {!person.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                          Inactiv
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(person)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                    title="Modifică slujitor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(person.id, person.name)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
                    title="Șterge slujitor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact info & Notes */}
              <div className="mt-3 text-xs space-y-1 text-stone-400">
                {person.phone && (
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>{person.phone}</span>
                  </div>
                )}
                {person.notes && (
                  <p className="text-stone-400/90 italic bg-stone-950/40 p-2 rounded border border-stone-800/60">
                    „{person.notes}”
                  </p>
                )}
              </div>

              {/* Skills / Modules Pills */}
              <div className="mt-3 pt-3 border-t border-stone-800/80">
                <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
                  <span className="font-semibold uppercase tracking-wider text-stone-400">Ascultări compatibile:</span>
                  <span className="text-amber-400 flex items-center space-x-0.5" title="Total ture efectuate/programate">
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
                          className="text-[11px] px-2 py-0.5 rounded-md flex items-center space-x-1 border"
                          style={{
                            backgroundColor: `${mod.color}15`,
                            borderColor: `${mod.color}40`,
                            color: mod.color,
                          }}
                        >
                          {renderModuleIcon(mod.iconName, { className: 'w-3 h-3' })}
                          <span>{mod.name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-stone-500 italic">Nicio ascultare selectată</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-100">
            {/* Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
              <h3 className="font-serif font-bold text-lg text-amber-100">
                {editingPerson ? 'Modificare Slujitor' : 'Adăugare Slujitor Nou'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Nume Monahal sau de Mirean *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Părintele Sofronie sau Fratele Mihail"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Rank & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                    Rang / Statut
                  </label>
                  <select
                    value={formRank}
                    onChange={e => setFormRank(e.target.value as MonasticRank)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {RANKS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                    Telefon (opțional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 0740 000 000"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Color Tag */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5 block">
                  Culoare Distinctivă în Grafic
                </label>
                <div className="flex items-center space-x-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-stone-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Module Qualifications / Skills */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 block">
                  Ascultări la care poate fi programat:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modules.map(mod => {
                    const isChecked = formSkills.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleSkill(mod.id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-amber-950/30 border-amber-500 text-white'
                            : 'border-stone-800 hover:bg-stone-800/40 text-stone-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
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
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Notițe / Mențiuni (permis auto, tipic, sănătate etc.)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Permis categoria B & D, bun cântăreț etc."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="formActive"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className="rounded bg-stone-800 border-stone-700 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="formActive" className="text-xs text-stone-300 select-none cursor-pointer">
                  Membru activ în obște (poate fi repartizat de algoritm)
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow transition-colors"
                >
                  {editingPerson ? 'Salvează Modificările' : 'Adaugă Slujitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
