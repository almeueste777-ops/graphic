export type MonasticRank = 
  | 'Arhimandrit'
  | 'Protosinghel'
  | 'Ieromonah'
  | 'Ierodiacon'
  | 'Monah'
  | 'Rasofor'
  | 'Frate'
  | 'Voluntar / Miren';

export interface Person {
  id: string;
  name: string;
  rank: MonasticRank;
  phone?: string;
  skills: string[]; // module IDs this person is qualified/able to serve in
  active: boolean;
  notes?: string;
  colorTag: string; // for color coding
  orderIndex?: number;
}

export interface ModuleRole {
  id: string;
  name: string;
  description?: string;
  requiredCount: number; // how many people needed for this role simultaneously
}

export interface Module {
  id: string;
  name: string;
  iconName: string;
  color: string;
  roles: ModuleRole[];
  rotationCycle: 'weekly' | 'daily';
  isSystem: boolean; // default builtin modules vs custom user modules
  description?: string;
}

export type AbsenceReason = 
  | 'Învoire / Misiune'
  | 'Săptămână de chilie'
  | 'Spital / Medical'
  | 'Deplasare / Aprovizionare'
  | 'Ascultare externă'
  | 'Alt motiv';

export interface Absence {
  id: string;
  personId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: AbsenceReason;
  details?: string;
  preferredSubstituteId?: string; // Explicit substitute defined by user
}

export interface SubstitutionRule {
  id: string;
  moduleId: string; // or 'any'
  targetPersonId: string; // when this person is unavailable
  substituteIds: string[]; // prioritized chain of replacement persons (first available takes it)
  notes?: string;
}

export interface ScheduleAssignment {
  id: string;
  date: string; // YYYY-MM-DD
  moduleId: string;
  roleId: string;
  slotIndex: number; // e.g. 0 for first person in role, 1 for second
  personId: string | null;
  status: 'auto' | 'manual' | 'substituted';
  substitutedFromId?: string;
  notes?: string;
}

export interface MonasterySettings {
  monasteryName: string;
  abbotName: string;
  ecclesiarchName: string;
  location: string;
  weekStartDay: 1; // 1 = Monday
  autoAvoidDoubleBooking: boolean; // cannot be in Altar and Strana or Driving on same day/service
}
