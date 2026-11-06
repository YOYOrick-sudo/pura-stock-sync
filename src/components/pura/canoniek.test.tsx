import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Afvinkrij, Formulierveld, LegeStaatBlok, Lijstrij, Statusbadge, Telrij, Werkkaart } from './canoniek';

describe('canonieke patronen', () => {
  test('telrij houdt stapper en knop op 44px en de eenheid op de cijferlijn', () => {
    const html = renderToString(
      <Telrij naam="Wortelspread" meta="3,2 kg per bak" waarde={1} eenheid="bak" actieLabel="Bestellen" onChange={() => undefined} />,
    );
    expect(html).toContain('min-h-12');
    expect(html).toContain('h-11');
    expect(html).toContain('items-center');
    expect(html).toContain('leading-none');
    expect(html).toContain('text-xs');
    expect(html).toContain('font-semibold');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('bak');
    expect(html).not.toContain('items-baseline');
    expect(html).not.toContain('text-lg');
  });

  test('lijstrij en afvinkrij zijn even hoog en tonen meta', () => {
    const lijst = renderToString(<Lijstrij naam="Courgette" meta="5 kg" status={<Statusbadge toon="let-op">Onzeker</Statusbadge>} />);
    const vink = renderToString(<Afvinkrij naam="Terras" meta="Sluit" />);
    expect(lijst).toContain('min-h-12');
    expect(lijst).toContain('Onzeker');
    expect(lijst).toContain('5 kg');
    expect(vink).toContain('min-h-12');
    expect(vink).toContain('h-11');
    expect(vink).toContain('Sluit');
  });

  test('werkkaart, formulier en lege staat gebruiken de vaste maten', () => {
    const kaart = renderToString(<Werkkaart titel="Open"><LegeStaatBlok tekst="Niets openstaand." /></Werkkaart>);
    const veld = renderToString(<Formulierveld id="naam" label="Naam"><input id="naam" /></Formulierveld>);
    expect(kaart).toContain('Niets openstaand.');
    expect(kaart).toContain('py-6');
    expect(veld).toContain('space-y-2');
    expect(veld).toContain('Naam');
  });
});
