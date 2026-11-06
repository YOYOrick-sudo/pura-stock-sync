import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  beschikbareEindacties,
  ketenUitleg,
  ketenVoor,
  lijstKnop,
  normaliseerKeten,
  planKeten,
  rijVanDatabase,
  schrijfSoort,
  type AanvulKeten,
  type KetenItem,
  type KetenPlan,
} from './keten';

const intern = [
  { product_id: 'p-wortel', naam: 'Wortelspread' },
  { product_id: 'p-granola', naam: 'Granola huisgemaakt' },
];

function item(deel: Partial<KetenItem> & Pick<KetenItem, 'naam'>): KetenItem {
  return { actief: true, plek: 'werkbank', bron: 'koelcel_inkoop', product_sleutel: deel.naam.toLowerCase(), ...deel };
}

function schrijfsels(keten: AanvulKeten, naam: string, bestemming: 'werkbank' | 'werkblad', stappen: Array<'op' | 'stap-af' | 'ook-op'>): string[] {
  let open: number | null = null;
  let klaar = false;
  const uit: string[] = [];
  for (const gebeurtenis of stappen) {
    const plan: KetenPlan = planKeten(keten, gebeurtenis, open, naam, bestemming, klaar);
    expect(['transfer', 'eind', null]).toContain(schrijfSoort(plan));
    if (plan.soort === 'open-stap') open = plan.index;
    if (plan.soort === 'transfer') {
      uit.push(plan.sticker ? `sticker:${plan.stap}` : `afvinken:${plan.stap}`);
      open = null;
      klaar = true;
    }
    if (plan.soort === 'eind') {
      uit.push(`eind:${plan.actie}`);
      open = null;
      klaar = true;
    }
    if (plan.soort === 'niets') uit.push('niets');
  }
  return uit;
}

describe('zaad en oude rijen', () => {
  test('falafel loopt koelcel en vriezer, tahinidressing gaat direct naar de MEP', () => {
    const falafel = ketenVoor(item({ naam: 'Falafel', product_sleutel: 'falafel' }), [], 'West', [], []);
    expect(falafel.stappen).toEqual(['koelcel', 'vriezer']);
    expect(falafel.eindactie).toBe('bestelbord');
    expect(falafel.herkomst).toBe('zaad');
    expect(falafel.komtUitMidsland).toBe(false);

    const magazijn: KetenItem = {
      naam: 'Tahinidressing (flessen)', product_sleutel: 'tahinidressing', plek: 'magazijn', bron: 'zelf_west', actief: true,
    };
    const tahini = ketenVoor(
      item({ naam: 'Tahinidressing (fles)', product_sleutel: 'tahinidressing', bron: 'magazijn', plek: 'werkbank' }),
      [magazijn],
      'West',
      [],
      [],
    );
    expect(tahini.stappen).toEqual([]);
    expect(tahini.eindactie).toBe('mep');
    expect(ketenUitleg(tahini)).toBe('Naar MEP (maken)');
  });

  test('een rij van vóór de keten wordt koelcel plus vriezer, of een eindactie', () => {
    expect(rijVanDatabase({
      taak_sleutel: ' Falafel ',
      vervolgactie: 'vriezer_naar_koelcel',
      vervolg_als_op: null,
    })).toMatchObject({ stapKoelcel: true, stapVriezer: true, stapMagazijn: false, eindactie: 'bestelbord' });
    expect(rijVanDatabase({
      taak_sleutel: 'hummus',
      vervolgactie: 'mep',
      vervolg_als_op: 'bestelbord',
    })?.eindactie).toBe('mep');
    expect(rijVanDatabase({
      taak_sleutel: 'ketchup',
      stap_koelcel: false,
      stap_magazijn: true,
      eindactie: 'bestelbord',
    })).toMatchObject({ stapMagazijn: true, eindactie: 'bestelbord' });
  });
});

describe('falafel', () => {
  const keten = ketenVoor(item({ naam: 'Falafel', product_sleutel: 'falafel', plek: 'werkbank' }), [], 'West', [], []);

  test('op opent de koelcel, afvinken schrijft niets extra, ook op gaat naar de vriezer', () => {
    expect(lijstKnop(keten, false)).toEqual({ id: 'op', label: 'Op' });
    expect(beschikbareEindacties(keten.komtUitMidsland)).toEqual(['mep', 'bestelbord']);
    const open = planKeten(keten, 'op', null, 'Falafel');
    expect(open).toEqual({ soort: 'open-stap', index: 0, stap: 'koelcel', titel: 'Falafel uit koelcel naar werkbank' });
    expect(schrijfSoort(open)).toBeNull();

    const gedaan = planKeten(keten, 'stap-af', 0, 'Falafel');
    expect(gedaan).toEqual({ soort: 'transfer', stap: 'koelcel', sticker: false });

    const vriezer = planKeten(keten, 'ook-op', 0, 'Falafel');
    expect(vriezer).toEqual({
      soort: 'open-stap',
      index: 1,
      stap: 'vriezer',
      titel: 'Falafel uit vriezer naar koelcel',
    });
    expect(schrijfSoort(vriezer)).toBeNull();
  });

  test('de vriezer afvinken is alleen de sticker, ook op bestelt één keer', () => {
    const sticker = planKeten(keten, 'stap-af', 1, 'Falafel');
    expect(sticker).toEqual({ soort: 'transfer', stap: 'vriezer', sticker: true });
    expect(schrijfSoort(sticker)).toBe('transfer');

    const besteld = planKeten(keten, 'ook-op', 1, 'Falafel');
    expect(besteld).toEqual({ soort: 'eind', actie: 'bestelbord' });
    expect(schrijfSoort(besteld)).toBe('eind');

    expect(schrijfsels(keten, 'Falafel', 'werkbank', ['op', 'ook-op', 'ook-op'])).toEqual(['eind:bestelbord']);
    expect(schrijfsels(keten, 'Falafel', 'werkbank', ['op', 'stap-af'])).toEqual(['afvinken:koelcel']);
    expect(schrijfsels(keten, 'Falafel', 'werkbank', ['op', 'ook-op', 'stap-af'])).toEqual(['sticker:vriezer']);
    expect(schrijfsels(keten, 'Falafel', 'werkbank', ['op', 'ook-op', 'ook-op', 'ook-op'])).toEqual(['eind:bestelbord', 'niets']);
  });
});

describe('tahinidressing', () => {
  test('op maakt meteen de MEP, niet het magazijn en niet het bestelbord', () => {
    const keten = ketenVoor(
      item({ naam: 'Tahinidressing', product_sleutel: 'tahinidressing', bron: 'magazijn' }),
      [item({ naam: 'Tahinidressing magazijn', product_sleutel: 'tahinidressing', plek: 'magazijn', bron: 'zelf_west' })],
      'West',
      [],
      [],
    );
    expect(lijstKnop(keten, false)?.id).toBe('mep');
    expect(lijstKnop(keten, false)?.label).not.toBe('Bijbestellen');
    expect(schrijfsels(keten, 'Tahinidressing', 'werkbank', ['op'])).toEqual(['eind:mep']);
    expect(schrijfsels(keten, 'Tahinidressing', 'werkbank', ['op', 'op'])).toEqual(['eind:mep', 'niets']);
    expect(planKeten(keten, 'op', null, 'Tahinidressing')).toEqual({ soort: 'eind', actie: 'mep' });
  });
});

describe('ketchup', () => {
  test('magazijn eerst, ook op bestelt één keer op het bestelbord', () => {
    const fles = item({ naam: 'Ketchup', product_sleutel: 'ketchup', plek: 'werkblad', bron: 'magazijn' });
    const magazijn = item({ naam: 'Ketchup', product_sleutel: 'ketchup', plek: 'magazijn', bron: 'koelcel_inkoop' });
    const keten = ketenVoor(fles, [fles, magazijn], 'West', [], []);
    expect(keten.herkomst).toBe('afgeleid');
    expect(keten.stappen).toEqual(['magazijn']);
    expect(keten.eindactie).toBe('bestelbord');
    expect(ketenUitleg(keten)).toBe('Aanvullen uit magazijn');
    expect(lijstKnop(keten, false)).toEqual({ id: 'op', label: 'Op' });

    const open = planKeten(keten, 'op', null, 'Ketchup', 'werkblad');
    expect(open).toMatchObject({ soort: 'open-stap', titel: 'Ketchup uit magazijn naar werkblad' });
    expect(schrijfsels(keten, 'Ketchup', 'werkblad', ['op', 'stap-af'])).toEqual(['afvinken:magazijn']);
    expect(schrijfsels(keten, 'Ketchup', 'werkblad', ['op', 'ook-op'])).toEqual(['eind:bestelbord']);
    expect(schrijfsels(keten, 'Ketchup', 'werkblad', ['op', 'ook-op', 'op'])).toEqual(['eind:bestelbord', 'niets']);
  });
});

describe('granola en wortelspread', () => {
  test('granola komt uit de interne producten en heeft geen MEP of bestelbord', () => {
    const keten = ketenVoor(
      item({ naam: 'Granola', product_sleutel: 'granola', bron: 'midsland' }),
      [],
      'West',
      [],
      intern,
    );
    expect(keten.midslandVast).toBe(true);
    expect(keten.komtUitMidsland).toBe(true);
    expect(keten.eindactie).toBe('intern_midsland');
    expect(keten.stappen).toEqual([]);
    expect(beschikbareEindacties(true)).toEqual(['intern_midsland']);
    expect(lijstKnop(keten, false)).toEqual({ id: 'intern_midsland', label: 'Intern bestellen' });
    expect(lijstKnop(keten, false)?.label).not.toMatch(/MEP|Bijbestellen/);
    expect(schrijfsels(keten, 'Granola', 'werkbank', ['op'])).toEqual(['eind:intern_midsland']);
    expect(schrijfsels(keten, 'Granola', 'werkbank', ['op', 'op'])).toEqual(['eind:intern_midsland', 'niets']);
  });

  test('wortelspread houdt koelcel en vriezer, en eindigt bij Midsland', () => {
    const bank = item({ naam: 'Wortelspread', product_sleutel: 'wortelspread', bron: 'midsland', plek: 'werkbank' });
    const koel = item({ naam: 'Wortelspread', product_sleutel: 'wortelspread', bron: 'vriezer', plek: 'koelcel' });
    const vries = item({ naam: 'Wortelspread', product_sleutel: 'wortelspread', bron: 'midsland', plek: 'vriezer' });
    const keten = ketenVoor(bank, [bank, koel, vries], 'West', [], intern);
    expect(keten.midslandVast).toBe(true);
    expect(keten.stappen).toEqual(['koelcel', 'vriezer']);
    expect(keten.eindactie).toBe('intern_midsland');
    expect(lijstKnop(keten, false)?.id).toBe('op');
    expect(beschikbareEindacties(keten.komtUitMidsland)).not.toContain('mep');
    expect(beschikbareEindacties(keten.komtUitMidsland)).not.toContain('bestelbord');

    expect(planKeten(keten, 'op', null, 'Wortelspread')).toMatchObject({
      titel: 'Wortelspread uit koelcel naar werkbank',
    });
    expect(schrijfsels(keten, 'Wortelspread', 'werkbank', ['op', 'ook-op', 'ook-op'])).toEqual(['eind:intern_midsland']);
    expect(schrijfsels(keten, 'Wortelspread', 'werkbank', ['op', 'ook-op', 'stap-af'])).toEqual(['sticker:vriezer']);
    expect(schrijfsels(keten, 'Wortelspread', 'werkbank', ['op', 'stap-af'])).toEqual(['afvinken:koelcel']);
  });

  test('een opgeslagen bestelbord wint niet van interne_producten', () => {
    const keten = ketenVoor(
      item({ naam: 'Granola', product_sleutel: 'granola' }),
      [],
      'West',
      [{
        taakSleutel: 'granola',
        vestiging: null,
        instructie: 'extra',
        stapKoelcel: false,
        stapVriezer: false,
        stapMagazijn: true,
        eindactie: 'bestelbord',
      }],
      intern,
    );
    expect(keten.eindactie).toBe('intern_midsland');
    expect(keten.stappen).toEqual(['magazijn']);
    expect(keten.midslandVast).toBe(true);
    expect(keten.instructie).toBe('extra');
    expect(planKeten(keten, 'ook-op', 0, 'Granola').soort === 'eind' && planKeten(keten, 'ook-op', 0, 'Granola')).toMatchObject({
      actie: 'intern_midsland',
    });
  });

  test('afvinken van Midsland zet de eindactie terug naar het bestelbord', () => {
    expect(normaliseerKeten({
      instructie: '  haal bij  ',
      stapKoelcel: true,
      stapVriezer: false,
      stapMagazijn: true,
      eindactie: 'intern_midsland',
      komtUitMidsland: false,
    }, { midslandVast: false })).toEqual({
      instructie: 'haal bij',
      stapKoelcel: true,
      stapVriezer: false,
      stapMagazijn: true,
      eindactie: 'bestelbord',
      komtUitMidsland: false,
    });
    expect(normaliseerKeten({
      instructie: '',
      stapKoelcel: false,
      stapVriezer: false,
      stapMagazijn: false,
      eindactie: 'mep',
      komtUitMidsland: true,
    }, { midslandVast: false }).eindactie).toBe('intern_midsland');
    expect(normaliseerKeten({
      instructie: '',
      stapKoelcel: false,
      stapVriezer: false,
      stapMagazijn: false,
      eindactie: 'mep',
      komtUitMidsland: false,
    }, { midslandVast: true }).eindactie).toBe('intern_midsland');
  });
});

describe('migratie 0070', () => {
  test('voegt alleen kolommen toe en laat de andere tabellen met rust', () => {
    const sql = readFileSync(new URL('../../drizzle/migrations/0070_taak_vervolg_keten.sql', import.meta.url), 'utf8');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS stap_koelcel');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS stap_vriezer');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS stap_magazijn');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS eindactie');
    expect(sql).toContain("'tahinidressing'");
    expect(sql).toContain("v_email NOT LIKE 'yorick@%'");
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(sql).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(sql).not.toMatch(/\b(UPDATE|INSERT INTO|ALTER TABLE|DELETE FROM|DROP TABLE)\s+(public\.)?(foh_tasks|horeko_artikelen|bestel_signalen)\b/i);
    expect(sql).not.toContain('komt_uit_midsland');

    const terug = readFileSync(new URL('../../docs/research/0070_taak_vervolg_keten_rollback.sql', import.meta.url), 'utf8');
    expect(terug).toContain('DROP COLUMN IF EXISTS eindactie');
    expect(terug).toContain('taak_vervolg_config_opslaan');
    expect(terug).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(terug).not.toMatch(/\b(UPDATE|INSERT INTO|ALTER TABLE|DELETE FROM|DROP TABLE)\s+(public\.)?(foh_tasks|horeko_artikelen|bestel_signalen)\b/i);
  });
});
