// @ts-expect-error vitest types are not installed in the app tsconfig
import { describe, expect, it } from 'vitest';
import {
  amsterdamKalenderdag,
  kalenderdagenInclusief,
  labelVergelijking,
  vergelijkingsperiode,
  vergelijktZelfdeWeekdag,
  verschuifKalenderdagen,
  weekdagIndex,
  weekdagVergelijking,
} from './vergelijkingsperiode';

describe('zelfde weekdag, 364 kalenderdagen', () => {
  it('vr 30 okt 2026 is vr 31 okt 2025', () => {
    expect(verschuifKalenderdagen('2026-10-30', -364)).toBe('2025-10-31');
    expect(weekdagIndex('2026-10-30')).toBe(weekdagIndex('2025-10-31'));
    expect(labelVergelijking('2025-10-31', '2025-10-31')).toBe('vr 31 okt 2025');
  });

  it('een week blijft even lang en op dezelfde weekdagen', () => {
    const week = vergelijkingsperiode('2026-10-26', '2026-11-01');
    expect(week).toEqual({ van: '2025-10-27', tot: '2025-11-02' });
    expect(kalenderdagenInclusief(week.van, week.tot)).toBe(7);
    expect(weekdagIndex(week.van)).toBe(1);
    expect(weekdagIndex(week.tot)).toBe(0);
    expect(labelVergelijking(week.van, week.tot)).toBe('ma 27 okt – zo 2 nov 2025');
  });

  it('een lopende maand schuift beide uiteinden', () => {
    const maand = vergelijkingsperiode('2026-10-01', '2026-10-30');
    expect(maand).toEqual({ van: '2025-10-02', tot: '2025-10-31' });
    expect(kalenderdagenInclusief(maand.van, maand.tot)).toBe(30);
    expect(weekdagIndex(maand.van)).toBe(weekdagIndex('2026-10-01'));
    expect(labelVergelijking(maand.van, maand.tot)).toBe('do 2 okt – vr 31 okt 2025');
  });

  it('een jaar tot en met 30 okt houdt de lengte', () => {
    const jaar = vergelijkingsperiode('2026-01-01', '2026-10-30');
    expect(jaar).toEqual({ van: '2025-01-02', tot: '2025-10-31' });
    expect(kalenderdagenInclusief(jaar.van, jaar.tot)).toBe(kalenderdagenInclusief('2026-01-01', '2026-10-30'));
    expect(weekdagIndex(jaar.van)).toBe(weekdagIndex('2026-01-01'));
    expect(labelVergelijking(jaar.van, jaar.tot)).toBe('do 2 jan – vr 31 okt 2025');
  });

  it('een aangepaste periode over de maandgrens', () => {
    const aangepast = vergelijkingsperiode('2026-07-14', '2026-08-03');
    expect(aangepast).toEqual({ van: '2025-07-15', tot: '2025-08-04' });
    expect(kalenderdagenInclusief(aangepast.van, aangepast.tot)).toBe(21);
    expect(labelVergelijking(aangepast.van, aangepast.tot)).toBe('di 15 jul – ma 4 aug 2025');
  });

  it('schrikkeljaar: 29 feb 2028 komt uit op 2 mrt 2027 en terug', () => {
    expect(verschuifKalenderdagen('2028-02-28', -364)).toBe('2027-03-01');
    expect(verschuifKalenderdagen('2028-02-29', -364)).toBe('2027-03-02');
    expect(verschuifKalenderdagen('2028-03-01', -364)).toBe('2027-03-03');
    expect(verschuifKalenderdagen('2027-03-02', 364)).toBe('2028-02-29');
    expect(weekdagIndex('2028-02-29')).toBe(weekdagIndex('2027-03-02'));
    const overgang = vergelijkingsperiode('2028-02-28', '2028-03-01');
    expect(overgang).toEqual({ van: '2027-03-01', tot: '2027-03-03' });
    expect(kalenderdagenInclusief(overgang.van, overgang.tot)).toBe(3);
  });

  it('zomer/wintertijd verschuift de kalenderdag niet', () => {
    expect(verschuifKalenderdagen('2026-03-29', -364)).toBe('2025-03-30');
    expect(verschuifKalenderdagen('2026-03-30', -364)).toBe('2025-03-31');
    expect(verschuifKalenderdagen('2026-10-25', -364)).toBe('2025-10-26');
    expect(weekdagIndex('2026-03-30')).toBe(weekdagIndex('2025-03-31'));

    // Middernacht in Amsterdam min 364 keer 24 uur, als UTC-datumstring gelezen,
    // landt een dag eerder. De kalenderdag in Amsterdam is 31 maart.
    const middernacht = new Date('2026-03-30T00:00:00+02:00');
    const viaMilliseconden = new Date(middernacht.getTime() - 364 * 86_400_000).toISOString().slice(0, 10);
    expect(viaMilliseconden).toBe('2025-03-30');
    expect(amsterdamKalenderdag(new Date(middernacht.getTime() - 364 * 86_400_000))).toBe('2025-03-31');
    expect(verschuifKalenderdagen('2026-03-30', -364)).toBe('2025-03-31');
  });

  it('alleen de jaarvergelijkende modi', () => {
    expect(['dag', 'week', 'maand', 'jaar', 'custom'].every(vergelijktZelfdeWeekdag)).toBe(true);
    expect(vergelijktZelfdeWeekdag('dag_prev')).toBe(false);
    expect(vergelijktZelfdeWeekdag('week_prev')).toBe(false);
    expect(vergelijktZelfdeWeekdag('weekend_prev')).toBe(false);
  });

  it('loonkosten gebruikt voor maand, jaar en aangepast hetzelfde label als omzet', () => {
    expect(weekdagVergelijking('maand', '2026-10-01', '2026-10-30')).toEqual({
      van: '2025-10-02', tot: '2025-10-31', label: 'do 2 okt – vr 31 okt 2025',
    });
    expect(weekdagVergelijking('jaar', '2026-01-01', '2026-10-30')).toEqual({
      van: '2025-01-02', tot: '2025-10-31', label: 'do 2 jan – vr 31 okt 2025',
    });
    expect(weekdagVergelijking('custom', '2026-10-30', '2026-10-30')).toEqual({
      van: '2025-10-31', tot: '2025-10-31', label: 'vr 31 okt 2025',
    });
    expect(weekdagVergelijking('maand', '2026-10-30', '2026-10-30')?.van).not.toBe('2025-10-30');
    expect(weekdagVergelijking('dag_prev', '2026-10-30', '2026-10-30')).toBeNull();
    expect(weekdagVergelijking('week_prev', '2026-10-19', '2026-10-25')).toBeNull();
    expect(weekdagVergelijking('weekend_prev', '2026-10-24', '2026-10-25')).toBeNull();
  });
});
