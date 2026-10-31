// @ts-ignore vitest types are not installed in the app tsconfig
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { allNavigationItems, midslandKeukenUrls, useNavigatieItems } from './useNavigatieItems';

const state = vi.hoisted(() => ({ location: 'Midsland', vlagAan: false }));
vi.mock('@/contexts/UserLocationContext', () => ({ useUserLocation: () => ({ userLocation: state.location }) }));
vi.mock('@/hooks/useRole', () => ({ useRole: () => ({ isManager: true, isOwner: true }) }));
vi.mock('@/hooks/useIsMtLid', () => ({ useIsMtLid: () => ({ isMtLid: true }) }));
vi.mock('@/hooks/useHeeftRol', () => ({ useHeeftRol: () => ({ heeftRol: true }) }));
vi.mock('@/hooks/useOntvangstV2', () => ({
  useFase2VlagAan: (vestiging: string | null, vlag: string) => vestiging === 'Midsland' && vlag === 'ontvangst_v2' && state.vlagAan,
}));

function zichtbareUrls(): string[] {
  let urls: string[] = [];
  function Menu() {
    urls = useNavigatieItems().map((item) => item.url);
    return null;
  }
  renderToString(createElement(Menu));
  return urls;
}

describe('Midsland Bestelbord achter ontvangst_v2', () => {
  beforeEach(() => { state.location = 'Midsland'; state.vlagAan = false; });
  test('Midsland zonder schakelaar heeft alleen de bestaande keuken-items', () => {
    expect(midslandKeukenUrls(false)).toEqual(['/kitchen/mep', '/kitchen/gerechten']);
    expect(zichtbareUrls()).not.toContain('/kitchen/bestelbord');
  });
  test('Midsland met ontvangst_v2 aan toont Bestelbord', () => {
    state.vlagAan = true;
    expect(midslandKeukenUrls(true)).toEqual(['/kitchen/mep', '/kitchen/gerechten', '/kitchen/bestelbord']);
    expect(zichtbareUrls()).toContain('/kitchen/bestelbord');
  });
  test('West behoudt exact dezelfde menu-items met de schakelaar uit en aan', () => {
    state.location = 'West';
    const verwacht = allNavigationItems.filter((item) => item.locations.includes('West')).map((item) => item.url);
    expect(zichtbareUrls()).toEqual(verwacht);
    state.vlagAan = true;
    expect(zichtbareUrls()).toEqual(verwacht);
    expect(zichtbareUrls()).toContain('/kitchen/bestelbord');
  });
});