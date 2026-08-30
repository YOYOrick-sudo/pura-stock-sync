# Gerechten met allergenen — Keuken → Gerechten → categorie Zoet

Gerechten zijn iets anders dan recepten: een gerecht is wat de gast koopt, met de allergenen die erin zitten. Recepten blijven ongemoeid.

## Wat je krijgt

Nieuw scherm **Keuken → Gerechten** (`/kitchen/gerechten`):

- Categorietabs bovenaan, nu alleen **Zoet** (later makkelijk Hartig/Dranken erbij).
- Binnen Zoet twee blokken zoals in je lijst: **Standaard assortiment** en **Specials**.
- Per gerecht: naam, prijs (als die bekend is) en de allergeen-labels als chips.
- Zoekbalk bovenaan — typ "brownie" en je hebt hem meteen. Bedoeld om aan de bar/kassa in twee tellen te beantwoorden: "zit hier noten in?"
- Toevoegen/bewerken via één dialoog met aanvinkbare labels (grote tikdoelen, tablet-proof).
- Oranje markering **"nog te controleren"** bij de rijen die in de PDF leeg of met vraagtekens stonden.

## Labels — exact zoals jouw lijst

Gluten · Zuivel · Vegan · Ei · Haver · Pinda's · Sesam · Soja · Walnoot · Amandel · Hazelnoot · Suiker · Pistache

Vegan wordt als groen dieetlabel getoond, de allergenen rood, Suiker/Haver neutraal — zodat je in één blik ziet wat een waarschuwing is en wat informatie.

## Data uit de PDF

Alle ~55 producten worden overgenomen, inclusief de prijzen die nu in de namen staan (bijv. "Espresso brownie 3,80" wordt naam "Espresso brownie" + prijs 3,80).

Als "nog te controleren" komen erin: Osawa Cake, Espresso Dadel Taart, Pruimen Tulband, Earl grey - zuidvruchten cake, Perentaart (alleen vraagtekens), en Haver zuidvruchten (glutenkolom onduidelijk: "Haver"). Typefouten uit de lijst worden netjes overgenomen: "Raberber & kokos taart" → "Rabarber & kokos taart", "Banaan amdel muffin" → "Banaan amandel muffin", "No bake wiite c cheesecake" → "No bake witte choco cheesecake", "Madelaine" → "Madeleine".

## In de praktijk

- Wie: bediening en keuken, op tablet of telefoon, midden in een gesprek met een gast. Daarom zoeken vóór bladeren.
- Wat verandert er: de papieren/PDF-lijst vervalt. Wijzigt een recept, dan past de keuken het gerecht hier aan — één plek.
- Risico: een gerecht dat niet in de lijst staat of niet is bijgewerkt geeft verkeerde info aan een gast. Daarom staat "nog te controleren" duidelijk in beeld en niet stilletjes als "geen allergenen", en tonen we onderaan altijd de zin dat bij twijfel het etiket/de keuken leidend is.
- Over een maand: specials wisselen. Gerechten worden gearchiveerd, niet verwijderd, met een filter "Ook gearchiveerde tonen".

## Technisch

- Migratie: tabel `public.gerechten` (naam, categorie default 'Zoet', groep 'standaard'|'special', prijs numeric null, labels text[], gecontroleerd boolean default true, notitie, is_gearchiveerd, sort_order, vestiging null = beide, created_at/updated_at + trigger). GRANT voor `authenticated` (lezen/schrijven) en `service_role`; RLS aan met lezen voor alle ingelogde gebruikers en schrijven voor manager/owner via `has_role`. Geen anon-toegang.
- Data-insert van de PDF-rijen via een aparte data-stap na de migratie.
- Frontend: `src/lib/gerecht-labels.ts` (labelcodes + kleurgroep), hook `src/hooks/useGerechten.ts` (TanStack Query, CRUD), pagina `src/pages/kitchen/Gerechten.tsx` en `src/components/kitchen/GerechtDialog.tsx`. Route in `App.tsx` achter `ProtectedRoute`, item "Gerechten" in de keuken-sectie van `AppSidebar.tsx` en in `KitchenMenu`. Bestaande design-tokens, geen nieuwe libraries.
