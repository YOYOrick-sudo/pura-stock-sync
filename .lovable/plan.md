# Vriescel: minimum van 6 en meer kunnen tellen

## Wat er verandert

1. **Minimale vriescelvoorraad op 6** voor de gevacumeerde spreads in West: Tomatenrelish, Tomatenjam en Wortelspread (die staat nu ook nog op 1). Drukke dagen: 8.
2. **Meer tellen dan het doel mag.** Nu stopt de plus-knop bij het doelaantal, dus als er 9 zakjes liggen kun je maximaal 6 invoeren. Dat wordt losgelaten: je kunt doortellen zolang je wilt.
3. **Meer dan nodig is geen probleem.** Ligt er meer dan het minimum, dan blijft de regel gewoon groen/klaar, er komt niets op de aanvulbon en er wordt niets besteld. Geen waarschuwing, geen amber.

## Wat dit in de praktijk doet
Bij de maandagse vriesceltelling tel je gewoon wat er ligt. Zie je 9 zakjes relish, dan tik je 9 in en de lijst zegt: klaar. Zie je er 4, dan gaat het tekort van 2 door naar Midsland zoals nu.

## Techniek
- Migratie: `koelcel_check_items` — `doel_aantal` 6 en `doel_aantal_druk` 8 voor Tomatenrelish, Tomatenjam en Wortelspread (bron `vriezer`, vestiging West). Regel in `migratie_logboek`.
- `VoorraadRonde.tsx`: de `Math.min(heel + 1, Math.ceil(doel))` in de stepper vervalt (geen bovengrens meer). Tekortberekening blijft `Math.max(doel - aanwezig, 0)`, dus een overschot levert nooit een bestelregel op.

## Open vraag
Avocado spread staat ook op 1 in de vriescel. Moet die ook naar 6, of blijft die zoals hij is?
