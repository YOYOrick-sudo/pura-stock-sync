# Onderweg-melding op het juiste niveau

## Wat er nu misgaat

In de koelwerkbank staat "1 onderweg" bij Wortelspread. Dat klopt niet: de koelwerkbank wordt nooit vanuit Midsland geleverd, die vul je bij uit de koelcel.

Twee oorzaken, allebei nagekeken in de data:

1. Openstaande bestellingen worden alleen op **productnaam** gekoppeld. Wortelspread bestaat drie keer (vriescel, koelcel, koelwerkbank). Een bestelling bij Midsland voor de vriescel plakt daardoor op alle drie de regels. Dit speelt bij elk product dat op meerdere plekken staat: Tempeh, Rode kool, Avocado spread enzovoort.
2. De openstaande regels die nu meetellen staan op een bestelling met status "concept" — dus nog niet eens verstuurd. Toch kleurt de regel al amber met "Binnengekomen / Nog niet binnen".

## Wat we veranderen

- Onderweg telt alleen nog mee op het niveau dat Midsland daadwerkelijk levert (de vriescelregel). Koelcel- en koelwerkbankregels tonen geen onderweg meer en worden gewoon als vulling/reserve geteld.
- Alleen verstuurde bestellingen gelden als onderweg. Een bestellijst die nog in concept staat, verandert de telronde niet.
- Dezelfde regel gaat ook in de bestelberekening gelden, zodat een lege koelcel niet meer wordt onderdrukt door iets dat naar de vriescel onderweg is.

## Wat je daarna ziet

- Koelwerkbank: Wortelspread weer een gewone regel (vol / half / bodempje / leeg), geen amber balk.
- Vriescel (maandag): daar zie je wel "1 onderweg" zodra de bestelling naar Midsland verstuurd is.

## Nog te bevestigen (data, geen code)

Je zegt: vriescel 6 zakjes, koelcel altijd 1 gevacumeerd zakje. In de lijst staat nu:
- Koelcel Wortelspread: 1 gevacumeerd zakje — klopt.
- Vriescel Wortelspread: 1 stuk — dat zou 6 moeten zijn.

Ik pas de vriesceldoelen aan zodra je zegt welke spreads op 6 moeten (alleen Wortelspread, of ook Avocado spread en de andere spreads).

## Technisch

- `useOpenstaandeBestellingen` en `openstaandVoorProduct` in `src/hooks/useKoelcelCheck.ts`: sleutel wordt `naam + plek/niveau` in plaats van alleen naam; alleen items met `bron = 'midsland'` (plek vriezer) kunnen onderweg hebben; orders met status `concept` vallen buiten de telling.
- `VoorraadRonde.tsx` leest de map met dezelfde samengestelde sleutel, zodat werkbank- en koelcelregels 0 krijgen.
- Geen databasewijziging nodig voor de fix; de vriesceldoelen zijn een aparte datacorrectie met regel in `migratie_logboek`.
