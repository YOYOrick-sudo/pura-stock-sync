// @ts-ignore bun test runner
import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { FalafelAanvulRij } from './FalafelAanvulRij';

const stil = () => {};

function html(extra: Record<string, unknown> = {}) {
  return renderToString(createElement(FalafelAanvulRij, {
    naam: 'Falafel',
    vulnorm: 'half',
    eenheid: 'bak',
    doelAantal: 1,
    afgevinkt: false,
    doorgezet: false,
    laden: false,
    fout: false,
    onOpPeil: stil,
    onAangevuld: stil,
    onOntdooien: stil,
    onBestellen: stil,
    onHerstel: stil,
    onVink: stil,
    ...extra,
  }));
}

test('start toont de peilbalk en compacte knoppen, zonder bestellen', () => {
  const uit = html();
  expect(uit).toContain('Falafel');
  expect(uit).toContain('Min. ½');
  expect(uit).toContain('Minstens half vol');
  expect(uit).toContain('Staat de lade op peil?');
  expect(uit).toContain('Op peil');
  expect(uit).toContain('bg-success');
  expect(uit).toContain('Aanvullen');
  expect(uit).toContain('bg-warning');
  expect(uit).toContain('h-11');
  expect(uit).toContain('animate-in');
  expect(uit).toContain('duration-200');
  expect(uit).toContain('active:scale-[0.98]');
  expect(uit).not.toContain('min-h-16');
  expect(uit).not.toContain('animate-bounce');
  expect(uit).not.toContain('repeat-infinite');
  expect(uit).not.toContain('Bijbestellen');
  expect(uit).not.toContain('Vriezer onvoldoende');
});

test('koelcel en vriezer tonen alleen de knoppen van die stap', () => {
  const koelcel = html({ beginStap: 'koelcel' });
  expect(koelcel).toContain('Min. ½');
  expect(koelcel).toContain('Vul de lade aan uit de koelcel.');
  expect(koelcel).toContain('Aangevuld uit koelcel');
  expect(koelcel).toContain('Koelcel onvoldoende');
  expect(koelcel).toContain('bg-destructive');
  expect(koelcel).not.toContain('Vriezer onvoldoende');

  const vriezer = html({ beginStap: 'vriezer' });
  expect(vriezer).toContain('Min. ½');
  expect(vriezer).toContain('Zet 1 bak uit de vriezer in de koelcel voor de volgende service.');
  expect(vriezer).toContain('Ontdooien gestart');
  expect(vriezer).toContain('bg-info');
  expect(vriezer).toContain('Vriezer onvoldoende');
  expect(vriezer).toContain('Bestelsignaal');
  expect(vriezer).not.toContain('Aangevuld uit koelcel');
});

test('afgevinkt en doorgezet tonen de uitkomst, geen nieuwe keuzes', () => {
  const klaar = html({ afgevinkt: true });
  expect(klaar).toContain('Op peil');
  expect(klaar).toContain('Min. ½');
  expect(klaar).not.toContain('Aanvullen');
  const ontdooit = html({ doorgezet: true, doorgezetNaar: 'mep' });
  expect(ontdooit).toContain('In ontdooiing · lade later aanvullen');
  expect(ontdooit).toContain('Herstel');
  expect(ontdooit).not.toContain('Vriezer onvoldoende');
});
