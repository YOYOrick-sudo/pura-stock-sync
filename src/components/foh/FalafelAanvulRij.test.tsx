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

test('start toont doel en de twee eerste knoppen, zonder bestellen', () => {
  const uit = html();
  expect(uit).toContain('Falafel');
  expect(uit).toContain('Doel lade: minimaal ½ bak');
  expect(uit).toContain('Op peil');
  expect(uit).toContain('Aanvullen');
  expect(uit).not.toContain('Bijbestellen');
  expect(uit).not.toContain('Vriezer onvoldoende');
});

test('koelcel en vriezer tonen alleen de knoppen van die stap', () => {
  const koelcel = html({ beginStap: 'koelcel' });
  expect(koelcel).toContain('Vul de lade aan uit de koelcel.');
  expect(koelcel).toContain('Aangevuld uit koelcel');
  expect(koelcel).toContain('Koelcel onvoldoende');
  expect(koelcel).not.toContain('Vriezer onvoldoende');

  const vriezer = html({ beginStap: 'vriezer' });
  expect(vriezer).toContain('Zet 1 bak uit de vriezer in de koelcel voor de volgende service.');
  expect(vriezer).toContain('Ontdooien gestart (uit vriezer)');
  expect(vriezer).toContain('Vriezer onvoldoende');
  expect(vriezer).not.toContain('Aangevuld uit koelcel');
});

test('afgevinkt en doorgezet tonen de uitkomst, geen nieuwe keuzes', () => {
  expect(html({ afgevinkt: true })).toContain('Op peil');
  expect(html({ afgevinkt: true })).not.toContain('Aanvullen');
  const ontdooit = html({ doorgezet: true, doorgezetNaar: 'mep' });
  expect(ontdooit).toContain('In ontdooiing · lade later aanvullen');
  expect(ontdooit).toContain('Herstel');
  expect(ontdooit).not.toContain('Vriezer onvoldoende');
});
