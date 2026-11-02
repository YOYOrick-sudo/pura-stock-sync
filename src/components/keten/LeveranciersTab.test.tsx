import { describe, expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { LeverancierKanaal, leverancierLijstLabel } from './LeveranciersTab';
import { leverancierUpdatePatch } from '@/hooks/useKeten';

describe('leveranciersbeheer met soort', () => {
  test('lijst toont een rustig label en winkel/intern geen ruw kanaal', () => {
    expect(leverancierLijstLabel({ soort: 'extern', kanaal: 'mail' })).toBe('Extern · mail');
    expect(leverancierLijstLabel({ soort: 'winkel', kanaal: 'winkel' })).toBe('Zelf halen');
    expect(leverancierLijstLabel({ soort: 'intern', kanaal: 'intern' })).toBe('Intern');
    expect(leverancierLijstLabel({ kanaal: 'portal' })).toBe('Extern · portal');
  });

  test('winkel en intern zijn alleen-lezen, extern houdt de kanaalkeuze', () => {
    const onKanaal = vi.fn();
    const winkel = renderToString(createElement(LeverancierKanaal, { leverancier: { soort: 'winkel', kanaal: 'winkel' }, onKanaal }));
    expect(winkel).toContain('Zelf halen');
    expect(winkel).not.toContain('role="combobox"');
    const intern = renderToString(createElement(LeverancierKanaal, { leverancier: { soort: 'intern', kanaal: 'intern' }, onKanaal }));
    expect(intern).toContain('Intern');
    expect(intern).not.toContain('role="combobox"');
    const extern = renderToString(createElement(LeverancierKanaal, { leverancier: { soort: 'extern', kanaal: 'mail' }, onKanaal }));
    expect(extern).toContain('role="combobox"');
    expect(extern).not.toContain('>winkel<');
  });

  test('opslaan laat het kanaal van winkel staan', async () => {
    const db = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { soort: 'winkel' }, error: null }) }) }),
      }),
    };
    const patch = await leverancierUpdatePatch(db as never, 'spar', { naam: 'Spar (zelf halen)', kanaal: 'mail' });
    expect(patch).toEqual({ naam: 'Spar (zelf halen)' });
    const extern = await leverancierUpdatePatch(db as never, 'boer', { naam: 'Boer & Chef', kanaal: 'portal', soort: 'extern' });
    expect(extern).toEqual({ naam: 'Boer & Chef', kanaal: 'portal' });
  });
});
