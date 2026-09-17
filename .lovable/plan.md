# Nakijken ChatGPT-lijst West tegen de app

## Korte conclusie
Het document is bruikbaar als controlelijst, maar levert nauwelijks nieuwe informatie op. Vrijwel alles wat erin staat, staat al in de app: 42 producten in het document tegenover 44 koelcelregels, 28 vriescelregels, 34 koelwerkbankregels en 3 toppingsregels in West. De bakmaten (1/6, 1/9, 1/4, hoog/midden/halfvol) staan bij ons al gedetailleerder vastgelegd dan in het document.

De 16 open vragen in het document zijn precies dezelfde punten die bij ons nog openstaan: bakmaat van de mayonaises, aantal paprika's, rode kool en zoetzure gember. Er komt dus geen antwoord uit dit bestand.

## Wat wel opvalt (verschillen om te bevestigen)
| Product | In het document | Nu in de app |
| --- | --- | --- |
| Bananencake, vriescel | 5 bakken | 6 bakken (rustig) |
| Wortel-walnoot, koelcel | 2 tot 3 bakken (bandbreedte) | één vast aantal |
| Cheesecake, vriescel | 6 bakken, maar als onzeker gemarkeerd | 6 bakken, bevestigd |
| Granaatappels, 8 stuks | bewaarplek onbekend | koelcel |

Verder geen afwijkingen gevonden in de normen die het document als bevestigd aanmerkt.

## Voorstel
1. Jij bevestigt de vier punten hierboven (of laat ze zoals ze zijn).
2. Alleen de bevestigde punten worden aangepast in de productlijst van West. Geen massale import; het document overschrijft niets automatisch, want de app is op die plekken preciezer.
3. Wat open blijft (mayonaisebakken, aantal paprika's, koelcelaantal rode kool en zoetzure gember) blijft leeg staan in plaats van dat er een aanname wordt ingevuld.

## Technisch
- Vergelijking gedaan tussen `products[]` uit het JSON-bestand en `koelcel_check_items` (vestiging West, actief) per `plek` en `product_sleutel`.
- Eventuele wijziging is een kleine data-update op `doel_aantal` / `doel_aantal_druk` van maximaal vier regels; geen schema- of codewijziging.
- Bandbreedte "2 tot 3" past in het huidige model als rustig = 2 en druk = 3, zonder nieuwe kolom.
