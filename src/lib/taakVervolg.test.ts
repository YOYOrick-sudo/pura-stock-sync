// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
// @ts-ignore node test API is outside the browser app types
import { readFileSync } from 'node:fs';
import { isEigenaarAccount } from './eigenaar';
import {
  KETEN_ZAAD,
  VRIEZER_NAAR_KOELCEL,
  configVoorTaak,
  heeftVriezerNaarKoelcel,
  interneProductVoor,
  ketenVoor,
  planBordVervolg,
  rijVanDatabase,
  taakSleutelVan,
  valideerKeten,
  voerVervolgUit,
  type KetenRij,
} from './taakVervolg';

const falafel: KetenRij = {
  taakSleutel: 'falafel',
  vestiging: 'West',
  instructie: 'Zet een bak klaar',
  stapKoelcel: false,
  stapVriezer: false,
  stapMagazijn: false,
  eindactie: 'mep',
};

describe('eigenaar', () => {
  test('alleen een adres dat met yorick@ begint', () => {
    expect(isEigenaarAccount('yorick@puravida.nl')).toBe(true);
    expect(isEigenaarAccount('  Yorick@puravida.nl ')).toBe(true);
    expect(isEigenaarAccount('yorick@')).toBe(true);
    expect(isEigenaarAccount('yorick.mulder@puravida.nl')).toBe(false);
    expect(isEigenaarAccount('niet-yorick@puravida.nl')).toBe(false);
    expect(isEigenaarAccount('yorick@puravida.nl.extra')).toBe(true);
    expect(isEigenaarAccount(null)).toBe(false);
    expect(isEigenaarAccount('')).toBe(false);
  });
});

describe('zaad vervangt de vaste lijst', () => {
  test('het zaad is falafel via de vriezer, en tahinidressing naar de MEP', () => {
    expect(VRIEZER_NAAR_KOELCEL.map((p) => p.sleutel)).toEqual(['falafel']);
    expect(KETEN_ZAAD.map((rij) => rij.taakSleutel)).toEqual(['falafel', 'tahinidressing']);
    expect(KETEN_ZAAD[0]).toMatchObject({ stapKoelcel: true, stapVriezer: true, eindactie: 'bestelbord' });
    expect(KETEN_ZAAD[1]).toMatchObject({ stapKoelcel: false, stapVriezer: false, stapMagazijn: false, eindactie: 'mep' });
  });

  test('zonder opgeslagen rij blijft falafel de vriezer-stap, een lookalike niet', () => {
    expect(heeftVriezerNaarKoelcel({ naam: 'Falafel', product_sleutel: 'iets' })).toBe(true);
    expect(heeftVriezerNaarKoelcel({ naam: 'Falafel balletjes', product_sleutel: 'falafel' })).toBe(true);
    expect(heeftVriezerNaarKoelcel({ naam: 'Falafelwrap', product_sleutel: 'falafelwrap' })).toBe(false);
    expect(heeftVriezerNaarKoelcel({ naam: 'Döner kebab', product_sleutel: 'doner-kebab' })).toBe(false);
  });

  test('een opgeslagen rij wint van het zaad, ook zonder vriezerstap', () => {
    expect(heeftVriezerNaarKoelcel({ naam: 'Falafel', product_sleutel: 'falafel' }, [falafel], 'West')).toBe(false);
    expect(configVoorTaak({ product_sleutel: 'falafel', naam: 'Falafel' }, 'West', [falafel])?.instructie).toBe('Zet een bak klaar');
    expect(ketenVoor({ product_sleutel: 'falafel', naam: 'Falafel' }, [], 'West', [falafel], [])?.eindactie).toBe('mep');
  });

  test('een andere vestiging laat het zaad voor West staan', () => {
    const midsland: KetenRij = { ...falafel, vestiging: 'Midsland', eindactie: 'mep' };
    expect(ketenVoor({ product_sleutel: 'falafel' }, [], 'West', [midsland], []).stappen).toEqual(['koelcel', 'vriezer']);
    expect(ketenVoor({ product_sleutel: 'falafel' }, [], 'Midsland', [midsland], []).eindactie).toBe('mep');
  });

  test('een vestiging-rij wint van een rij voor alle vestigingen', () => {
    const overal: KetenRij = { ...falafel, vestiging: null, eindactie: 'mep', instructie: 'overal' };
    const west: KetenRij = { ...falafel, eindactie: 'bestelbord', instructie: 'west' };
    expect(configVoorTaak({ product_sleutel: 'falafel' }, 'West', [overal, west])?.instructie).toBe('west');
    expect(configVoorTaak({ product_sleutel: 'falafel' }, 'Test', [overal, west])?.instructie).toBe('overal');
  });

  test('de productsleutel gaat voor de naam', () => {
    const iets: KetenRij = { ...falafel, taakSleutel: 'iets', eindactie: 'mep' };
    expect(configVoorTaak({ product_sleutel: 'iets', naam: 'Falafel' }, 'West', [iets])?.eindactie).toBe('mep');
    expect(taakSleutelVan({ product_sleutel: ' Falafel ', naam: 'andere', id: '1' })).toBe('falafel');
    expect(taakSleutelVan({ naam: ' Hummus ', id: '1' })).toBe('hummus');
  });
});

describe('opslaan', () => {
  test('een oude database-rij wordt een keten, een onbekende actie blijft leeg', () => {
    expect(rijVanDatabase({
      taak_sleutel: ' Hummus ',
      vestiging: ' West ',
      instructie: '  Vul bij  ',
      vervolgactie: 'mep',
      vervolg_als_op: 'bestelbord',
    })).toEqual({
      taakSleutel: 'hummus',
      vestiging: 'West',
      instructie: 'Vul bij',
      stapKoelcel: false,
      stapVriezer: false,
      stapMagazijn: false,
      eindactie: 'mep',
    });
    expect(rijVanDatabase({ taak_sleutel: 'x', vervolgactie: 'verzin', vervolg_als_op: 'geen' })?.eindactie).toBeNull();
    expect(rijVanDatabase({ taak_sleutel: '  ' })).toBeNull();
  });

  test('de instructie blijft kort', () => {
    expect(valideerKeten({
      instructie: 'x'.repeat(281),
      stapKoelcel: false,
      stapVriezer: false,
      stapMagazijn: false,
      eindactie: 'mep',
      komtUitMidsland: false,
    })).toMatch(/kort/);
  });
});

describe('interne producten', () => {
  const lijst = [{ product_id: 'p1', naam: 'Falafel' }, { product_id: 'p2', naam: 'Hummus' }];

  test('match op naam, niet op een product dat er alleen op lijkt', () => {
    expect(interneProductVoor({ naam: 'falafel', product_sleutel: 'falafel' }, lijst)?.product_id).toBe('p1');
    expect(interneProductVoor({ naam: 'Falafelwrap', product_sleutel: 'falafelwrap' }, lijst)).toBeNull();
    expect(interneProductVoor({ naam: 'Hummus' }, null)).toBeNull();
  });
});

describe('bestelbord via de bestaande RPC', () => {
  test('een open regel met artikel wordt gekoppeld, niet nieuw geschreven', () => {
    expect(planBordVervolg({
      vestiging: 'West',
      naam: 'Falafel',
      eenheid: 'bak',
      openSignaalId: 's1',
      artikelId: 'a1',
      artikelVormId: 'v1',
    })).toEqual([{
      rpc: 'bord_regel_koppelen',
      args: { p_signaal_id: 's1', p_artikel_id: 'a1', p_artikel_vorm_id: 'v1' },
    }]);
  });

  test('zonder artikel maakt de bestaande aanmaak-RPC het artikel op de open regel', () => {
    const plan = planBordVervolg({
      vestiging: 'West',
      naam: 'Falafel',
      eenheid: 'bak',
      openSignaalId: 's1',
      leverancierId: 'l1',
    });
    expect(plan.map((stap) => stap.rpc)).toEqual(['bord_artikel_aanmaken']);
    expect(JSON.stringify(plan)).not.toContain('bestel_signalen');
  });

  test('zonder open regel maakt het vervolg een bordregel via opBestelbord', () => {
    const hook = readFileSync(new URL('../hooks/useTaakVervolg.ts', import.meta.url), 'utf8');
    expect(hook).toContain('opBestelbord');
    expect(hook).toContain('bestelOpdracht');
    expect(hook).not.toContain('bestelbordViaRpc');
    expect(hook).not.toContain('geen open bordregel');
  });
});

describe('uitvoeren', () => {
  test('intern zonder product blijft geblokkeerd en roept de RPC niet aan', async () => {
    let aangeroepen = false;
    const uit = await voerVervolgUit('intern_midsland', { internProductId: null }, {
      mep: async () => ({ dubbel: false }),
      bestelbord: async () => ({ gekoppeld: false }),
      intern: async () => { aangeroepen = true; },
    });
    expect(uit).toEqual({ soort: 'geblokkeerd', reden: expect.stringMatching(/interne producten/) });
    expect(aangeroepen).toBe(false);
  });

  test('mep en een gekoppelde bordregel gaan naar de bestaande routes', async () => {
    const mep = await voerVervolgUit('mep', {}, {
      mep: async () => ({ dubbel: true }),
      bestelbord: async () => ({ gekoppeld: false }),
      intern: async () => undefined,
    });
    expect(mep).toEqual({ soort: 'mep', dubbel: true });

    const bord = await voerVervolgUit('bestelbord', {}, {
      mep: async () => ({ dubbel: false }),
      bestelbord: async () => ({ gekoppeld: true }),
      intern: async () => undefined,
    });
    expect(bord).toEqual({ soort: 'bestelbord', gekoppeld: true, reden: undefined });
  });

  test('de vriezer-stap zelf is geen losse schrijfactie', async () => {
    const uit = await voerVervolgUit('vriezer_naar_koelcel', {}, {
      mep: async () => { throw new Error('niet'); },
      bestelbord: async () => { throw new Error('niet'); },
      intern: async () => { throw new Error('niet'); },
    });
    expect(uit).toEqual({ soort: 'vriezer_naar_koelcel' });
  });
});

describe('potlood zonder aanvulketen', () => {
  test('de eigenaar ziet het potlood, aanmaken blijft achter de schakelaar', () => {
    const ronde = readFileSync(new URL('../components/foh/AfvinkRonde.tsx', import.meta.url), 'utf8');
    expect(ronde).toContain('const toonInstellen = eigenaar');
    expect(ronde).not.toContain('ketenAan && eigenaar');
    expect(ronde).toContain('schrijfKeten || toonInstellen || toonKeten');
    expect(ronde).toContain('if (!schrijfKeten)');
    const paneelStart = ronde.indexOf('<TaakVervolgPaneel');
    const paneel = ronde.slice(paneelStart, ronde.indexOf('/>', paneelStart));
    expect(paneel).toContain('instellingVan(paneelItem)');
    expect(paneel).toContain('vervolg.bewaar.mutateAsync');
    expect(paneel).toContain('midslandVast');
    const venster = readFileSync(new URL('../components/foh/TaakVervolgPaneel.tsx', import.meta.url), 'utf8');
    expect(venster).toContain('Komt uit Midsland');
    expect(venster).toContain('<Dialog ');
    expect(venster).not.toContain('Sheet');
    expect(venster).not.toContain('side="bottom"');
    expect(venster).toContain('{!midsland && (');
    expect(venster).toContain('beschikbareEindacties(false)');
  });

  test('opslaan via taak_vervolg_config_opslaan hangt niet aan de leesvlag of de keten', () => {
    const hook = readFileSync(new URL('../hooks/useTaakVervolg.ts', import.meta.url), 'utf8');
    const bewaar = hook.slice(hook.indexOf('const bewaar'), hook.indexOf('onSuccess:'));
    expect(bewaar).toContain("rpc('taak_vervolg_config_opslaan'");
    expect(bewaar).toContain('p_stap_koelcel');
    expect(bewaar).toContain('p_eindactie');
    expect(bewaar).not.toContain('ketenAan');
    expect(bewaar).not.toMatch(/if\s*\(\s*!?\s*aan\b/);
    const query = hook.slice(hook.indexOf('const query'), hook.indexOf('const bewaar'));
    expect(query).toContain('enabled: aan && !!vestiging');

    const sql = readFileSync(new URL('../../drizzle/migrations/0070_taak_vervolg_keten.sql', import.meta.url), 'utf8');
    const fn = sql.slice(
      sql.indexOf('FUNCTION public.taak_vervolg_config_opslaan'),
      sql.indexOf('REVOKE ALL ON FUNCTION public.taak_vervolg_config_opslaan'),
    );
    expect(fn).toContain("v_email NOT LIKE 'yorick@%'");
    expect(fn).not.toContain('aanvulketen');
    expect(fn).not.toContain('ketenAan');
  });
});
