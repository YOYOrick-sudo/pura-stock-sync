# Plan: blok "Advies" op het Bestelbord

## Wat het in de praktijk doet
De bot zet per bestelronde een drankadvies klaar voor een leverdag. Bovenaan het Bestelbord staat een ingeklapt blok "Advies (nog niet besteld)". Per regel tik je "Op bord zetten"; dan ontstaat een gewone open bordregel. Er wordt nooit automatisch iets op het bord gezet of besteld. Kijkt niemand naar het advies, dan werkt het bord precies zoals nu. Advies van een verstreken leverdag verdwijnt uit beeld, maar blijft bewaard als historie.

## 1. Database (één migratie, alleen toevoegen)
- Nieuwe tabel `bestel_advies` met precies de velden uit de opdracht.
- Vestiging: CHECK in ('West','Midsland'). Op `bestel_signalen` zelf staat geen vestigingscontrole; daar loopt het via RLS met `heeft_vestiging`. Die RLS volg ik hier ook.
- `updated_at` via de bestaande trigger `set_updated_at`.
- Unique (vestiging, leverdag, leverancier, artikel) met `NULLS NOT DISTINCT`, zodat er ook geen dubbele regels zonder leverancier kunnen ontstaan.
- Index op (vestiging, leverdag).
- Rechten:
  - authenticated: `GRANT SELECT` en `GRANT UPDATE (op_bord_regel_id)` (alleen die ene kolom).
  - service_role: `GRANT ALL`.
  - anon: niets.
- RLS:
  - Policy lezen: `heeft_vestiging(auth.uid(), vestiging)`.
  - Policy update: dezelfde voorwaarde, alleen voor authenticated.
  - Geen insert- of delete-policy voor gebruikers.
- Databasefunctie `bestelbot_advies_vervangen(p_vestiging text, p_datum date, p_leverdag date, p_regels jsonb)`:
  - SECURITY DEFINER, search_path public.
  - **Alleen service_role mag hem uitvoeren**: `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` en `GRANT EXECUTE ... TO service_role`.
  - Doet de koppeling en de vervanging in één transactie. Vanuit de edge function kan dat niet als één geheel.
  - Koppeling per regel:
    1. Artikel: meegestuurd `artikel_id`, anders exacte naam (hoofdletterongevoelig) in `artikelen`.
    2. Leverancier: exacte naam (hoofdletterongevoelig) in `leveranciers`.
    3. Vorm: meegestuurd `artikel_vorm_id`, anders de niet-gearchiveerde vorm van die vestiging met dezelfde leverancier, anders de standaardvorm.
    4. Niet gevonden: het veld blijft leeg en de regel blijft gewoon staan.
  - Vervangen:
    1. Onthoud `op_bord_regel_id` per (artikel, leverancier), hoofdletterongevoelig.
    2. Verwijder de oude regels van die vestiging en leverdag.
    3. Voeg de nieuwe regels in en zet de onthouden ids terug.
  - Geeft terug: aantal regels en aantal gekoppelde regels.

## 2. Edge function `bot-bestelbord`
- Nieuwe POST-actie `advies`, met dezelfde Bearer-check, audit en limiet als de andere acties.
- De invoer wordt gecontroleerd:
  - vestiging West of Midsland;
  - datum en leverdag als YYYY-MM-DD;
  - `regels` als lijst van maximaal 500;
  - artikel niet leeg, hoeveelheid ≥ 0;
  - de overige velden optioneel, ook `artikel_id` en `artikel_vorm_id` (uuid).
- Roept alleen de nieuwe functie aan en antwoordt `{ok:true, aantal, gekoppeld}`.
- GET, bestellen, koppel en import_historie veranderen niet. Er wordt geen bordregel gemaakt en niets besteld.
- Daarna deploy ik de functie opnieuw en test ik dat een ongeldig token 401 geeft.
- Het contract komt in `docs/bestelbot-fundament.md`.

## 3. UI op het Bestelbord
- **Ophalen:** een nieuwe hook `useBestelAdvies(vestiging)` in `useBestelbord.ts`.
  - Leest de vroegste leverdag op of na vandaag voor die vestiging, met alle regels van die dag.
  - Realtime, net als het bord.
- **Blok bovenaan:**
  - Inklapbaar en standaard dicht. Kop: "Advies voor <leverdag> · n regels".
  - Zonder advies: "Nog geen advies".
  - Gegroepeerd per leverancier. Per regel aantal + eenheid + artikel, klein grijs de reden, en een badge "onzeker" waar dat geldt.
  - Regels met hoeveelheid 0 staan onderaan, ingeklapt onder "Laag verbruik".
- **Knop "Op bord zetten"** (44px):
  - Volgt hetzelfde pad als handmatig toevoegen. Staat dezelfde naam al open op het bord, dan wordt het aantal opgehoogd.
  - Bij handmatig toevoegen vraagt een toast "+x erbij" om bevestiging. Bij advies hoog ik direct op, met een toast en "Ongedaan maken", zodat het één tik blijft.
  - Met vorm: artikel, vorm, eenheid en leverancier komen uit die vorm, net als bij kiezen in de keuzelijst.
  - Zonder vorm: eenheid en leverancier uit het advies (eenheid standaard 'stuks').
  - Daarna wordt `op_bord_regel_id` gezet op de nieuwe of opgehoogde bordregel. De adviesregel toont dan "op bord ✓".
  - De bordregel krijgt nooit status 'besteld'.
- **Kleine aanpassing aan het toevoegen:** het geeft voortaan het id van de nieuwe regel terug (`.select('id')`). Het gedrag voor de gebruiker verandert niet.

## 4. Testen
- **Preview:** ingelogd als jouw account, West en Midsland.
  - Het blok is zichtbaar en inklapbaar, met de lege staat "Nog geen advies".
  - Toevoegen en bewerken werken nog.
  - Besteld en geleverd test ik met een eigen testregel, die ik daarna weer verwijder.
- **Databasefunctie:** een tijdelijk testadvies.
  - Koppeling controleren.
  - Opnieuw sturen met dezelfde regel: `op_bord_regel_id` blijft behouden.
  - "Op bord zetten" in de preview. Daarna verwijder ik de testregel op het bord en het testadvies weer, en meld ik dat.
- **Typecheck en build.**
- **Niet te testen:** de bot-aanroep met het echte token.

## 5. Horeko-leesrechten
- Op de vier Horeko-tabellen staan RLS en leesregels. Tabelrechten voor anon, authenticated en service_role ontbreken echter; dat heb ik vandaag gecontroleerd. Daardoor weigert de database elke vraag ("permission denied") nog voordat de leesregel wordt bekeken.
- In dezelfde migratie komen alleen leesrechten. Geen `GRANT ALL`, niets voor anon:

```sql
GRANT SELECT ON public.horeko_artikelen, public.horeko_recepten, public.horeko_recept_regels, public.horeko_gerecht_verbruik TO authenticated;
GRANT SELECT ON public.horeko_artikelen, public.horeko_recepten, public.horeko_recept_regels, public.horeko_gerecht_verbruik TO service_role;
```

## Risico's
- **Andere naam bij de bot:** stuurt de bot een iets andere artikel- of leveranciersnaam, dan koppelt die regel niet. Hij staat er dan wel, maar zonder prijs en vorm. Het antwoord `gekoppeld` laat dat zien.
- **Leverdag in het verleden:** zo'n advies wordt niet getoond.
- **Opnieuw sturen voor dezelfde leverdag:** vervangt het oude advies. Regels die al op het bord stonden houden hun vinkje.
