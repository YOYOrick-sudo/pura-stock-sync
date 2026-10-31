// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { registreerStickerGebruik } from './stickerPrint';

describe('stickergebruik na het aanmaken van de printopdracht', () => {
  test('bain-marie roept de ongeldige registratie niet aan en veroorzaakt geen printretry', async () => {
    let opdrachten = 0;
    let registraties = 0;
    const print = async () => {
      opdrachten += 1;
      await registreerStickerGebruik('bain', async () => {
        registraties += 1;
        return { error: new Error('ongeldig type') };
      });
    };
    // De bestaande QueryClient herhaalt een mislukte mutatie één keer.
    await print().catch(() => print());
    expect(opdrachten).toBe(1);
    expect(registraties).toBe(0);
  });

  test.each(['bereid', 'ontdooid', 'vrij'] as const)('%s blijft geregistreerd zoals voorheen', async (type) => {
    const geregistreerd: string[] = [];
    await registreerStickerGebruik(type, async (waarde) => {
      geregistreerd.push(waarde);
      return { error: null };
    });
    expect(geregistreerd).toEqual([type]);
  });

  test('een registratiefout bij snel printen blijft een fout', async () => {
    const fout = new Error('registratie mislukt');
    await expect(registreerStickerGebruik('bereid', async () => ({ error: fout }))).rejects.toThrow('registratie mislukt');
  });
});