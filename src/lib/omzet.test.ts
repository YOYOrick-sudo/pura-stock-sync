// @ts-ignore bun test runner
import { describe, expect, it } from 'bun:test';
import { allNavigationItems } from '@/hooks/useNavigatieItems';
import { MT_ROUTES } from '@/lib/mt';
import { controleRegels } from './omzet.fixture';
import {
  bouwOmzetBeeld,
  formatEuro,
  formatProcent,
  maandOpen,
  procent1,
  werkdagVanIso,
  amsterdamDatum,
  type OmzetRegel,
} from './omzet';

const VANDAAG = '2026-11-01';
const regels = controleRegels();

function beeld(keuze: 'Totaal' | 'Midsland' | 'West', extra: OmzetRegel[] = []) {
  return bouwOmzetBeeld([...regels, ...extra], keuze, 2026, VANDAAG);
}

describe('omzet oktober 2026 tegen 2025', () => {
  it('totaal, Midsland en West kloppen op de euro', () => {
    expect(beeld('Totaal').maand.nu.omzet).toBe(96028);
    expect(beeld('Midsland').maand.nu.omzet).toBe(66340);
    expect(beeld('West').maand.nu.omzet).toBe(29688);
    expect(beeld('Totaal').maand.toen.omzet).toBe(100226);
    expect(beeld('Midsland').maand.toen.omzet).toBe(71256);
    expect(beeld('West').maand.toen.omzet).toBe(28970);
  });

  it('verschil in euro en procent, afgerond op één decimaal', () => {
    const totaal = beeld('Totaal').maand.verschil;
    const midsland = beeld('Midsland').maand.verschil;
    const west = beeld('West').maand.verschil;
    expect(totaal.euro).toBe(-4198);
    expect(procent1(totaal.procent!)).toBe(-4.2);
    expect(midsland.euro).toBe(-4916);
    expect(procent1(midsland.procent!)).toBe(-6.9);
    expect(west.euro).toBe(718);
    expect(procent1(west.procent!)).toBe(2.5);
    expect(formatProcent(totaal.procent)).toBe('−4,2%');
    expect(formatEuro(96028)).toContain('96.028');
  });

  it('open dagen, omzet per open dag en gemiddelde bon', () => {
    const midsland = beeld('Midsland').maand;
    const west = beeld('West').maand;
    const totaal = beeld('Totaal').maand;
    expect(midsland.nu.openDagen).toBe(24);
    expect(midsland.toen.openDagen).toBe(27);
    expect(west.nu.openDagen).toBe(26);
    expect(west.toen.openDagen).toBe(31);
    expect(totaal.nu.openDagen).toBe(50);
    expect(procent1(midsland.perDagVerschil.procent!)).toBe(4.7);
    expect(procent1(west.perDagVerschil.procent!)).toBe(22.2);
    expect(Math.round(midsland.gemBonNu! * 100) / 100).toBe(46.65);
    expect(Math.round(west.gemBonNu! * 100) / 100).toBe(26.27);
    expect(Math.round(totaal.gemBonNu! * 100) / 100).toBe(37.63);
    expect(totaal.nu.bonnen).toBe(1422 + 1130);
  });
});

describe('jaar tot nu toe en maanden die in beide jaren open waren', () => {
  it('januari t/m oktober, zoals op 1 november', () => {
    const totaal = beeld('Totaal');
    const midsland = beeld('Midsland');
    const west = beeld('West');
    expect(totaal.ytd.tot).toBe('2026-11-01');
    expect(totaal.ytd.toenTot).toBe('2025-11-01');
    expect(midsland.ytd.nu.omzet).toBe(785240);
    expect(midsland.ytd.toen.omzet).toBe(890038);
    expect(procent1(midsland.ytd.verschil.procent!)).toBe(-11.8);
    expect(west.ytd.nu.omzet).toBe(294194);
    expect(west.ytd.toen.omzet).toBe(352848);
    expect(procent1(west.ytd.verschil.procent!)).toBe(-16.6);
    expect(totaal.ytd.nu.omzet).toBe(1079434);
    expect(totaal.ytd.toen.omzet).toBe(1242886);
    expect(procent1(totaal.ytd.verschil.procent!)).toBe(-13.2);
  });

  it('alleen apr–okt, toen beide vestigingen in beide jaren open waren', () => {
    const totaal = beeld('Totaal').gelijk;
    const midsland = beeld('Midsland').gelijk;
    const west = beeld('West').gelijk;
    expect(totaal.maanden).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(totaal.label).toBe('apr–okt');
    expect(midsland.maanden).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(west.nu).toBe(290457);
    expect(west.toen).toBe(304355);
    expect(procent1(west.verschil.procent!)).toBe(-4.6);
    expect(midsland.nu).toBe(747600);
    expect(midsland.toen).toBe(773778);
    expect(procent1(midsland.verschil.procent!)).toBe(-3.4);
    expect(totaal.toen).toBe(1078133);
    expect(totaal.nu).toBe(1038057);
    expect(procent1(totaal.verschil.procent!)).toBe(-3.7);
    expect(maandOpen(4, 2026, 1)).toBe(false);
    expect(maandOpen(17, 2026, 4)).toBe(true);
    expect(maandOpen(22, 2026, 1)).toBe(true);
  });
});

describe('maanden zonder data', () => {
  it('een dichte maand is dicht, niet −100%', () => {
    const maart = beeld('Totaal').maanden[2];
    expect(maart.label).toBe('mrt');
    expect(maart.ditJaar).toBeNull();
    expect(maart.procent).toBeNull();
    expect(formatProcent(maart.procent)).toBe('dicht');
    expect(beeld('West').maanden[1].ditJaar).toBeNull();
    expect(beeld('Totaal').maanden[1].ditJaar).toBe(1128);
    expect(beeld('Totaal').dichtMaanden).toEqual([3, 11, 12]);
  });

  it('een losse novemberdag telt mee tot nu toe, niet als volle maand', () => {
    const extra: OmzetRegel[] = [
      { vestiging: 'Midsland', werkdag: '2025-11-01', omzetExcl: 100, aantalBonnen: 2 },
      { vestiging: 'Midsland', werkdag: '2026-11-01', omzetExcl: 50, aantalBonnen: 1 },
    ];
    const midsland = beeld('Midsland', extra);
    expect(midsland.maand.nu.omzet).toBe(66340);
    expect(midsland.ytd.nu.omzet).toBe(785240 + 50);
    expect(midsland.ytd.toen.omzet).toBe(890038 + 100);
    expect(midsland.gelijk.maanden).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(midsland.maanden[10].ditJaar).toBe(50);
    expect(midsland.maanden[10].procent).not.toBeNull();
  });
});

describe('werkdag, open dag en bon', () => {
  it('twee uren op dezelfde werkdag zijn één open dag en één bonnentotaal', () => {
    const los: OmzetRegel[] = [
      { vestiging: 'West', werkdag: '2026-10-03', omzetExcl: 10.1, aantalBonnen: 1 },
      { vestiging: 'West', werkdag: '2026-10-03', omzetExcl: 0.2, aantalBonnen: 1 },
      { vestiging: 'West', werkdag: '2026-10-04', omzetExcl: 0, aantalBonnen: 4 },
      { vestiging: 'West', werkdag: '2026-10-05', omzetExcl: 5, aantalBonnen: 1, isDemo: true },
    ];
    const oktober = bouwOmzetBeeld(los, 'West', 2026, VANDAAG).maand;
    expect(oktober.nu.omzet).toBe(10.3);
    expect(oktober.nu.openDagen).toBe(1);
    expect(oktober.nu.bonnen).toBe(6);
    expect(oktober.gemBonNu).toBeCloseTo(10.3 / 6, 5);
  });

  it('kantelt de werkdag om 06:00 Europe/Amsterdam', () => {
    expect(werkdagVanIso('2026-07-04T02:30:00+02:00')).toEqual({ werkdag: '2026-07-03', uur: 2 });
    expect(werkdagVanIso('2026-07-04T05:59:00+02:00').werkdag).toBe('2026-07-03');
    expect(werkdagVanIso('2026-07-04T06:00:00+02:00')).toEqual({ werkdag: '2026-07-04', uur: 6 });
    expect(werkdagVanIso('2026-07-04T14:00:00Z')).toEqual({ werkdag: '2026-07-04', uur: 16 });
    expect(werkdagVanIso('2026-11-01T00:30:00Z').werkdag).toBe('2026-10-31');
    expect(amsterdamDatum(new Date('2026-11-01T00:13:00Z'))).toBe('2026-11-01');
    expect(amsterdamDatum(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11-01');
  });

  it('een bon vóór het kanteluur blijft in de werkdag die de sync bewaart', () => {
    const grens = werkdagVanIso('2026-11-01T00:30:00Z');
    const beeldNaGrens = bouwOmzetBeeld(
      [{ vestiging: 'Midsland', werkdag: grens.werkdag, omzetExcl: 80, aantalBonnen: 1 }],
      'Midsland',
      2026,
      VANDAAG,
    );
    expect(grens.werkdag).toBe('2026-10-31');
    expect(beeldNaGrens.maand.nu.omzet).toBe(80);
    expect(beeldNaGrens.maanden[10].ditJaar).toBeNull();
  });
});

describe('menu', () => {
  it('Omzet is een MT-item en hoort bij de MT-routes', () => {
    const item = allNavigationItems.find((kandidaat) => kandidaat.url === '/omzet');
    expect(item && 'mtOnly' in item && item.mtOnly).toBe(true);
    expect(MT_ROUTES).toContain('/omzet');
  });
});
