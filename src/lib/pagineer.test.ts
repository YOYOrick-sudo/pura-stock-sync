// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { allesOphalen } from './pagineer';

describe('allesOphalen', () => {
  test('plakt pagina’s aan elkaar tot een korte pagina', async () => {
    const bron = ['a', 'b', 'c', 'd', 'e'];
    let aanroepen = 0;
    const resultaat = await allesOphalen(async (van, tot) => {
      aanroepen += 1;
      return bron.slice(van, tot + 1);
    }, 2);
    expect(resultaat).toEqual(bron);
    expect(aanroepen).toBe(3);
  });

  test('stopt bij een lege eerste pagina', async () => {
    const resultaat = await allesOphalen(async () => [], 2);
    expect(resultaat).toEqual([]);
  });

  test('neemt een te lange eerste pagina als de volledige set', async () => {
    let aanroepen = 0;
    const resultaat = await allesOphalen(async () => {
      aanroepen += 1;
      return [1, 2, 3];
    }, 2);
    expect(resultaat).toEqual([1, 2, 3]);
    expect(aanroepen).toBe(1);
  });
});
