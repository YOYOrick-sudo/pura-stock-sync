// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { verdeelMobieleNavigatie } from './mobieleNavigatie';

describe('mobiele navigatieverdeling', () => {
  test('balk en Meer bevatten ieder zichtbaar item precies eenmaal', () => {
    const items = ['/dashboard', '/taken-bediening', '/kitchen/mep', '/kitchen/bestelbord', '/kitchen/recipes', '/settings', '/mt-punt'].map(url => ({ url }));
    const { balk, meer } = verdeelMobieleNavigatie(items, false);
    expect(balk.map(item => item.url)).toEqual(['/dashboard', '/taken-bediening', '/kitchen/mep', '/kitchen/bestelbord']);
    expect(meer.map(item => item.url)).toEqual(['/kitchen/recipes', '/settings', '/mt-punt']);
    expect([...balk, ...meer].map(item => item.url).sort()).toEqual(items.map(item => item.url).sort());
    expect(new Set([...balk, ...meer].map(item => item.url)).size).toBe(items.length);
  });

  test('alleen-MT toont zijn zichtbare route rechtstreeks in de balk', () => {
    const items = [{ url: '/mt-punt' }];
    expect(verdeelMobieleNavigatie(items, true)).toEqual({ balk: items, meer: [] });
  });

  test('MT krijgt maximaal vier rechtstreekse vakken en behoudt overige items', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ url: `/mt-${i}` }));
    const { balk, meer } = verdeelMobieleNavigatie(items, true);
    expect(balk).toEqual(items.slice(0, 4));
    expect(meer).toEqual(items.slice(4));
  });

  test('verborgen items worden niet toegevoegd aan de balk', () => {
    const items = [{ url: '/kitchen/mep' }, { url: '/kassatelling' }];
    expect(verdeelMobieleNavigatie(items, false)).toEqual({ balk: [items[0]], meer: [items[1]] });
  });
});