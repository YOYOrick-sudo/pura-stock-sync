# Lade Links midden — vier bakken vastleggen

## Wat er nu in het systeem staat

| Bak in de foto | Nu bekend | Klopt niet |
|---|---|---|
| Geroosterde bloemkool (linksboven) | Alleen "Gesneden bloemkool" in de koelcel (zelf gemaakt, 1 stuk) | Geen bak op de werkbank |
| Aubergine (rechtsboven) | Werkbank GN 1/4 midden, 1 bakje + koelcel 8 stuks zelf gemaakt | Ligt nu op lade Rechts midden; koelcelvoorraad niet nodig |
| Rode kool (linksonder) | Werkbank GN 1/4, 1 bakje + koelcel 1 gevacumeerde zak uit Midsland | Lade Rechts midden; koelcel moet 4 zakken zijn |
| Gegrilde groenten paprika/venkel/courgette (rechtsonder) | Heet nu "Geroosterde groenten", werkbank GN 1/4 + koelcel 4 stuks | Naam verwarrend, lade fout, koelcelvoorraad niet nodig |

## Wat we vastleggen

**Lade Links midden** krijgt deze vier, in de volgorde van de foto:
1. Geroosterde bloemkool (nieuw werkbank-item)
2. Aubergine
3. Rode kool
4. Gegrilde groenten (paprika, venkel, courgette) — hernoemd

**Zelfgemaakt (bloemkool, aubergine, gegrilde groenten)**
- Geen aparte koelcelvoorraad meer; de bak op de werkbank is leidend.
- Tellen: vol / half / dun laagje / leeg.
- Dun laagje of leeg = MEP-taak "vandaag", aanvullen tot de helft van de GN 1/4.
- Half = geen taak (bak is nog voldoende gevuld voor de service).
- De oude koelcelregels van aubergine en geroosterde groenten worden gearchiveerd, niet verwijderd.

**Rode kool (uit Midsland)**
- Koelcel: 4 gevacumeerde zakken op peil.
- Bestelregel zonder gepruts met losse zakken: pas bestellen als er 2 of minder liggen, dan aanvullen tot 5. Dus altijd een bestelling van 3 zakken — nooit een transport voor 1 zakje.
- Werkbank wordt bijgevuld uit die koelcelzakken.

## Technisch

- Datawijzigingen op `koelcel_check_items` (West): nieuw werkbank-item geroosterde bloemkool (GN 1/4 midden, bron `zelf_west`), naam gegrilde groenten bijwerken, `lade_id` van de vier op "Links midden" (`94b711e5…`) met volgorde 410–413, koelcelregels aubergine + geroosterde groenten op `actief=false`.
- Rode kool koelcel: `doel_aantal` 4, `bestelpunt` 2, `bestel_inhoud`/aanvultarget 5.
- Geen schemawijziging nodig; bestelpunt- en batchvelden bestaan al.
- Aanvullen tot "de helft van de bak" gebruikt de bestaande vulnorm-logica; voor deze drie zetten we `vulnorm` op half in plaats van vol.
