import { describe, it, expect } from 'vitest';
import { generateSchedule, isPersonAbsent } from './scheduler';
import type { Person, Module, Absence, SubstitutionRule } from '../types';
import { parseISO } from 'date-fns';

describe('Monastery Scheduler Algorithm', () => {
  const mockPersons: Person[] = [
    {
      id: 'p1',
      name: 'Părintele Paisie',
      rank: 'Arhimandrit',
      skills: ['altar'],
      active: true,
      colorTag: '#8b1d24',
    },
    {
      id: 'p2',
      name: 'Părintele Sofronie',
      rank: 'Ieromonah',
      skills: ['altar', 'strana'],
      active: true,
      colorTag: '#b38210',
    },
    {
      id: 'p3',
      name: 'Părintele Teofan',
      rank: 'Ieromonah',
      skills: ['altar', 'soferie'],
      active: true,
      colorTag: '#1d4ed8',
    },
    {
      id: 'p4',
      name: 'Fratele Ioan',
      rank: 'Frate',
      skills: ['paracliserie', 'soferie'],
      active: true,
      colorTag: '#047857',
    },
  ];

  const mockModules: Module[] = [
    {
      id: 'altar',
      name: 'Altar',
      iconName: 'Church',
      color: '#8b1d24',
      rotationCycle: 'weekly',
      isSystem: true,
      roles: [{ id: 'altar_preot', name: 'Preot de rând', requiredCount: 1 }],
    },
    {
      id: 'soferie',
      name: 'Șoferie',
      iconName: 'Car',
      color: '#1d4ed8',
      rotationCycle: 'daily',
      isSystem: true,
      roles: [{ id: 'sofer_garda', name: 'Șofer de gardă', requiredCount: 1 }],
    },
  ];

  it('correctly detects if a person is absent in a date range', () => {
    const absences: Absence[] = [
      {
        id: 'a1',
        personId: 'p3',
        startDate: '2026-09-14',
        endDate: '2026-09-20',
        reason: 'Spital / Medical',
      },
    ];

    expect(isPersonAbsent('p3', parseISO('2026-09-15'), absences)).toBeDefined();
    expect(isPersonAbsent('p3', parseISO('2026-09-21'), absences)).toBeUndefined();
    expect(isPersonAbsent('p1', parseISO('2026-09-15'), absences)).toBeUndefined();
  });

  it('assigns qualified persons to weekly module and honors skills', () => {
    const res = generateSchedule({
      startDate: parseISO('2026-09-14'),
      endDate: parseISO('2026-09-20'),
      persons: mockPersons,
      modules: mockModules,
      absences: [],
      substitutionRules: [],
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const altarAssignments = res.assignments.filter(a => a.moduleId === 'altar');
    expect(altarAssignments.length).toBe(7); // 7 days of the week
    
    // Only persons with 'altar' skill (p1, p2, p3) can be assigned
    altarAssignments.forEach(a => {
      expect(['p1', 'p2', 'p3']).toContain(a.personId);
    });
  });

  it('applies explicit preferred substitute when person is absent', () => {
    const absences: Absence[] = [
      {
        id: 'abs_1',
        personId: 'p3', // Teofan is absent
        startDate: '2026-09-14',
        endDate: '2026-09-20',
        reason: 'Învoire / Misiune',
        preferredSubstituteId: 'p2', // Sofronie must replace him!
      },
    ];

    const res = generateSchedule({
      startDate: parseISO('2026-09-14'),
      endDate: parseISO('2026-09-20'),
      persons: [mockPersons[1], mockPersons[2]], // Only p2 and p3 available for altar
      modules: [mockModules[0]], // Altar
      absences,
      substitutionRules: [],
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const altarAssignments = res.assignments.filter(a => a.moduleId === 'altar');
    expect(altarAssignments.length).toBe(7);
    // Since p3 is absent and preferred substitute is p2, p2 must be assigned
    altarAssignments.forEach(a => {
      expect(a.personId).toBe('p2');
    });
  });

  it('applies general substitution rule chain (X -> Y -> Z)', () => {
    const absences: Absence[] = [
      {
        id: 'abs_1',
        personId: 'p1', // Paisie is absent with no direct substitute defined
        startDate: '2026-09-14',
        endDate: '2026-09-20',
        reason: 'Deplasare / Aprovizionare',
      },
    ];

    const rules: SubstitutionRule[] = [
      {
        id: 'r1',
        moduleId: 'altar',
        targetPersonId: 'p1',
        substituteIds: ['p2', 'p3'], // 1st choice p2, 2nd choice p3
      },
    ];

    const res = generateSchedule({
      startDate: parseISO('2026-09-14'),
      endDate: parseISO('2026-09-20'),
      persons: mockPersons,
      modules: [mockModules[0]], // Altar
      absences,
      substitutionRules: rules,
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const altarAssignments = res.assignments.filter(a => a.moduleId === 'altar');
    expect(altarAssignments.length).toBe(7);
    // p2 is the first substitute in rule
    altarAssignments.forEach(a => {
      expect(a.personId).toBe('p2');
    });
  });

  it('avoids double-booking the same person on the same date', () => {
    const res = generateSchedule({
      startDate: parseISO('2026-09-14'),
      endDate: parseISO('2026-09-14'), // Single day
      persons: mockPersons,
      modules: mockModules, // Altar and Soferie
      absences: [],
      substitutionRules: [],
      existingAssignments: [],
      avoidDoubleBooking: true,
    });

    const dateStr = '2026-09-14';
    const dayAssignments = res.assignments.filter(a => a.date === dateStr);
    const assignedIds = dayAssignments.map(a => a.personId).filter(Boolean);
    const uniqueIds = new Set(assignedIds);

    // Should have distinct people assigned for altar and soferie
    expect(assignedIds.length).toBe(uniqueIds.size);
  });
});
