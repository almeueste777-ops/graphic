import { describe, it, expect } from 'vitest';
import { 
  generateSchedule, 
  isPersonAvailableOnDate,
  getPriestMonthlyDuty,
  getMonasticWeekIndex,
  getCommunityWeeklyDuties
} from './scheduler';
import { getOrthodoxEaster, getDayLiturgicalInfo } from './orthodoxCalendar';
import { DEFAULT_PERSONS, DEFAULT_MODULES, DEFAULT_RULES } from '../store/monasteryStore';
import { cleanMonasticName } from '../components/PrintableView';
import type { Absence } from '../types';
import { parseISO, format } from 'date-fns';

describe('Clean Monastic Names & Typography Engine', () => {
  it('strips all honorific prefixes properly to avoid duplicate titles', () => {
    expect(cleanMonasticName('Pr. Avacum')).toBe('Avacum');
    expect(cleanMonasticName('Pr. Modest')).toBe('Modest');
    expect(cleanMonasticName('Pr. Iliescu')).toBe('Iliescu');
    expect(cleanMonasticName('Fr. Arghir')).toBe('Arghir');
    expect(cleanMonasticName('Fr. Ioan')).toBe('Ioan');
    expect(cleanMonasticName('Protos. Mina')).toBe('Mina');
    expect(cleanMonasticName('Ierom. Pantelimon')).toBe('Pantelimon');
    expect(cleanMonasticName('Protosinghel Pamvo Dima')).toBe('Pamvo Dima');
    expect(cleanMonasticName('Ierodiacon Ciprian')).toBe('Ciprian');
    expect(cleanMonasticName('Monah Grichentie')).toBe('Grichentie');
    expect(cleanMonasticName('Părintele Sebastian')).toBe('Sebastian');
    expect(cleanMonasticName('Fratele Arghir')).toBe('Arghir');
  });
});

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

  it('permanently assigns Fr. Ioan to strana_ajutor and substitutes him when absent', () => {
    // Normal week without absence: Fr. Ioan must be the helper for Strana 2
    const weekStart = parseISO('2026-09-19');
    const weekEnd = parseISO('2026-09-25');

    const result = generateSchedule({
      startDate: weekStart,
      endDate: weekEnd,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'strana'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const stranaAjutor = result.assignments.filter(a => a.roleId === 'strana_ajutor');
    expect(stranaAjutor.length).toBe(7);
    stranaAjutor.forEach(a => {
      expect(a.personId).toBe('p_ioan');
    });

    // When Fr. Ioan is absent, he is substituted by Pr. Avacum or Pr. Damaschin
    const absences: Absence[] = [
      {
        id: 'abs_ioan',
        personId: 'p_ioan',
        startDate: '2026-09-19',
        endDate: '2026-09-25',
        reason: 'Săptămână de chilie',
      }
    ];

    const resultSub = generateSchedule({
      startDate: weekStart,
      endDate: weekEnd,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'strana'),
      absences,
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const stranaAjutorSub = resultSub.assignments.filter(a => a.roleId === 'strana_ajutor');
    expect(stranaAjutorSub.length).toBe(7);
    stranaAjutorSub.forEach(a => {
      expect(a.status).toBe('substituted');
      expect(a.substitutedFromId).toBe('p_ioan');
      expect(['p_avacum', 'p_damaschin']).toContain(a.personId);
    });
  });

  it('correctly implements the exact 7-day rotation for În Biserică', () => {
    // Week starting Saturday Sept 12, 2026 to Friday Sept 18, 2026
    const startDate = parseISO('2026-09-12'); // Saturday
    const endDate = parseISO('2026-09-18');   // Friday

    const result = generateSchedule({
      startDate,
      endDate,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'biserica'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: false,
    });

    const bisericaAssignments = result.assignments.filter(a => a.moduleId === 'biserica');
    expect(bisericaAssignments.length).toBe(7);

    // Saturday: Pr. Iliescu
    expect(bisericaAssignments.find(a => a.date === '2026-09-12')?.personId).toBe('p_iliescu');
    // Sunday: Pr. Pantelimon
    expect(bisericaAssignments.find(a => a.date === '2026-09-13')?.personId).toBe('p_pantelimon');
    // Monday: Pr. Avacum
    expect(bisericaAssignments.find(a => a.date === '2026-09-14')?.personId).toBe('p_avacum');
    // Tuesday: Pr. Ciprian
    expect(bisericaAssignments.find(a => a.date === '2026-09-15')?.personId).toBe('p_ciprian');
    // Wednesday: Pr. Avacum
    expect(bisericaAssignments.find(a => a.date === '2026-09-16')?.personId).toBe('p_avacum');
    // Thursday: Pr. Ciprian
    expect(bisericaAssignments.find(a => a.date === '2026-09-17')?.personId).toBe('p_ciprian');
    // Friday: Fr. Arghir
    expect(bisericaAssignments.find(a => a.date === '2026-09-18')?.personId).toBe('p_arghir');
  });

  it('substitutes correctly when someone is absent from În Biserică', () => {
    // If Pr. Avacum is absent on Monday Sept 14, 2026, Pr. Ciprian substitutes him
    const absences: Absence[] = [
      {
        id: 'abs_avacum_mon',
        personId: 'p_avacum',
        startDate: '2026-09-14',
        endDate: '2026-09-14',
        reason: 'Învoire / Misiune',
      }
    ];

    const result = generateSchedule({
      startDate: parseISO('2026-09-14'),
      endDate: parseISO('2026-09-14'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'biserica'),
      absences,
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: false,
    });

    const monBiserica = result.assignments.find(a => a.date === '2026-09-14' && a.moduleId === 'biserica');
    expect(monBiserica?.status).toBe('substituted');
    expect(monBiserica?.substitutedFromId).toBe('p_avacum');
    expect(monBiserica?.personId).toBe('p_ciprian');
  });

  it('recalculates week 12-18 Septembrie 2026 with Pr. Sebastian absent and Pr. Avacum serving', () => {
    const startDate = parseISO('2026-09-12');
    const endDate = parseISO('2026-09-18');

    // Pr. Sebastian este plecat 7 zile
    const absences: Absence[] = [
      {
        id: 'abs_sebastian_7zile',
        personId: 'p_sebastian',
        startDate: '2026-09-12',
        endDate: '2026-09-18',
        reason: 'Învoire / Misiune',
        details: 'Plecat 7 zile',
      }
    ];

    // Preotul de rând al săptămânii este Pr. Avacum
    const existingAssignments: any[] = [
      {
        id: '2026-09-12_altar_altar_preot_0',
        date: '2026-09-12',
        moduleId: 'altar',
        roleId: 'altar_preot',
        slotIndex: 0,
        personId: 'p_avacum',
        status: 'manual',
      }
    ];

    const result = generateSchedule({
      startDate,
      endDate,
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES,
      absences,
      substitutionRules: DEFAULT_RULES,
      existingAssignments,
      avoidDoubleBooking: false,
    });

    // 1. Preotul de rând slujește la altar: Pr. Avacum
    const weeklyAltar = result.assignments.filter(a => a.roleId === 'altar_preot');
    expect(weeklyAltar.length).toBeGreaterThanOrEqual(1);

    // 2. Predică 13 Septembrie (Duminică) -> Pr. Avacum (preotul de rând)
    const sundayPreach = result.assignments.find(a => a.date === '2026-09-13' && a.moduleId === 'predica');
    expect(sundayPreach?.personId).toBe('p_avacum');

    // 3. Predică 14 Septembrie (Înălțarea Sf. Cruci - Praznic Împărătesc) -> Pr. Avacum (înlocuitor Sebastian)
    const inaltarePreach = result.assignments.find(a => a.date === '2026-09-14' && a.moduleId === 'predica');
    expect(inaltarePreach?.personId).toBe('p_avacum');

    // 4. Paracliser -> Fr. Arghir
    const paracliserAssignments = result.assignments.filter(a => a.roleId === 'paracliser_principal');
    expect(paracliserAssignments.length).toBe(7);
    paracliserAssignments.forEach(a => {
      expect(a.personId).toBe('p_arghir');
    });

    // 5. Strană 1 -> Pr. Grichentie, Strană 2 -> Fr. Ioan
    const strana1Assignments = result.assignments.filter(a => a.roleId === 'strana_psalt');
    expect(strana1Assignments.length).toBe(7);
    strana1Assignments.forEach(a => {
      expect(a.personId).toBe('p_grichentie');
    });

    const strana2Assignments = result.assignments.filter(a => a.roleId === 'strana_ajutor');
    expect(strana2Assignments.length).toBe(7);
    strana2Assignments.forEach(a => {
      expect(a.personId).toBe('p_ioan');
    });

    // 6. În Biserică -> exact rotația celor 7 zile
    const bisericaAssignments = result.assignments.filter(a => a.moduleId === 'biserica');
    expect(bisericaAssignments.find(a => a.date === '2026-09-12')?.personId).toBe('p_iliescu');
    expect(bisericaAssignments.find(a => a.date === '2026-09-13')?.personId).toBe('p_pantelimon');
    expect(bisericaAssignments.find(a => a.date === '2026-09-14')?.personId).toBe('p_avacum');
    expect(bisericaAssignments.find(a => a.date === '2026-09-15')?.personId).toBe('p_ciprian');
    expect(bisericaAssignments.find(a => a.date === '2026-09-16')?.personId).toBe('p_avacum');
    expect(bisericaAssignments.find(a => a.date === '2026-09-17')?.personId).toBe('p_ciprian');
    expect(bisericaAssignments.find(a => a.date === '2026-09-18')?.personId).toBe('p_arghir');
  });

  it('guarantees each priest has exactly 1 week of Altar, 1 of Strană, 1 of Ascultări, and 1 Liberă per month', () => {
    const priests = ['p_pantelimon', 'p_avacum', 'p_mina', 'p_sebastian'];

    priests.forEach(priestId => {
      const dutiesAcrossMonth = [1, 2, 3, 4].map(w => getPriestMonthlyDuty(priestId, w));
      
      // Must contain all 4 distinct duty categories in a month
      expect(dutiesAcrossMonth).toContain('altar');
      expect(dutiesAcrossMonth).toContain('strana');
      expect(dutiesAcrossMonth).toContain('ascultari');
      expect(dutiesAcrossMonth).toContain('liber');

      // Exactly 1 of each
      expect(dutiesAcrossMonth.filter(d => d === 'altar').length).toBe(1);
      expect(dutiesAcrossMonth.filter(d => d === 'strana').length).toBe(1);
      expect(dutiesAcrossMonth.filter(d => d === 'ascultari').length).toBe(1);
      expect(dutiesAcrossMonth.filter(d => d === 'liber').length).toBe(1);
    });

    // In Week 2 (12-18 Septembrie 2026), Avacum is on Altar, Mina is on Strană, Pantelimon on Ascultări, Sebastian is Liber
    expect(getPriestMonthlyDuty('p_avacum', 2)).toBe('altar');
    expect(getPriestMonthlyDuty('p_mina', 2)).toBe('strana');
    expect(getPriestMonthlyDuty('p_pantelimon', 2)).toBe('ascultari');
    expect(getPriestMonthlyDuty('p_sebastian', 2)).toBe('liber');
  });

  it('automatically rotates the weekly altar priest across weeks 1 to 4 when no manual override exists', () => {
    // Week 1 (e.g. Sept 5 to Sept 11, 2026) -> Pr. Pantelimon
    const resW1 = generateSchedule({
      startDate: parseISO('2026-09-05'),
      endDate: parseISO('2026-09-11'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'altar'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });
    const priestW1 = resW1.assignments.find(a => a.roleId === 'altar_preot');
    expect(priestW1?.personId).toBe('p_pantelimon');

    // Week 2 (Sept 12 to Sept 18, 2026) -> Pr. Avacum
    const resW2 = generateSchedule({
      startDate: parseISO('2026-09-12'),
      endDate: parseISO('2026-09-18'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'altar'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });
    const priestW2 = resW2.assignments.find(a => a.roleId === 'altar_preot');
    expect(priestW2?.personId).toBe('p_avacum');

    // Week 3 (Sept 19 to Sept 25, 2026) -> Pr. Sebastian
    const resW3 = generateSchedule({
      startDate: parseISO('2026-09-19'),
      endDate: parseISO('2026-09-25'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'altar'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });
    const priestW3 = resW3.assignments.find(a => a.roleId === 'altar_preot');
    expect(priestW3?.personId).toBe('p_sebastian');

    // Week 4 (Sept 26 to Oct 2, 2026) -> Pr. Mina
    const resW4 = generateSchedule({
      startDate: parseISO('2026-09-26'),
      endDate: parseISO('2026-10-02'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'altar'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });
    const priestW4 = resW4.assignments.find(a => a.roleId === 'altar_preot');
    expect(priestW4?.personId).toBe('p_mina');
  });

  it('computes correct monastic week index (1 to 4) and community weekly duty profile', () => {
    const weekStart = parseISO('2026-09-12');
    const weekIdx = getMonasticWeekIndex(weekStart);
    expect(weekIdx).toBe(2);

    const duties = getCommunityWeeklyDuties(weekStart, DEFAULT_PERSONS);
    expect(duties.length).toBeGreaterThan(0);
    const avacumDuty = duties.find(d => d.personId === 'p_avacum');
    expect(avacumDuty?.category).toBe('altar');
    const minaDuty = duties.find(d => d.personId === 'p_mina');
    expect(minaDuty?.category).toBe('strana');
    const pantelimonDuty = duties.find(d => d.personId === 'p_pantelimon');
    expect(pantelimonDuty?.category).toBe('ascultari');
    const sebastianDuty = duties.find(d => d.personId === 'p_sebastian');
    expect(sebastianDuty?.category).toBe('liber');
  });

  it('assigns weekly obedience for soferie to Pr. Spiridon across all 7 days of the week', () => {
    const res = generateSchedule({
      startDate: parseISO('2026-09-12'),
      endDate: parseISO('2026-09-18'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES.filter(m => m.id === 'soferie'),
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const soferAssignments = res.assignments.filter(a => a.moduleId === 'soferie');
    expect(soferAssignments.length).toBe(7);
    soferAssignments.forEach(a => {
      expect(a.personId).toBe('p_spiridon');
    });
  });

  it('generates complete weekly assignments for all modular print view boxes (altar, strana, paracliserie, soferie, predica, biserica)', () => {
    const res = generateSchedule({
      startDate: parseISO('2026-09-12'),
      endDate: parseISO('2026-09-18'),
      persons: DEFAULT_PERSONS,
      modules: DEFAULT_MODULES,
      absences: [],
      substitutionRules: DEFAULT_RULES,
      existingAssignments: [],
      avoidDoubleBooking: false,
    });

    // 1. Altar (Preot de rând)
    const altarPreot = res.assignments.filter(a => a.roleId === 'altar_preot');
    expect(altarPreot.length).toBe(7);
    expect(altarPreot[0].personId).toBe('p_avacum');

    // 2. Strana (Protopsalt & Ajutor)
    const stranaPsalt = res.assignments.filter(a => a.roleId === 'strana_psalt');
    expect(stranaPsalt.length).toBe(7);
    const stranaAjutor = res.assignments.filter(a => a.roleId === 'strana_ajutor');
    expect(stranaAjutor.length).toBe(7);
    expect(stranaAjutor[0].personId).toBe('p_ioan');

    // 3. Paracliserie (Paracliser de rând)
    const paracliser = res.assignments.filter(a => a.roleId === 'paracliser_principal');
    expect(paracliser.length).toBe(7);
    expect(paracliser[0].personId).toBe('p_arghir');

    // 4. Șoferie (Șofer de serviciu)
    const sofer = res.assignments.filter(a => a.roleId === 'sofer_garda');
    expect(sofer.length).toBe(7);
    expect(sofer[0].personId).toBe('p_spiridon');

    // 5. Biserică (Pomelnice & Pelerini: 7 zile rotație)
    const biserica = res.assignments.filter(a => a.roleId === 'biserica_rand');
    expect(biserica.length).toBe(7);
    // Saturday: Pr. Iliescu
    const satBiserica = biserica.find(a => a.date === '2026-09-12');
    expect(satBiserica?.personId).toBe('p_iliescu');
    // Sunday: Pr. Pantelimon
    const sunBiserica = biserica.find(a => a.date === '2026-09-13');
    expect(sunBiserica?.personId).toBe('p_pantelimon');
    // Monday: Pr. Avacum
    const monBiserica = biserica.find(a => a.date === '2026-09-14');
    expect(monBiserica?.personId).toBe('p_avacum');
  });
});
