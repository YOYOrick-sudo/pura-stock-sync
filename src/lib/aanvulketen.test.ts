// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
// @ts-ignore node test API is outside the browser app types
import { readFileSync } from 'node:fs';
import {
  aanvulUitkomst,
  aanvulketenAan,
  doelLadeTekst,
  gevolgVanKeuze,
  isFalafelVoorbeeld,
  ontdooiAantal,
  ontdooiInstructie,
  stapTitel,
} from './aanvulketen';

describe('schakelaar', () => {
  test('staat uit voor West en Midsland, ook met de parameter', () => {
    expect(aanvulketenAan({ vestiging: 'West', search: 'aanvulketen=1', previewHost: false })).toBe(false);
    expect(aanvulketenAan({ vestiging: 'Midsland', search: '?aanvulketen=1', previewHost: false })).toBe(false);
    expect(aanvulketenAan({ vestiging: 'West' })).toBe(false);
    expect(aanvulketenAan({ vestiging: 'West', env: 'true', search: 'aanvulketen=1' })).toBe(false);
  });

  test('aan via de bouwvariabele, de Test-vestiging of een preview-host', () => {
    expect(aanvulketenAan({ vestiging: 'West', env: '1' })).toBe(true);
    expect(aanvulketenAan({ vestiging: 'Test', search: 'aanvulketen=1', previewHost: false })).toBe(true);
    expect(aanvulketenAan({ vestiging: 'West', search: 'aanvulketen=1', previewHost: true })).toBe(true);
    expect(aanvulketenAan({ vestiging: 'Test', previewHost: true })).toBe(false);
    expect(aanvulketenAan({ vestiging: 'Test', search: 'aanvulketen=0', previewHost: true })).toBe(false);
  });
});

describe('alleen falafel', () => {
  test('naam of productsleutel falafel, niets wat er alleen op lijkt', () => {
    expect(isFalafelVoorbeeld({ naam: 'Falafel', product_sleutel: null })).toBe(true);
    expect(isFalafelVoorbeeld({ naam: 'Falafel balletjes', product_sleutel: 'falafel' })).toBe(true);
    expect(isFalafelVoorbeeld({ naam: 'Falafel ', product_sleutel: 'iets-anders' })).toBe(true);
    expect(isFalafelVoorbeeld({ naam: 'Falafelwrap', product_sleutel: 'falafelwrap' })).toBe(false);
    expect(isFalafelVoorbeeld({ naam: 'Döner kebab', product_sleutel: null })).toBe(false);
    expect(isFalafelVoorbeeld({ naam: '', product_sleutel: null })).toBe(false);
  });
});

describe('keuzes', () => {
  test('op peil en aangevuld uit de koelcel vinken alleen af', () => {
    expect(gevolgVanKeuze('op_peil')).toEqual({ soort: 'afvinken' });
    expect(gevolgVanKeuze('aangevuld_koelcel')).toEqual({ soort: 'afvinken' });
  });

  test('tekort loopt koelcel en vriezer af zonder meteen te bestellen', () => {
    expect(gevolgVanKeuze('aanvullen')).toEqual({ soort: 'stap', stap: 'koelcel' });
    expect(gevolgVanKeuze('koelcel_onvoldoende')).toEqual({ soort: 'stap', stap: 'vriezer' });
    expect(gevolgVanKeuze('ontdooien')).toEqual({ soort: 'ontdooien' });
    expect(gevolgVanKeuze('vriezer_onvoldoende')).toEqual({ soort: 'bestellen' });
  });
});

test('elke stap heeft een korte titel', () => {
  expect(stapTitel('Falafel', 'lade')).toBe('Staat de lade op peil?');
  expect(stapTitel('Falafel', 'koelcel')).toBe('Vul de lade aan uit de koelcel.');
  expect(stapTitel('Falafel', 'vriezer')).toBe('Ontdooien of bestellen?');
});

test('teksten noemen het doel en een concrete ontdooihoeveelheid', () => {
  expect(doelLadeTekst('half')).toBe('Doel lade: minimaal ½ bak');
  expect(doelLadeTekst('vol')).toBe('Doel lade: vol');
  expect(doelLadeTekst(null)).toBe('Doel lade: vol');
  expect(ontdooiAantal({ batch_aantal: 2, doel_aantal: 1 })).toBe(2);
  expect(ontdooiAantal({ doel_aantal: 1 })).toBe(1);
  expect(ontdooiAantal({})).toBe(1);
  expect(ontdooiInstructie({ eenheid: 'bak', doel_aantal: 1 })).toBe(
    'Zet 1 bak uit de vriezer in de koelcel voor de volgende service.',
  );
  expect(aanvulUitkomst('mep')).toBe('In ontdooiing · lade later aanvullen');
  expect(aanvulUitkomst('bestelbord')).toBe('Bijbesteld · op het bestelbord');
});

test('de sluitlijst toont de stappen op een preview en maakt alleen aan als de schakelaar aan staat', () => {
  const tekst = readFileSync(new URL('../components/foh/AfvinkRonde.tsx', import.meta.url), 'utf8');
  expect(tekst).toContain('const toonKeten = schrijfKeten || previewHost');
  expect(tekst).toContain('if (!schrijfKeten)');
  expect(tekst).toContain('ontdooiStickerOpdracht');
  expect(tekst).toContain('planKeten');
  expect(tekst).not.toContain(".from('print_jobs')");
  expect(tekst).not.toContain('side="bottom"');
  expect(tekst).not.toContain('FalafelAanvulRij');
  const hook = readFileSync(new URL('../hooks/useKoelcelCheck.ts', import.meta.url), 'utf8');
  const ontdooi = hook.slice(hook.indexOf('const ontdooiDirect'), hook.indexOf('const bestelUitSluitlijst'));
  const bestel = hook.slice(hook.indexOf('const bestelUitSluitlijst'), hook.indexOf('return {', hook.indexOf('const bestelUitSluitlijst')));
  expect(ontdooi).toContain('retry: false');
  expect(ontdooi).toContain("'Ontdooien'");
  expect(bestel).toContain('retry: false');
  expect(bestel).toContain('opBestelbord');
});
