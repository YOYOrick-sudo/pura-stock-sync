import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { PURA_THEME_V3, ShadcnVergelijking } from './ShadcnVoorbeeld';

describe('shadcn-voorbeeld', () => {
  test('toont hetzelfde West-scherm in huidig en voorstel', () => {
    const html = renderToString(<ShadcnVergelijking tokens />);
    expect(html).toContain(PURA_THEME_V3);
    expect(html).toContain('Bestelbord');
    expect(html).toContain('Wortelspread');
    expect(html).toContain('Granola');
    expect(html).toContain('Sluitlijst West');
    expect(html).toContain('Tellen koelcel');
    expect(html).toContain('Niets onderweg.');
    expect(html).toContain('min-h-12');
    expect(html.match(/bg-primary text-primary-foreground/g)?.length).toBe(2);
  });

  test('het voorstel staat niet op :root', () => {
    const css = readFileSync(fileURLToPath(new URL('../../index.css', import.meta.url)), 'utf8');
    const root = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'));
    expect(root).toContain('--background: 45 8% 95%');
    expect(root).not.toContain(PURA_THEME_V3);
    expect(css).toContain(`.${PURA_THEME_V3} {`);
    expect(css).toContain('--background: 0 0% 100%');
  });
});
