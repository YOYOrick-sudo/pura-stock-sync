// @ts-ignore bun test runner
import { expect, mock, test } from 'bun:test';
import type { KoelcelCheckItem } from './useKoelcelCheck';

mock.module('@/integrations/supabase/client', () => ({
  supabase: new Proxy({}, { get() { throw new Error('Geen databasecontact toegestaan'); } }),
}));

const { vervolgactieVoorRegel } = await import('./useKoelcelCheck');

const magazijn: KoelcelCheckItem = {
  id: 'bea6f01b-5e9b-46ba-9302-282786187429', vestiging: 'West',
  naam: 'Tahinidressing (flessen)', doel_aantal: 1, doel_aantal_druk: null,
  eenheid: 'fles', type: 'koelcel', plek: 'magazijn', bron: 'zelf_west',
  bak_maat: null, volgorde: 1, actief: true, product_sleutel: 'tahinidressing',
};

test('Tahinidressing uit het magazijn gaat naar Bereiden op de mise-en-place', () => {
  expect(vervolgactieVoorRegel(magazijn, [magazijn])).toEqual({
    soort: 'mep', handeling: 'Bereiden', label: 'de mise-en-place',
  });
});

test('Tahinidressing in de werkbank blijft eerst naar het magazijn gaan', () => {
  const werkbank: KoelcelCheckItem = {
    ...magazijn, id: '048f9e02-5b2b-4e0d-9269-66074d32882f',
    naam: 'Tahinidressing (fles)', plek: 'werkbank', bron: 'magazijn',
  };
  expect(vervolgactieVoorRegel(werkbank, [werkbank, magazijn])).toEqual({
    soort: 'niveau', onderItem: magazijn, label: 'magazijn op peil (maandag)',
  });
});