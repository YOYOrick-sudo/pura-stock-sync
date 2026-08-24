# Mise-en-place lijst (MEP) — voorstel

Een dag-planning per vestiging waarop staat wát er voorbereid moet worden, door wie, in welke volgorde. Regels kunnen wél of níet aan een recept hangen — zonder de receptendatabase te vervuilen.

## 1. Recept of los werk: hoe we het onderscheid maken

Een MEP-regel heeft twee bronnen:

- **Receptregel**: gekoppeld aan een bestaand recept (`recipe_id`). Titel, foto en THT komen uit het recept; klikken opent het recept.
- **Vrije taak**: geen recept, alleen een eigen titel (`titel`) — "Kip vacumeren", "Kip lunch bereiden", "Zout aanvullen".

De koppeling is optioneel: de MEP-lijst slaat de titel altijd zelf op. Er wordt dus nooit een "nep-recept" aangemaakt om iets op de lijst te krijgen. Bij toevoegen kies je in één zoekveld: bestaand recept selecteren, of "Los: <wat je typt>" als vrije taak.

Wordt een vrije taak later tóch een echt recept? Dan kun je hem in het detailpaneel alsnog aan een recept koppelen.

## 2. Prioriteit

Drie niveaus — meer wordt in de praktijk nooit consequent gebruikt:

- **Must** (rood) — moet vandaag af, anders draaien we vast
- **Normaal** (neutraal) — standaard
- **Als er tijd is** (grijs/blauw) — mag doorschuiven

Sorteren gebeurt binnen een sectie op handmatige volgorde (`sort_order`), prioriteit is een badge + filter, niet de sorteersleutel. Zo blijft slepen leidend, precies zoals in de takenlijst.

## 3. Medewerker toewijzen

Toewijzen op **naam** uit een eenvoudige medewerkerslijst per vestiging (dezelfde bron als de takenlijst: `foh_employees`), plus optioneel "niet toegewezen". Geen inlog-account nodig — MEP wordt vaak op één keukentablet gedaan.

## 4. Drie views

1. **Alles** — alle regels van de dag onder elkaar, groepeerbaar op status; slepen om te ordenen.
2. **Per persoon** — kolommen/blokken per medewerker (+ "Niet toegewezen"). Binnen elke persoon een eigen volgorde die je kunt slepen: iedereen ziet meteen zijn eigen rijtje in werkvolgorde.
3. **Werkview** — grote, tablet-vriendelijke lijst: één regel per taak met naam, aantal, prio, afvinken. Bedoeld om ernaast te staan tijdens het werken (filter op "mijn naam" met één tik).

## 5. Wat ik er zelf aan toe zou voegen

- **Aantal + eenheid** (2 bakken, 5 kg) in plaats van alleen een getal.
- **Status** gepland → bezig → klaar, met een voortgangsbalk bovenaan ("12 van 18 klaar").
- **Doorschuiven naar morgen**: onafgemaakte regels bij dagwissel met één knop meenemen (of automatisch, met melding).
- **MEP-templates**: vaste weekdag-lijsten ("elke donderdag: kip spiesen, dressings, zuurdesem") die je met één klik op de dag zet — zelfde idee als de takenlijst-templates.
- **Notitie per regel** en (later) een foto zoals bij de taken.
- **Vanuit interne bestellingen**: de bestaande automatische koppeling (goedgekeurde bestelling → MEP-regel) blijft werken.

## 6. Technisch

Database — uitbreiden van de bestaande, nog ongebruikte tabel `mep_planning`:

- `recipe_id` wordt **nullable** (nu verplicht) — dat is precies wat de vrije taken mogelijk maakt
- nieuw: `titel` (verplicht, gevuld met de receptnaam bij receptregels), `prioriteit` (1/2/3), `eenheid`, `sort_order`, `employee_id` → `foh_employees`, `sort_order_persoon`, `completed_at`/`completed_by`
- bestaande `assigned_to` (uuid naar auth-gebruiker) blijft ongebruikt naast `employee_id`
- optioneel later: `mep_templates` (vestiging, weekdag, titel, recipe_id, aantal, prio, sort_order)
- RLS: lezen/schrijven voor ingelogde medewerkers van dezelfde vestiging, in lijn met `foh_tasks`; GRANTs meeleveren

Frontend:

- Route `/kitchen/mep` (link in keukenmenu + sidebar); `src/pages/kitchen/MepPlanning.tsx` bestaat al als lege stub en wordt de echte pagina
- Hook `src/hooks/useMepPlanning.ts` (React Query, optimistic updates zoals in FohTasks)
- Componenten: `MepAddRow` (recept-of-vrij zoekveld), `MepRow`, `MepPersonBoard`, `MepWorkView`
- Slepen met `@dnd-kit`, zelfde patroon als de takenlijst; `sort_order` in stappen van 10

## 7. Bouwvolgorde

1. Migratie (kolommen + RLS + grants)
2. Hook + basispagina met view "Alles" (toevoegen, afvinken, slepen, prio)
3. View "Per persoon" met eigen volgorde
4. Werkview (tablet-formaat) + voortgangsbalk
5. Doorschuiven naar morgen + weekdag-templates

## Openstaande keuzes

- Voor welke vestiging(en) starten we: alleen West, of West + Midsland?
- Medewerkerslijst uit `foh_employees` (bestaand, per vestiging) — akkoord, of wil je vrije naam-invoer?
