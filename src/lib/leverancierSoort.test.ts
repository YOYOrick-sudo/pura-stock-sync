import { describe, expect, test, vi } from 'vitest';
import {
  alsSoort, kanaalVoorOpslaan, leesRouteLeveranciers, soortKolomOntbreekt, soortLabel, suggestieOnderschrift, zonderWinkelIntern,
} from './leverancierSoort';

function keten(antwoord: { data: unknown; error: { code?: string; message?: string } | null }) {
  const b: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    then: (fn: (v: typeof antwoord) => unknown) => Promise<unknown>;
  } = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), order: vi.fn(), then: (fn) => Promise.resolve(antwoord).then(fn) };
  b.select.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  b.is.mockReturnValue(b);
  b.order.mockReturnValue(b);
  return b;
}

describe('soort van een leverancier', () => {
  test('onbekend of leeg valt terug op extern', () => {
    expect(alsSoort(undefined)).toBe('extern');
    expect(alsSoort(null)).toBe('extern');
    expect(alsSoort('')).toBe('extern');
    expect(alsSoort('winkel')).toBe('winkel');
    expect(soortLabel('intern')).toBe('Intern');
    expect(soortLabel('winkel')).toBe('Zelf halen');
    expect(soortLabel(undefined)).toBe('Extern');
  });

  test('opslaan wijzigt het kanaal van winkel en intern niet', () => {
    expect(kanaalVoorOpslaan('winkel', 'mail')).toBeNull();
    expect(kanaalVoorOpslaan('intern', 'portal')).toBeNull();
    expect(kanaalVoorOpslaan('extern', 'mail')).toBe('mail');
    expect(kanaalVoorOpslaan('extern', 'winkel')).toBeNull();
    expect(kanaalVoorOpslaan(undefined, 'api')).toBe('api');
  });

  test('routes houden alleen externe leveranciers', async () => {
    const b = keten({
      data: [
        { id: 'boer', naam: 'Boer & Chef', kanaal: 'mail', soort: 'extern' },
        { id: 'spar', naam: 'Spar (zelf halen)', kanaal: 'winkel', soort: 'winkel' },
        { id: 'mid', naam: 'Midsland (intern)', kanaal: 'intern', soort: 'intern' },
        { id: 'oud', naam: 'Zonder soort', kanaal: 'portal', soort: null },
      ],
      error: null,
    });
    const db = { from: vi.fn(() => b) };
    expect((await leesRouteLeveranciers(db)).map((l) => l.id)).toEqual(['boer', 'oud']);
    expect(b.select).toHaveBeenCalledWith('id, naam, kanaal, soort');
  });

  test('ontbrekende soort-kolom leest iedereen als extern', async () => {
    const fout = keten({ data: null, error: { code: '42703', message: 'column leveranciers.soort does not exist' } });
    const goed = keten({ data: [{ id: 'spar', naam: 'Spar (zelf halen)', kanaal: 'winkel' }], error: null });
    const from = vi.fn().mockReturnValueOnce(fout).mockReturnValueOnce(goed);
    const lijst = await leesRouteLeveranciers({ from });
    expect(lijst).toEqual([{ id: 'spar', naam: 'Spar (zelf halen)', kanaal: 'winkel', soort: 'extern' }]);
    expect(goed.select).toHaveBeenCalledWith('id, naam, kanaal');
    expect(soortKolomOntbreekt({ code: 'PGRST204', message: 'Could not find the soort column' })).toBe(true);
    expect(soortKolomOntbreekt({ message: 'permission denied' })).toBe(false);
  });

  test('ontvangst en suggesties noemen winkel en intern en laten extern met rust', () => {
    const soorten = new Map<string, 'extern' | 'winkel' | 'intern'>([['spar', 'winkel'], ['mid', 'intern'], ['boer', 'extern']]);
    const namen = new Map([['spar', 'Spar (zelf halen)'], ['mid', 'Midsland (intern)'], ['boer', 'Boer & Chef']]);
    expect(zonderWinkelIntern([['spar', 'Spar (zelf halen)'], ['boer', 'Boer & Chef'], ['mid', 'Midsland (intern)']], soorten).map(([id]) => id)).toEqual(['boer']);
    expect(zonderWinkelIntern([['spar', 'Spar (zelf halen)']], new Map()).map(([id]) => id)).toEqual(['spar']);
    expect(suggestieOnderschrift({
      leverancier_id: 'spar',
      vormen: [
        { vorm: 'bak 500 g', leverancier_id: 'spar', leverancier_naam: 'Spar (zelf halen)' },
        { vorm: 'emmer', leverancier_id: 'boer', leverancier_naam: 'Boer & Chef' },
      ],
    }, soorten, namen)).toBe('2 verpakkingen · Spar (zelf halen)');
    expect(suggestieOnderschrift({
      vormen: [{ vorm: 'doos', leverancier_id: 'boer', leverancier_naam: 'Boer & Chef' }],
    }, soorten, namen)).toBe('doos · Boer & Chef');
    expect(suggestieOnderschrift({
      vormen: [{ vorm: 'bak', leverancier_id: 'mid' }],
    }, soorten, namen)).toBe('bak · Midsland (intern)');
  });
});
