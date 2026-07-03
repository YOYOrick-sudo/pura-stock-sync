## Doel

Onderhouds-module toegankelijk voor élke ingelogde medewerker (geen pincode meer aan de voorkant), met een strakke, visueel aangename lijst per vestiging en een simpele meld-flow: titel + urgentie + plek in de zaak + optionele foto.

De bestaande pincode-flow blijft achter de hand voor beheer op de admin-pagina — maar de standaardweg via de sidebar is nu direct binnen.

## 1. Database

Aanpassing op `maintenance_tickets`:
- `melder_id` wordt optioneel (was NOT NULL, hoorde bij pincode-users).
- Nieuwe kolom `melder_user_id uuid` — verwijst naar de ingelogde app-gebruiker (`auth.users`), nullable.
- Nieuwe kolom `plek text` — locatie binnen de zaak (Bar, Keuken, Zaal, Terras, Sanitair, Entree, Voorraad, Overig).
- Nieuwe kolom `foto_url text` — optionele foto.

RLS blijft zoals nu (lezen open, insert door ingelogde users), zodat medewerkers direct kunnen posten.

Nieuwe storage-bucket `maintenance-photos` (privaat, met signed URLs) + policies waarbij ingelogde gebruikers kunnen uploaden en iedereen in de app kan lezen via signed URL.

## 2. Toegang

`Onderhoud.tsx` krijgt twee paden:
- **Ingelogd via app** (Supabase auth): pincode overslaan, direct de nieuwe tickets-lijst tonen, gefilterd op vestiging van de gebruiker (via `useUserLocation`).
- **Pincode-flow** blijft bestaan voor beheer-scherm en cross-vestiging (bereikbaar via een discrete "Beheer"-knop rechtsboven). Niets breekt voor bestaande onderhouds-users.

## 3. Meldflow — `NewTicketForm` opnieuw

Eén scherm, groot en duidelijk:
- **Titel** — korte omschrijving, verplicht.
- **Urgentie** — 3 grote kaartknoppen (Laag / Normaal / Hoog) met kleur (grijs / oranje / rood).
- **Plek** — chip-selector met vaste opties (Bar, Keuken, Zaal, Terras, Sanitair, Entree, Voorraad, Overig).
- **Foto** — optioneel, camera-capture op mobiel (`<input type="file" accept="image/*" capture="environment">`), thumbnail-preview, upload naar `maintenance-photos`.
- **Toelichting** — optioneel textarea.
- Grote primaire submit-knop, bevestigings-toast, terug naar lijst.

Vestiging wordt automatisch gezet vanuit `useUserLocation` — geen dropdown.

## 4. Lijst-scherm — `TicketList` polish

Compacte, visueel prettige lijst van meldingen op de eigen vestiging:
- Sticky header met titel "Onderhoud — {vestiging}" en één primaire knop **+ Nieuwe melding**.
- Filter-tabs: Open • In behandeling • Afgehandeld (Alle als vierde).
- Ticket-kaarten (rounded 20px, subtiele border, hover-lift):
  - Links een gekleurde urgentie-strip (grijs/oranje/rood).
  - Titel prominent, daaronder plek-badge + relatieve tijd ("2 uur geleden").
  - Foto-thumbnail rechtsboven als aanwezig.
  - Status-badge (Open / Bezig / Klaar) met semantische kleuren.
- Empty-state: vriendelijk illustratief blokje met de + knop.
- Detail-scherm (`TicketDetail`) toont foto full-width, opmerkingen-thread onderin — layout-polish, geen nieuwe functionaliteit.

## 5. Design-tokens

Alles in bestaande semantic tokens uit `index.css`:
- Urgentie-kleuren via bestaande status-varianten (`success`/`warning`/`destructive` met `/10` achtergrond en volle tekst-kleur).
- Border-radius 20px voor kaarten, 14px voor knoppen/inputs — conform project-standaard.
- Icon 20px in kaarten, 16px inline — conform icon-standaard.
- Touch targets 44px+ voor tablets — conform iPad-richtlijn.

## 6. Bestanden

Nieuw:
- `supabase/migrations/*_onderhoud_openzetten.sql`
- Storage bucket + policies

Gewijzigd:
- `src/pages/maintenance/Onderhoud.tsx` — dual-path (app-user vs pincode)
- `src/components/maintenance/NewTicketForm.tsx` — nieuwe velden + foto-upload
- `src/components/maintenance/TicketList.tsx` — polish + filter-tabs + kaart-layout
- `src/components/maintenance/TicketDetail.tsx` — foto weergave + polish
- `src/hooks/maintenance/useMaintenanceTickets.ts` — vestiging-filter, nieuwe velden

## Verificatie

- Migration draait en RLS/GRANTs kloppen.
- Playwright: login als medewerker → Onderhoud in sidebar → direct lijst (geen pincode) → melding maken met foto → verschijnt bovenaan met juiste kleur/plek/thumbnail. Screenshot.
