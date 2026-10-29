// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, it } from 'vitest';
import { duurderWaarschuwing, pijlRichting, prijsTooltip, zoekSignaal, type PrijsSignaal } from './prijsSignaal';

const sig = (o: Partial<PrijsSignaal>): PrijsSignaal => ({
  vestiging: 'Midsland', leverancier_id: 'L1', artikel_id: 'A1', naam: 'Feta', verpakking: '1,6kg', eenheid: null,
  nu_prijs: 22.6, normale_prijs: 21.89, n_vergelijk: 3, verschil_pct: 3.2, richting: 'omhoog', pijl: true, tooltip: null, ...o,
});

describe('pijlRichting', () => {
  it('toont pijl omhoog bij stijging boven drempel', () => expect(pijlRichting(sig({}))).toBe('omhoog'));
  it('toont pijl omlaag bij daling', () => expect(pijlRichting(sig({ richting: 'omlaag' }))).toBe('omlaag'));
  it('geen pijl als de view pijl=false geeft (onder 3% of te weinig vergelijking)', () => expect(pijlRichting(sig({ pijl: false }))).toBeNull());
});

describe('prijsTooltip', () => {
  it('Nederlandse notatie met 2 decimalen', () => expect(prijsTooltip(sig({}))).toBe('was €21,89, nu €22,60'));
});

describe('duurderWaarschuwing', () => {
  it('≥5% én ≥€5 extra geeft waarschuwing', () => {
    // 10 × (11 − 10) = €10 extra, 10%
    expect(duurderWaarschuwing(sig({ nu_prijs: 11, normale_prijs: 10 }), 10)).toBe('Let op: €10,00 duurder dan normaal (was €10,00, nu €11,00)');
  });
  it('≥5% maar minder dan €5 extra: geen waarschuwing', () => {
    expect(duurderWaarschuwing(sig({ nu_prijs: 11, normale_prijs: 10 }), 4)).toBeNull();
  });
  it('≥€25 extra geeft waarschuwing ook onder 5%', () => {
    // 100 × (10,30 − 10) = €30, 3%
    expect(duurderWaarschuwing(sig({ nu_prijs: 10.3, normale_prijs: 10 }), 100)).not.toBeNull();
  });
  it('onder beide drempels: geen waarschuwing', () => {
    expect(duurderWaarschuwing(sig({ nu_prijs: 10.3, normale_prijs: 10 }), 10)).toBeNull();
  });
  it('goedkoper: geen waarschuwing', () => expect(duurderWaarschuwing(sig({ nu_prijs: 9, normale_prijs: 10 }), 100)).toBeNull());
});

describe('zoekSignaal', () => {
  it('kiest op verpakking als er meerdere zijn', () => {
    const a = sig({ verpakking: '24x20cl' }), b = sig({ verpakking: '12x33cl' });
    expect(zoekSignaal([a, b], { leverancier_id: 'L1', artikel_id: 'A1', naam: 'x', vorm: '24×20cl' })).toBe(a);
  });
  it('geeft niets bij twijfel', () => {
    expect(zoekSignaal([sig({ verpakking: 'a' }), sig({ verpakking: 'b' })], { leverancier_id: 'L1', artikel_id: 'A1', naam: 'x' })).toBeNull();
  });
});
