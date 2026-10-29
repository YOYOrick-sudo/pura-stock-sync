// @ts-ignore bun test runner
import { expect, test } from 'bun:test';
import { adviesMetadataGeldig } from '../../supabase/functions/bot-bestelbord/advies-metadata';
test('bestaand advies zonder metadata blijft toegestaan', () => expect(adviesMetadataGeldig(undefined, undefined)).toBe(true));
test('expliciete verkoopfactor en geldige periode toegestaan', () => expect(adviesMetadataGeldig('proef-v1', { kassa_ids: [{ id: '1737439', per_eenheid: 1 }], periode_van: '2026-10-20', periode_tot: '2026-10-28' })).toBe(true));
test('nulconversie geweigerd', () => expect(adviesMetadataGeldig('v1', { kassa_ids: [{ id: '1737439', per_eenheid: 0 }] })).toBe(false));
test('dubbele kassabron geweigerd', () => expect(adviesMetadataGeldig('v1', { kassa_ids: [{ id: '1', per_eenheid: 1 }, { id: '1', per_eenheid: 1 }] })).toBe(false));
test('omgekeerde periode geweigerd', () => expect(adviesMetadataGeldig('v1', { periode_van: '2026-10-29', periode_tot: '2026-10-20' })).toBe(false));
test('onbestaande datum geweigerd', () => expect(adviesMetadataGeldig('v1', { periode_van: '2026-02-30', periode_tot: '2026-03-05' })).toBe(false));