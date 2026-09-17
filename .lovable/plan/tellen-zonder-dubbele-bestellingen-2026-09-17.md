# Tellen zonder dubbele bestellingen

Je vraag: maandag tel je 4 van de 6, een week later nog maar 2. Wat moet er dan gebeuren?

Het antwoord dat in de praktijk én in professionele voorraadsystemen klopt: er bestaat maar één openstaande behoefte per product. Elke telling **overschrijft** die behoefte, hij telt hem niet op. En wat al besteld is maar nog niet geleverd, telt mee als voorraad-onderweg.

De rekenregel wordt overal dezelfde:

```text
nodig = doel − wat er ligt − wat al besteld is en nog niet geleverd
```

## De drie situaties

**1. Bestelling staat nog als concept (niet verstuurd)**
Week 1: 4 van 6 → regel "2 bananencake" op de conceptbestelling.
Week 2: nog 2 van 6 → diezelfde regel wordt bijgewerkt naar 4. Geen tweede regel, geen tweede bestelling.

**2. Bestelling is al verstuurd naar Midsland, nog niet geleverd**
Week 1: 2 besteld en verstuurd. Week 2 tel je 2 → nodig is 6 − 2 − 2 onderweg = 2. Er komt dus 2 bij op de nieuwe conceptbestelling, niet 4. Je bestelt nooit twee keer hetzelfde.

**3. Bestelling is geleverd**
Dan telt hij niet meer mee als onderweg; wat je telt is de waarheid en het tekort gaat gewoon op de nieuwe lijst.

## Wat je op het scherm ziet

- Bij de telling: "2 besteld, nog niet geleverd" onder de regel, zodat je weet dat er al iets aankomt voordat je iets doet.
- Als een telling een bestaande regel bijwerkt: "Bijgewerkt naar 4 bakken" in plaats van een nieuwe melding.
- Op de bestellijst onder Voorraad blijft het één regel per product, met de datum van de laatste telling.

## Wat er onder water verandert

Nu houdt de app al het hoogste tekort aan binnen één conceptbestelling, maar hij kijkt niet naar al verstuurde bestellingen. Daardoor kan hetzelfde product twee keer onderweg zijn.

- Nieuwe functie `openstaandVoorProduct(vestiging, naam)`: telt regels op bestellingen met status `concept`, `submitted`/`approved` — alles wat nog niet `delivered` is — en trekt eventueel `ontvangen_aantal` eraf.
- `naarMidsland` en `opBestelbord` in `src/hooks/useKoelcelCheck.ts` rekenen met `nodig = doel − aanwezig − openstaand`. Is de uitkomst 0 of minder, dan wordt er niets besteld en zegt de app "staat al voor je klaar".
- Bestaat de regel al op de conceptbestelling, dan wordt `quantity` overschreven met de nieuwe behoefte (in plaats van de huidige max-regel). Een regel die iemand handmatig heeft aangepast (`handmatig_aangepast = true`) wordt met rust gelaten.
- Hetzelfde geldt voor het bestelbord: één open signaal per product, bijgewerkt in plaats van verdubbeld.
- Geen databasewijziging nodig; alle velden bestaan al.

## Risico dat we bewust nemen

Als Midsland maar een deel levert en dat niet registreert, denkt de app dat alles binnen is. Daarom blijft de wekelijkse telling leidend: die corrigeert zichzelf de week erna automatisch, omdat de telling altijd wint van de administratie.
