## Probleem

Op de Tijdlijn (`/personeel/tijdlijn`) klik je op een collega-blokje (bv. Fee) en opent er alleen een **Popover** met info. Er is geen Bewerken-knop en geen koppeling naar de bestaande `PersonModal`. Daarom kun je vestiging/team/slaapplek/data niet wijzigen vanaf de Tijdlijn.

De `PersonModal` (die wél vestiging, team, slaapplek én kamer kan wijzigen) wordt nu alleen op de **Collega's**-pagina aangeroepen. Daar werkt bewerken al wel — maar vanaf de Tijdlijn niet.

Korte semantiek-check: **Vestiging** = `location_id` (West / Midsland / Pea). **Slaapplek** = `housing_id`. Twee aparte velden — beide aanpasbaar in de modal. De DB-trigger blokkeert alleen kamer-vs-slaapplek mismatches, dus een wijziging West→Midsland werkt prima zolang je niet een kamer uit de oude slaapplek vasthoudt (modal reset `roomId` automatisch bij wijziging slaapplek; team wordt ook gereset bij vestiging-wijziging — al goed geregeld).

## Oplossing

Voeg een **"Bewerken"** knop toe aan de Popover van `PlanningBlock`, en open daarmee de bestaande `PersonModal` met `person={p}` voorgevuld.

### Wijzigingen

**1. `src/components/personeel/PlanningBlock.tsx`**
- Optionele prop `onEdit?: (person: Person) => void`.
- In de Popover-content onderaan een `<Button size="sm" variant="outline">Bewerken</Button>` die `onEdit(person)` aanroept (alleen renderen als prop meegegeven).

**2. `src/pages/personeel/Tijdlijn.tsx`**
- Lokale state `const [editing, setEditing] = useState<Person | null>(null)`.
- Import `PersonModal`.
- `<PlanningBlock ... onEdit={setEditing} />` doorgeven.
- Onderaan de pagina renderen:
  ```tsx
  {editing && <PersonModal open={!!editing} onClose={() => setEditing(null)} person={editing} />}
  ```

### Waarom dit werkt
- `PersonModal` + `useUpdatePerson` zijn al volledig functioneel (zie Collega's-pagina). De update-mutation roept `supabase.update().eq('id', ...)` aan op `personeel_people` met de nieuwe `location_id`, `team_id`, `housing_id`, `room_id`. Bij wijzigen van vestiging wordt `team_id` automatisch leeggemaakt zodat je een team uit de nieuwe vestiging moet kiezen — anders blokt de `personeel_validate_team_location` trigger het opslaan (terecht).
- Realtime invalidation in `usePeople` zorgt dat de Tijdlijn direct de nieuwe positie/kleur toont na opslaan.

### Geen wijzigingen nodig aan
- `usePeople` / `useUpdatePerson` — werken al.
- DB-triggers — `personeel_validate_team_location` en `personeel_people_d_validate_room` blijven beschermend, modal voldoet aan beide.
- Collega's-pagina — bewerken werkt daar al.

## Test (door jou, na bouw)
1. Tijdlijn → klik op Fee → Popover opent → klik **Bewerken** → modal opent met Fee's data.
2. Vestiging Midsland → West, kies een West-team, sla op → blokje verspringt naar West-rij in Tijdlijn.
3. Slaapplek wijzigen → kleur van het blokje verandert.
4. Annuleren-knop sluit modal zonder opslaan.
