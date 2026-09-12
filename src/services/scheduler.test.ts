import { describe, it, expect } from 'vitest';
import { generateSchedule, isPersonAvailableOnDate } from './scheduler';
import { getOrthodoxEaster, getDayLiturgicalInfo } from './orthodoxCalendar';
import { DEFAULT_PERSONS, DEFAULT_MODULES, DEFAULT_RULES } from '../store/monasteryStore';
import type { Absence } from '../types';
import { parseISO, format } from 'date-fns';

describe('Orthodox Liturgical Calendar & Paschalion', () => {
  it('computes exact Orthodox Easter dates according to Julian + 13 days', () => {
    const easter2024 = getOrthodoxEaster(2024);
    expect(format(easter2024, 'yyyy-MM-dd')).toBe('2024-05-05');

    const easter2025 = getOrthodoxEaster(2025);
    expect(format(easter2025, 'yyyy-MM-dd')).toBe('2025-04-20');

    const easter2026 = getOrthodoxEaster(2026);
    expect(format(easter2026, 'yyyy-MM-dd')).toBe('2026-04-12');
  });

  it('correctly identifies fixed red cross feast days (Boboteaza, Schimbarea la Fata, Craciunul)', () => {
    const boboteaza = getDayLiturgicalInfo(new Date(2026, 0, 6)); // 6 Jan
    expect(boboteaza.isRedCross).toBe(true);
    expect(boboteaza.rank).toBe('praznic_imparatesc');
    expect(boboteaza.feastTitle).toContain('Boboteaza');

    const craciun = getDayLiturgicalInfo(new Date(2026, 11, 25)); // 25 Dec
    expect(craciun.isRedCross).toBe(true);
    expect(craciun.rank).toBe('praznic_imparatesc');

    const sfPantelimon = getDayLiturgicalInfo(new Date(2026, 6, 27)); // 27 Jul
    expect(sfPantelimon.isRedCross).toBe(true);
    expect(sfPantelimon.rank).toBe('sarbatoare_mare');
    expect(sfPantelimon.feastTitle).toContain('Pantelimon');
  });

  it('correctly identifies movable feasts like Florii and Inaltarea Domnului', () => {
    // In 2026, Easter is April 12. Florii is April 5 (Easter - 7 days)
    const florii = getDayLiturgicalInfo(new Date(2026, 3, 5));
    expect(florii.isRedCross).toBe(true);
    expect(florii.feastTitle).toContain('Floriile');

    // Inaltarea is 39 days after Easter -> May 21 in 2026
    const inaltarea = getDayLiturgicalInfo(new Date(2026, 4, 21));
    expect(inaltarea.isRedCross).toBe(true);
    expect(inaltarea.feastTitle).toContain('Înălțarea Domnului');
  });
});

describe('Monastery Scheduler Engine & Custom Community Rules', () => {
  it('correctly respects weekendOnly restriction for Pr. Iliescu', () => {
    const iliescu = DEFAULT_PERSONS.find(p => p.id === 'p_iliescu')!;
    expect(iliescu.weekendOnly).toBe(true);

    const monday = parseISO('2026-09-14'); // Monday
    const saturday = parseISO('2026-09-19'); // Saturday
    const sunday = parseISO('2026-09-20'); // Sunday

    expect(isPersonAvailableOnDate(iliescu, monday)).toBe(false);
    expect(isPersonAvailableOnDate(iliescu, saturday)).toBe(true);
    expect(isPersonAvailableOnDate(iliescu, sunday)).toBe(true);
  });

  it('assigns Pr. Iliescu as Protos & Proscomidie on Saturday', () => {
    // Saturday Sept 19, 2026 to Friday Sept 25, 2026 (Monastic week starting Saturday)
    const startDate = parseISO('2026-09-19');
    const endDate = parseISO('2026-09-25');

    const result = generateSchedule({
      startDate,
      endDate,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES,
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const protosSaturday = result.assignments.find(a => 
      a.date === '2026-09-19' && a.roleId === 'altar_protos_sambata'
    );
    expect(protosSaturday).toBeDefined();
    expect(protosSaturday?.personId).toBe('p_iliescu');

    // On weekdays, altar_protos_sambata should not be assigned
    const protosMonday = result.assignments.find(a => 
      a.date === '2026-09-21' && a.roleId === 'altar_protos_sambata'
    );
    expect(protosMonday).toBeUndefined();
  });

  it('assigns weekly altar priest to preach on Sunday', () => {
    // Saturday to Friday week: Sunday is 2026-09-20
    const startDate = parseISO('2026-09-19');
    const endDate = parseISO('2026-09-25');

    const result = generateSchedule({
      startDate,
      endDate,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES,
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: false,
    });

    const weeklyAltarPriest = result.assignments.find(a => 
      a.date === '2026-09-20' && a.roleId === 'altar_preot'
    );
    const sundayPreacher = result.assignments.find(a => 
      a.date === '2026-09-20' && a.moduleId === 'predica'
    );

    expect(weeklyAltarPriest).toBeDefined();
    expect(sundayPreacher).toBeDefined();
    // Rule: "preotul de rand predica doar duminica"
    expect(sundayPreacher?.personId).toBe(weeklyAltarPriest?.personId);
  });

  it('assigns Saturday preaching according to the 2-Saturdays rule', () => {
    // Sept 5, 2026 is Saturday 1 of the month (5 / 7 = 0 -> 1st Saturday)
    const res1 = generateSchedule({
      startDate: parseISO('2026-09-05'),
      endDate: parseISO('2026-09-05'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'predica'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: false,
    });

    const sat1Preach = res1.assignments.find(a => a.date === '2026-09-05' && a.moduleId === 'predica');
    expect(sat1Preach?.personId).toBe('p_iliescu');

    // Sept 12, 2026 is Saturday 2 of the month -> A deacon preaches
    const res2 = generateSchedule({
      startDate: parseISO('2026-09-12'),
      endDate: parseISO('2026-09-12'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'predica'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: false,
    });

    const sat2Preach = res2.assignments.find(a => a.date === '2026-09-12' && a.moduleId === 'predica');
    // Must be one of the deacons (Ciprian, Modest, Petru)
    expect(['p_ciprian', 'p_modest', 'p_petru']).toContain(sat2Preach?.personId);
  });

  it('respects Pr. Petru serving 2 weeks per month alternation at Altar', () => {
    // Week 1 (starting day 1-7) -> Petru can serve
    const week1Start = parseISO('2026-09-05');
    const week1End = parseISO('2026-09-11');
    const resWeek1 = generateSchedule({
      startDate: week1Start,
      endDate: week1End,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'altar'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });
    const deaconWeek1 = resWeek1.assignments.find(a => a.roleId === 'altar_diacon');
    expect(deaconWeek1).toBeDefined();

    // Week 2 (day 8-14) -> Petru is off at Altar, only Ciprian or Modest
    const week2Start = parseISO('2026-09-12');
    const week2End = parseISO('2026-09-18');
    const resWeek2 = generateSchedule({
      startDate: week2Start,
      endDate: week2End,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'altar'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });
    const deaconWeek2 = resWeek2.assignments.find(a => a.roleId === 'altar_diacon');
    expect(deaconWeek2?.personId).not.toBe('p_petru');
    expect(['p_ciprian', 'p_modest']).toContain(deaconWeek2?.personId);
  });

  it('substitutes Pr. Iliescu when absent on Saturday Protos', () => {
    const absences: Absence[] = [
      {
        id: 'abs_iliescu',
        personId: 'p_iliescu',
        startDate: '2026-09-19',
        endDate: '2026-09-19',
        reason: 'Învoire / Misiune',
      }
    ];

    const result = generateSchedule({
      startDate: parseISO('2026-09-19'),
      endDate: parseISO('2026-09-19'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'altar'),
      absences,
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: false,
    });

    const protos = result.assignments.find(a => a.roleId === 'altar_protos_sambata');
    expect(protos?.status).toBe('substituted');
    expect(protos?.personId).not.toBe('p_iliescu');
    expect(protos?.substitutedFromId).toBe('p_iliescu');
  });
});
