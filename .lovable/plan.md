

# "Nieuw" indicator en beschrijving toevoegen

## 1. Beschrijving toevoegen aan "Rode wijn vacuüm trekken"

De template in de database krijgt een beschrijving:

> "Doe de zwarte dop op de fles en pak het pompje. Zet het pompje op de dop en trek de hendel naar boven. Pomp totdat je een klik hoort."

Dit wordt direct zichtbaar via het bestaande info-icoontje (i) naast de taak.

## 2. "Nieuw" indicator op recent toegevoegde taken

Een klein sterretje-icoontje (Sparkles) naast taken die recent zijn toegevoegd aan de takenlijst. Dit helpt het team om te zien wat er nieuw is.

**Hoe het werkt:**
- Templates die minder dan 7 dagen oud zijn krijgen het icoontje
- Klein oranje sterretje, past bij het Pura Vida kleurenschema
- Verschijnt naast de taaknaam, voor de tijd-indicator
- Na 7 dagen verdwijnt het automatisch -- geen extra onderhoud nodig

**Welke taken krijgen het nu:**
- Amuse checken evt aanpassen en communiceren met team
- Keukenraam schoonmaken met Glassex (binnen- en buitenzijde)
- Terrastafels afnemen
- Rode wijn vacuüm trekken met dop en vacuümpomp
- Schrobben achter bar (zondag)
- Alles FIFO: Melk, bieren en fris (zondag)
- Aquafabe verversen (woensdag)

## Technisch

1. **Database update**: `UPDATE foh_daily_templates SET description = '...' WHERE title ILIKE '%rode wijn%'`
2. **FohTasks.tsx**: Bij het ophalen van taken, ook de `created_at` van de template meenemen. In de `SortableTaskItem` component een `Sparkles` icoontje tonen als de template minder dan 7 dagen oud is.
3. Styling: 14px Sparkles icon, kleur `#E27726` (Pura Vida oranje), naast de taaknaam.

