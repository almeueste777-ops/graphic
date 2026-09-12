import React, { useState } from 'react';
import type { Module, ModuleRole, Person, ScheduleAssignment, MonasterySettings, Absence, SubstitutionRule } from '../types';
import { AVAILABLE_ICONS, renderModuleIcon } from '../utils/iconHelper';
import { generateSchedule } from '../services/scheduler';
import { startOfWeek, endOfWeek } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Layers, 
  Users, 
  ArrowUp, 
  ArrowDown, 
  Palette,
  CheckCircle2
} from 'lucide-react';

const PRESET_MODULE_COLORS = [
  '#8b1d24', '#b38210', '#1d4ed8', '#047857', '#c2410c',
  '#7c3aed', '#db2777', '#0891b2', '#4b5563', '#0f766e',
  '#b45309', '#4338ca', '#be123c', '#15803d', '#334155'
];

interface ModulesViewProps {
  modules: Module[];
  setModules: (updater: Module[] | ((prev: Module[]) => Module[])) => void;
  persons: Person[];
  deleteModule: (moduleId: string) => void;
  moveModule: (index: number, direction: 'up' | 'down') => void;
  schedule?: ScheduleAssignment[];
  setSchedule?: (updater: ScheduleAssignment[] | ((prev: ScheduleAssignment[]) => ScheduleAssignment[])) => void;
  settings?: MonasterySettings;
  absences?: Absence[];
  rules?: SubstitutionRule[];
  currentDate?: Date;
}

export const ModulesView: React.FC<ModulesViewProps> = ({
  modules,
  setModules,
  persons,
  deleteModule,
  moveModule,
  schedule,
  setSchedule,
  settings,
  absences,
  rules,
  currentDate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Church');
  const [formColor, setFormColor] = useState(PRESET_MODULE_COLORS[0]);
  const [formCycle, setFormCycle] = useState<'weekly' | 'daily'>('weekly');
  const [formDescription, setFormDescription] = useState('');
  const [formRoles, setFormRoles] = useState<{ id: string; name: string; requiredCount: number }[]>([
    { id: 'role_1', name: 'Slujitor principal de rând', requiredCount: 1 }
  ]);

  const openAddModal = () => {
    setEditingModule(null);
    setFormName('');
    setFormIcon('Church');
    setFormColor(PRESET_MODULE_COLORS[Math.floor(Math.random() * PRESET_MODULE_COLORS.length)]);
    setFormCycle('weekly');
    setFormDescription('');
    setFormRoles([{ id: `role_${Date.now()}`, name: 'Persoană de rând', requiredCount: 1 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (mod: Module) => {
    setEditingModule(mod);
    setFormName(mod.name);
    setFormIcon(mod.iconName);
    setFormColor(mod.color);
    setFormCycle(mod.rotationCycle);
    setFormDescription(mod.description || '');
    setFormRoles(mod.roles.map(r => ({ ...r })));
    setIsModalOpen(true);
  };

  const handleAddRoleRow = () => {
    setFormRoles(prev => [
      ...prev,
      { id: `role_${Date.now()}`, name: `Rol #${prev.length + 1}`, requiredCount: 1 }
    ]);
  };

  const handleRemoveRoleRow = (index: number) => {
    if (formRoles.length <= 1) return;
    setFormRoles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index: number, name: string, requiredCount: number) => {
    setFormRoles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name, requiredCount };
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const formattedRoles: ModuleRole[] = formRoles
      .filter(r => r.name.trim().length > 0)
      .map(r => ({
        id: r.id,
        name: r.name.trim(),
        requiredCount: Math.max(1, r.requiredCount || 1),
      }));

    if (formattedRoles.length === 0) {
      formattedRoles.push({ id: `role_${Date.now()}`, name: 'Slujitor de rând', requiredCount: 1 });
    }

    let updatedModules: Module[];

    if (editingModule) {
      updatedModules = modules.map(m =>
        m.id === editingModule.id
          ? {
              ...m,
              name: formName.trim(),
              iconName: formIcon,
              color: formColor,
              rotationCycle: formCycle,
              description: formDescription.trim() || undefined,
              roles: formattedRoles,
            }
          : m
      );
      setModules(updatedModules);
    } else {
      const newModule: Module = {
        id: `mod_${Date.now()}`,
        name: formName.trim(),
        iconName: formIcon,
        color: formColor,
        rotationCycle: formCycle,
        description: formDescription.trim() || undefined,
        roles: formattedRoles,
      };
      updatedModules = [...modules, newModule];
      setModules(updatedModules);
    }

    // Cross-module correlation: automatically update schedule with modified modules
    if (setSchedule && schedule && settings && absences && rules) {
      const weekStartsOn = settings.weekStartDay ?? 6;
      const curDate = currentDate || new Date(2026, 8, 12);
      const weekStart = startOfWeek(curDate, { weekStartsOn });
      const weekEnd = endOfWeek(curDate, { weekStartsOn });

      const result = generateSchedule({
        startDate: weekStart,
        endDate: weekEnd,
        persons,
        modules: updatedModules,
        absences,
        substitutionRules: rules,
        existingAssignments: schedule,
        avoidDoubleBooking: settings.autoAvoidDoubleBooking,
      });

      setSchedule(result.assignments);
      setSyncFeedback(`Ascultarea „${formName.trim()}” a fost salvată! Programul și foaia de tipărit au fost sincronizate.`);
      setTimeout(() => setSyncFeedback(null), 6000);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Sigur doriți să ștergeți ascultarea „${name}”? Aceasta va fi eliminată din grafic și din lista tuturor slujitorilor.`)) {
      deleteModule(id);
      setSyncFeedback(`Ascultarea „${name}” a fost ștearsă și curățată din grafic.`);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center space-x-2.5 animate-in fade-in duration-200 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Header & Add Module Action */}
      <div className="apple-glass rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Gestionare Ascultări & Module</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-mono border border-white/5">
              {modules.length}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            Personalizați, ordonați sau adăugați ascultări pentru slujbele și activitățile mănăstirii
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="apple-gold-button flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 fill-black text-black" />
          <span>Adaugă Ascultare</span>
        </button>
      </div>

      {/* Modules Cards Grid (Apple Settings Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, index) => {
          const qualifiedCount = persons.filter(p => p.skills.includes(mod.id) && p.active).length;

          return (
            <div
              key={mod.id}
              className="apple-card rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
            >
              <div>
                {/* Header of card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                      style={{ 
                        backgroundColor: `${mod.color}20`, 
                        color: mod.color,
                        border: `1px solid ${mod.color}40`,
                        boxShadow: `0 4px 14px ${mod.color}25`
                      }}
                    >
                      {renderModuleIcon(mod.iconName, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base tracking-tight leading-snug">
                        {mod.name}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/5">
                          {mod.rotationCycle === 'weekly' ? 'Săptămânal' : 'Zilnic'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reorder, Edit, Delete */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveModule(index, 'up')}
                      disabled={index === 0}
                      className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-white/50 hover:text-white flex items-center justify-center disabled:opacity-20 transition-all"
                      title="Mută mai sus în grafic"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveModule(index, 'down')}
                      disabled={index === modules.length - 1}
                      className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-white/50 hover:text-white flex items-center justify-center disabled:opacity-20 transition-all"
                      title="Mută mai jos în grafic"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(mod)}
                      className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-all"
                      title="Modifică ascultarea"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(mod.id, mod.name)}
                      className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-rose-500/20 text-white/40 hover:text-rose-300 flex items-center justify-center transition-all"
                      title="Șterge ascultarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {mod.description && (
                  <p className="mt-3 text-xs text-white/50 leading-relaxed">
                    {mod.description}
                  </p>
                )}

                {/* Roles list */}
                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block">
                    Roluri & Posturi:
                  </span>
                  {mod.roles.map(role => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between text-xs bg-white/[0.03] px-3 py-1.5 rounded-2xl border border-white/[0.05]"
                    >
                      <span className="text-white/80 font-medium">{role.name}</span>
                      <span className="text-[10px] text-amber-300/90 font-semibold bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/5">
                        {role.requiredCount} {role.requiredCount === 1 ? 'persoană' : 'persoane'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer info: qualified monks */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-white/30" />
                  <span>Slujitori apți:</span>
                </div>
                <span className={`font-semibold ${qualifiedCount > 0 ? 'text-white/90' : 'text-rose-400'}`}>
                  {qualifiedCount} {qualifiedCount === 1 ? 'slujitor' : 'slujitori'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Module Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="apple-glass rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-white border border-white/15">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-semibold text-lg text-white">
                {editingModule ? `Modificare: ${editingModule.name}` : 'Adăugare Ascultare Nouă'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/60 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Denumire Ascultare *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Altar, Strană, Pangar, Bucătărie..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Descriere sau Responsabilități
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Îndatoriri, rânduială, program..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              {/* Rotation Cycle (Apple Segmented Control) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Ciclul de Rotație
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormCycle('weekly')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formCycle === 'weekly'
                        ? 'bg-amber-500/15 border-amber-400/50 text-white shadow-xs'
                        : 'border-white/[0.08] hover:bg-white/[0.04] text-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Săptămânal</span>
                      {formCycle === 'weekly' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      Aceeași persoană este de rând toată săptămâna
                    </p>
                  </div>

                  <div
                    onClick={() => setFormCycle('daily')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formCycle === 'daily'
                        ? 'bg-amber-500/15 border-amber-400/50 text-white shadow-xs'
                        : 'border-white/[0.08] hover:bg-white/[0.04] text-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Zilnic</span>
                      {formCycle === 'daily' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      Turele se schimbă în fiecare zi
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Icon Picker */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block">
                  Pictogramă
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVAILABLE_ICONS.map(icon => {
                    const isSelected = formIcon.toLowerCase() === icon.name.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={icon.name}
                        onClick={() => setFormIcon(icon.name)}
                        title={icon.label}
                        className={`p-2.5 rounded-2xl flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-amber-400 text-black border-amber-300 scale-105 shadow-md'
                            : 'border-white/[0.08] hover:bg-white/[0.06] text-white/70'
                        }`}
                      >
                        {renderModuleIcon(icon.name, { className: 'w-4 h-4' })}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker: Palette + Custom Color */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 flex items-center justify-between">
                  <span>Culoare Tematică</span>
                  <span className="text-[10px] font-mono text-white/40">{formColor}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_MODULE_COLORS.map(c => (
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

              {/* Roles & Required Persons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                    Roluri & Număr de Slujitori
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRoleRow}
                    className="text-xs text-amber-300 hover:text-amber-200 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adaugă rol</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formRoles.map((role, idx) => (
                    <div key={role.id || idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Nume rol (ex: Slujitor de rând)"
                        value={role.name}
                        onChange={e => handleRoleChange(idx, e.target.value, role.requiredCount)}
                        className="flex-1 px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-all"
                      />
                      <div className="flex items-center space-x-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-2.5 py-1.5">
                        <span className="text-[10px] text-white/40">Nr:</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={role.requiredCount}
                          onChange={e => handleRoleChange(idx, role.name, parseInt(e.target.value) || 1)}
                          className="w-8 text-xs text-center bg-transparent text-amber-300 font-bold focus:outline-none"
                        />
                      </div>
                      {formRoles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoleRow(idx)}
                          className="w-7 h-7 rounded-full text-white/40 hover:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  {editingModule ? 'Salvează' : 'Creează'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
