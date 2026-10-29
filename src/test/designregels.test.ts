// @ts-nocheck bun test runner (node-API's buiten de app-types)
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

// Harde regels zonder uitzonderingen: kleuren die niet bestaan, een font dat niet bestaat, tabs onder 44px.
const HARD: [string, RegExp][] = [
  ['niet-bestaande pv-kleur', /\b(?:bg|text|border|ring|fill)-pv-/],
  ['niet-bestaand font-heading', /\bfont-heading\b/],
  ['tab lager dan 44px', /\[&>button\]:min-h-(?:[0-9]|10)\b/],
];
// Bestaande gebruikers van de oude polar-set; deze lijst mag alleen krimpen.
const POLAR_TOEGESTAAN = ['components/AppSidebar.tsx', 'components/SidebarLayout.tsx', 'components/dashboard/TerschellingEventsCard.tsx', 'components/foh/FohTasks.tsx', 'pages/Dashboard.tsx', 'pages/DesignPreview.tsx', 'pages/StyleGuide.tsx', 'pages/TakenBeheer.tsx'];

function alleBestanden() {
  return MAPPEN.flatMap((m) => bestanden(join(ROOT, m))).map((f) => [relative(ROOT, f), readFileSync(f, 'utf8')] as const);
}

describe('designregels', () => {
  test('geen niet-bestaande kleuren, fonts of te lage tabs', () => {
    const fout = alleBestanden().flatMap(([f, t]) => HARD.filter(([, re]) => re.test(t)).map(([n]) => `${f} :: ${n}`));
    expect(fout).toEqual([]);
  });
  test('geen nieuwe imports uit components/polar', () => {
    const fout = alleBestanden().filter(([f, t]) => !f.startsWith('components/polar/') && /from ['"]@\/components\/polar/.test(t) && !POLAR_TOEGESTAAN.includes(f)).map(([f]) => f);
    expect(fout).toEqual([]);
  });
  test('geen nieuwe vaste kleuren of losse afrondingen buiten de bestaande lijst', () => {
    const nieuw = afwijkingen().filter((a) => !BESTAANDE_AFWIJKINGEN.includes(a));
    expect(nieuw).toEqual([]);
  });
  test('de bouwblokken zelf volgen de regels', () => {
    expect(afwijkingen().filter((a) => a.startsWith('components/pura/') || a.startsWith('components/kitchen/bestelbord/'))).toEqual([]);
  });
});
