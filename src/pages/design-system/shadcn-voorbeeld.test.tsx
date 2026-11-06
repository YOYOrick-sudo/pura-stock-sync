import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { ShadcnVergelijking, VoorstelScherm } from './ShadcnVoorbeeld';

describe('shadcn-voorbeeld', () => {
  test('toont hetzelfde West-scherm in huidig en voorstel', () => {
    const html = renderToString(<ShadcnVergelijking tokens />);
    expect(html).toContain('Bestelbord');
    expect(html).toContain('Wortelspread');
    expect(html).toContain('Granola');
    expect(html).toContain('Sluitlijst West');
    expect(html).toContain('Tellen koelcel');
    expect(html).toContain('Niets onderweg.');
    expect(html).toContain('min-h-12');
    expect(html.match(/bg-primary text-primary-foreground/g)?.length).toBe(2);
  });

  test('het voorstel heeft één titel en geen dubbele kop of streepje', () => {
    const html = renderToString(<VoorstelScherm id="nieuw" />);
    expect(html).toContain('text-2xl');
    expect(html).toContain('tracking-tight');
    expect(html).toContain('gewicht nog niet ingesteld');
    expect(html).toContain('>Status<');
    expect(html).toContain('Locatie');
    expect(html).toContain('h-9');
    expect(html).not.toContain('Op het bord');
    expect(html).not.toContain('Open producten');
    expect(html).not.toContain('Notitie');
    expect(html).not.toContain('—');
    expect(html.match(/bg-primary text-primary-foreground/g)?.length).toBe(1);
  });

  test('de tokens van het boek staan op :root', () => {
    const css = readFileSync(fileURLToPath(new URL('../../index.css', import.meta.url)), 'utf8');
    const root = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'));
    expect(root).toContain('--background: 0 0% 100%');
    expect(root).toContain('--muted-foreground: 0 0% 32%');
    expect(root).toContain('--ring: 0 0% 32%');
    expect(root).toContain('--primary: 163 65% 26%');
    expect(css).not.toContain('.pura-theme-v3 {');
  });
});
