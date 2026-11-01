// @ts-ignore bun test runner
import { describe, expect, it } from 'bun:test';
import { allNavigationItems } from '@/hooks/useNavigatieItems';
import { MT_ROUTES } from '@/lib/mt';
import { controleRegels } from './omzet.fixture';
import {
  bouwOmzetBeeld,
  formatEuro,
  formatProcent,
  jarenUit,
  maandDetail,
  maandOpen,
  maandVensters,
  procent1,
  standaardZichtbareJaren,
  tintVoorJaar,
  voegDagen,
  werkdagVanIso,
  amsterdamDatum,
  type OmzetRegel,
} from './omzet';

const VANDAAG = '2026-11-01';
const regels = controleRegels();

function beeld(keuze: 'Totaal' | 'Midsland' | 'West', extra: OmzetRegel[] = [], maand?: number) {
  return bouwOmzetBeeld([...regels, ...extra], keuze, 2026, VANDAAG, maand);
}

describe('omzet oktober 2026 tegen 2025', () => {
  it('totaal, Midsland en West kloppen op de euro', () => {
    expect(beeld('Totaal').maand.nu.omzet).toBe(96036);
    expect(beeld('Midsland').maand.nu.omzet).toBe(66348);
    expect(beeld('West').maand.nu.omzet).toBe(29688);
    expect(beeld('Totaal').maand.toen.omzet).toBe(100226);
    expect(beeld('Midsland').maand.toen.omzet).toBe(71256);
    expect(beeld('West').maand.toen.omzet).toBe(28970);
  });

  it('verschil in euro en procent, afgerond op één decimaal', () => {
    const totaal = beeld('Totaal').maand.verschil;
    const midsland = beeld('Midsland').maand.verschil;
    const west = beeld('West').maand.verschil;
    expect(totaal.euro).toBe(-4190);
    expect(procent1(totaal.procent!)).toBe(-4.2);
    expect(midsland.euro).toBe(-4908);
    expect(procent1(midsland.procent!)).toBe(-6.9);
    expect(west.euro).toBe(718);
    expect(procent1(west.procent!)).toBe(2.5);
    expect(formatProcent(totaal.procent)).toBe('−4,2%');
    expect(formatEuro(96036)).toContain('96.036');
  });

  it('open dagen, omzet per open dag en gemiddelde bon', () => {
    const midsland = beeld('Midsland').maand;
    const west = beeld('West').maand;
    const totaal = beeld('Totaal').maand;
    expect(midsland.nu.openDagen).toBe(23);
    expect(midsland.toen.openDagen).toBe(27);
    expect(west.nu.openDagen).toBe(26);
    expect(west.toen.openDagen).toBe(31);
    expect(totaal.nu.openDagen).toBe(49);
    expect(procent1(midsland.perDagVerschil.procent!)).toBe(9.3);
    expect(procent1(west.perDagVerschil.procent!)).toBe(22.2);
    expect(Math.round(midsland.gemBonNu! * 100) / 100).toBe(46.66);
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
    expect(midsland.ytd.nu.omzet).toBe(785248);
    expect(midsland.ytd.toen.omzet).toBe(890038);
    expect(procent1(midsland.ytd.verschil.procent!)).toBe(-11.8);
    expect(west.ytd.nu.omzet).toBe(294194);
    expect(west.ytd.toen.omzet).toBe(352848);
    expect(procent1(west.ytd.verschil.procent!)).toBe(-16.6);
    expect(totaal.ytd.nu.omzet).toBe(1079442);
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
    expect(midsland.nu).toBe(747608);
    expect(midsland.toen).toBe(773778);
    expect(procent1(midsland.verschil.procent!)).toBe(-3.4);
    expect(totaal.toen).toBe(1078133);
    expect(totaal.nu).toBe(1038065);
    expect(procent1(totaal.verschil.procent!)).toBe(-3.7);
    expect(maandOpen(4, 2026, 1)).toBe(false);
    expect(maandOpen(17, 2026, 4)).toBe(true);
    expect(maandOpen(22, 2026, 1)).toBe(true);
  });
});

describe('gekozen maand en tooltip', () => {
  it('zonder keuze blijft oktober de vorige volle maand', () => {
    expect(beeld('Totaal', [], 10).maand.nu.omzet).toBe(beeld('Totaal').maand.nu.omzet);
  });

  it('juni toont juni, niet oktober', () => {
    const juni = beeld('Totaal', [], 6);
    expect(juni.maand.maand).toBe(6);
    expect(juni.maand.nu.omzet).toBe(244256);
    expect(juni.maand.toen.omzet).toBe(239927);
    expect(juni.maand.verschil.euro).toBe(4329);
    expect(procent1(juni.maand.verschil.procent!)).toBe(1.8);
    expect(juni.ytd.nu.omzet).toBe(1079442);
  });

  it('tooltip noemt bedrag, euroverschil en procent, en dicht is geen nul', () => {
    const okt = maandDetail(beeld('Totaal').maanden[9], 2026);
    expect(okt.dit).toContain('96.036');
    expect(okt.vorig).toContain('100.226');
    expect(okt.euro).toContain('4.190');
    expect(okt.procent).toBe('−4,2%');
    const maart = beeld('Totaal').maanden[2];
    expect(maart.ditJaar).toBeNull();
    const dicht = maandDetail(maart, 2026);
    expect(dicht.dit).toBe('dicht');
    expect(dicht.euro).toBe('dicht');
    expect(dicht.procent).toBe('dicht');
    expect(beeld('Totaal', [], 3).maand.nu.dicht).toBe(true);
    expect(beeld('Totaal', [], 3).maand.verschil.procent).toBeNull();
  });

  it('een verborgen lijn haalt het verschil uit de tooltip', () => {
    const detail = maandDetail(beeld('Midsland').maanden[9], 2026, { ditJaar: true, vorigJaar: false });
    expect(detail.vorig).toBeNull();
    expect(detail.euro).toBe('dicht');
    expect(detail.dit).toContain('66.348');
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
    expect(beeld('Totaal').maanden.map((punt) => punt.maand)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(beeld('Totaal').dichtMaanden).toEqual([3]);
    expect(beeld('West').dichtMaanden).toEqual([2, 3]);
  });

  it('een losse novemberdag telt mee tot nu toe, niet als volle maand', () => {
    const extra: OmzetRegel[] = [
      { vestiging: 'Midsland', werkdag: '2025-11-01', omzetExcl: 100, aantalBonnen: 2 },
      { vestiging: 'Midsland', werkdag: '2026-11-01', omzetExcl: 50, aantalBonnen: 1 },
    ];
    const midsland = beeld('Midsland', extra);
    expect(midsland.maand.nu.omzet).toBe(66348);
    expect(midsland.ytd.nu.omzet).toBe(785248 + 50);
    expect(midsland.ytd.toen.omzet).toBe(890038 + 100);
    expect(midsland.gelijk.maanden).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(midsland.maanden[10].ditJaar).toBe(50);
    expect(midsland.maanden[10].loopt).toBe(true);
    expect(midsland.maanden[10].procent).not.toBeNull();
  });

  it('open dagen volgen de database, alleen dagen met omzet', () => {
    expect(beeld('Midsland', [], 2).maand.toen.openDagen).toBe(20);
    expect(beeld('Midsland', [], 8).maand.toen.openDagen).toBe(28);
    expect(beeld('Midsland', [], 4).maand.nu.openDagen).toBe(22);
    expect(beeld('Midsland', [], 8).maand.nu.openDagen).toBe(22);
    expect(beeld('Midsland', [], 9).maand.nu.openDagen).toBe(21);
    expect(beeld('Midsland').maand.nu.openDagen).toBe(23);
    expect(beeld('West', [], 4).maand.nu.openDagen).toBe(15);
    expect(beeld('West', [], 5).maand.nu.openDagen).toBe(26);
    expect(beeld('West', [], 6).maand.nu.openDagen).toBe(25);
  });

  it('een lopende november telt alleen dezelfde dagen vorig jaar', () => {
    const extra: OmzetRegel[] = [
      { vestiging: 'Midsland', werkdag: '2026-11-01', omzetExcl: 40, aantalBonnen: 1 },
      { vestiging: 'Midsland', werkdag: '2025-11-01', omzetExcl: 80, aantalBonnen: 1 },
      { vestiging: 'Midsland', werkdag: '2025-11-20', omzetExcl: 900, aantalBonnen: 9 },
    ];
    const nov = beeld('Midsland', extra, 11).maand;
    expect(nov.loopt).toBe(true);
    expect(nov.nu.omzet).toBe(40);
    expect(nov.toen.omzet).toBe(80);
    expect(nov.verschil.euro).toBe(-40);
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
    expect(beeldNaGrens.maanden.find((punt) => punt.maand === 11)).toBeUndefined();
  });
});

describe('alle jaren', () => {
  it('loopt van het eerste tot het laatste jaar met kassadata', () => {
    expect(jarenUit(controleRegels())).toEqual([2026, 2025]);
    const metGat = [
      { werkdag: '2026-05-01', isDemo: false },
      { werkdag: '2023-06-12', isDemo: false },
      { werkdag: '1970-01-01', isDemo: true },
    ];
    expect(jarenUit(metGat)).toEqual([2026, 2025, 2024, 2023]);
  });

  it('zet standaard het gekozen jaar en het jaar ervoor aan', () => {
    expect(standaardZichtbareJaren([2024, 2025, 2026], 2026)).toEqual([2026, 2025]);
    expect(tintVoorJaar(2026, [2024, 2025, 2026])).toBe('hsl(var(--primary))');
    expect(tintVoorJaar(2025, [2024, 2025, 2026])).toBe('hsl(var(--chart-prev-line))');
    expect(tintVoorJaar(2024, [2024, 2025, 2026])).toBe('hsl(var(--muted-foreground))');
  });

  it('elk jaar staat op de maand, dicht blijft null', () => {
    const okt = beeld('Totaal').maanden[9];
    expect(okt.perJaar[2026]).toBe(96036);
    expect(okt.perJaar[2025]).toBe(100226);
    expect(beeld('Totaal').maanden[2].perJaar[2026]).toBeNull();
  });

  it('maandvensters sluiten op elkaar aan en dagen uit uren worden één', () => {
    expect(maandVensters('2025-01-15', '2025-03-02')).toEqual([
      { van: '2025-01-15', tot: '2025-01-31' },
      { van: '2025-02-01', tot: '2025-02-28' },
      { van: '2025-03-01', tot: '2025-03-02' },
    ]);
    const samen = voegDagen([
      { vestiging: 'West', werkdag: '2026-10-03', omzetExcl: 10.1, aantalBonnen: 1 },
      { vestiging: 'West', werkdag: '2026-10-03', omzetExcl: 0.2, aantalBonnen: 2 },
      { vestiging: 'Midsland', werkdag: '2026-10-03', omzetExcl: 5, aantalBonnen: 1 },
      { vestiging: 'West', werkdag: '2026-10-04', omzetExcl: 1, aantalBonnen: 1, isDemo: true },
    ]);
    expect(samen).toHaveLength(2);
    expect(samen.find((rij) => rij.vestiging === 'West')).toEqual({
      vestiging: 'West', werkdag: '2026-10-03', omzetExcl: 10.3, aantalBonnen: 3,
    });
  });
});

describe('menu', () => {
  it('Omzet is een MT-item en hoort bij de MT-routes', () => {
    const item = allNavigationItems.find((kandidaat) => kandidaat.url === '/omzet');
    expect(item && 'mtOnly' in item && item.mtOnly).toBe(true);
    expect(MT_ROUTES).toContain('/omzet');
  });
});
