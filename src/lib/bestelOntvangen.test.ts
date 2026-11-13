import { describe, expect, test } from 'vitest';
import { leesOntvangen, planOntvangst, type BordRegel } from '../../supabase/functions/bot-bestelbord/ontvangen';

const ID = '22222222-2222-4222-8222-222222222222';
const NU = '2026-11-13T18:00:00.000Z';

function rij(deel: Partial<BordRegel> = {}): BordRegel {
  return {
    id: ID, vestiging: 'West', status: 'besteld', naam: 'Passata', aantal: 6, eenheid: 'blik',
    leverancier_id: null, artikel_id: null, artikel_vorm_id: null, ...deel,
  };
}

describe('ontvangen invoer', () => {
  test('geleverd zonder aantal, deels met aantal', () => {
    const uit = leesOntvangen([
      { id: ID, uitkomst: 'geleverd' },
      { id: '33333333-3333-4333-8333-333333333333', uitkomst: 'deels', geleverd_aantal: 4, opmerking: '  krat stuk  ' },
    ]);
    expect(uit.ok).toBe(true);
    if (!uit.ok) return;
    expect(uit.regels[0]).toEqual({ id: ID, uitkomst: 'geleverd', geleverdAantal: null, opmerking: '' });
    expect(uit.regels[1].opmerking).toBe('krat stuk');
    expect(uit.regels[1].geleverdAantal).toBe(4);
  });

  test('weigert deels zonder aantal, een dubbele id en een open regel-vorm', () => {
    expect(leesOntvangen([{ id: ID, uitkomst: 'deels' }]).ok).toBe(false);
    expect(leesOntvangen([{ id: ID, uitkomst: 'deels', geleverd_aantal: 1.5 }]).ok).toBe(false);
    expect(leesOntvangen([{ id: ID, uitkomst: 'geleverd' }, { id: ID, uitkomst: 'geleverd' }]).ok).toBe(false);
    expect(leesOntvangen([]).ok).toBe(false);
  });
});

describe('ontvangen plan, dezelfde overgangen als de app', () => {
  test('geleverd zet status, tijdstip en levering_status', () => {
    const plan = planOntvangst(rij(), { id: ID, uitkomst: 'geleverd', geleverdAantal: null, opmerking: '' }, NU, 'West');
    expect(plan).toEqual({
      soort: 'geleverd',
      update: { status: 'geleverd', geleverd_op: NU, geleverd_door: null, levering_status: 'geleverd' },
    });
  });

  test('niet geleverd gaat terug naar open, met opmerking', () => {
    const plan = planOntvangst(rij(), { id: ID, uitkomst: 'niet_geleverd', geleverdAantal: null, opmerking: 'niet op de bon' }, NU, 'West');
    expect(plan).toEqual({
      soort: 'niet_geleverd',
      update: { status: 'open', verwachte_levering: null, levering_status: 'niet_geleverd', levering_opmerking: 'niet op de bon' },
    });
  });

  test('deels levert het origineel en zet het restant als open regel terug', () => {
    const plan = planOntvangst(
      rij({ leverancier_id: 'lev', artikel_id: 'art', artikel_vorm_id: 'vorm' }),
      { id: ID, uitkomst: 'deels', geleverdAantal: 4, opmerking: 'twee kapot' },
      NU,
      'West',
    );
    expect(plan.soort).toBe('deels');
    if (plan.soort !== 'deels') return;
    expect(plan.restantAantal).toBe(2);
    expect(plan.update).toEqual({
      status: 'geleverd', geleverd_op: NU, geleverd_door: null, levering_status: 'deels',
      levering_opmerking: '4 blik binnen — twee kapot',
    });
    expect(plan.restant).toMatchObject({
      vestiging: 'West', naam: 'Passata', aantal: 2, eenheid: 'blik', bron: 'restant', restant_van: ID,
      leverancier_id: 'lev', artikel_id: 'art', artikel_vorm_id: 'vorm', levering_opmerking: 'twee kapot', gemeld_door: null,
    });
  });

  test('alleen een bestelde regel van deze vestiging', () => {
    expect(planOntvangst(null, { id: ID, uitkomst: 'geleverd', geleverdAantal: null, opmerking: '' }, NU, 'West').soort).toBe('fout');
    expect(planOntvangst(rij({ vestiging: 'Midsland' }), { id: ID, uitkomst: 'geleverd', geleverdAantal: null, opmerking: '' }, NU, 'West')).toMatchObject({ soort: 'fout' });
    expect(planOntvangst(rij({ status: 'open' }), { id: ID, uitkomst: 'geleverd', geleverdAantal: null, opmerking: '' }, NU, 'West')).toMatchObject({ reden: 'status is open' });
    expect(planOntvangst(rij({ aantal: 2 }), { id: ID, uitkomst: 'deels', geleverdAantal: 2, opmerking: '' }, NU, 'West')).toMatchObject({ soort: 'fout' });
  });
});
