import type { Person, Module, Absence, SubstitutionRule, ScheduleAssignment } from '../types';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
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
}

export interface GenerationResult {
  assignments: ScheduleAssignment[];
  warnings: string[];
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

/**
 * Main Auto-Scheduler Engine with Monastery and Liturgical Typikon Rules
 */
export function generateSchedule({
  startDate,
  endDate,
  persons,
  modules,
  absences,
  substitutionRules,
  existingAssignments,
  avoidDoubleBooking = true,
}: GenerateScheduleParams): GenerationResult {
  const warnings: string[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const newAssignments: ScheduleAssignment[] = [...existingAssignments.filter(a => {
    const aDate = parseISO(a.date);
    return aDate < startDate || aDate > endDate;
  })];

  const activePersons = persons.filter(p => p.active);

  // Map to track daily bookings: "YYYY-MM-DD" -> Set of personIds already booked today
  const dailyBookings = new Map<string, Set<string>>();

  // Populate daily bookings from kept assignments
  newAssignments.forEach(a => {
    if (!a.personId) return;
    if (!dailyBookings.has(a.date)) dailyBookings.set(a.date, new Set());
    dailyBookings.get(a.date)!.add(a.personId);
  });

  // Sort modules: prioritize Altar (priest, deacon), Strană, Paracliserie, Predică, Șoferie, others
  const sortedModules = [...modules].sort((a, b) => {
    const priority = (m: Module) => {
      if (m.id === 'altar') return 1;
      if (m.id === 'strana') return 2;
      if (m.id === 'paracliserie') return 3;
      if (m.id === 'predica') return 4;
      if (m.id === 'soferie') return 5;
      return 10;
    };
    return priority(a) - priority(b);
  });

  // Calculate week of month index based on start date
  const weekOfMonth = Math.floor((startDate.getDate() - 1) / 7) + 1;
  const isPetruServingWeek = weekOfMonth % 2 === 1; // Weeks 1 & 3 for Pr. Petru (una da, una nu)

  // Track assigned altar priest of the week for Sunday preaching
  let altarPriestOfTheWeekId: string | null = null;

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
            // Rotație: Pr. Mina, Pr. Sebastian, Pr. Iliescu
            else if (litInfo.rank === 'praznic_imparatesc') {
              preachReason = `Praznic Împărătesc (${litInfo.feastTitle}) - Rotație Pr. Mina / Pr. Sebastian / Pr. Iliescu`;
              const praznicCandidates = activePersons.filter(p => 
                (p.id === 'p_mina' || p.id === 'p_sebastian' || (p.id === 'p_iliescu' && isPersonAvailableOnDate(p, day))) &&
                !isPersonAbsent(p.id, day, absences)
              ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

              if (praznicCandidates.length > 0) {
                assignedId = praznicCandidates[0].id;
              } else {
                // Fallback to any priest
                const anyPriest = activePersons.filter(p => p.skills.includes('predica') && isPersonAvailableOnDate(p, day) && !isPersonAbsent(p.id, day, absences));
                if (anyPriest.length > 0) assignedId = anyPriest[0].id;
              }
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
        // Weekly Modules (Altar Preot & Diacon, Strană, Paracliserie)
        // ====================================================================
        if (module.rotationCycle === 'weekly') {
          // Get qualified active persons
          let qualified = activePersons.filter(p => p.skills.includes(module.id));

          // Sub-filtering based on specific monastic roles:
          if (role.id === 'altar_preot') {
            // Weekly priest must NOT be weekendOnly (Pr. Iliescu serves only weekends)
            qualified = qualified.filter(p => !p.weekendOnly && (p.rank === 'Ieromonah' || p.rank === 'Arhimandrit' || p.rank === 'Protosinghel'));
          } else if (role.id === 'altar_diacon') {
            // Diacon candidates: Pr. Ciprian, Pr. Modest, and Pr. Petru (if Petru's active week)
            qualified = qualified.filter(p => {
              if (p.id === 'p_petru' || p.serviceWeeksPerMonth === 2) {
                return isPetruServingWeek; // Petru only serves in weeks 1 & 3
              }
              return p.rank.includes('Diacon') || p.rank.includes('Ierodiacon');
            });
          } else if (role.id === 'strana_psalt') {
            // Protopsalt 1: Glichentie, Ciprian, Mina, Avacum
            qualified = qualified.filter(p => ['p_glichentie', 'p_ciprian', 'p_mina', 'p_avacum'].includes(p.id) || p.skills.includes('strana'));
          } else if (role.id === 'strana_ajutor') {
            // Strana 2 / Cititor: Avacum, Fr. Ioan, Damaschin
            qualified = activePersons.filter(p => p.skills.includes('strana_ajutor') || ['p_avacum', 'p_ioan', 'p_damaschin'].includes(p.id));
          } else if (role.id === 'paracliser_principal') {
            // Paracliser: Arghir, Ciprian, Modest, Avacum
            qualified = activePersons.filter(p => p.skills.includes('paracliserie') && ['p_arghir', 'p_ciprian', 'p_modest', 'p_avacum'].includes(p.id));
          }

          if (qualified.length === 0) {
            warnings.push(`Nu există niciun slujitor disponibil pentru „${module.name}” (${role.name}).`);
            continue;
          }

          // Sort by fewest total assignments (fair share)
          const sortedCandidates = [...qualified].sort((a, b) => {
            return getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments);
          });

          // Pick the best candidate available for the whole week or substitute when absent
          let primaryCandidate: Person | null = null;
          for (const cand of sortedCandidates) {
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
            if (!dailyBookings.has(dateStr)) dailyBookings.set(dateStr, new Set());

            let assignedId: string | null = null;
            let status: 'auto' | 'substituted' = 'auto';
            let substitutedFromId: string | undefined;

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
