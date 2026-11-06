import { describe, expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Info } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { BestelbordTabs, ZonderPrijsFilter } from './BestelbordTabs';

describe('tabbalk bestelbord', () => {
  test('elke tab één teller-badge; Onderweg waarschuwt zonder tweede getal of stip', () => {
    const tabs = [
      { id: 'bord', naam: 'Op het bord', kort: 'Bord', Icoon: Info, n: 4 },
      { id: 'onderweg', naam: 'Onderweg', kort: 'Onderweg', Icoon: Info, n: 5, aandacht: 'te checken' },
    ];
    const html = renderToString(createElement(Tabs, { value: 'bord' }, createElement(BestelbordTabs, { tabs })));
    expect(html).toContain('aria-label="Op het bord (4)"');
    expect(html).toContain('aria-label="Onderweg (5), te checken"');
    expect(html).toContain('text-warning');
    expect(html).toContain('h-3 w-3');
    expect(html).toContain('border-warning/40');
    expect(html).toContain('bg-card');
    expect(html).not.toContain('bg-warning/10');
    expect(html.match(/text-warning/g)).toHaveLength(1);
    expect(html).not.toContain('h-2 w-2');
    expect(html).not.toMatch(/>1</);
  });

  test('rustige Onderweg-tab gebruikt dezelfde neutrale badge', () => {
    const tabs = [{ id: 'onderweg', naam: 'Onderweg', kort: 'Onderweg', Icoon: Info, n: 2 }];
    const html = renderToString(createElement(Tabs, { value: 'onderweg' }, createElement(BestelbordTabs, { tabs })));
    expect(html).toContain('aria-label="Onderweg (2)"');
    expect(html).not.toContain('bg-warning/10');
    expect(html).toContain('bg-card');
    expect(html).toContain('border-border');
  });

  test('zonder prijs blijft een tikdoel van 44 px en dezelfde tekst', () => {
    const html = renderToString(createElement(ZonderPrijsFilter, { aantal: 4, aan: false, onToggle: () => {} }));
    expect(html).toContain('h-11');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('>4<');
    expect(html).toContain('zonder prijs');
    expect(html).toContain('border-warning/40');
    const aan = renderToString(createElement(ZonderPrijsFilter, { aantal: 4, aan: true, onToggle: () => {} }));
    expect(aan).toContain('aria-pressed="true"');
    expect(aan).not.toContain('border-warning/40');
  });
});
