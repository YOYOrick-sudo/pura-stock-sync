# Lade klapt pas in als je aan de volgende lade begint

## Wat er nu gebeurt
Zodra je het laatste product van een lade aantikt, klapt die lade meteen dicht. Dat voelt abrupt: je bent nog bezig met kijken of je goed hebt geteld, en het scherm springt al weg.

## Wat er verandert
- Tel je het laatste product van een lade, dan blijft die lade gewoon open staan. Je ziet je eigen telling nog volledig, en corrigeren kan zonder de lade opnieuw te openen.
- Pas als je het eerste product van een andere lade aantikt, klapt de vorige (volledig getelde) lade in. Precies op dat moment, geen tik extra nodig.
- De knop onderaan ("... klaar") blijft werken zoals nu: daarmee sluit je een lade direct en spring je naar de volgende. Handig bij de reservelade, waar je bewust niets aantikt.
- De laatste lade van de ronde blijft open staan tot je hem via de knop afrondt of naar de aanvulbon gaat.
- Bij het inklappen blijft het product dat je net aantikte op dezelfde plek op het scherm staan, zodat de lijst niet onder je vinger wegschuift.

## In de praktijk
- Wie: het team tijdens de voorraadronde op de iPad, bij open en sluit.
- Verandering in gewoonte: geen. Het voelt alleen rustiger; je houdt zicht op wat je net telde.
- Risico: klein. Er verandert niets aan wat er geteld of besteld wordt, alleen wanneer een lade dichtklapt. De voortgangsteller ("4/15") loopt daardoor één lade "achter" tot je aan de volgende begint — dat is precies wat je op het scherm ziet.

## Technisch
In `src/components/foh/VoorraadRonde.tsx`:
- De `useEffect` die groepen automatisch bevestigt zodra alle items geteld zijn (regel ~816-828) vervalt als directe trigger.
- In plaats daarvan bepaalt `zet()` (regel ~941) bij elke tik de groep van het aangetikte item en bevestigt dan de groepen die volledig geteld zijn, nog niet bevestigd zijn, niet in `heropend` staan én een andere sleutel hebben dan de huidige groep.
- Hulpstructuur: `Map<itemId, groepSleutel>` afgeleid uit `telGroepen` (memo).
- `sluitGroep` en `volgendeGroep` blijven ongewijzigd; de voortgangsteller blijft op `bevestigd` gebaseerd.
- Scrollbehoud: vóór het inklappen de `getBoundingClientRect().top` van het aangetikte item onthouden en na de state-update met `window.scrollBy` het verschil corrigeren (in `requestAnimationFrame`).
