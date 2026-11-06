// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BordTabel } from './BordTabel';
import type { ArtikelVorm, BestelSignaal } from '@/hooks/useBestelbord';

function regel(deel: Partial<BestelSignaal>): BestelSignaal {
  return {
    id: 's', vestiging: 'Test', naam: 'Bloem', aantal: 2, eenheid: 'zak', notitie: null,
    status: 'open', bron: 'handmatig', created_at: '2026-11-01', besteld_op: null,
    bestelreferentie: null, besteld_via: null, leverancier_id: 'l', artikel_id: null,
    artikel_vorm_id: null, verwachte_levering: null, geleverd_op: null, geleverd_door: null,
    levering_status: null, levering_opmerking: null, restant_van: null,
    ...deel,
  };
}

const vorm = { id: 'v' } as ArtikelVorm;

describe('aantallen en bedragen in BordTabel', () => {
  test('getal en eenheid delen vaste sporen, subtotaal staat in de prijskolom', () => {
    const html = renderToString(createElement(TooltipProvider, null, createElement(BordTabel, {
      regels: [
        regel({ id: 'a', naam: 'Bloem', aantal: 12, eenheid: 'zak' }),
        regel({ id: 'b', naam: 'Melk', aantal: 1, eenheid: 'stuk' }),
      ],
      leverancier: () => 'Bidfood',
      deadlineHint: () => null,
      prijsVan: (s) => ({ vorm, totaal: s.id === 'a' ? 10 : 5 }),
      prijsSignaal: () => null,
      prijsTip: () => '',
      onBesteld: () => {},
      onBewerk: () => {},
      onVervallen: () => {},
    })));
    expect(html.match(/grid-cols-\[4ch_8ch\]/g)).toHaveLength(2);
    expect(html).toContain('zakken');
    expect(html).toContain('>stuk<');
    expect(html).toContain('hidden font-medium tabular-nums sm:block');
    expect(html).toContain('15,00');
  });
});
