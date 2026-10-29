import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { BESTAANDE_AFWIJKINGEN } from './designregels.allowlist';

const ROOT = join(import.meta.dir, '..');
const MAPPEN = ['pages', 'components'];
// Vaste kleur in een Tailwind-klasse (bg-[#..], text-[#..]) of een losse afronding (rounded-[..]).
const REGELS: [string, RegExp][] = [
  ['vaste kleur', /\b(?:bg|text|border|fill|stroke|ring|from|to|via)-\[#[0-9a-fA-F]{3,8}\]/],
  ['losse afronding', /\brounded(?:-[a-z]{1,2})?-\[[^\]]+\]/],
];

function bestanden(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    // design-system toont bewust foute voorbeelden in tekst; die map telt niet mee.
    if (statSync(p).isDirectory()) return n === 'design-system' ? [] : bestanden(p);
    return /\.tsx?$/.test(n) && !n.endsWith('.test.ts') ? [p] : [];
  });
}

export function afwijkingen() {
  const uit: string[] = [];
  for (const map of MAPPEN) for (const f of bestanden(join(ROOT, map))) {
    const tekst = readFileSync(f, 'utf8');
    for (const [naam, re] of REGELS) if (re.test(tekst)) uit.push(`${relative(ROOT, f)} :: ${naam}`);
  }
  return uit.sort();
}

describe('designregels', () => {
  test('geen nieuwe vaste kleuren of losse afrondingen buiten de bestaande lijst', () => {
    const nieuw = afwijkingen().filter((a) => !BESTAANDE_AFWIJKINGEN.includes(a));
    expect(nieuw).toEqual([]);
  });
  test('de bouwblokken zelf volgen de regels', () => {
    expect(afwijkingen().filter((a) => a.startsWith('components/pura/') || a.startsWith('components/kitchen/bestelbord/'))).toEqual([]);
  });
});
