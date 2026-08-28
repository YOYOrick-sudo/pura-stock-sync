# Stap 1c afronden — tellen eindigt in een voorstel, en het voorstel kan weg

Drie gaten dichten, dan één klikronde die de hele flow als gebruiker bewijst.

## 1. Telronde afronden binnen de telflow

Nu blijft de telronde op `open` staan; `rpc_genereer_bestelvoorstel` kijkt alleen naar rondes met status `afgerond`, dus er ontstaat nooit een voorstel. De afrondstap komt in het telblok zelf, geen apart scherm.

- Onder de tellijst staat één primaire knop **Klaar met tellen** (grote tikbalk, blijft in beeld op tablet). Erboven één regel: "12 van 16 geteld — de rest komt in 'niet geteld'."
- De knop rondt de ronde af en draait meteen het voorstel; het resultaat verschijnt op dezelfde plek onder "Wat wordt besteld", met de blokken "niet geteld" en "geen leverancier gekoppeld".
- Afronden mag met niet-getelde artikelen. Geen blokkade, geen bevestigingsdialoog.
- **Deels tellen:** een open ronde blijft gewoon staan. Elke invoer is direct opgeslagen (zoals nu), dus een weggelegde tablet verliest niets. De routekaart toont dan "Telling bezig — 7 van 16", en openen zet je verder in dezelfde ronde. Niets wordt automatisch afgerond.
- **Opnieuw tellen na afronden:** de afgeronde route toont "Geteld om 15:10" met een kleine knop "Verder tellen" die de ronde terugzet op open; bij de volgende afronding draait het voorstel opnieuw, en handwerk blijft beschermd door `bron`/`handmatig_aangepast`.

De bestaande `useAfrondenEnVoorstel` (in `useBestelronde.ts`) wordt hiervoor gebruikt; hij bestaat al maar wordt nergens aangeroepen.

## 2. Verzendknoppen per kanaal — één primaire knop

Onderaan het voorstel, precies één primaire actie, afhankelijk van het kanaal van de route:

| Kanaal | Knop | Wie |
| --- | --- | --- |
| intern | **Stuur naar Midsland** | elk teamlid |
| portal | **Kopieer bestellijst** → daarna **Gemarkeerd als besteld** | elk teamlid |
| mail | **Kopieer bestellijst** → daarna **Gemarkeerd als besteld**; secundair "Concept-mail openen" | elk teamlid |
| api | **Verstuur naar \<leverancier\>** | manager/owner; teamlid ziet de knop uitgeschakeld met "een manager verstuurt deze bestelling" |

- Kopiëren gebruikt de bestaande `bestelTekst()`; na kopiëren verschijnt de markeer-knop, zodat niemand per ongeluk "besteld" zet zonder de lijst te hebben gehad.
- Api roept de bestaande edge function `bestelling-versturen-api` aan; die zet zelf `besteld`. Mislukt het, dan komt `laatste_fout` als gewone zin in beeld met "Probeer opnieuw".
- Ontbrekende leverdatum of ontbrekende api-configuratie blokkeert met één zin, geen instellingenscherm in de flow.

## 3. Namen in plaats van id's

De `profiles`-tabel is op dit moment leeg (0 rijen), dus elke aanvraag toont nu "Onbekend" — ook waar `requested_by` wél gevuld is. Er komt een `SECURITY DEFINER`-functie `rpc_namen_voor_users(uuid[])` die per gebruiker naam uit `profiles` teruggeeft en terugvalt op het e-mailadres uit de authenticatie. Onderweg en de orderhistorie gebruiken die; alleen als beide ontbreken staat er "Onbekend".

## 4. Klikronde als bewijs

Met tijdelijke testleveranciers, één per kanaal (portal, mail, api), inclusief besteldag, artikelkoppeling en api-config. Die worden na afloop hard verwijderd en met query aangetoond dat ze weg zijn.

Doorlopen als West-teamlid, Midsland-teamlid en manager:

1. tellen (deels), tablet "weglegen", terugkomen en verder tellen
2. Klaar met tellen → voorstel verschijnt, met blok "niet geteld"
3. aantal aanpassen + extra regel toevoegen → dashboard opnieuw openen (voorstel draait) → beide ongewijzigd
4. portal: kopiëren → gemarkeerd als besteld; mail idem; api als teamlid (knop uit) en als manager (verstuurt)
5. intern versturen als teamlid → Midsland ziet de aanvraag met de naam van de aanvrager
6. ontvangst afvinken, deels en compleet

Verslag per rol als gebruikersflow, met de statussen die de database daarna laat zien.

## Technisch

- `src/pages/voorraad/Bestellen.tsx`: afrondknop + voortgangsregel + "Verder tellen"; verzendblok per kanaal; melding bij ontbrekende configuratie.
- `src/hooks/useVoorraadModule.ts`: afronden koppelen, `useInkoopVersturen` (edge function), `useInkoopBesteldMarkeren`, namen-lookup in `useOnderweg`.
- Migratie: `rpc_namen_voor_users(uuid[])` als `SECURITY DEFINER` met `search_path = public`, uitvoerrecht voor `authenticated`.
- Guards blijven leidend: de knoppen tonen wat mag, de trigger op `inkoop_orders` beslist. Api + `besteld` blijft uitsluitend de edge function.

## Risico's

- Testleveranciers raken de echte database. Ze krijgen een herkenbare naam met `ZZTEST`, staan op West, en worden in dezelfde ronde verwijderd inclusief orders en regels; opruiming wordt met query aangetoond.
- "Verder tellen" na een afgerond voorstel kan systeemregels vervangen. Dat is de bedoeling; handmatige regels en aangepaste aantallen blijven staan, en dat is precies het testgeval uit punt 3.
