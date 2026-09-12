import { format, addDays } from 'date-fns';

export type LiturgicalRank = 
  | 'praznic_imparatesc' 
  | 'sarbatoare_mare' 
  | 'sarbatoare_sfinti' 
  | 'duminica' 
  | 'sambata' 
  | 'zi_obisnuita';

export interface DayLiturgicalInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Duminică, 1 = Luni, ..., 6 = Sâmbătă
  isRedCross: boolean;
  rank: LiturgicalRank;
  feastTitle: string;
  isSunday: boolean;
  isSaturday: boolean;
  fasting?: string;
}

/**
 * Computus for Orthodox Easter (Pascha) according to the Meeus Julian algorithm
 * with +13 days Gregorian offset (valid for 1900 - 2099).
 */
export function getOrthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 3 = March, 4 = April in Julian
  const day = ((d + e + 114) % 31) + 1;

  // Julian date
  const julianDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // Add 13 days to convert from Julian to Revised Julian / Gregorian
  const gregorianDate = new Date(julianDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  return new Date(gregorianDate.getUTCFullYear(), gregorianDate.getUTCMonth(), gregorianDate.getUTCDate());
}

/**
 * Sărbători cu dată fixă (Cruce Roșie - Praznice Împărătești și Sfinți Mari BOR)
 */
interface FixedFeast {
  title: string;
  rank: 'praznic_imparatesc' | 'sarbatoare_mare' | 'sarbatoare_sfinti';
  fasting?: string;
}

const FIXED_FEASTS: Record<string, FixedFeast> = {
  '01-01': { title: 'Tăierea-împrejur cea după trup a Domnului; Sf. Ier. Vasile cel Mare', rank: 'praznic_imparatesc' },
  '01-06': { title: 'Botezul Domnului - Boboteaza (Dumnezeiasca Arătare)', rank: 'praznic_imparatesc' },
  '01-07': { title: 'Soborul Sfântului Prooroc Ioan Botezătorul', rank: 'sarbatoare_mare' },
  '01-27': { title: 'Aducerea moaștelor Sf. Ierarh Ioan Gură de Aur', rank: 'sarbatoare_sfinti' },
  '01-30': { title: 'Sfinții Trei Ierarhi: Vasile cel Mare, Grigorie Teologul și Ioan Gură de Aur', rank: 'sarbatoare_mare' },
  '02-02': { title: 'Întâmpinarea Domnului', rank: 'praznic_imparatesc' },
  '02-10': { title: 'Sfântul Sfințit Mucenic Haralambie', rank: 'sarbatoare_sfinti' },
  '03-09': { title: 'Sfinții 40 de Mucenici din Sevastia', rank: 'sarbatoare_sfinti' },
  '03-25': { title: 'Buna Vestire (Blagoveștenia)', rank: 'praznic_imparatesc' },
  '04-23': { title: 'Sfântul Mare Mucenic Gheorghe, Purtătorul de biruință', rank: 'sarbatoare_mare' },
  '04-25': { title: 'Sfântul Apostol și Evanghelist Marcu', rank: 'sarbatoare_sfinti' },
  '05-08': { title: 'Sfântul Apostol și Evanghelist Ioan Teologul', rank: 'sarbatoare_sfinti' },
  '05-21': { title: 'Sfinții Împărați Constantin și Elena', rank: 'sarbatoare_mare' },
  '06-02': { title: 'Sfântul Mare Mucenic Ioan cel Nou de la Suceava', rank: 'sarbatoare_mare' },
  '06-24': { title: 'Nașterea Sfântului Ioan Botezătorul (Sânzienele)', rank: 'sarbatoare_mare' },
  '06-29': { title: 'Sfinții Slăviții Apostoli Petru și Pavel', rank: 'sarbatoare_mare' },
  '07-20': { title: 'Sfântul Slăvitul Prooroc Ilie Tesviteanul', rank: 'sarbatoare_mare' },
  '07-27': { title: 'Sfântul Mare Mucenic și Tămăduitor Pantelimon', rank: 'sarbatoare_mare' },
  '08-06': { title: 'Schimbarea la Față a Domnului', rank: 'praznic_imparatesc' },
  '08-15': { title: 'Adormirea Maicii Domnului (Uspenia)', rank: 'praznic_imparatesc' },
  '08-29': { title: 'Tăierea Capului Sfântului Prooroc Ioan Botezătorul', rank: 'sarbatoare_mare', fasting: 'Post negru / Aspru' },
  '09-08': { title: 'Nașterea Maicii Domnului', rank: 'praznic_imparatesc' },
  '09-14': { title: 'Înălțarea Sfintei Cruci', rank: 'praznic_imparatesc', fasting: 'Zi de post' },
  '10-01': { title: 'Acoperământul Maicii Domnului', rank: 'sarbatoare_mare' },
  '10-14': { title: 'Sfânta Cuvioasă Parascheva de la Iași', rank: 'sarbatoare_mare' },
  '10-26': { title: 'Sfântul Mare Mucenic Dimitrie, Izvorâtorul de Mir', rank: 'sarbatoare_mare' },
  '10-27': { title: 'Sf. Cuv. Dimitrie cel Nou, Ocrotitorul Bucureștilor', rank: 'sarbatoare_mare' },
  '11-08': { title: 'Soborul Sfinților Arhangheli Mihail și Gavriil', rank: 'sarbatoare_mare' },
  '11-12': { title: 'Sf. Martiri Năsăudeni; Sf. Ioan Milostivul', rank: 'sarbatoare_sfinti' },
  '11-21': { title: 'Intrarea în Biserică a Maicii Domnului (Ovidenia)', rank: 'praznic_imparatesc' },
  '11-30': { title: 'Sfântul Apostol Andrei, cel Întâi Chemat, Ocrotitorul României', rank: 'sarbatoare_mare' },
  '12-06': { title: 'Sfântul Ierarh Nicolae, Făcătorul de minuni', rank: 'sarbatoare_mare' },
  '12-12': { title: 'Sfântul Ierarh Spiridon al Trimitundei', rank: 'sarbatoare_sfinti' },
  '12-25': { title: 'Nașterea Domnului - Crăciunul', rank: 'praznic_imparatesc' },
  '12-26': { title: 'Soborul Maicii Domnului; Sf. Cuv. Nicodim de la Tismana', rank: 'sarbatoare_mare' },
  '12-27': { title: 'Sfântul Apostol Întâiul Mucenic și Arhidiacon Ștefan', rank: 'sarbatoare_mare' },
};

/**
 * Computes liturgical details for any given day in the Orthodox Church
 */
export function getDayLiturgicalInfo(date: Date): DayLiturgicalInfo {
  const year = date.getFullYear();
  const dateStr = format(date, 'yyyy-MM-dd');
  const monthDay = format(date, 'MM-dd');
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

  // Check movable feasts (Pascha cycle)
  const easter = getOrthodoxEaster(year);
  const easterStr = format(easter, 'yyyy-MM-dd');
  const floriiStr = format(addDays(easter, -7), 'yyyy-MM-dd');
  const vinereaMareStr = format(addDays(easter, -2), 'yyyy-MM-dd');
  const aDouaZiPasteStr = format(addDays(easter, 1), 'yyyy-MM-dd');
  const aTreiaZiPasteStr = format(addDays(easter, 2), 'yyyy-MM-dd');
  const izvorulTamaduiriiStr = format(addDays(easter, 5), 'yyyy-MM-dd');
  const inaltareaStr = format(addDays(easter, 39), 'yyyy-MM-dd');
  const rusaliileStr = format(addDays(easter, 49), 'yyyy-MM-dd');
  const sfantaTreimeStr = format(addDays(easter, 50), 'yyyy-MM-dd');

  // Movable matching
  if (dateStr === easterStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'praznic_imparatesc',
      feastTitle: 'Sfintele Paști - Învierea Domnului',
      isSunday: true,
      isSaturday: false,
    };
  }
  if (dateStr === floriiStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'praznic_imparatesc',
      feastTitle: 'Intrarea Domnului în Ierusalim (Floriile)',
      isSunday: true,
      isSaturday: false,
      fasting: 'Dezlegare la pește',
    };
  }
  if (dateStr === inaltareaStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'praznic_imparatesc',
      feastTitle: 'Înălțarea Domnului (Ispasul)',
      isSunday: false,
      isSaturday: false,
    };
  }
  if (dateStr === rusaliileStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'praznic_imparatesc',
      feastTitle: 'Pogorârea Sfântului Duh (Rusaliile / Cincizecimea)',
      isSunday: true,
      isSaturday: false,
    };
  }
  if (dateStr === sfantaTreimeStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'praznic_imparatesc',
      feastTitle: 'Sfânta Treime (Lunea de după Rusalii)',
      isSunday: false,
      isSaturday: false,
    };
  }
  if (dateStr === aDouaZiPasteStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'praznic_imparatesc',
      feastTitle: 'A doua zi de Paști (Săptămâna Luminată)',
      isSunday: false,
      isSaturday: false,
    };
  }
  if (dateStr === aTreiaZiPasteStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'praznic_imparatesc',
      feastTitle: 'A treia zi de Paști (Săptămâna Luminată)',
      isSunday: false,
      isSaturday: false,
    };
  }
  if (dateStr === izvorulTamaduiriiStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'sarbatoare_mare',
      feastTitle: 'Izvorul Tămăduirii (Vinerea Luminată)',
      isSunday: false,
      isSaturday: false,
    };
  }
  if (dateStr === vinereaMareStr) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'sarbatoare_mare',
      feastTitle: 'Sfânta și Marea Vineri (Răstignirea Domnului)',
      isSunday: false,
      isSaturday: false,
      fasting: 'Post negru',
    };
  }

  // Check fixed feasts
  const fixed = FIXED_FEASTS[monthDay];
  if (fixed) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: fixed.rank === 'praznic_imparatesc' || fixed.rank === 'sarbatoare_mare' || fixed.rank === 'sarbatoare_sfinti',
      rank: fixed.rank,
      feastTitle: fixed.title,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
      fasting: fixed.fasting,
    };
  }

  // Regular Sunday or Saturday or ordinary day
  if (dayOfWeek === 0) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: true,
      rank: 'duminica',
      feastTitle: 'Duminică - Ziua Domnului & a Învierii',
      isSunday: true,
      isSaturday: false,
    };
  }

  if (dayOfWeek === 6) {
    return {
      date: dateStr,
      dayOfWeek,
      isRedCross: false,
      rank: 'sambata',
      feastTitle: 'Sâmbătă - Pomenirea Sfinților & a celor adormiți',
      isSunday: false,
      isSaturday: true,
    };
  }

  return {
    date: dateStr,
    dayOfWeek,
    isRedCross: false,
    rank: 'zi_obisnuita',
    feastTitle: 'Zi de rând liturgic',
    isSunday: false,
    isSaturday: false,
  };
}

/**
 * Returns all significant feasts for a whole month
 */
export function getMonthFeasts(year: number, month: number): DayLiturgicalInfo[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const list: DayLiturgicalInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    const info = getDayLiturgicalInfo(dt);
    if (info.isRedCross || info.isSunday || info.isSaturday) {
      list.push(info);
    }
  }

  return list;
}
