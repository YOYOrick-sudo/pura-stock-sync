## Plan: takenlijst-beheer — simpel, snel, foutloos én ChatGPT-achtig gepolijst

### Wat ik garandeer
- **Intuïtiever**: één rustig "Lijst beheren" scherm, geen verstopte tabs of losse popups.
- **Sneller**: optimistische UI — wijzigingen verschijnen direct, opslaan op de achtergrond.
- **Foutloos**: database blokkeert dubbele taken, dus het issue van vandaag kan niet meer terugkomen.
- **Visueel strak**: ChatGPT-achtige polish — zachte cards, dunne lijnen, veel ademruimte, subtiele hover, geen kleurexplosies.

---

### 1. Dubbele maandag-taken opruimen (nu)
- 3 taken staan vandaag dubbel in West (Emmers water, Stoelen op tafels, Vitrine roosters). Templates zelf zijn schoon.
- Per taak één exemplaar archiveren → één blijft over.

### 2. Dubbele taken voorgoed onmogelijk maken
- Database-regel: per `template_id + due_date` mag maar één actieve taak bestaan.
- Generator wordt conflict-safe: dubbele trigger = stil overslaan, geen kopie.
- Werkt ook bij dubbele tab, race condition op iPad, of dubbele refresh.

### 3. Nieuw "Lijst beheren" scherm — ChatGPT-achtige polish

Eén rustig scherm, drie heldere zones. Geen losse popups meer.

```text
┌──────────────────────────────────────────────────────────┐
│  Lijst beheren                              [✕]          │
│  Sluit · West                                            │
│                                                          │
│  ╭────────────────────────────────────────────────────╮  │
│  │  Sluit (actief)                          ⌄         │  │  ← rustige selector
│  ╰────────────────────────────────────────────────────╯  │
│                                                          │
│  ┌─ BIJVULLEN ──────────────────────── ⋮ ─┐              │
│  │                                          │              │
│  │  ⋮⋮  Limonadeflessen aanvullen      ✎  │              │
│  │  ⋮⋮  Frisdrank bijvullen             ✎  │              │
│  │                                          │              │
│  │  + taak in Bijvullen                    │              │
│  └─────────────────────────────────────────┘              │
│                                                          │
│  ┌─ TERRAS ─────────────────────────── ⋮ ─┐              │
│  │  ⋮⋮  Stoelen op tafels        ma   ✎  │              │
│  │  ⋮⋮  Emmers water...          ma   ✎  │              │
│  │  + taak in Terras                       │              │
│  └─────────────────────────────────────────┘              │
│                                                          │
│  + Nieuwe categorie                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Visuele taal (ChatGPT-niveau)**:
- **Kleur**: alleen wit, drie tinten grijs, één groene accent. Geen kleurvlakken, geen badges met achtergronden — alleen tekst en haarlijnen.
- **Cards**: `border-radius: 16px`, 1px border `hsl(var(--border))`, geen schaduw — alleen een hover-tint.
- **Lijnen**: haarfijn (`1px`, 8% opacity). Categorieën gescheiden door witruimte, niet door dikke headers.
- **Typografie**: categorie-headers `13px / uppercase / 600 / tracking-wide / muted`. Taken `15px / regular`. Helemaal Inter, geen tweede font.
- **Whitespace**: 24px tussen secties, 12px tussen taken, 20px card-padding. Ruim, niet vol.
- **Interactie**: hover = `bg-muted/40` (zoals de takenlijst). Drag-handle (`⋮⋮`) verschijnt alleen op hover van de regel. Edit-icoon (`✎`) verschijnt rechts op hover.
- **Inline edit**: klik op een taak → de regel verandert in een rustig input-veld op dezelfde plek. Geen modal, geen sprongen.
- **Herhaling**: subtiel grijs pill-tekstje `ma` of `ma · vr` rechts naast de titel (zoals nu al in de live lijst). Geen extra icoon.
- **Animaties**: 150ms fade/slide bij toevoegen/verwijderen, niets meer. Geen "bounce", geen overhead.
- **Knoppen**: tekst-links met `+` ervoor (`+ taak in Bijvullen`, `+ Nieuwe categorie`). Geen grote groene CTA's binnenin het scherm — alleen één rustige "Sluiten" rechtsonder.

**Header van het scherm**:
- Titel `Lijst beheren` (24px, semibold) + sublabel `Sluit · West` (13px, muted).
- Rechtsboven: `✕` om te sluiten. Geen "Annuleren/Opslaan" knoppenrij — alles autosavet.

### 4. Wijzigingen zijn direct zichtbaar
- Optimistic update: UI past direct aan, save loopt op achtergrond.
- Bij fout: kleine toast + automatische rollback.
- Wijziging in de actieve lijst synct meteen naar de taken van vandaag.
- Geen aparte "Opslaan als template" knop — dit scherm ís het template.

### 5. Andere lijsten beheren (verborgen complexiteit)
- Bovenaan een rustige selector: `Sluit (actief) ⌄`. Klik = dropdown met andere templates ("Standaard Sluitlijst", "Zomer Sluitlijst", "+ Nieuwe lijst aanmaken").
- 95% van de tijd hoef je dit niet aan te raken. Geen aparte tab meer.

### 6. Toegang
- Knop in de header heet voortaan **"Lijst beheren"** (potlood-icoon, niet shield).
- Wachtwoord-popup (2017/2020) blijft, opent direct dit nieuwe scherm.

---

### Technisch (kort)
- **Migration**: dedup vandaag's taken + partial unique index `(template_id, due_date) WHERE archived=false AND template_id IS NOT NULL`.
- **Generator** (`generateDailyTasks` + edge function): insert wordt `upsert` met `onConflict: 'template_id,due_date', ignoreDuplicates: true`.
- **Nieuwe component** `src/components/foh/ListManager.tsx` vervangt de huidige Admin Panel + Template Editor. Hergebruikt `SortableTaskItem`, `CategoryPicker`, `RepeatBadge`.
- **Inline autosave** met React Query `onMutate` (optimistic) + 400ms debounce per veld.
- **Sync naar vandaag**: bestaande logica uit `handleSaveTemplateEdits` wordt na elke mutatie aangeroepen.
- Geen nieuwe dependencies — alles met de huidige tokens (`hsl(var(--*))`), Tailwind en `@dnd-kit`.

Akkoord? Dan bouw ik dit in één keer door — duplicaten fix, database-slot, en het nieuwe gepolijste beheerscherm.