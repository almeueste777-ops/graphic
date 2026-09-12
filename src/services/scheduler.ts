import type { Person, Module, Absence, SubstitutionRule, ScheduleAssignment } from '../types';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

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
 * Counts how many assignments a person already has in a list of assignments
 */
function getAssignmentCount(personId: string, assignments: ScheduleAssignment[]): number {
  return assignments.filter(a => a.personId === personId).length;
}

/**
 * Main Auto-Scheduler Engine
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

  // Sort modules: prioritize altar and strana, then paracliserie, then others
  const sortedModules = [...modules].sort((a, b) => {
    const priority = (m: Module) => {
      if (m.id === 'altar') return 1;
      if (m.id === 'strana') return 2;
      if (m.id === 'paracliserie') return 3;
      if (m.id === 'soferie') return 4;
      return 10;
    };
    return priority(a) - priority(b);
  });

  // For weekly modules, we choose one person for the entire week
  for (const module of sortedModules) {
    for (const role of module.roles) {
      for (let slot = 0; slot < role.requiredCount; slot++) {
        
        if (module.rotationCycle === 'weekly') {
          // Find candidates qualified for this module and role
          const qualified = activePersons.filter(p => p.skills.includes(module.id));

          if (qualified.length === 0) {
            warnings.push(`Nu există niciun slujitor calificat pentru modulul „${module.name}” (${role.name}).`);
            continue;
          }

          // Sort by fewest total assignments (fair share)
          const sortedCandidates = [...qualified].sort((a, b) => {
            return getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments);
          });

          // Pick the best candidate available for the whole week or substitute when absent
          let primaryCandidate: Person | null = null;
          for (const cand of sortedCandidates) {
            // Check availability for days of the week
            const hasConflict = days.some(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const absent = isPersonAbsent(cand.id, day, absences);
              if (absent) return true;
              if (avoidDoubleBooking && dailyBookings.get(dateStr)?.has(cand.id)) return true;
              return false;
            });

            if (!hasConflict) {
              primaryCandidate = cand;
              break;
            }
          }

          // If no one is available all 7 days without any conflict, fallback to candidate with fewest conflicts
          if (!primaryCandidate && sortedCandidates.length > 0) {
            primaryCandidate = sortedCandidates[0];
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
              const isDoubleBooked = avoidDoubleBooking && dailyBookings.get(dateStr)!.has(primaryCandidate.id);

              if (absence || isDoubleBooked) {
                // Needs substitution!
                status = 'substituted';
                substitutedFromId = primaryCandidate.id;

                // 1. Check absence-specific preferred substitute
                let subFound: Person | null = null;
                if (absence?.preferredSubstituteId) {
                  const directSub = activePersons.find(p => p.id === absence.preferredSubstituteId);
                  if (directSub && directSub.skills.includes(module.id) && !isPersonAbsent(directSub.id, day, absences) && (!avoidDoubleBooking || !dailyBookings.get(dateStr)!.has(directSub.id))) {
                    subFound = directSub;
                  }
                }

                // 2. Check general substitution rules for this person and module
                if (!subFound) {
                  const rule = substitutionRules.find(r => r.targetPersonId === primaryCandidate!.id && (r.moduleId === module.id || r.moduleId === 'any'));
                  if (rule) {
                    for (const sId of rule.substituteIds) {
                      const subCand = activePersons.find(p => p.id === sId);
                      if (subCand && subCand.skills.includes(module.id) && !isPersonAbsent(subCand.id, day, absences) && (!avoidDoubleBooking || !dailyBookings.get(dateStr)!.has(subCand.id))) {
                        subFound = subCand;
                        break;
                      }
                    }
                  }
                }

                // 3. Check any other qualified person with fewest assignments
                if (!subFound) {
                  const fallbackCandidates = qualified.filter(p => 
                    p.id !== primaryCandidate!.id && 
                    !isPersonAbsent(p.id, day, absences) && 
                    (!avoidDoubleBooking || !dailyBookings.get(dateStr)!.has(p.id))
                  ).sort((a, b) => getAssignmentCount(a.id, newAssignments) - getAssignmentCount(b.id, newAssignments));

                  if (fallbackCandidates.length > 0) {
                    subFound = fallbackCandidates[0];
                  }
                }

                if (subFound) {
                  assignedId = subFound.id;
                  const reason = absence ? absence.reason : 'suprapunere cu altă ascultare';
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
          // Daily rotation cycle (e.g. Șoferie, Bucătărie per day)
          days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            if (!dailyBookings.has(dateStr)) dailyBookings.set(dateStr, new Set());

            const qualified = activePersons.filter(p => p.skills.includes(module.id));
            if (qualified.length === 0) {
              warnings.push(`Nu există slujitori calificați pentru „${module.name}”.`);
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
