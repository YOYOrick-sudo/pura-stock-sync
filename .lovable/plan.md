# Stap 1c — één voorraadmodule, één bestelflow

1b is geaccepteerd. Nu vervalt de dubbele flow: het oude "Nieuwe bestelling"-scherm en de nieuwe keten worden één module. Principe: **automatisch is de standaard, handmatig is de uitzondering**.

## Rechten (vastgelegd)

| Actie | Wie |
| --- | --- |
| Tellen / "Huidig" invullen | alle ingelogde teamleden |
| Ontvangst vastleggen (inkoop én intern) | alle ingelogde teamleden |
| "Gemarkeerd als besteld" bij kanaal portal of mail | alle ingelogde teamleden |
| **Intern versturen** ("Stuur naar Midsland") | alle ingelogde teamleden |
| **Extern versturen** (API-klik naar de leverancier) | manager/owner |
| Extra bestellen (ad-hoc regel op de route) | alle ingelogde teamleden |
| Order handmatig aanmaken / annuleren | manager/owner |

Kanaal `api` kent geen handmatige "besteld"-knop: die status komt uitsluitend uit de edge function na een geslaagde verzending, voor geen enkele rol direct te zetten.

Dit wordt in de database afgedwongen, niet alleen in de UI: een guard-trigger op `inkoop_orders` en `inkoop_order_regels` laat teamleden alleen ontvangst-velden en de toegestane statusovergangen schrijven; alles daarbuiten blijft manager/owner. Ad-hoc regels lopen via een `SECURITY DEFINER`-RPC, zodat vrij orders aanmaken manager-werk blijft. De hooks houden hun `.select('id')`-controle, zodat stil falen onmogelijk blijft.

## Zijbalk en routes

Eén module **Voorraad** met drie items:

| Nieuw | Wat het is |
| --- | --- |
| `/voorraad` | **Laatst geteld** per artikel/route, met datum — bewust niet "Voorraad" genoemd |
| `/voorraad/bestellen` | Dashboard met de routes + tellen + voorstel + verzenden |
| `/voorraad/ontvangen` | Alles wat onderweg is: inkooporders én interne orders, ontvangst vastleggen |

De kolomkop op `/voorraad` is **Laatst geteld** met de teldatum erbij. Tot stap 2 draait is een getelde stand geen actuele voorraad; het team mag niet leren vertrouwen op een getal dat het nog niet waarmaakt.

**Vervalt volledig** (route weg uit `App.tsx`, bestand verwijderd):

- `/bestelronde` → opgaat in `/voorraad/bestellen`
- `/internal-orders` → splitst in Bestellen (aanvragen) en Ontvangen (behandelen)
- `/midsland-bestellingen` (legacy `MidslandOrders.tsx`) → vervalt; behandelen zit in Ontvangen
- `/inkooporders` → splitst in Bestellen (verzenden) en Ontvangen

Oude paden krijgen één redirect naar de nieuwe plek zodat opgeslagen tabbladen op tablets niet op een 404 komen; geen dubbele schermen erachter.

## Bestellen = dashboard, geen formulier

Bij binnenkomst staat er per route een kaart met één status:

```text
Kooyman        besteldag vandaag   [ te tellen ]        12 artikelen
Midsland       levert morgen       [ voorstel klaar ]   7 regels
Bidfood                            [ verzonden ]        ma 12:00 besteld
```

Routes van vandaag (besteldag/leverdag) staan bovenaan; de rest staat eronder onder "Overige routes".

- **te tellen** → knop opent de tel-stap
- **voorstel klaar / concept** → knop opent het voorstel
- **verzonden / onderweg** → link naar Ontvangen

Het scherm wordt gebouwd op de eindtoestand van stap 3: het voorstel staat er al. Zolang de cron er niet is, draait dezelfde `rpc_genereer_bestelvoorstel` bij het openen van het dashboard. Idempotent, dus openen kan zo vaak als je wil.

### Hergeneratie overschrijft nooit handwerk

`inkoop_order_regels` en `internal_order_items` krijgen `bron` (`systeem` | `handmatig`) en `handmatig_aangepast` (boolean).

- De RPC vervangt bij een bestaand concept **alleen** regels met `bron = 'systeem'` en `handmatig_aangepast = false`.
- Handmatige regels en met de hand aangepaste aantallen blijven staan; voor een artikel dat al zo'n regel heeft maakt de RPC geen tweede regel.
- Aantal wijzigen in de UI zet `handmatig_aangepast = true`; een ad-hoc regel krijgt `bron = 'handmatig'`.
- Klikronde-testgeval: aantal aanpassen + ad-hoc regel toevoegen → dashboard opnieuw openen (RPC draait) → beide ongewijzigd.

### Tel-stap = het oude patisserie-scherm

De vertrouwde lijst blijft: artikel, **Aanvullen tot**, **Huidig** invullen, grote tikdoelen, per route gefilterd, in telvolgorde. Alleen de bestemming verandert: "Huidig" schrijft nu een `telronde_regels`-regel in plaats van localStorage. Er is geen tweede telplek meer.

### Voorstel en verzenden — één scherm, één knop

Het voorstel toont de regels (aanpasbaar aantal) plus de blokken "niet geteld" en "geen leverancier gekoppeld". Onderaan staat precies één primaire knop:

- portal/mail: **Kopieer bestellijst** (daarna verschijnt "Gemarkeerd als besteld"; mail heeft daarnaast "Concept-mail openen")
- api: **Verstuur naar <leverancier>** — manager/owner; voor teamleden zichtbaar-maar-uit met "een manager verstuurt deze bestelling"
- intern: **Stuur naar <vestiging>** — voor iedereen

Geen instellingen, geen tabs, geen zijstappen op dit scherm. Ontbrekende config blokkeert met één zin in gewone taal.

### Extra bestellen — elke route

Knop **Extra bestellen** op het dashboard: eerst leverancier of interne route kiezen (routes van vandaag bovenaan), dan artikel en aantal. De regel gaat op het bestaande concept van die route; bestaat dat niet, dan wordt het aangemaakt met de eerstvolgende leverdatum uit de besteldagen — of zonder datum met zichtbare melding als die ontbreekt. Bestaat de regel al, dan wordt het aantal opgehoogd; geen dubbele regels.

## Ontvangen

Eén lijst met alles wat onderweg is, inkoop en intern door elkaar, gesorteerd op verwachte leverdatum. Per regel ontvangen aantal; afwijking zichtbaar; order wordt `ontvangen` of `deels_ontvangen` (intern: `delivered` / `partially_delivered`). Nog steeds geen voorraadmutaties — dat is stap 2.

## De 8 bestaande interne orders

Gemeten: 6 met status `approved` en 2 met `delivered`, allemaal West → Midsland. Die blijven staan en worden niet verplaatst of verwijderd:

- de 6 `approved` verschijnen in het nieuwe Ontvangen-scherm bij Midsland en bij West als "onderweg";
- de 2 `delivered` komen in de historie-weergave.

Regels zonder `artikel_id` (oude vrije tekst) blijven leesbaar via hun snapshot `product_name` / `unit`; ze worden niet stil aan een artikel gekoppeld. Bestaande regels krijgen `bron = 'handmatig'`, zodat de RPC ze nooit opruimt.

## Naam in plaats van gebruikers-id

`requested_by` / `approved_by` worden opgezocht in `profiles` en als naam getoond (val terug op "onbekend"). Geldt in Ontvangen en in de orderhistorie.

## Architectuurdocument

`mem://architecture/voorraadketen-datamodel-v2` krijgt een sectie **1c — bedieningsmodel**: één voorraadmodule met drie schermen, tellen bestaat alleen als tel-stap binnen een bestelronde, `bron`/`handmatig_aangepast` als bescherming tegen hergeneratie, ad-hoc regels via de concept-order van elke route, en de rechtenverdeling hierboven (extern verzenden = manager/owner, intern verzenden, ontvangen en besteld-markeren = iedereen; `api` + `besteld` alleen door de edge function).

## Volgorde van bouwen

1. Migratie: `bron` + `handmatig_aangepast`, guard-triggers per rol en kanaal, ad-hoc RPC, aangepaste `rpc_genereer_bestelvoorstel`.
2. Nieuwe routes + zijbalkmodule, oude routes en bestanden weg.
3. `/voorraad/bestellen` dashboard + tel-stap.
4. Voorstel/verzendscherm, één knop per kanaal.
5. Extra bestellen voor elke route.
6. `/voorraad/ontvangen` inkoop + intern samen, met namen.
7. Klikronde West-staff, Midsland-staff en manager; verslag als gebruikersflow, inclusief het hergeneratie-testgeval.

## Opruimbevestiging

Na de ombouw: geen testleveranciers of ZZTEST-records in de database (met query aangetoond), geen `MidslandOrders.tsx`, `Bestelronde.tsx`, `Inkooporders.tsx`, `InternalOrders.tsx` of `OrderDashboard.tsx` in de repo, geen localStorage-tellingen meer in gebruik, en geen zijbalk- of routeverwijzing naar de vervallen paden behalve de redirects.

## Risico's

- Lopende localStorage-tellingen vervallen bij de overstap — akkoord, met melding in de UI.
- Zonder leveranciersdata blijft de leverancierskant leeg; het dashboard toont dan alleen interne routes plus een verwijzing naar Instellingen → Voorraadketen.
- Ruimere ontvangst-rechten betekenen dat een teamlid een order kan afsluiten; afwijkingen blijven per regel zichtbaar en de historie blijft bewaard.
