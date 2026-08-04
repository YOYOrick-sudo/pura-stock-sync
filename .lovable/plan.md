# West open-fase: gestandaardiseerde openlijst toevoegen

Alles als dagelijkse templates (`foh_daily_templates`, phase `open`, `repeat_type='daily'`, `is_active=true`), zodat ze elke dag opnieuw verschijnen. Midsland blijft ongemoeid. Geen bestaande taak wordt verwijderd zonder akkoord.

## Huidige open-fase West (opgehaald)

**Bediening**
- Deel 1 (10): Inklokken · Kussens naar terras · Bakjes en plantjes op tafels · Tafels schoonmaken (binnen + buiten) · Terras vegen · Stofzuigen en dweilen · Kassa tellen
- Bar (20): Waterkaraf vullen · Sinaasappels halveren · Fles water bij juicer · Mini-gardes in glaasje water · Siropen op bar · Muntblaadjes op bar · Koffiemachine uit eco-stand
- shop (50): Ziet de shop er verzorgd uit?

**Keuken**
- Bijvullen keuken (30): Check MEP lijst whiteboard, zijn er dingen die je kan maken?

**Samen**
- Extra (20): Planten watergeven

Bestaande categorie-volgorde West (alle fases): bediening 10 Deel 1, 20 Bar, 30 Bijvullen bar, 40 Schoonmaak Bar, 50 shop, 60 Terras · keuken 10 Ontdooien, 20 Keuken, 30 Bijvullen keuken · samen 10 Sanitair, 20 Extra, 30 Algemeen, 40 Laatste Loodjes.

## Dubbelingen / overlap — voorstel

| Nieuw | Bestaand (open) | Voorstel |
|---|---|---|
| Water voor de juicer klaarzetten | Bar: "Fles water bij juicer" | **Samenvoegen** — nieuwe taak niet aanmaken, bestaande verplaatsen naar "Machines & klaarzetten" |
| Glaasje water voor de chai-garde | Bar: "Mini-gardes in glaasje water" | **Samenvoegen** — bestaande verplaatsen naar "Machines & klaarzetten" |
| Tafels binnen / buiten afnemen met doekje | Deel 1: "Tafels schoonmaken (binnen + buiten)" | **Vervangen** — oude template deactiveren, twee nieuwe (binnen / buiten) in "Zaal & terras" |
| Smoothies maken | Bijvullen bar (**sluit**): "Smoothies maken voor de volgende dag" | **Beide houden** — verschillende fases (sluit = voorbereiden, open = aanvullen indien op) |
| — | Bijvullen keuken (open): "Check MEP lijst whiteboard" | Geen dubbeling met de nieuwe lijst; blijft staan |

Alle overige nieuwe taken hebben geen tegenhanger.

## Nieuwe categorieën + sort_order

Rijen in `foh_category_order` voor **alle vier fases** (open/tussen/borrel/sluit), consistent met de bestaande opzet; bestaande categorieën schuiven op.

**samen**: 5 Binnenkomst · 10 Sanitair · 20 Extra · 30 Algemeen · 40 Laatste Loodjes

**bediening**: 10 Deel 1 · 15 Machines & klaarzetten · 20 Bar · 25 Vers & bijvullen · 28 Zaal & terras · 30 Bijvullen bar · 40 Schoonmaak Bar · 50 shop · 60 Terras · 70 Admin

**keuken**: 5 Apparatuur aan · 10 Ontdooien (vriezer → koelcel) · 12 Koelcel-ronde · 14 Afbakken — brood · 16 Afbakken — croissants · 18 Warm eten · 20 Keuken · 30 Bijvullen keuken

## Taken per categorie (open-fase)

**SAMEN — Binnenkomst** (13, sort_order 10..130): Poort openen — code 2020 · Sleutel van het randje pakken · Schuur openen · Licht tussenstukje aan · Licht koelcel aan · Licht vriescel aan · Deur naar binnen openen · Sleutel op haakje hangen bij wasmachine · Licht binnen aan · Vaatwasser aan · Licht linker vitrine aan · Licht + aanknop middelste vitrine aan · Check: licht rechter vitrine brandt (staat altijd aan i.v.m. boter en jam)

**BEDIENING — Machines & klaarzetten** (6): Sopje klaarzetten onder koffiemachine en in de wasbak in de keuken · Glaasje water voor de chai-garde (verplaatst) · Water voor de juicer klaarzetten (verplaatst) · Deksels van de theebakjes af · Telefoons checken op batterij en aan de lader · Muziek aan

**BEDIENING — Vers & bijvullen** (3): Limoensapfles vullen/persen · Smoothies maken · Servetjes in de bestekblikjes

**BEDIENING — Zaal & terras** (2): Tafels binnen afnemen met doekje · Tafels buiten afnemen met doekje

**BEDIENING — Admin** (2): Mail checken · Agenda checken

**KEUKEN — Apparatuur aan** (3): Oven aan — 210 °C, hete lucht · Bain-marie aan · Tosti-ijzer aan

**KEUKEN — Koelcel-ronde** (3): Alle bakken die op de grond staan in de koelcel mee naar binnen · Grijze bak met potten mee naar binnen · Deksels van de potten halen en schoonmaken — potten zelf indien nodig

**KEUKEN — Afbakken — brood** (6): Pastel de nata van gisteren: 4 min in de oven — nieuwe: 10 min · Brood checken en in de lades: bovenin brioche + pita · midden up north + stokbrood · onderin panini (evt. flatbread) · Up north broodjes afbakken (indien nodig) — 30/185, 8 min · Brood van Menno afbakken voor verkoop: 1× spelt, 1× tarwe bruin, 1× meerzaden + 2–3 stokbroden. Stokbrood uit de vriezer, Menno-brood ligt ontdooid in de koelcel — 40/200, 8 min · 2 grote broden afbakken (ook voor toast) — Nederlands graan of horecabrood van Menno · Manden vullen: 1 spelt · 1 meerzaden · 1 tarwe bruin · 2–3 stokbroden · 2 grote broden

**KEUKEN — Afbakken — croissants** (4): 8 roomboter croissants afbakken — 180 °C, 20 min · 6 chocolade croissants afbakken — (instelling volgt) · 6 pistache croissants afbakken — (instelling volgt) · Gevulde croissants afbakken — via het croissant-programma van de oven

**KEUKEN — Warm eten** (2): Soep opwarmen · Kip en ei van gisteren in de oven — 30/185, tot warm

Totaal nieuw aan te maken: **42 templates** (44 uit de lijst minus 2 samengevoegde juicer/chai-taken), plus 2 verplaatsingen en 1 vervanging.

## Technisch

- Categorie-rijen via `INSERT` in `foh_category_order` (location West, 4 fases × 8 nieuwe categorieën) plus `UPDATE` van `sort_order` voor bestaande categorieën.
- Nieuwe templates via de insert-tool: `location='West'`, `phase='open'`, `repeat_type='daily'`, `is_active=true`, `priority=2`, `department` per sectie, `sort_order` per 10 oplopend, `category` zoals hierboven.
- Verplaatsingen: `UPDATE foh_daily_templates SET category='Machines & klaarzetten'` voor de twee bar-taken; `is_active=false` voor "Tafels schoonmaken (binnen + buiten)".
- De DB-trigger `create_task_from_new_template` maakt de taken meteen voor vandaag aan; vanaf morgen loopt het via de dagelijkse reset.
- Geen frontend-wijzigingen nodig: secties en categorie-volgorde komen uit de database.

## Verificatie na uitvoering

1. Query: West open-fase telt de nieuwe categorieën met de juiste `department` en `sort_order`.
2. `/taken-bediening` West toont Binnenkomst bovenaan in Samen, Apparatuur aan bovenaan in Keuken.
3. Geen taak met `department='voorkant'` of ontbrekende categorie-rij.
