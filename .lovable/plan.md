## Problemen op de tijdlijn

1. Namen-kolom en tijdlijn-kolom hebben elk een eigen verticale scrollbar — regels lopen uit de pas.
2. Alle balkjes hebben de slaapplek-kleur, dus personen met dezelfde slaapplek (of zonder) zijn niet uit elkaar te houden.
3. Pura Vida West en Pura Vida Midsland sluiten visueel direct op elkaar aan.
4. Personen zonder slaapplek tonen alleen een grijs streepje "—" — onduidelijk of dat "onbekend" of "niet nodig" is.
5. Per vestiging staan keuken en bediening door elkaar; binnen een functie staat de volgorde alfabetisch i.p.v. op aankomstdatum, dus je ziet niet wie als eerste begint.

## Oplossing

### 1. Verticale scroll synchroniseren

In `src/pages/personeel/Tijdlijn.tsx`:
- De buitenste flex-container (`<div className="flex" style={{ maxHeight: "70vh" }}>`) wordt zélf de enige verticale scroll-container (`overflow-y-auto`).
- Namen-kolom verliest eigen `overflow-y-auto` maar blijft `sticky left-0` (horizontaal vastgepind, verticaal scrolt mee).
- Tijdlijn-container verliest `overflow-y-auto`, behoudt `overflow-x-auto`.
- Sticky maand-/dagheader en density-bar blijven werken via `sticky top-0 z-…` binnen de gedeelde scroll-container.
- Namen-kolom-header krijgt ook `sticky top-0 z-30`.

Resultaat: namen en balkjes scrollen verticaal altijd samen.

### 2. Unieke kleur per persoon

Nieuwe util `getPersonColor(personId: string): string` in `src/lib/personeel-utils.ts`:
- Hash van `person.id` → vaste hue 0-360°, vaste S/L (`hsl(h, 65%, 55%)`).
- Deterministisch — zelfde persoon krijgt altijd dezelfde kleur.
- `getTextColorForBg` blijft tekstcontrast bepalen.

In `PlanningBlock.tsx` wordt `bg = getPersonColor(person.id)` i.p.v. `housing?.color`. Slaapplek-info blijft 100% behouden via het bolletje in de popover en in de woonruimte-kolom links.

### 3. Vestigingen visueel scheiden

In `src/pages/personeel/Tijdlijn.tsx`:
- Vestigings-headers krijgen sterker contrast: `bg-primary/10 text-primary font-bold text-base`, dikke linker-accentbalk (`border-l-4 border-primary`), hoogte verhoogd (~44px).
- Nieuw `Row`-type `{ kind: "spacer"; locId: string }` vóór elke vestiging vanaf de tweede; lege rij van 20px met dubbele top-border. Meegenomen in `offsets` en `totalRowsHeight`.
- Behandeling identiek in namen-kolom en tracks-area zodat alles in lijn blijft.

### 4. Intuïtieve woonruimte-status (geen streepje meer)

Drie staten, snel scanbaar via icoon + kleur:
- **Heeft slaapplek**: bestaande gekleurde bolletje + naam.
- **Geen woonruimte nodig**: lucide `House` met `Slash`-overlay (16px, grijs) + label "woont thuis" (md+). Tooltip: "Geen woonruimte nodig".
- **Onbekend / nog niet toegewezen** (`housing_id` NULL én niet "not needed"): `AlertCircle` 14px in `text-amber-600` + label "toewijzen" (md+). Tooltip: "Nog geen slaapplek toegewezen". Klikbaar → opent `PersonModal`.

Schema: nieuwe kolom `housing_not_needed boolean not null default false` op `personeel_people`. `Person`/`PersonInput`-types uitgebreid; `useCreatePerson`/`useUpdatePerson` nemen het veld mee. `PersonModal` krijgt een checkbox "Heeft geen woonruimte nodig" die het `housing_id`-veld disabled maakt zodra aangevinkt.

### 5. Splitsing in Keuken & Bediening + sortering op aankomstdatum

De bestaande tabel `personeel_teams` is al per-locatie en heeft een `name` (bv. "Keuken", "Bediening"). Daar bovenop introduceren we een **functie-categorie** die teams groepeert binnen elke vestiging.

- Nieuwe kolom `function_group text` op `personeel_teams` met toegestane waarden `'keuken'` en `'bediening'` (CHECK-constraint, nullable voor backwards-compat). Een data-migratie vult bestaande teams in: teamnaam bevat "keuken"/"chef"/"kok" → `keuken`, anders → `bediening`. Beheerder kan dit later overrulen via team-instellingen (geen UI-werk in deze iteratie nodig — we vullen via heuristiek).
- Een persoon erft zijn functie-categorie van het team in zijn (per-vestiging) assignment. Multi-locatie blijft werken: per vestiging kan iemand in een ander team zitten en dus een andere functie hebben.

In `Tijdlijn.tsx` wordt de `rows`-build (nu regel 97-123) uitgebreid:
1. Per vestiging: groepeer mensen op `function_group` van hun team in die vestiging (`keuken` eerst, `bediening` daarna; `null` valt onder `bediening` als fallback).
2. **Binnen elke functie-groep** sortering op `start_date` oplopend (vroegste boven), bij gelijke datum alfabetisch op naam als tiebreaker. Dat geeft de gevraagde "wie komt het eerst aan"-volgorde gerekend vanaf vandaag.
3. Tussen de twee functie-groepen komt een sub-header-rij (nieuw `Row`-type `{ kind: "function"; locId: string; group: 'keuken' | 'bediening' }`): hoogte ~28px, `bg-muted/40`, klein icoon (lucide `ChefHat` voor keuken, `Coffee` of `Utensils` voor bediening) + label "KEUKEN" / "BEDIENING" in caps, tracking-wide. Wordt zowel in de namen-kolom als in de tracks-area gerenderd, met een dunne `border-t border-border/50`.
4. De bestaande "Naam / Woonruimte"-subheader verschijnt onder elke functie-header (in plaats van één keer per vestiging), zodat ook na scrollen de kolomtitels duidelijk blijven.

Geen functie-groep voor een vestiging zonder mensen → die vestiging wordt nog steeds overgeslagen (huidige gedrag).

## Te wijzigen bestanden

- `src/pages/personeel/Tijdlijn.tsx` — scroll-structuur, vestigings-styling, spacer-rij, functie-headers, nieuwe sortering, woonruimte-status.
- `src/lib/personeel-utils.ts` — `getPersonColor`.
- `src/components/personeel/PlanningBlock.tsx` — kleur per persoon.
- `src/components/personeel/PersonModal.tsx` — checkbox "Geen woonruimte nodig".
- `src/types/personeel.ts` — `housing_not_needed: boolean` op `Person`/`PersonInput`; `function_group: 'keuken' | 'bediening' | null` op `PersoneelTeam`.
- `src/hooks/personeel/usePeople.ts` — nieuw veld meenemen in insert/update.
- `src/hooks/personeel/useTeams.ts` — `function_group` in select.
- Supabase-migraties:
  1. `alter table personeel_people add column housing_not_needed boolean not null default false;`
  2. `alter table personeel_teams add column function_group text check (function_group in ('keuken','bediening'));` + UPDATE-statement dat bestaande teams classificeert op basis van naam (case-insensitive match op "keuken|chef|kok" → `keuken`, rest → `bediening`).

## Wat blijft hetzelfde

- Bestaande logica voor history, density, multi-locatie, popovers, rijhoogtes.
- Slaapplek-info blijft volledig zichtbaar.
- Geen kolommen of data verwijderd; alle wijzigingen zijn additief en backwards-compatible.