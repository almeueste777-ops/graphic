import { useState, useEffect } from 'react';
import type { Person, Module, Absence, SubstitutionRule, ScheduleAssignment, MonasterySettings } from '../types';
import { parseISO } from 'date-fns';
import { generateSchedule } from '../services/scheduler';

const STORAGE_KEY_PERSONS = 'graphic_monastery_persons_v5';
const STORAGE_KEY_MODULES = 'graphic_monastery_modules_v5';
const STORAGE_KEY_ABSENCES = 'graphic_monastery_absences_v5';
const STORAGE_KEY_RULES = 'graphic_monastery_rules_v5';
const STORAGE_KEY_SCHEDULE = 'graphic_monastery_schedule_v5';
const STORAGE_KEY_SETTINGS = 'graphic_monastery_settings_v5';

export const DEFAULT_MODULES: Module[] = [
  {
    id: 'altar',
    name: 'Altar',
    iconName: 'Church',
    color: '#8b1d24', // Roșu bizantin
    rotationCycle: 'weekly',
    description: 'Slujirea la Sfântul Altar (Sf. Liturghie, Vecernie, Utrenie)',
    roles: [
      { id: 'altar_preot', name: 'Preot slujitor de rând', requiredCount: 1 },
      { id: 'altar_diacon', name: 'Diacon slujitor', requiredCount: 1 },
      { id: 'altar_protos_sambata', name: 'Protos & Proscomidie Sâmbătă', requiredCount: 1 },
    ]
  },
  {
    id: 'predica',
    name: 'Predică',
    iconName: 'Scroll',
    color: '#b45309', // Auriu / amvon
    rotationCycle: 'daily',
    description: 'Cuvânt de învățătură liturgic (Duminici, Praznice, Sâmbete, Sfinți)',
    roles: [
      { id: 'predica_cuvant', name: 'Predicator de rând', requiredCount: 1 }
    ]
  },
  {
    id: 'biserica',
    name: 'În Biserică',
    iconName: 'Eye',
    color: '#059669', // Verde smarald
    rotationCycle: 'daily',
    description: 'Prezență și supraveghere în biserică, primirea credincioșilor și a pelerinilor, pomelnice',
    roles: [
      { id: 'biserica_rand', name: 'De rând în Biserică', requiredCount: 1 }
    ]
  },
  {
    id: 'strana',
    name: 'Strană',
    iconName: 'BookOpen',
    color: '#b38210', // Auriu
    rotationCycle: 'weekly',
    description: 'Cântarea la strană, tipicul bisericesc, citirea Ceasurilor și a Apostolului',
    roles: [
      { id: 'strana_psalt', name: 'Protopsalt (Strana 1)', requiredCount: 1 },
      { id: 'strana_ajutor', name: 'Ajutor Permanent / Cititor (Strana 2)', requiredCount: 1 }
    ]
  },
  {
    id: 'paracliserie',
    name: 'Paracliserie',
    iconName: 'Bell',
    color: '#c2410c', // Oranj roșiatic
    rotationCycle: 'weekly',
    description: 'Pregătirea bisericii, cădelnița, lumânările, toaca și clopotele',
    roles: [
      { id: 'paracliser_principal', name: 'Paracliser de rând', requiredCount: 1 }
    ]
  },
  {
    id: 'soferie',
    name: 'Șoferie',
    iconName: 'Car',
    color: '#1d4ed8', // Albastru
    rotationCycle: 'daily',
    description: 'Deplasări, aprovizionare, aeroport, urgențe mănăstirești',
    roles: [
      { id: 'sofer_garda', name: 'Șofer de serviciu', requiredCount: 1 }
    ]
  }
];

export const DEFAULT_PERSONS: Person[] = [
  {
    id: 'p_pamvo',
    name: 'Protos. Pamvo Dima',
    rank: 'Protosinghel',
    skills: ['altar', 'predica'],
    active: true,
    colorTag: '#7f1d1d',
    notes: 'Starețul Mănăstirii Bogdănești. Slujitor Altar & Predică la praznice și hramuri.',
  },
  {
    id: 'p_pantelimon',
    name: 'Ierom. Pantelimon',
    rank: 'Ieromonah',
    skills: ['altar', 'predica', 'biserica'],
    active: true,
    colorTag: '#8b1d24',
    notes: 'Eclesiarhul Mănăstirii Bogdănești. Preot slujitor Altar, Predică și de rând duminică în biserică.',
  },
  {
    id: 'p_mina',
    name: 'Protos. Mina',
    rank: 'Protosinghel',
    skills: ['altar', 'strana', 'predica'],
    active: true,
    colorTag: '#047857',
    notes: 'Economul Mănăstirii Bogdănești. Preot slujitor Altar, Protopsalt Strană 1, Predică la praznice.',
  },
  {
    id: 'p_avacum',
    name: 'Pr. Avacum',
    rank: 'Ieromonah',
    skills: ['altar', 'strana', 'strana_ajutor', 'paracliserie', 'soferie', 'predica', 'biserica'],
    active: true,
    colorTag: '#b45309',
    notes: 'Slujitor Altar, Strană 1 & 2, Paracliserie, Șoferie, Predică și de rând luni & miercuri în biserică.',
  },
  {
    id: 'p_sebastian',
    name: 'Pr. Sebastian',
    rank: 'Ieromonah',
    skills: ['altar', 'predica'],
    active: true,
    colorTag: '#6366f1',
    notes: 'Preot slujitor Altar, Predică la praznice împărătești & mari.',
  },
  {
    id: 'p_iliescu',
    name: 'Pr. Iliescu',
    rank: 'Preot',
    skills: ['altar', 'predica', 'biserica'],
    active: true,
    weekendOnly: true,
    colorTag: '#be185d',
    notes: 'Doar în weekenduri. Sâmbătă este Protos, face Proscomidia, stă de rând în biserică. La predică: 2 sâmbete/lună și praznice.',
  },
  {
    id: 'p_ciprian',
    name: 'Pr. Ciprian',
    rank: 'Ierodiacon',
    skills: ['altar', 'strana', 'paracliserie', 'predica', 'biserica'],
    active: true,
    colorTag: '#0284c7',
    notes: 'Diacon la Altar, Protopsalt Strană 1, Paracliserie, Predică și de rând marți & joi în biserică.',
  },
  {
    id: 'p_modest',
    name: 'Pr. Modest',
    rank: 'Ierodiacon',
    skills: ['altar', 'paracliserie', 'soferie', 'predica'],
    active: true,
    colorTag: '#7c3aed',
    notes: 'Secretarul Mănăstirii Bogdănești. Diacon la Altar, Șofer, Paracliserie, Predică.',
  },
  {
    id: 'p_petru',
    name: 'Pr. Petru',
    rank: 'Diacon',
    skills: ['altar', 'soferie', 'predica'],
    active: true,
    serviceWeeksPerMonth: 2,
    colorTag: '#0d9488',
    notes: 'Diacon de mir. Slujește 2 săptămâni pe lună (una da, una nu). Șofer. Predică.',
  },
  {
    id: 'p_grichentie',
    name: 'Pr. Grichentie',
    rank: 'Monah',
    skills: ['strana'],
    active: true,
    colorTag: '#ca8a04',
    notes: 'Protopsalt de bază la Strană 1.',
  },
  {
    id: 'p_ioan',
    name: 'Fr. Ioan',
    rank: 'Frate',
    skills: ['strana_ajutor', 'soferie'],
    active: true,
    colorTag: '#16a34a',
    notes: 'Ajutor permanent la Strană (Strana 2 / Cititor Ceasuri & Apostol) și Șofer.',
  },
  {
    id: 'p_damaschin',
    name: 'Pr. Damaschin',
    rank: 'Ieromonah',
    skills: ['strana_ajutor'],
    active: true,
    colorTag: '#475569',
    notes: 'Ajutor la Strană (înlocuitor Strana 2 / Cititor Ceasuri, Apostol).',
  },
  {
    id: 'p_arghir',
    name: 'Fr. Arghir',
    rank: 'Monah',
    skills: ['paracliserie', 'biserica'],
    active: true,
    colorTag: '#ea580c',
    notes: 'Paracliser de rând și de rând vineri în biserică.',
  },
  {
    id: 'p_spiridon',
    name: 'Pr. Spiridon',
    rank: 'Ieromonah',
    skills: ['soferie'],
    active: true,
    colorTag: '#2563eb',
    notes: 'Șofer de bază al mănăstirii.',
  },
];

export const DEFAULT_RULES: SubstitutionRule[] = [
  {
    id: 'rule_altar_preot',
    moduleId: 'altar',
    targetPersonId: 'p_pantelimon',
    substituteIds: ['p_avacum', 'p_mina', 'p_sebastian'],
    notes: 'Dacă Pr. Pantelimon este învoit la Altar, slujește Pr. Avacum, apoi Pr. Mina.',
  },
  {
    id: 'rule_diacon',
    moduleId: 'altar',
    targetPersonId: 'p_ciprian',
    substituteIds: ['p_modest', 'p_petru'],
    notes: 'Dacă Pr. Ciprian lipsește de la diaconie, intră Pr. Modest sau Pr. Petru.',
  },
  {
    id: 'rule_strana',
    moduleId: 'strana',
    targetPersonId: 'p_grichentie',
    substituteIds: ['p_ciprian', 'p_mina', 'p_avacum'],
    notes: 'Dacă Pr. Grichentie este învoit, cântă Pr. Ciprian sau Pr. Mina.',
  },
  {
    id: 'rule_strana_ajutor',
    moduleId: 'strana',
    targetPersonId: 'p_ioan',
    substituteIds: ['p_avacum', 'p_damaschin'],
    notes: 'Dacă Fr. Ioan (ajutor permanent la strană) este învoit, îl înlocuiește Pr. Avacum sau Pr. Damaschin.',
  },
  {
    id: 'rule_paracliserie',
    moduleId: 'paracliserie',
    targetPersonId: 'p_arghir',
    substituteIds: ['p_modest', 'p_ciprian', 'p_avacum'],
    notes: 'Dacă Fr. Arghir este învoit de la paracliserie, preia Pr. Modest.',
  },
  {
    id: 'rule_soferie',
    moduleId: 'soferie',
    targetPersonId: 'p_spiridon',
    substituteIds: ['p_modest', 'p_petru', 'p_avacum', 'p_ioan'],
    notes: 'Dacă Pr. Spiridon este indisponibil, preia Pr. Modest sau Pr. Petru.',
  },
  {
    id: 'rule_predica_sebastian',
    moduleId: 'predica',
    targetPersonId: 'p_sebastian',
    substituteIds: ['p_avacum', 'p_mina', 'p_pantelimon'],
    notes: 'Dacă Pr. Sebastian este plecat, predică Pr. Avacum sau Pr. Mina.',
  },
  {
    id: 'rule_biserica_pantelimon',
    moduleId: 'biserica',
    targetPersonId: 'p_pantelimon',
    substituteIds: ['p_avacum', 'p_mina', 'p_ciprian'],
    notes: 'Duminică în Biserică: dacă Pr. Pantelimon lipsește, preia Pr. Avacum.',
  },
  {
    id: 'rule_biserica_avacum',
    moduleId: 'biserica',
    targetPersonId: 'p_avacum',
    substituteIds: ['p_ciprian', 'p_pantelimon', 'p_modest'],
    notes: 'Luni/Miercuri în Biserică: dacă Pr. Avacum lipsește, preia Pr. Ciprian.',
  },
  {
    id: 'rule_biserica_ciprian',
    moduleId: 'biserica',
    targetPersonId: 'p_ciprian',
    substituteIds: ['p_avacum', 'p_modest', 'p_arghir'],
    notes: 'Marți/Joi în Biserică: dacă Pr. Ciprian lipsește, preia Pr. Avacum.',
  },
  {
    id: 'rule_biserica_arghir',
    moduleId: 'biserica',
    targetPersonId: 'p_arghir',
    substituteIds: ['p_modest', 'p_ciprian', 'p_avacum'],
    notes: 'Vineri în Biserică: dacă Fr. Arghir lipsește, preia Pr. Modest.',
  },
  {
    id: 'rule_biserica_iliescu',
    moduleId: 'biserica',
    targetPersonId: 'p_iliescu',
    substituteIds: ['p_pantelimon', 'p_avacum', 'p_mina'],
    notes: 'Sâmbătă în Biserică: dacă Pr. Iliescu lipsește, preia Pr. Pantelimon.',
  }
];

export const DEFAULT_SETTINGS: MonasterySettings = {
  monasteryName: 'Mănăstirea Bogdănești',
  monasterySubtitle: 'Arhiepiscopia Sucevei și Rădăuților',
  abbotName: 'Protos. Pamvo Dima',
  ecclesiarchName: 'Ierom. Pantelimon',
  economName: 'Protos. Mina',
  secretaryName: 'Pr. Modest',
  location: 'Bogdănești, Suceava',
  weekStartDay: 6, // Sâmbătă seara începe rândul liturgic (practică monahală)
  autoAvoidDoubleBooking: true,
};

export const DEFAULT_ABSENCES: Absence[] = [
  {
    id: 'abs_sebastian_default',
    personId: 'p_sebastian',
    startDate: '2026-09-12',
    endDate: '2026-09-18',
    reason: 'Învoire / Misiune',
    details: 'Plecat 7 zile (săptămână liberă / învoire)',
    preferredSubstituteId: 'p_avacum',
  }
];

export const DEFAULT_SCHEDULE: ScheduleAssignment[] = generateSchedule({
  startDate: parseISO('2026-09-12'),
  endDate: parseISO('2026-09-18'),
  persons: DEFAULT_PERSONS,
  modules: DEFAULT_MODULES,
  absences: DEFAULT_ABSENCES,
  substitutionRules: DEFAULT_RULES,
  existingAssignments: [],
  avoidDoubleBooking: true,
}).assignments;

// Global reactive event bus for storage synchronization across components
const listeners: (() => void)[] = [];
function notify() {
  listeners.forEach(l => l());
}

export function useMonasteryData() {
  const [persons, setPersonsState] = useState<Person[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PERSONS);
    return saved ? JSON.parse(saved) : DEFAULT_PERSONS;
  });

  const [modules, setModulesState] = useState<Module[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MODULES);
    return saved ? JSON.parse(saved) : DEFAULT_MODULES;
  });

  const [absences, setAbsencesState] = useState<Absence[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ABSENCES);
    return saved ? JSON.parse(saved) : DEFAULT_ABSENCES;
  });

  const [rules, setRulesState] = useState<SubstitutionRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RULES);
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  const [schedule, setScheduleState] = useState<ScheduleAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
    return saved ? JSON.parse(saved) : DEFAULT_SCHEDULE;
  });

  const [settings, setSettingsState] = useState<MonasterySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Sync listener
  useEffect(() => {
    const handleUpdate = () => {
      const p = localStorage.getItem(STORAGE_KEY_PERSONS);
      const m = localStorage.getItem(STORAGE_KEY_MODULES);
      const a = localStorage.getItem(STORAGE_KEY_ABSENCES);
      const r = localStorage.getItem(STORAGE_KEY_RULES);
      const s = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      const set = localStorage.getItem(STORAGE_KEY_SETTINGS);

      if (p) setPersonsState(JSON.parse(p));
      if (m) setModulesState(JSON.parse(m));
      if (a) setAbsencesState(JSON.parse(a));
      if (r) setRulesState(JSON.parse(r));
      if (s) setScheduleState(JSON.parse(s));
      if (set) setSettingsState(JSON.parse(set));
    };

    listeners.push(handleUpdate);
    return () => {
      const index = listeners.indexOf(handleUpdate);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const setPersons = (newPersons: Person[] | ((prev: Person[]) => Person[])) => {
    setPersonsState(prev => {
      const updated = typeof newPersons === 'function' ? newPersons(prev) : newPersons;
      localStorage.setItem(STORAGE_KEY_PERSONS, JSON.stringify(updated));
      notify();
      return updated;
    });
  };

  const setModules = (newModules: Module[] | ((prev: Module[]) => Module[])) => {
    setModulesState(prev => {
      const updated = typeof newModules === 'function' ? newModules(prev) : newModules;
      localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(updated));
      notify();
      return updated;
    });
  };

  const setAbsences = (newAbsences: Absence[] | ((prev: Absence[]) => Absence[])) => {
    setAbsencesState(prev => {
      const updated = typeof newAbsences === 'function' ? newAbsences(prev) : newAbsences;
      localStorage.setItem(STORAGE_KEY_ABSENCES, JSON.stringify(updated));
      notify();
      return updated;
    });
  };

  const addAbsence = (absenceData: Omit<Absence, 'id'>): Absence => {
    const newAbsence: Absence = {
      ...absenceData,
      id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setAbsences(prev => [...prev, newAbsence]);
    return newAbsence;
  };

  const deleteAbsence = (absenceId: string) => {
    setAbsences(prev => prev.filter(a => a.id !== absenceId));
  };

  const setRules = (newRules: SubstitutionRule[] | ((prev: SubstitutionRule[]) => SubstitutionRule[])) => {
    setRulesState(prev => {
      const updated = typeof newRules === 'function' ? newRules(prev) : newRules;
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(updated));
      notify();
      return updated;
    });
  };

  const setSchedule = (newSchedule: ScheduleAssignment[] | ((prev: ScheduleAssignment[]) => ScheduleAssignment[])) => {
    setScheduleState(prev => {
      const updated = typeof newSchedule === 'function' ? newSchedule(prev) : newSchedule;
      localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(updated));
      notify();
      return updated;
    });
  };

  const setSettings = (newSettings: MonasterySettings | ((prev: MonasterySettings) => MonasterySettings)) => {
    setSettingsState(prev => {
      const updated = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      notify();
      return updated;
    });
  };

  // Delete any module cleanly and update skills & rules
  const deleteModule = (moduleId: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleId));
    setPersons(prev => prev.map(p => ({
      ...p,
      skills: p.skills.filter(s => s !== moduleId)
    })));
    setRules(prev => prev.filter(r => r.moduleId !== moduleId));
    setSchedule(prev => prev.filter(a => a.moduleId !== moduleId));
  };

  // Reorder modules (Up / Down)
  const moveModule = (index: number, direction: 'up' | 'down') => {
    setModules(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const resetToDefaults = () => {
    localStorage.setItem(STORAGE_KEY_PERSONS, JSON.stringify(DEFAULT_PERSONS));
    localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(DEFAULT_MODULES));
    localStorage.setItem(STORAGE_KEY_ABSENCES, JSON.stringify(DEFAULT_ABSENCES));
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(DEFAULT_RULES));
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(DEFAULT_SCHEDULE));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    notify();
  };

  const exportAllDataJson = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      persons,
      modules,
      absences,
      rules,
      schedule,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphic_manastire_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAllDataJson = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.persons) setPersons(data.persons);
      if (data.modules) setModules(data.modules);
      if (data.absences) setAbsences(data.absences);
      if (data.rules) setRules(data.rules);
      if (data.schedule) setSchedule(data.schedule);
      if (data.settings) setSettings(data.settings);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  };

  return {
    persons,
    modules,
    absences,
    rules,
    schedule,
    settings,
    setPersons,
    setModules,
    setAbsences,
    addAbsence,
    deleteAbsence,
    setRules,
    setSchedule,
    setSettings,
    deleteModule,
    moveModule,
    resetToDefaults,
    exportAllDataJson,
    importAllDataJson,
  };
}
