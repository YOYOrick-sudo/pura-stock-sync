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

**Rode kool — via een generieke Midsland-bestelregel**

In plaats van een losse uitzondering voor rode kool komt er één systeemregel voor alle producten die uit Midsland komen:

- Per Midsland-product leg je twee getallen vast: *meld vanaf* (bestelpunt) en *aanvullen tot*.
- Zolang de voorraad boven het bestelpunt is: geen bestelling.
- Op of onder het bestelpunt: het systeem zet in één keer het verschil tot "aanvullen tot" op de interne bestellijst. Nooit losse restbestellingen van 1 stuk.
- Rode kool krijgt: op peil 4 zakken, meld vanaf 2, aanvullen tot 5 (dus altijd 3 zakken tegelijk).
- Dezelfde velden gelden meteen voor de andere Midsland-producten (o.a. oesterzwam, dukkah); daar vullen we de twee getallen per product in het beheer in.
- Werkbank wordt bijgevuld uit de koelcelzakken.

## Ook mee: stickerknop au bain-marie

In de database staan twee identieke vissoep-stickers, 1,3 seconde na elkaar aangemaakt. Het zijn dus twee losse tikken die allebei doorkomen (dubbeltik op de iPad), niet één opdracht met aantal 2.

- Eén tik = altijd precies één sticker: na een tik negeert de knop verdere tikken op hetzelfde product tot de opdracht klaar is, plus een korte blokkade daarna.
- Alleen de aangetikte knop reageert: nu worden bij het printen álle stickerknoppen grijs, waardoor het lijkt of je ze allemaal indrukt. Voortaan verandert alleen de knop die je aanraakt (kort "Bezig…", daarna het vinkje).


## Technisch

- Datawijzigingen op `koelcel_check_items` (West): nieuw werkbank-item geroosterde bloemkool (GN 1/4 midden, bron `zelf_west`), naam gegrilde groenten bijwerken, `lade_id` van de vier op "Links midden" (`94b711e5…`) met volgorde 410–413, koelcelregels aubergine + geroosterde groenten op `actief=false`.
- Generieke Midsland-regel: hergebruik van de bestaande velden `bestelpunt` en een aanvul-doel. Als er nog geen "aanvullen tot"-veld is, komt er één migratie die `aanvul_tot` (numeric, nullable) toevoegt aan `koelcel_check_items`, met GRANT/RLS ongewijzigd.
- De bestelberekening in `useKoelcelCheck.ts` krijgt één gedeelde functie: bron `midsland` → bestel alleen bij `ligt <= bestelpunt`, dan `aanvul_tot - ligt`. Geldt voor elk Midsland-product, niet alleen rode kool.
- Beheer (`VoorraadCheckBeheer.tsx`) krijgt de twee velden zichtbaar per product, met korte uitleg achter een info-icoon.
- Rode kool: `doel_aantal` 4, `bestelpunt` 2, `aanvul_tot` 5.
- Aanvullen tot "de helft van de bak" voor de zelfgemaakte producten gebruikt de bestaande vulnorm-logica; voor die drie zetten we `vulnorm` op half.

