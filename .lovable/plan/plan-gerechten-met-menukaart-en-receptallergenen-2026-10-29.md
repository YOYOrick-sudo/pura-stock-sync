# Plan: Gerechten met menukaart en receptallergenen

## Praktijk
Het keukenteam bekijkt op telefoon of iPad de gerechten, kaartomschrijving, prijzen en allergenen. Er is geen nieuwe invulafspraak: bestaande gecontroleerde labels blijven leidend. Niet gecontroleerde gerechten blijven bij een allergenenfilter onder **Niet te garanderen — eerst navragen in de keuken**; de keuken moet deze eerst controleren. Als receptinformatie ontbreekt of laden mislukt, wordt dit expliciet getoond, nooit als veilig. Er ontstaan geen nieuwe dagelijkse lijsten of gegevens.

## Wijzigingen
- Breid de zeven categorieën uit en voeg een standaard uitgeschakelde schakelchip **Alleen op de kaart** toe.
- Toon kaartomschrijving, acht kaarttekens met uitleg via hover én tik, en alle prijsvarianten met hun namen.
- Haal per categorie één extra query op uit `v_gerecht_allergenen`, gekoppeld op `gerecht_id`. Geen berekeningen in de pagina.
- Behoud bestaande labels. Alleen bij lege labels: toon Nederlandse receptallergenen en mogelijke sporen, inclusief onvolledigheidsmelding of ontbrekende receptkoppeling.
- Behoud de veiligheidsselectie op gecontroleerde labels; berekende allergenen of kaarttekens maken een gerecht nooit veilig.

## Grenzen en risico
Alleen de drie genoemde bestanden en eventueel één klein keukencomponent wijzigen; geen migraties, gegevenswijzigingen, nieuwe libraries of publicatie. GerechtDialog en alle andere modules blijven ongemoeid. Grootste operationele risico is een ongecontroleerd gerecht als veilig lezen: deze komen bij een actief vrij-van-filter altijd in het navraagblok, ook wanneer berekende allergenen leeg zijn. Queryfouten krijgen een zichtbare melding met opnieuw proberen.

## Technisch
Categorie: UI + bestaande leesquery; geen rollen-, RLS- of schemawijziging. Kaartvelden blijven optioneel in het bestaande Gerecht-type zodat GerechtDialog en opslaan ongewijzigd werken. Hergebruik TanStack Query, Nederlandse allergenennamen en bestaande kleuren/componenten; tikdoelen minstens 44px.

## Controle
Controleer de zeven categorieën, kaartfilter aan/uit, prijzen, tik- en hover-uitleg, bronvoorrang en ontbrekende/onvolledige recepten. Test dat ongecontroleerde gerechten bij vrij-van-filter niet veilig worden, en dat het bestaande bewerkvenster blijft openen. Controleer desktop en iPad met een ingelogde sessie, plus foutmeldingen en query-aantallen.

<!-- Vorig plan hieronder behouden als referentie. -->
# Vorig plan: Besteld & levering (klein)

## Doel
Eén overzicht per vestiging: wat is besteld, wanneer komt het, en personeel vinkt "geleverd" af. Voorkomt open regels die blijven hangen en dubbel bestellen.

## Statussen (bestaand: open / besteld / vervallen)
```text
open ──bestellen──> besteld ──afvinken──> geleverd
                      │
                      ├─ niet geleverd ─> open  (opmerking blijft, bot neemt hem weer mee)
                      └─ deels geleverd ─> geleverd + nieuwe open regel voor restant
```
Keuze deels geleverd: originele regel = geleverd met het ontvangen aantal in de opmerking; restant wordt een **nieuwe open regel** (bron 'restant', verwijst naar origineel). Simpelst voor de bot: hij ziet gewoon een open regel.

## Datavelden (migratie-schets, alleen toevoegen, nullable)
`bestel_signalen`:
- `verwachte_levering date`
- `geleverd_op timestamptz`, `geleverd_door uuid`
- `levering_status text` CHECK in ('geleverd','niet_geleverd','deels') — laatste uitkomst
- `levering_opmerking text`
- `restant_van uuid` (FK naar bestel_signalen, ON DELETE SET NULL)
- status-CHECK uitbreiden met 'geleverd' (enige niet-puur-additieve stap; eerst bestaande CHECK controleren)
- Index (vestiging, status, verwachte_levering)

Default leverdatum (DB-functie `bestel_verwachte_levering(vestiging, leverancier_id, besteld_op)`):
1. eerstvolgende leverdag uit `leverancier_besteldagen` als ingevuld;
2. anders besteld_op (Europe/Amsterdam) + 1 dag;
3. valt dat op een dichte dag van de vestiging (`mep_is_open`/`vestiging_opendagen`), dan doorschuiven naar de volgende open dag.
Een trigger vult dit bij overgang naar 'besteld' als het leeg is — geldt dus ook voor handmatig bestellen in de app.

RLS: bestaande policies (heeft_vestiging) dekken de nieuwe kolommen; geen nieuwe policies.

## Scherm (in bestaande Bestellijst, geen nieuwe module)
Nieuwe tab/sectie **"Onderweg"** naast de huidige lijst, zelfde stijl als MEP:
- **Vandaag te checken**: verwacht vandaag of eerder, niet afgevinkt. Te laat = rode badge "2 dagen".
- **Onderweg**: verwacht later.
- Gegroepeerd per leverancier + ordernummer; kop toont besteldatum en ordernummer, knop **"Alles geleverd"**.
- Per regel: rond vinkje (geleverd) en menu: "Niet geleverd" / "Deels geleverd" (kort aantal + opmerking).
- Afgevinkt: ingeklapt "Geleverd" met wie/wanneer, undo via toast.
- Bij handmatig "besteld" zetten: verwachte datum toont "morgen", aanpasbaar met één tik.
- Bij toevoegen op het bord: als hetzelfde artikel/naam onderweg is → melding "Al onderweg, verwacht do 30 okt" (waarschuwen, niet blokkeren).

## API-afspraak bot (bot-bestelbord)
**POST bestellen** (uitbreiding, achterwaarts compatibel):
```json
{ "vestiging":"West","actie":"bestellen",
  "regels":[{"id":"uuid","bestelreferentie":"K-123","verwachte_levering":"2026-10-30"}] }
```
`verwachte_levering` optioneel (YYYY-MM-DD, niet in verleden, max +30 dagen); ontbreekt → serverdefault. Antwoord per id ongewijzigd plus `verwachte_levering`:
`{"id":"…","status":"ok","verwachte_levering":"2026-10-30"}`. Idempotent zoals nu.

**GET** `?vestiging=West&status=besteld` (default `open`, andere waarden 400):
regels met id, naam, aantal, eenheid, leverancier_id/naam, bestelreferentie, besteld_op, verwachte_levering, `te_laat` (bool), `dagen_te_laat`. Bot meldt achterstand, bestelt niet opnieuw.

Open regels uit "niet geleverd"/restant krijgen in GET open extra `levering_opmerking` en `restant_van`, zodat de bot ziet dat het een herbestelling is.

Bot zet besteld pas na bevestiging leverancier (API-/webshop-ordernummer of na betaling door Yorick) — afspraak aan de botkant, server controleert alleen dat bestelreferentie gevuld is.

## Randgevallen
- **Handmatig besteld**: trigger vult morgen (of volgende open dag); besteld_via = 'handmatig'.
- **Midsland maandag dicht / weekend**: verwachte dag op dichte dag → volgende open dag; "te checken" toont pas op die open dag, telt niet als te laat tijdens dichte dagen.
- **Seizoen West dicht**: idem via openingsdagen; geen rode regels terwijl dicht.
- **Deels geleverd**: zie boven; restant direct terug op bestellijst.
- **Niet geleverd**: terug naar open, verwachte_levering leeg, opmerking zichtbaar op bord.
- **Per ongeluk afgevinkt**: undo; later terugzetten via menu (alleen naar 'besteld').
- **Regels zonder leverancier**: groep "Onbekende leverancier".
- **Oude besteld-regels zonder datum**: tonen onder "Onderweg — zonder datum", niet als te laat.

## Bewust weggelaten
Geen voorraadboeking bij levering, geen prijzen/facturen, geen pakbon-scan, geen notificaties (later n8n), geen leverancierportaal, geen automatische herbestelling door de app zelf, geen nieuwe module of menu-item.

## Test na bouw
Bun-tests voor de leverdatumregel (vandaag→morgen, zaterdag/maandag Midsland, leverdag leverancier). Met West- en Midsland-login: bestellen, afvinken, niet/deels geleverd, waarschuwing "al onderweg"; GET status=besteld met testregel.
