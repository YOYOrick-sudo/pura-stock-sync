# Keuken opschonen + MEP sneller maken

Vier losse punten, in deze volgorde te bouwen.

## 1. Modules verbergen (beide vestigingen)

Uit de zijbalk halen: **Voorraadstand**, **Onderweg** en **Ingrediënten**.
De routes en data blijven bestaan (Ingrediënten wordt intern gebruikt door recepten/allergenen, Onderweg door de bestelketen) — alleen de zijbalk-ingangen verdwijnen, zodat het team niet in halve schermen belandt. Terughalen is later één regel.

## 2. Recepten koppelen aan mise-en-place

Nu verschijnt een recept alleen in "Taak toevoegen → Recept/methode" als het én een halffabricaat-methode heeft én aan staat voor de vestiging. Daardoor voelt het alsof recepten er niet in zitten.

Aanpassing in de keuzelijst:
- Twee blokken: **Met methode** (zoals nu, inclusief eenheid en houdbaarheid) en **Overige recepten van deze vestiging** (alles wat aan staat, zonder methode).
- Kies je een recept zonder methode, dan komt het als MEP-taak op de lijst met naam, categorie en een vrij aantal; afronden gebeurt zonder batch/sticker (die vraagt om een methode).
- Vanaf de taak op de MEP-lijst kun je het recept openen om het te lezen tijdens het maken.

Praktijk: de kok ziet alles wat hij kan maken op één plek, ook nieuwe recepten waarvoor nog geen methode is ingevuld. Wil je er wél stickers/batches uit, dan vul je alsnog een methode in — dat blijft de manager-actie.

## 3. Zes vaakst gemaakte MEP-taken als snelknoppen

Bovenin het "Taak toevoegen"-scherm komt een rij van maximaal zes tegels, net als bij Stickers: één tik en de taak staat op de lijst van vandaag (met het laatst gebruikte aantal als voorstel).

- Telling per vestiging, gebaseerd op de laatste 90 dagen afgeronde/aangemaakte MEP-taken, gegroepeerd op methode of taaknaam.
- Wordt live berekend uit `mep_taken`, dus geen extra invoer en geen lijst die volloopt.
- Nieuwe vestiging of stille periode: minder dan zes tegels, of geen rij — dan gewoon de zoeklijst.

## 4. Stickermodule: tekstveld direct open met lijst

Bij het openen van Snel printen staat de cursor al in het productveld (dat gebeurt al) maar de suggestielijst klapt niet zichtbaar open. Die gaat voortaan direct open met "Meest gebruikt", zodat je op de iPad meteen kunt aantikken zonder eerst te tikken in het veld. Wegtikken sluit de lijst zoals nu.

## Technisch

- `src/components/AppSidebar.tsx`: drie nav-items verwijderen (routes ongemoeid).
- `src/hooks/useMepTaken.ts`: `useMepRecepten` uitbreiden met recepten zonder methode (via `recept_locaties` + `recipes`), plus nieuwe hook `useMepFavorieten(vestiging)` die de top 6 uit `mep_taken` haalt (SQL-aggregatie via een read-only RPC of een gefilterde select over 90 dagen).
- `src/components/kitchen/MepTaakToevoegen.tsx`: favorietenrij, twee gegroepeerde blokken in de keuzelijst, `methode_id` optioneel maken in de insert.
- `src/components/kitchen/StickerProductCombobox.tsx`: popover standaard open bij mount wanneer `autoFocus` aan staat.
- Geen schemawijziging nodig, behalve eventueel één SECURITY INVOKER-RPC voor de top 6 (alleen lezen, respecteert bestaande RLS).
