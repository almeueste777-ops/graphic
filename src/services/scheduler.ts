import type { Person, Module, Absence, SubstitutionRule, ScheduleAssignment } from '../types';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { getDayLiturgicalInfo } from './orthodoxCalendar';

export interface GenerateScheduleParams {
  startDate: Date;
  endDate: Date;
  persons: Person[];
  modules: Module[];
  absences: Absence[];
  substitutionRules: SubstitutionRule[];
  existingAssignments: ScheduleAssignment[];
  avoidDoubleBooking: boolean;
  weekIndexOverride?: number;
}

export interface GenerationResult {
  assignments: ScheduleAssignment[];
  warnings: string[];
}

export interface GenerateCycleScheduleParams {
  startDate?: Date;
  referenceDate?: Date;
  persons: Person[];
  modules: Module[];
  absences: Absence[];
  substitutionRules: SubstitutionRule[];
  existingAssignments: ScheduleAssignment[];
  avoidDoubleBooking?: boolean;
  weeksCount?: number;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export interface CycleWeekSummary {
  weekIndex: number;
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  altarPriestId: string | null;
  deaconId: string | null;
  stranaPriestId: string | null;
  ascultariPriestId: string | null;
  liberPriestId: string | null;
  protosSaturdayId: string | null;
  paracliserId: string | null;
  soferId: string | null;
  assignmentsCount: number;
}

export interface CycleGenerationSummary extends GenerationResult {
  cycleStartDate: Date;
  cycleEndDate: Date;
  cycleStartDateStr: string;
  cycleEndDateStr: string;
  weeks: CycleWeekSummary[];
}

/**
 * Checks if a person is absent on a specific date
 */
export function isPersonAbsent(personId: string, date: Date, absences: Absence[]): Absence | undefined {
  const targetTime = date.getTime();
  return absences.find(abs => {
    if (abs.personId !== personId) return false;
    const start = startOfDay(parseISO(abs.startDate)).getTime();
    const end = endOfDay(parseISO(abs.endDate)).getTime();
    return targetTime >= start && targetTime <= end;
  });
}

/**
 * Checks if a person is available on a given date considering weekendOnly restrictions
 */
export function isPersonAvailableOnDate(person: Person, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
  if (person.weekendOnly) {
    // Only available on Saturday or Sunday
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  return true;
}

/**
 * Counts how many assignments a person already has in a list of assignments
 */
export function getAssignmentCount(personId: string, assignments: ScheduleAssignment[]): number {
  return assignments.filter(a => a.personId === personId).length;
}

export type MonasticDutyCategory = 'altar' | 'strana' | 'ascultari' | 'liber';

export interface PersonWeeklyDutyStatus {
  personId: string;
  category: MonasticDutyCategory;
  label: string;
  description: string;
}

/**
 * Calculates the week index in the 4-week monastic cycle (1, 2, 3, 4).
 */
export function getMonasticWeekIndex(date: Date): number {
  const day = date.getDate();
  return ((Math.floor((day - 1) / 7)) % 4) + 1;
}

/**
 * Calculates the starting date of the 4-week monastic cycle that contains the given date.
 */
export function getCycleStartDate(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 6): Date {
  const currentWeekStart = startOfWeek(date, { weekStartsOn });
  const weekIdx = getMonasticWeekIndex(currentWeekStart);
  return subWeeks(currentWeekStart, weekIdx - 1);
}

/**
 * Calculates the 4-week monastic duty rotation for the serving hieromonks.
 * Every hieromonk gets:
 * - 1 week of Altar (Priest of the week)
 * - 1 week of Strană (Chanting / Reading)
 * - 1 week of Ascultări (Church standing, monastery duties)
 * - 1 week Liberă (Cell, rest, prayer)
 */
export function getPriestMonthlyDuty(personId: string, weekIndex: number): MonasticDutyCategory {
  const cycleIndex = ((weekIndex - 1) % 4) + 1; // 1, 2, 3, 4

  // Rotation matrix:
  // Week 1: Pantelimon (Altar), Avacum (Strană), Sebastian (Ascultări), Mina (Liber)
  // Week 2: Avacum (Altar), Mina (Strană), Pantelimon (Ascultări), Sebastian (Liber)
  // Week 3: Sebastian (Altar), Pantelimon (Strană), Mina (Ascultări), Avacum (Liber)
  // Week 4: Mina (Altar), Sebastian (Strană), Avacum (Ascultări), Pantelimon (Liber)
  const priestSchedule: Record<number, Record<string, MonasticDutyCategory>> = {
    1: { p_pantelimon: 'altar', p_avacum: 'strana', p_sebastian: 'ascultari', p_mina: 'liber' },
    2: { p_avacum: 'altar', p_mina: 'strana', p_pantelimon: 'ascultari', p_sebastian: 'liber' },
    3: { p_sebastian: 'altar', p_pantelimon: 'strana', p_mina: 'ascultari', p_avacum: 'liber' },
    4: { p_mina: 'altar', p_sebastian: 'strana', p_avacum: 'ascultari', p_pantelimon: 'liber' },
  };

  return priestSchedule[cycleIndex]?.[personId] || 'ascultari';
}

/**
 * Finds which priest is designated for a specific duty in a given week of the month.
 */
export function getPriestByDuty(duty: MonasticDutyCategory, weekIndex: number): string | null {
  const priests = ['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'];
  for (const pId of priests) {
    if (getPriestMonthlyDuty(pId, weekIndex) === duty) {
      return pId;
    }
  }
  return null;
}

/**
 * Generates the weekly duty profile for every active person in the monastery.
 */
export function getCommunityWeeklyDuties(startDate: Date, persons: Person[]): PersonWeeklyDutyStatus[] {
  const weekIndex = getMonasticWeekIndex(startDate);

  return persons.filter(p => p.active).map(person => {
    // Serving Hieromonks:
    if (['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'].includes(person.id)) {
      const category = getPriestMonthlyDuty(person.id, weekIndex);
      const labels: Record<MonasticDutyCategory, { label: string; desc: string }> = {
        altar: { label: 'Săptămână de Altar', desc: 'Preot slujitor de rând la Sf. Altar și predică duminică' },
        strana: { label: 'Săptămână de Strană', desc: 'Cântăreț la strană, tipic și Ceasuri' },
        ascultari: { label: 'Săptămână de Ascultări', desc: 'De rând în biserică, primire pelerini, ascultări' },
        liber: { label: 'Săptămână Liberă', desc: 'Săptămână liberă pe lună: chilie, rugăciune, odihnă' },
      };
      return {
        personId: person.id,
        category,
        label: labels[category].label,
        description: labels[category].desc,
      };
    }

    // Pr. Iliescu: Weekend Protos
    if (person.id === 'p_iliescu') {
      return {
        personId: person.id,
        category: 'altar',
        label: 'Slujitor Weekend',
        description: 'Protos sâmbăta, proscomidie, predică și stat în biserică',
      };
    }

    // Starețul Protos. Pamvo Dima
    if (person.id === 'p_pamvo') {
      return {
        personId: person.id,
        category: 'altar',
        label: 'Starețul Mănăstirii',
        description: 'Binecuvântare, slujire la Praznice și Hramuri',
      };
    }

    // Deacons:
    if (person.id === 'p_petru') {
      const isServing = weekIndex % 2 === 1;
      return {
        personId: person.id,
        category: isServing ? 'altar' : 'liber',
        label: isServing ? 'Diacon de rând & Șofer' : 'Săptămână Liberă de Diaconie',
        description: isServing ? 'Slujește la Altar (săptămânile 1 & 3)' : 'Săptămână liberă de diaconie',
      };
    }

    if (person.id === 'p_ciprian') {
      const deacMap: Record<number, MonasticDutyCategory> = { 1: 'altar', 2: 'strana', 3: 'ascultari', 4: 'liber' };
      const cat = deacMap[weekIndex] || 'ascultari';
      return {
        personId: person.id,
        category: cat,
        label: cat === 'altar' ? 'Diacon Altar' : cat === 'strana' ? 'Protopsalt Strană' : cat === 'ascultari' ? 'În Biserică (Marți & Joi)' : 'Săptămână Liberă',
        description: 'Rotație lunară diaconească',
      };
    }

    if (person.id === 'p_modest') {
      const modMap: Record<number, MonasticDutyCategory> = { 1: 'ascultari', 2: 'ascultari', 3: 'altar', 4: 'liber' };
      const cat = modMap[weekIndex] || 'ascultari';
      return {
        personId: person.id,
        category: cat,
        label: cat === 'altar' ? 'Diacon Altar' : cat === 'ascultari' ? 'Secretar & Șofer' : 'Săptămână Liberă',
        description: 'Secretariat mănăstiresc, șoferie, diaconie',
      };
    }

    // Monks and Brothers:
    if (person.id === 'p_grichentie') {
      const cat: MonasticDutyCategory = weekIndex === 4 ? 'liber' : 'strana';
      return {
        personId: person.id,
        category: cat,
        label: cat === 'strana' ? 'Protopsalt Strană 1' : 'Săptămână Liberă / Chilie',
        description: 'Cântăreț de bază la Strană 1',
      };
    }

    if (person.id === 'p_ioan') {
      const cat: MonasticDutyCategory = weekIndex === 4 ? 'liber' : 'strana';
      return {
        personId: person.id,
        category: cat,
        label: cat === 'strana' ? 'Ajutor Permanent Strană 2' : 'Săptămână Liberă / Chilie',
        description: 'Cititor Ceasuri, Apostol, ajutor strană',
      };
    }

    if (person.id === 'p_arghir') {
      const cat: MonasticDutyCategory = weekIndex === 4 ? 'liber' : 'ascultari';
      return {
        personId: person.id,
        category: cat,
        label: cat === 'ascultari' ? 'Paracliser de rând & În Biserică' : 'Săptămână Liberă / Chilie',
        description: 'Paracliserie și de rând vineri în biserică',
      };
    }

    if (person.id === 'p_spiridon') {
      const cat: MonasticDutyCategory = weekIndex === 4 ? 'liber' : 'ascultari';
      return {
        personId: person.id,
        category: cat,
        label: cat === 'ascultari' ? 'Șofer de serviciu' : 'Săptămână Liberă',
        description: 'Deplasări și ascultări mănăstirești',
      };
    }

    return {
      personId: person.id,
      category: 'ascultari',
      label: 'Ascultare Mănăstirească',
      description: 'Ascultare obștească',
    };
  });
}

/**
 * Single-Week Auto-Scheduler Engine with Monastery and Liturgical Typikon Rules
 */
export function generateSingleWeekSchedule({
  startDate,
  endDate,
  persons,
  modules,
  absences,
  substitutionRules,
  existingAssignments,
  avoidDoubleBooking = true,
  weekIndexOverride,
}: GenerateScheduleParams): GenerationResult {
  const warnings: string[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  // Track manual assignments from current interval so they are preserved
  const manualAssignmentsMap = new Map<string, ScheduleAssignment>();
  existingAssignments.forEach(a => {
    const aDate = parseISO(a.date);
    if (aDate >= startDate && aDate <= endDate && a.status === 'manual') {
      manualAssignmentsMap.set(`${a.date}_${a.moduleId}_${a.roleId}_${a.slotIndex}`, a);
    }
  });

  const newAssignments: ScheduleAssignment[] = [
    ...existingAssignments.filter(a => {
      const aDate = parseISO(a.date);
      return aDate < startDate || aDate > endDate;
    }),
    ...Array.from(manualAssignmentsMap.values()),
  ];

  const activePersons = persons.filter(p => p.active);

  // Map to track daily bookings: "YYYY-MM-DD" -> Set of personIds already booked today
  const dailyBookings = new Map<string, Set<string>>();

  // Populate daily bookings from kept assignments
  newAssignments.forEach(a => {
    if (!a.personId) return;
    if (!dailyBookings.has(a.date)) dailyBookings.set(a.date, new Set());
    dailyBookings.get(a.date)!.add(a.personId);
  });

  // Sort modules: prioritize Altar (priest, deacon), Strană, Paracliserie, Predică, Biserică, Șoferie, others
  const sortedModules = [...modules].sort((a, b) => {
    const priority = (m: Module) => {
      if (m.id === 'altar') return 1;
      if (m.id === 'strana') return 2;
      if (m.id === 'paracliserie') return 3;
      if (m.id === 'predica') return 4;
      if (m.id === 'biserica') return 5;
      if (m.id === 'soferie') return 6;
      return 10;
    };
    return priority(a) - priority(b);
  });

  // Calculate week of month index based on start date or override
  const weekOfMonth = weekIndexOverride ?? (Math.floor((startDate.getDate() - 1) / 7) + 1);
  const isPetruServingWeek = weekOfMonth % 2 === 1; // Weeks 1 & 3 for Pr. Petru (una da, una nu)

  // Track assigned altar priest of the week for Sunday preaching
  let altarPriestOfTheWeekId: string | null = null;
  const existingAltarPriest = existingAssignments.find(a => {
    const aDate = parseISO(a.date);
    return aDate >= startDate && aDate <= endDate && a.roleId === 'altar_preot' && a.personId;
  });
  if (existingAltarPriest && existingAltarPriest.personId) {
    altarPriestOfTheWeekId = existingAltarPriest.personId;
  }

  for (const module of sortedModules) {
    for (const role of module.roles) {
      for (let slot = 0; slot < role.requiredCount; slot++) {

        // ====================================================================
        // Special Rule 1: Protos Sâmbătă & Proscomidie (Saturday Only)
        // ====================================================================
        if (role.id === 'altar_protos_sambata') {
          days.forEach(day => {
            if (day.getDay() !== 6) return; // Only on Saturday!

            const dateStr = format(day, 'yyyy-MM-dd');
            const assignmentKey = `${dateStr}_${module.id}_${role.id}_${slot}`;
            if (manualAssignmentsMap.has(assignmentKey)) return;

            if (!dailyBookings.has(dateStr)) dailyBookings.set(dateStr, new Set());

            // Primary candidate: Pr. Iliescu (or any priest with weekendOnly/altar)
            let assignedId: string | null = null;
            let status: 'auto' | 'substituted' = 'auto';
            let substitutedFromId: string | undefined;

            const iliescu = activePersons.find(p => p.id === 'p_iliescu' || (p.weekendOnly && p.skills.includes('altar')));
            if (iliescu && !isPersonAbsent(iliescu.id, day, absences)) {
              assignedId = iliescu.id;
            } else {
              // Substitute: another priest
              status = 'substituted';
              if (iliescu) substitutedFromId = iliescu.id;
              const fallbackPriests = activePersons.filter(p => 
                p.skills.includes('altar') && 
                p.id !== iliescu?.id && 
                !isPersonAbsent(p.id, day, absences)
              ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

              if (fallbackPriests.length > 0) {
                assignedId = fallbackPriests[0].id;
                warnings.push(`${format(day, 'dd.MM')} - Sâmbătă Protos: ${iliescu?.name || 'Pr. Iliescu'} este înlocuit de ${fallbackPriests[0].name}.`);
              }
            }

            if (assignedId) {
              dailyBookings.get(dateStr)!.add(assignedId);
            }

            newAssignments.push({
              id: `${dateStr}_${module.id}_${role.id}_${slot}`,
              date: dateStr,
              moduleId: module.id,
              roleId: role.id,
              slotIndex: slot,
              personId: assignedId,
              status,
              substitutedFromId,
              notes: 'Protos Sâmbătă & Proscomidie',
            });
          });
          continue;
        }

        // ====================================================================
        // Special Rule 2: Predică / Cuvânt de învățătură (Liturgical Typikon)
        // ====================================================================
        if (module.id === 'predica' || role.id === 'predica_cuvant') {
          days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const assignmentKey = `${dateStr}_${module.id}_${role.id}_${slot}`;
            if (manualAssignmentsMap.has(assignmentKey)) return;

            if (!dailyBookings.has(dateStr)) dailyBookings.set(dateStr, new Set());

            const litInfo = getDayLiturgicalInfo(day);
            const dayOfWeek = day.getDay();
            let assignedId: string | null = null;
            let preachReason = '';

            // Rule 2.1: Duminică -> Preotul de rând predică doar duminica
            if (dayOfWeek === 0) {
              preachReason = 'Duminică - Preotul de rând';
              if (altarPriestOfTheWeekId && !isPersonAbsent(altarPriestOfTheWeekId, day, absences)) {
                assignedId = altarPriestOfTheWeekId;
              } else {
                // Fallback priest
                const availablePriests = activePersons.filter(p => 
                  p.skills.includes('predica') && 
                  p.skills.includes('altar') && 
                  !p.weekendOnly && 
                  !isPersonAbsent(p.id, day, absences)
                ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));
                if (availablePriests.length > 0) assignedId = availablePriests[0].id;
              }
            }
            // Rule 2.2: Sâmbătă -> 2 sâmbete Pr. Iliescu, 2 sâmbete un diacon alternativ
            else if (dayOfWeek === 6) {
              const saturdayIndex = Math.floor((day.getDate() - 1) / 7) + 1; // 1, 2, 3, 4, 5
              if (saturdayIndex % 2 === 1) {
                // Saturdays 1 & 3: Pr. Iliescu (2 sâmbete pe lună)
                preachReason = `Sâmbăta ${saturdayIndex} din lună - Pr. Iliescu`;
                const iliescu = activePersons.find(p => p.id === 'p_iliescu');
                if (iliescu && !isPersonAbsent(iliescu.id, day, absences)) {
                  assignedId = iliescu.id;
                } else {
                  // Substitute with a deacon
                  const deacons = activePersons.filter(p => 
                    (p.rank.includes('Diacon') || p.rank.includes('Ierodiacon') || p.id === 'p_ciprian' || p.id === 'p_modest') &&
                    !isPersonAbsent(p.id, day, absences)
                  ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));
                  if (deacons.length > 0) assignedId = deacons[0].id;
                }
              } else {
                // Saturdays 2 & 4: Alternativ câte un diacon
                preachReason = `Sâmbăta ${saturdayIndex} din lună - Diacon`;
                const deacons = activePersons.filter(p => 
                  (p.rank.includes('Diacon') || p.rank.includes('Ierodiacon') || p.id === 'p_ciprian' || p.id === 'p_modest' || p.id === 'p_petru') &&
                  !isPersonAbsent(p.id, day, absences)
                ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));
                if (deacons.length > 0) assignedId = deacons[0].id;
              }
            }
            // Rule 2.3: Praznice Împărătești în timpul săptămânii
            // Rotație: Pr. Mina, Pr. Sebastian, Pr. Iliescu (weekend), sau Preotul de rând al săptămânii.
            // Dacă cel rânduit este plecat (ex: Pr. Sebastian), se aplică regula de înlocuire (Pr. Avacum / Pr. Mina).
            else if (litInfo.rank === 'praznic_imparatesc') {
              preachReason = `Praznic Împărătesc (${litInfo.feastTitle}) - Rotație Praznice`;

              // Candidates in rotation order: Sebastian, Mina, Iliescu (if weekend), or Altar Priest of the week
              const candidateOrder = ['p_sebastian', 'p_mina'];
              if (dayOfWeek === 6 || dayOfWeek === 0) candidateOrder.push('p_iliescu');
              if (altarPriestOfTheWeekId && !candidateOrder.includes(altarPriestOfTheWeekId)) {
                candidateOrder.push(altarPriestOfTheWeekId);
              }

              let chosenId: string | null = null;
              for (const cId of candidateOrder) {
                const cand = activePersons.find(p => p.id === cId);
                if (!cand) continue;

                if (!isPersonAbsent(cand.id, day, absences) && isPersonAvailableOnDate(cand, day)) {
                  chosenId = cand.id;
                  break;
                } else if (isPersonAbsent(cand.id, day, absences)) {
                  // Candidate is absent! Find substitute from rules
                  const rule = substitutionRules.find(r => r.targetPersonId === cand.id && (r.moduleId === 'predica' || r.moduleId === 'any'));
                  if (rule) {
                    for (const sId of rule.substituteIds) {
                      const subCand = activePersons.find(p => p.id === sId);
                      if (subCand && !isPersonAbsent(subCand.id, day, absences) && isPersonAvailableOnDate(subCand, day)) {
                        chosenId = subCand.id;
                        preachReason = `Praznic Împărătesc (${litInfo.feastTitle}) - ${subCand.name} (înlocuitor ${cand.name})`;
                        break;
                      }
                    }
                  }
                  if (chosenId) break;
                }
              }

              if (!chosenId && altarPriestOfTheWeekId && !isPersonAbsent(altarPriestOfTheWeekId, day, absences)) {
                chosenId = altarPriestOfTheWeekId;
                preachReason = `Praznic Împărătesc (${litInfo.feastTitle}) - Preotul de rând (${activePersons.find(p => p.id === altarPriestOfTheWeekId)?.name})`;
              }

              if (!chosenId) {
                const fallback = activePersons.filter(p => p.skills.includes('predica') && isPersonAvailableOnDate(p, day) && !isPersonAbsent(p.id, day, absences));
                if (fallback.length > 0) chosenId = fallback[0].id;
              }

              assignedId = chosenId;
            }
            // Rule 2.4: Sărbători Mari
            // Rotație: Pr. Pantelimon, Pr. Avacum, Pr. Mina, Pr. Sebastian, Pr. Iliescu
            else if (litInfo.rank === 'sarbatoare_mare') {
              preachReason = `Sărbătoare Mare (${litInfo.feastTitle}) - Rotație Pr. Pantelimon / Pr. Avacum / Pr. Mina / Pr. Sebastian`;
              const sarbatoareCandidates = activePersons.filter(p => 
                (p.id === 'p_pantelimon' || p.id === 'p_avacum' || p.id === 'p_mina' || p.id === 'p_sebastian' || (p.id === 'p_iliescu' && isPersonAvailableOnDate(p, day))) &&
                !isPersonAbsent(p.id, day, absences)
              ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

              if (sarbatoareCandidates.length > 0) {
                assignedId = sarbatoareCandidates[0].id;
              }
            }
            // Rule 2.5: Sărbători de sfinți
            // Diaconii în general la sărbători de sfinți
            else if (litInfo.rank === 'sarbatoare_sfinti') {
              preachReason = `Sărbătoare de Sfinți (${litInfo.feastTitle}) - Diacon`;
              const deacons = activePersons.filter(p => 
                (p.rank.includes('Diacon') || p.rank.includes('Ierodiacon') || p.id === 'p_ciprian' || p.id === 'p_modest' || p.id === 'p_petru') &&
                isPersonAvailableOnDate(p, day) &&
                !isPersonAbsent(p.id, day, absences)
              ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

              if (deacons.length > 0) {
                assignedId = deacons[0].id;
              }
            }

            // Only create assignment if it's a day with preaching or keep slot
            newAssignments.push({
              id: `${dateStr}_${module.id}_${role.id}_${slot}`,
              date: dateStr,
              moduleId: module.id,
              roleId: role.id,
              slotIndex: slot,
              personId: assignedId,
              status: 'auto',
              notes: preachReason,
            });
          });
          continue;
        }

        // ====================================================================
        // Special Rule 3: În Biserică (Stat de rând în Biserică / Pelerini)
        // Rotație stabilită pe zile:
        // Sâmbătă: Pr. Iliescu
        // Duminică: Pr. Pantelimon
        // Luni: Pr. Avacum
        // Marți: Pr. Ciprian
        // Miercuri: Pr. Avacum
        // Joi: Pr. Ciprian
        // Vineri: Fr. Arghir
        // ====================================================================
        if (module.id === 'biserica' || role.id === 'biserica_rand') {
          const bisericaDefaultMap: Record<number, string> = {
            0: 'p_pantelimon', // Duminică
            1: 'p_avacum',     // Luni
            2: 'p_ciprian',    // Marți
            3: 'p_avacum',     // Miercuri
            4: 'p_ciprian',    // Joi
            5: 'p_arghir',     // Vineri
            6: 'p_iliescu',    // Sâmbătă
          };

          days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const assignmentKey = `${dateStr}_${module.id}_${role.id}_${slot}`;
            if (manualAssignmentsMap.has(assignmentKey)) return;

            const dayOfWeek = day.getDay();
            const targetPersonId = bisericaDefaultMap[dayOfWeek];

            let assignedId: string | null = null;
            let status: 'auto' | 'substituted' = 'auto';
            let substitutedFromId: string | undefined;

            const primaryCandidate = activePersons.find(p => p.id === targetPersonId);

            if (primaryCandidate && !isPersonAbsent(primaryCandidate.id, day, absences)) {
              assignedId = primaryCandidate.id;
            } else {
              // Substitute if absent
              status = 'substituted';
              if (primaryCandidate) substitutedFromId = primaryCandidate.id;

              const absence = primaryCandidate ? isPersonAbsent(primaryCandidate.id, day, absences) : null;
              let subFound: Person | null = null;

              // 1. Preferred substitute specified in absence
              if (absence?.preferredSubstituteId) {
                const directSub = activePersons.find(p => p.id === absence.preferredSubstituteId);
                if (directSub && !isPersonAbsent(directSub.id, day, absences)) {
                  subFound = directSub;
                }
              }

              // 2. Check substitution rules for this person
              if (!subFound && primaryCandidate) {
                const rule = substitutionRules.find(r => r.targetPersonId === primaryCandidate.id && (r.moduleId === 'biserica' || r.moduleId === 'any'));
                if (rule) {
                  for (const sId of rule.substituteIds) {
                    const subCand = activePersons.find(p => p.id === sId);
                    if (subCand && !isPersonAbsent(subCand.id, day, absences)) {
                      subFound = subCand;
                      break;
                    }
                  }
                }
              }

              // 3. Fallback candidates for biserica
              if (!subFound) {
                const fallbackCandidates = activePersons.filter(p => 
                  p.skills.includes('biserica') && 
                  p.id !== targetPersonId && 
                  !isPersonAbsent(p.id, day, absences)
                ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

                if (fallbackCandidates.length > 0) {
                  subFound = fallbackCandidates[0];
                }
              }

              if (subFound) {
                assignedId = subFound.id;
                warnings.push(`${format(day, 'dd.MM')} - În Biserică: ${primaryCandidate?.name || targetPersonId} este înlocuit de ${subFound.name} (${absence?.reason || 'învoit'}).`);
              } else {
                warnings.push(`Atenție: ${format(day, 'dd.MM')} - Nu s-a găsit înlocuitor pentru rândul în Biserică.`);
              }
            }

            // Note: Standing duty in church (stat de rând în biserică) is compatible with altar/strana
            newAssignments.push({
              id: `${dateStr}_${module.id}_${role.id}_${slot}`,
              date: dateStr,
              moduleId: module.id,
              roleId: role.id,
              slotIndex: slot,
              personId: assignedId,
              status,
              substitutedFromId,
              notes: 'De rând în Biserică (Pelerini / Pomelnice)',
            });
          });
          continue;
        }

        // ====================================================================
        // Weekly Modules (Altar Preot & Diacon, Strană, Paracliserie)
        // ====================================================================
        if (module.rotationCycle === 'weekly') {
          // Get qualified active persons
          let qualified = activePersons.filter(p => p.skills.includes(module.id));

          // Sub-filtering based on specific monastic roles:
          if (role.id === 'altar_preot') {
            // Weekly priest must NOT be weekendOnly (Pr. Iliescu serves only weekends)
            // Regular weekly altar priests: Pantelimon, Avacum, Mina, Sebastian (Starețul serves at Praznice/Hramuri)
            qualified = qualified.filter(p => !p.weekendOnly && p.id !== 'p_pamvo' && (p.rank === 'Ieromonah' || p.rank === 'Arhimandrit' || p.rank === 'Protosinghel'));
          } else if (role.id === 'altar_diacon') {
            // Diacon candidates: Pr. Ciprian, Pr. Modest, and Pr. Petru (if Petru's active week)
            qualified = qualified.filter(p => {
              if (p.id === 'p_petru' || p.serviceWeeksPerMonth === 2) {
                return isPetruServingWeek; // Petru only serves in weeks 1 & 3
              }
              return p.rank.includes('Diacon') || p.rank.includes('Ierodiacon');
            });
          } else if (role.id === 'strana_psalt') {
            // Protopsalt 1: Grichentie, Ciprian, Mina, Avacum
            qualified = qualified.filter(p => ['p_grichentie', 'p_glichentie', 'p_ciprian', 'p_mina', 'p_avacum'].includes(p.id) || p.skills.includes('strana'));
          } else if (role.id === 'strana_ajutor') {
            // Strana 2 / Cititor: Fr. Ioan este ajutor permanent la Strană!
            const frIoan = activePersons.find(p => p.id === 'p_ioan');
            if (frIoan) {
              qualified = [frIoan, ...activePersons.filter(p => p.id !== 'p_ioan' && (p.skills.includes('strana_ajutor') || ['p_avacum', 'p_damaschin'].includes(p.id)))];
            } else {
              qualified = activePersons.filter(p => p.skills.includes('strana_ajutor') || ['p_avacum', 'p_ioan', 'p_damaschin'].includes(p.id));
            }
          } else if (role.id === 'paracliser_principal') {
            // Paracliser: Arghir, Ciprian, Modest, Avacum
            qualified = activePersons.filter(p => p.skills.includes('paracliserie') && ['p_arghir', 'p_ciprian', 'p_modest', 'p_avacum'].includes(p.id));
          }

          if (qualified.length === 0) {
            warnings.push(`Nu există niciun slujitor disponibil pentru „${module.name}” (${role.name}).`);
            continue;
          }

          // Sort by fewest total assignments (fair share)
          let sortedCandidates = [...qualified].sort((a, b) => {
            return getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments);
          });

          // Permanent role checks
          if (role.id === 'strana_ajutor') {
            const frIoan = qualified.find(p => p.id === 'p_ioan');
            if (frIoan) {
              sortedCandidates = [frIoan, ...sortedCandidates.filter(c => c.id !== 'p_ioan')];
            }
          } else if (role.id === 'strana_psalt') {
            const grichentie = qualified.find(p => p.id === 'p_grichentie' || p.id === 'p_glichentie');
            if (grichentie) {
              sortedCandidates = [grichentie, ...sortedCandidates.filter(c => c.id !== grichentie.id)];
            }
          } else if (role.id === 'paracliser_principal') {
            const arghir = qualified.find(p => p.id === 'p_arghir');
            if (arghir) {
              sortedCandidates = [arghir, ...sortedCandidates.filter(c => c.id !== 'p_arghir')];
            }
          }

          // Pick the best candidate available for the whole week or substitute when absent
          let primaryCandidate: Person | null = null;
          let substitutedWeeklyFromId: string | undefined;

          if (role.id === 'altar_preot') {
            if (altarPriestOfTheWeekId) {
              primaryCandidate = activePersons.find(p => p.id === altarPriestOfTheWeekId) || null;
            } else {
              // 4-week monthly rotation engine: find designated priest for this week of month
              const designatedPriestId = getPriestByDuty('altar', weekOfMonth);
              if (designatedPriestId) {
                const designatedPriest = activePersons.find(p => p.id === designatedPriestId);
                if (designatedPriest && !isPersonAbsent(designatedPriest.id, startDate, absences)) {
                  primaryCandidate = designatedPriest;
                  altarPriestOfTheWeekId = designatedPriest.id;
                } else if (designatedPriest && isPersonAbsent(designatedPriest.id, startDate, absences)) {
                  // Designated priest is absent! Substitute from rules
                  substitutedWeeklyFromId = designatedPriest.id;
                  const rule = substitutionRules.find(r => r.targetPersonId === designatedPriest.id && (r.moduleId === 'altar' || r.moduleId === 'any'));
                  if (rule) {
                    for (const sId of rule.substituteIds) {
                      const subPriest = activePersons.find(p => p.id === sId);
                      if (subPriest && !isPersonAbsent(subPriest.id, startDate, absences) && !subPriest.weekendOnly && subPriest.id !== 'p_pamvo') {
                        primaryCandidate = subPriest;
                        altarPriestOfTheWeekId = subPriest.id;
                        warnings.push(`${designatedPriest.name} (rânduit la Altar în săpt. ${weekOfMonth}) este înlocuit de ${subPriest.name}.`);
                        break;
                      }
                    }
                  }
                }
              }
            }
          } else if (role.id === 'strana_ajutor') {
            primaryCandidate = activePersons.find(p => p.id === 'p_ioan') || null;
          } else if (role.id === 'strana_psalt') {
            primaryCandidate = activePersons.find(p => p.id === 'p_grichentie' || p.id === 'p_glichentie') || null;
          } else if (role.id === 'paracliser_principal') {
            primaryCandidate = activePersons.find(p => p.id === 'p_arghir') || null;
          } else if (role.id === 'sofer_garda' || module.id === 'soferie') {
            primaryCandidate = activePersons.find(p => p.id === 'p_spiridon') || null;
          }

          if (!primaryCandidate) {
            // Respect 'liber' week: filter out priests who are on their off-week
            const nonLiberCandidates = sortedCandidates.filter(p => {
              if (['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'].includes(p.id)) {
                return getPriestMonthlyDuty(p.id, weekOfMonth) !== 'liber';
              }
              return true;
            });
            const candidatesToEvaluate = nonLiberCandidates.length > 0 ? nonLiberCandidates : sortedCandidates;

            for (const cand of candidatesToEvaluate) {
              const hasConflict = days.some(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                if (!isPersonAvailableOnDate(cand, day)) return true;
                if (isPersonAbsent(cand.id, day, absences)) return true;
                if (avoidDoubleBooking && dailyBookings.get(dateStr)?.has(cand.id)) return true;
                return false;
              });

              if (!hasConflict) {
                primaryCandidate = cand;
                break;
              }
            }
          }

          // Fallback if everyone has at least one conflict day
          if (!primaryCandidate && sortedCandidates.length > 0) {
            primaryCandidate = sortedCandidates[0];
          }

          // If this is the weekly altar priest, remember him for Sunday preaching
          if (role.id === 'altar_preot' && primaryCandidate) {
            altarPriestOfTheWeekId = primaryCandidate.id;
          }

          // Now assign each day of the week
          days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const assignmentKey = `${dateStr}_${module.id}_${role.id}_${slot}`;
            if (manualAssignmentsMap.has(assignmentKey)) {
              return;
            }
            if (!dailyBookings.has(dateStr)) dailyBookings.set(dateStr, new Set());

            let assignedId: string | null = null;
            let status: 'auto' | 'substituted' = substitutedWeeklyFromId ? 'substituted' : 'auto';
            let substitutedFromId: string | undefined = substitutedWeeklyFromId;

            if (primaryCandidate) {
              const absence = isPersonAbsent(primaryCandidate.id, day, absences);
              const isNotAvailableDay = !isPersonAvailableOnDate(primaryCandidate, day);
              const isDoubleBooked = avoidDoubleBooking && dailyBookings.get(dateStr)!.has(primaryCandidate.id);

              if (absence || isNotAvailableDay || isDoubleBooked) {
                // Needs substitution!
                status = 'substituted';
                substitutedFromId = primaryCandidate.id;

                // 1. Check absence-specific preferred substitute
                let subFound: Person | null = null;
                if (absence?.preferredSubstituteId) {
                  const directSub = activePersons.find(p => p.id === absence.preferredSubstituteId);
                  if (
                    directSub && 
                    directSub.skills.includes(module.id) && 
                    isPersonAvailableOnDate(directSub, day) && 
                    !isPersonAbsent(directSub.id, day, absences) && 
                    (!avoidDoubleBooking || !dailyBookings.get(dateStr)!.has(directSub.id))
                  ) {
                    subFound = directSub;
                  }
                }

                // 2. Check general substitution rules for this person and module
                if (!subFound) {
                  const rule = substitutionRules.find(r => r.targetPersonId === primaryCandidate!.id && (r.moduleId === module.id || r.moduleId === 'any'));
                  if (rule) {
                    for (const sId of rule.substituteIds) {
                      const subCand = activePersons.find(p => p.id === sId);
                      if (
                        subCand && 
                        subCand.skills.includes(module.id) && 
                        isPersonAvailableOnDate(subCand, day) && 
                        !isPersonAbsent(subCand.id, day, absences) && 
                        (!avoidDoubleBooking || !dailyBookings.get(dateStr)!.has(subCand.id))
                      ) {
                        subFound = subCand;
                        break;
                      }
                    }
                  }
                }

                // 3. Fallback to any other qualified person
                if (!subFound) {
                  const fallbackCandidates = qualified.filter(p => 
                    p.id !== primaryCandidate!.id && 
                    isPersonAvailableOnDate(p, day) && 
                    !isPersonAbsent(p.id, day, absences) && 
                    (!avoidDoubleBooking || !dailyBookings.get(dateStr)!.has(p.id))
                  ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

                  if (fallbackCandidates.length > 0) {
                    subFound = fallbackCandidates[0];
                  }
                }

                if (subFound) {
                  assignedId = subFound.id;
                  const reason = absence ? absence.reason : (isNotAvailableDay ? 'disponibil doar în weekend' : 'suprapunere');
                  warnings.push(`${format(day, 'dd.MM')} - ${module.name}: ${primaryCandidate.name} este înlocuit de ${subFound.name} (${reason}).`);
                } else {
                  assignedId = null;
                  warnings.push(`Atenție: ${format(day, 'dd.MM')} - Nu s-a găsit înlocuitor pentru ${primaryCandidate.name} la „${module.name}”.`);
                }
              } else {
                assignedId = primaryCandidate.id;
              }
            }

            if (assignedId) {
              dailyBookings.get(dateStr)!.add(assignedId);
            }

            newAssignments.push({
              id: `${dateStr}_${module.id}_${role.id}_${slot}`,
              date: dateStr,
              moduleId: module.id,
              roleId: role.id,
              slotIndex: slot,
              personId: assignedId,
              status,
              substitutedFromId,
            });
          });

        } else {
          // ====================================================================
          // Daily Rotation Cycle (e.g. Șoferie per day)
          // ====================================================================
          days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const assignmentKey = `${dateStr}_${module.id}_${role.id}_${slot}`;
            if (manualAssignmentsMap.has(assignmentKey)) return;

            if (!dailyBookings.has(dateStr)) dailyBookings.set(dateStr, new Set());

            const qualified = activePersons.filter(p => p.skills.includes(module.id) && isPersonAvailableOnDate(p, day));
            if (qualified.length === 0) {
              warnings.push(`Nu există slujitori disponibili pentru „${module.name}” pe data de ${format(day, 'dd.MM')}.`);
              return;
            }

            // Filter available for this day
            const available = qualified.filter(p => {
              if (isPersonAbsent(p.id, day, absences)) return false;
              if (avoidDoubleBooking && dailyBookings.get(dateStr)!.has(p.id)) return false;
              return true;
            });

            // Sort by fewest assignments
            available.sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

            let assignedId: string | null = null;
            if (available.length > 0) {
              assignedId = available[0].id;
              dailyBookings.get(dateStr)!.add(assignedId);
            } else {
              warnings.push(`Atenție: ${format(day, 'dd.MM')} - Niciun slujitor disponibil pentru „${module.name}” (${role.name}).`);
            }

            newAssignments.push({
              id: `${dateStr}_${module.id}_${role.id}_${slot}`,
              date: dateStr,
              moduleId: module.id,
              roleId: role.id,
              slotIndex: slot,
              personId: assignedId,
              status: 'auto',
            });
          });
        }
      }
    }
  }

  return {
    assignments: newAssignments,
    warnings,
  };
}

/**
 * Main Auto-Scheduler Engine. Automatically chunks multi-week intervals to prevent
 * locking one week's duty into the entire month.
 */
export function generateSchedule(params: GenerateScheduleParams): GenerationResult {
  const days = eachDayOfInterval({ start: params.startDate, end: params.endDate });
  if (days.length <= 7) {
    return generateSingleWeekSchedule(params);
  }

  // Multi-week interval: chunk week by week
  let currentAssignments = [...params.existingAssignments];
  const allWarnings: string[] = [];

  for (let i = 0; i < days.length; i += 7) {
    const chunkStart = days[i];
    const chunkEnd = days[Math.min(i + 6, days.length - 1)];
    const weekIndex = getMonasticWeekIndex(chunkStart);

    const chunkResult = generateSingleWeekSchedule({
      ...params,
      startDate: chunkStart,
      endDate: chunkEnd,
      existingAssignments: currentAssignments,
      weekIndexOverride: weekIndex,
    });

    currentAssignments = chunkResult.assignments;
    allWarnings.push(...chunkResult.warnings);
  }

  return {
    assignments: currentAssignments,
    warnings: allWarnings,
  };
}

/**
 * Generates the complete 4-week monastic cycle (or multi-week month) guaranteeing
 * canonical fair share: 1 week Altar, 1 week Strană, 1 week Ascultări, 1 week Liber.
 */
export function generateCycleSchedule({
  startDate,
  referenceDate,
  persons,
  modules,
  absences,
  substitutionRules,
  existingAssignments,
  avoidDoubleBooking = true,
  weeksCount = 4,
  weekStartsOn = 6,
}: GenerateCycleScheduleParams): CycleGenerationSummary {
  const ref = startDate || referenceDate || new Date();
  const cycleStartDate = startDate ? startOfWeek(startDate, { weekStartsOn }) : getCycleStartDate(ref, weekStartsOn);

  let currentAssignments = [...existingAssignments];
  const allWarnings: string[] = [];
  const weeksSummary: CycleWeekSummary[] = [];

  for (let i = 0; i < weeksCount; i++) {
    const weekIndex = i + 1;
    const wStart = addWeeks(cycleStartDate, i);
    const wEnd = endOfWeek(wStart, { weekStartsOn });
    const wStartStr = format(wStart, 'yyyy-MM-dd');
    const wEndStr = format(wEnd, 'yyyy-MM-dd');

    const weekResult = generateSingleWeekSchedule({
      startDate: wStart,
      endDate: wEnd,
      persons,
      modules,
      absences,
      substitutionRules,
      existingAssignments: currentAssignments,
      avoidDoubleBooking,
      weekIndexOverride: weekIndex,
    });

    currentAssignments = weekResult.assignments;
    allWarnings.push(...weekResult.warnings);

    // Extract summary of who does what this week
    const weekAssignments = currentAssignments.filter(a => a.date >= wStartStr && a.date <= wEndStr);
    const altarPreot = weekAssignments.find(a => a.roleId === 'altar_preot')?.personId || getPriestByDuty('altar', weekIndex);
    const deacon = weekAssignments.find(a => a.roleId === 'altar_diacon')?.personId || null;
    const stranaPriest = getPriestByDuty('strana', weekIndex);
    const ascultariPriest = getPriestByDuty('ascultari', weekIndex);
    const liberPriest = getPriestByDuty('liber', weekIndex);
    const protosSat = weekAssignments.find(a => a.roleId === 'altar_protos_sambata')?.personId || 'p_iliescu';
    const paracliser = weekAssignments.find(a => a.roleId === 'paracliser_principal')?.personId || 'p_arghir';
    const sofer = weekAssignments.find(a => a.roleId === 'sofer_garda')?.personId || 'p_spiridon';

    weeksSummary.push({
      weekIndex,
      startDate: wStart,
      endDate: wEnd,
      startDateStr: wStartStr,
      endDateStr: wEndStr,
      altarPriestId: altarPreot,
      deaconId: deacon,
      stranaPriestId: stranaPriest,
      ascultariPriestId: ascultariPriest,
      liberPriestId: liberPriest,
      protosSaturdayId: protosSat,
      paracliserId: paracliser,
      soferId: sofer,
      assignmentsCount: weekAssignments.length,
    });
  }

  const cycleEndDate = endOfWeek(addWeeks(cycleStartDate, weeksCount - 1), { weekStartsOn });

  return {
    assignments: currentAssignments,
    warnings: allWarnings,
    cycleStartDate,
    cycleEndDate,
    cycleStartDateStr: format(cycleStartDate, 'yyyy-MM-dd'),
    cycleEndDateStr: format(cycleEndDate, 'yyyy-MM-dd'),
    weeks: weeksSummary,
  };
}
