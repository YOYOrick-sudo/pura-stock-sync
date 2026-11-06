# Verfijning van het oude design

Alleen het bestelbord. Geen nieuwe kleuren of tokens. De waarden zijn de meest gebruikte uit de huidige app.

## Afstand

- `gap-2` tussen dingen in een rij. Dat komt het meest voor.
- `space-y-4` tussen de blokken op de pagina.
- `space-y-2` tussen een label en zijn veld. Dat is de meest gebruikte stapel.
- `px-4` en `py-2` als padding. Op desktop houdt een kaart `lg:px-6`, gelijk aan de kaartkop.

## Ronding

- Knoppen en invoer: `rounded-polar-lg`. Dat is de radius van `Button` en `Input`.
- Kaarten: `rounded-polar-lg`. Dat is de radius van `Card`.
- Een losse `rounded-polar-md` of `rounded-polar-xl` op het bestelbord is naar die radius gezet.

## Knop

- Hoogte `h-11`, via `size="touch"` of `size="touch-icon"`. `h-11` is de meest gebruikte hoogte, en het is een bestaande maat van `Button`.
- Ronding en varianten blijven die van `Button`: `default`, `outline` en `ghost`. Geen eigen hoogte of radius op de knop.

## Badge

- Statuslabels gebruiken `Badge` uit `components/ui/badge`, zonder eigen lettergrootte of padding.
- Neutraal is `secondary`. Dat is de meest gebruikte variant.
- Een waarschuwing blijft `warning`, informatie blijft `info`, een restant blijft `outline`. Dat zijn de bestaande statusvarianten, geen nieuwe kleuren.

## Titel

- De paginatitel is de `h1` in de header: `text-xl md:text-2xl font-semibold tracking-tight text-foreground`.
- Het bestelbord tekent geen tweede titel. De header zegt al Bestellijst.
