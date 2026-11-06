// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EindcheckKaart } from './OntvangstOnderweg';
import type { OntvangstVandaag } from '@/hooks/useOntvangstV2';
import type { OntvangstModus } from '@/lib/ontvangstV2';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn(async () => ({ data: [], error: null })), from: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const modus: OntvangstModus = {
  test: false, ontvangstV2: true, keukenadvies: false, magBeslissen: false, pVestiging: 'West', pBron: null,
};

function regel(deel: Partial<OntvangstVandaag> & Pick<OntvangstVandaag, 'naam' | 'soort'>): OntvangstVandaag {
  return {
    signaal_id: null, open_regel_id: null, pakbon_regel_id: deel.naam, leverancier_id: null,
    leverancier_naam: 'Kooyman', ordernummer: null, artikelnummer: null, besteld_aantal: 1, eenheid: 'stuk',
    verwachte_levering: '2026-11-06', te_laat: false, pakbon_aantal: 1, voorstel_aantal: 1,
    pakbon_status: null, pakbon_notitie: null, geleverd_vorm_id: null, geleverd_vorm: null,
    ...deel,
  };
}

function html(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderToString(createElement(QueryClientProvider, { client }, node));
}

describe('Vandaag binnen en nog open', () => {
  test('de teller van vandaag telt alleen de regels van vandaag, de rest zit dicht in het tweede blok', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T10:00:00+01:00'));
    const tekst = html(createElement(EindcheckKaart, {
      modus,
      laden: false,
      restanten: [],
      regels: [
        regel({ naam: 'Amandelmeel', soort: 'onderweg', signaal_id: 's1' }),
        regel({ naam: 'Like mayonaise', soort: 'onderweg', signaal_id: 's2', verwachte_levering: '2026-11-05', te_laat: true }),
        regel({ naam: 'Mist nog', soort: 'mist', open_regel_id: 'm1' }),
        regel({ naam: 'Emballage  5,00', soort: 'alleen_pakbon', pakbon_regel_id: 'e1', verwachte_levering: '2026-11-02', te_laat: true }),
      ],
    }));
    vi.useRealTimers();
    expect(tekst).toContain('Vandaag binnen');
    expect(tekst).toContain('Amandelmeel');
    expect(tekst).toContain('Nog open van eerder');
    expect(tekst).toContain('>2<');
    const open = tekst.split('Nog open van eerder')[1] ?? '';
    expect(open).not.toContain('Like mayonaise');
    expect(tekst).not.toContain('Mist nog');
  });
});
