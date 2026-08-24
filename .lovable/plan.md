# Mise-en-place lijst (MEP) — plan v2

De basis uit v1 blijft: recept-of-vrije-taak, nullable `recipe_id`, drie prioriteiten, drie views, slepen met @dnd-kit zoals de takenlijst. Hieronder de herziening.

## A. Templates zijn core, geen sluitstuk

- Tabel `mep_templates`: vestiging, weekdag (of "dagelijks"), titel, `recipe_id` (nullable), aantal, eenheid, prioriteit, `sort_order`, `actief`.
- Een nieuwe dag wordt automatisch gevuld vanuit de templates van die weekdag. Geen knop.
- Elke dagregel kan met één actie ("elke donderdag") template worden — het templatebestand groeit vanuit de praktijk.

## B. Dagwissel & doorschuiven — automatisch, met ontdubbeling

- Onafgemaakte regels schuiven automatisch door, met badge "van gisteren" en teller ("2e dag").
- Ontdubbeling bij dagopbouw: doorgeschoven regel en templateregel met dezelfde `recipe_id` óf identieke titel worden één regel — hoogste prioriteit wint, aantallen niet optellen (doorgeschoven regel wint), badge blijft.
- 3+ dagen doorgeschoven krijgt aparte markering.

## C. Realtime sync tussen tablets

- Realtime-subscription op `mep_planning` per vestiging + dag, bovenop de React Query optimistic updates.
- Laatste schrijver wint per veld; afvinken is idempotent.

## D. Gedeeld keukenaccount

- Gedeeld, permanent ingelogd account per vestiging. Sessie mag niet verlopen — dat is al zo geregeld in deze app (`persistSession`, `autoRefreshToken`, IndexedDB-opslag van de sessie).
- RLS in lijn met `foh_tasks`: lezen/schrijven binnen eigen vestiging; GRANTs meeleveren.
- Gecheckt: `foh_employees` bevat nu 4 namen (West: 1, Midsland: 3) — het keukenteam staat er dus nog niet in. We gebruiken deze tabel wél (geen tweede personentabel), voegen een kolom `afdeling` toe (bediening/keuken) en zetten het keukenteam van West erin als onderdeel van stap 1.

## E. Bestellingen-koppeling niet stilletjes breken

`titel` wordt verplicht, dus `create_mep_from_order` moet in dezelfde migratie mee: productnaam als titel, ook wanneer er geen recept matcht. Let op het tweede breukpunt: die functie gebruikt `ON CONFLICT (date, location, recipe_id)`. Met een nullable `recipe_id` werkt die unieke index niet meer betrouwbaar — vervangen door een unieke index op (date, location, lower(titel)) waar `deleted_at is null`, en de functie daarop aanpassen. Beide paden expliciet testen.

## F. Historie bewaren

- Afgeronde dagen worden nooit verwijderd; verwijderen is soft-delete (`deleted_at`).
- `completed_at` en `completed_by` altijd vullen.
- Doel: later per vestiging zien wat hoe vaak op de lijst staat, op welke weekdag, en hoe vaak het doorschuift.

## G. Slimmigheden zonder AI

1. Suggestie-chips boven het zoekveld: 5 regels die de afgelopen 4 weken het vaakst op deze weekdag stonden en vandaag nog ontbreken. Eén tik = toegevoegd.
2. Deelvoortgang per regel: tik op het aantal telt op ("3 van 5 bakken"); klaar bij vol aantal.
3. Voortgangsbalk per dag en per persoon.
4. Doorschuif-teller als vroege signalering.

## H. Werkview — tablet

- Grote regels, afvinkdoel minimaal 56px, filter "mijn naam" met één tik, zoekveld bovenaan.
- Wake-lock zolang de werkview open staat.
- Geen swipe als enige weg naar een actie.

## I. Datamodel (delta t.o.v. v1)

`mep_planning`:
- `recipe_id` nullable; `titel` verplicht (receptnaam bij receptregels)
- `prioriteit` (1/2/3), `aantal` (numeric), `eenheid`, `sort_order`, `sort_order_persoon`
- `employee_id` → `foh_employees`
- `aantal_klaar` (numeric, default 0)
- `completed_at`, `completed_by`, `deleted_at`
- `doorgeschoven_van` (date, nullable), `doorschuif_teller` (int, default 0)
- `bron`: handmatig / template / bestelling / doorgeschoven
- unieke index (date, location, lower(titel)) waar `deleted_at is null`, ter vervanging van de huidige recipe_id-constraint

`mep_templates`: zoals onder A.

`sort_order` in stappen van 10, met renumber-routine wanneer buren te dicht op elkaar komen.

## J. Bouwvolgorde

1. Migratie: kolommen, `mep_templates`, `afdeling` op `foh_employees`, RLS + grants, unieke index, `create_mep_from_order` herschrijven, soft-delete
2. Hook + view "Alles": toevoegen (recept-of-vrij), afvinken met deelvoortgang, slepen, prio, automatische dagopbouw uit templates + doorschuiven + ontdubbeling
3. Realtime sync
4. Werkview + voortgangsbalk
5. View "Per persoon" met eigen volgorde
6. Suggestie-chips + "opslaan als template"

Stap 1–4 is de lanceerbare kern voor West; 5–6 mag later.

## K. Keuzes

- West eerst, Midsland zodra week 1 loopt (datamodel is al per vestiging).
- Medewerkers uit `foh_employees` (keukenteam toevoegen in stap 1), geen vrije naam-invoer.

## Bewust niet

Automatisch vullen op reserveringen, weer, verkoop of voorraad; AI-voorspellingen. Dat komt later, gevoed door de historie uit F.
