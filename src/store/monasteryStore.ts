import { useState, useEffect } from 'react';
import type { Person, Module, Absence, SubstitutionRule, ScheduleAssignment, MonasterySettings } from '../types';

const STORAGE_KEY_PERSONS = 'graphic_monastery_persons_v1';
const STORAGE_KEY_MODULES = 'graphic_monastery_modules_v1';
const STORAGE_KEY_ABSENCES = 'graphic_monastery_absences_v1';
const STORAGE_KEY_RULES = 'graphic_monastery_rules_v1';
const STORAGE_KEY_SCHEDULE = 'graphic_monastery_schedule_v1';
const STORAGE_KEY_SETTINGS = 'graphic_monastery_settings_v1';

export const DEFAULT_MODULES: Module[] = [
  {
    id: 'altar',
    name: 'Altar',
    iconName: 'Church',
    color: '#8b1d24', // Roșu bizantin
    rotationCycle: 'weekly',
    isSystem: true,
    description: 'Slujitor de rând la Sfântul Altar (Sf. Liturghie, Vecernie, Utrenie)',
    roles: [
      { id: 'altar_preot', name: 'Preot slujitor de rând', requiredCount: 1 },
      { id: 'altar_ajutor', name: 'Diacon / Ajutor Altar', requiredCount: 1 }
    ]
  },
  {
    id: 'strana',
    name: 'Strană',
    iconName: 'BookOpen',
    color: '#b38210', // Auriu
    rotationCycle: 'weekly',
    isSystem: true,
    description: 'Cântarea la strană, tipicul bisericesc, citirea Ceasurilor și a Apostolului',
    roles: [
      { id: 'strana_psalt', name: 'Protopsalt (Strana 1)', requiredCount: 1 },
      { id: 'strana_ajutor', name: 'Ajutor / Cititor (Ceasuri, Apostol)', requiredCount: 1 }
    ]
  },
  {
    id: 'paracliserie',
    name: 'Paracliserie',
    iconName: 'Bell',
    color: '#c2410c', // Oranj roșiatic
    rotationCycle: 'weekly',
    isSystem: true,
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
    isSystem: true,
    description: 'Deplasări, aprovizionare, aeroport, urgențe mănăstirești',
    roles: [
      { id: 'sofer_garda', name: 'Șofer de serviciu', requiredCount: 1 }
    ]
  },
  {
    id: 'trapeza',
    name: 'Trapeză & Bucătărie',
    iconName: 'Utensils',
    color: '#047857', // Verde smarald
    rotationCycle: 'weekly',
    isSystem: false,
    description: 'Gătirea mesei pentru obște și pelerini, orânduirea trapezei',
    roles: [
      { id: 'bucatar_rand', name: 'Bucătar de rând', requiredCount: 1 },
      { id: 'ajutor_trapeza', name: 'Ajutor trapeză', requiredCount: 1 }
    ]
  }
];

export const DEFAULT_PERSONS: Person[] = [
  {
    id: 'p1',
    name: 'Părintele Paisie',
    rank: 'Arhimandrit',
    phone: '0740 111 222',
    skills: ['altar', 'soferie'],
    active: true,
    colorTag: '#8b1d24',
    notes: 'Starețul mănăstirii. De rând la Altar prin rotație cu ieromonahii.',
  },
  {
    id: 'p2',
    name: 'Părintele Sofronie',
    rank: 'Ieromonah',
    phone: '0741 222 333',
    skills: ['altar', 'strana'],
    active: true,
    colorTag: '#b38210',
    notes: 'Eclesiarh. Cântăreț și slujitor experimentat.',
  },
  {
    id: 'p3',
    name: 'Părintele Teofan',
    rank: 'Ieromonah',
    phone: '0742 333 444',
    skills: ['altar', 'strana', 'soferie'],
    active: true,
    colorTag: '#6366f1',
    notes: 'Are permis categoria B & D.',
  },
  {
    id: 'p4',
    name: 'Părintele Siluan',
    rank: 'Ierodiacon',
    phone: '0743 444 555',
    skills: ['altar', 'strana', 'paracliserie'],
    active: true,
    colorTag: '#10b981',
    notes: 'Slujire ca diacon la Altar și cititor la Strană.',
  },
  {
    id: 'p5',
    name: 'Părintele Arsenie',
    rank: 'Monah',
    phone: '0744 555 666',
    skills: ['strana', 'paracliserie', 'soferie'],
    active: true,
    colorTag: '#f59e0b',
    notes: 'Cântăreț la strană și paracliser.',
  },
  {
    id: 'p6',
    name: 'Părintele Ilarion',
    rank: 'Monah',
    phone: '0745 666 777',
    skills: ['paracliserie', 'trapeza'],
    active: true,
    colorTag: '#ec4899',
    notes: 'Bun rânduitor al bisericii și al bucătăriei.',
  },
  {
    id: 'p7',
    name: 'Fratele Ioan',
    rank: 'Frate',
    phone: '0746 777 888',
    skills: ['paracliserie', 'trapeza', 'soferie'],
    active: true,
    colorTag: '#06b6d4',
    notes: 'Tânăr, energic, disponibil pentru deplasări.',
  },
  {
    id: 'p8',
    name: 'Fratele Vasile',
    rank: 'Frate',
    phone: '0747 888 999',
    skills: ['strana', 'trapeza'],
    active: true,
    colorTag: '#8b5cf6',
    notes: 'Voce bună la Ceasuri și la strană.',
  }
];

export const DEFAULT_RULES: SubstitutionRule[] = [
  {
    id: 'rule_1',
    moduleId: 'altar',
    targetPersonId: 'p3', // Părintele Teofan
    substituteIds: ['p2', 'p1'], // Înlocuitor Părintele Sofronie, apoi Paisie
    notes: 'Dacă Părintele Teofan este învoit la Altar, slujește Părintele Sofronie.',
  },
  {
    id: 'rule_2',
    moduleId: 'paracliserie',
    targetPersonId: 'p7', // Fratele Ioan
    substituteIds: ['p6', 'p5'], // Monahul Ilarion, apoi Arsenie
    notes: 'Dacă Fratele Ioan lipsește de la paracliserie, intră Părintele Ilarion.',
  }
];

export const DEFAULT_SETTINGS: MonasterySettings = {
  monasteryName: 'Mănăstirea Înălțarea Domnului',
  abbotName: 'Arhim. Paisie',
  ecclesiarchName: 'Ierom. Sofronie',
  location: 'Schitul din Deal',
  weekStartDay: 1,
  autoAvoidDoubleBooking: true,
};

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
    return saved ? JSON.parse(saved) : [];
  });

  const [rules, setRulesState] = useState<SubstitutionRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RULES);
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  const [schedule, setScheduleState] = useState<ScheduleAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
    return saved ? JSON.parse(saved) : [];
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

  const resetToDefaults = () => {
    localStorage.setItem(STORAGE_KEY_PERSONS, JSON.stringify(DEFAULT_PERSONS));
    localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(DEFAULT_MODULES));
    localStorage.setItem(STORAGE_KEY_ABSENCES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(DEFAULT_RULES));
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify([]));
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
    setRules,
    setSchedule,
    setSettings,
    resetToDefaults,
    exportAllDataJson,
    importAllDataJson,
  };
}
