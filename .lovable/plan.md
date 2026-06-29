## Probleemanalyse (proactief, geen losse fixes)
De takenlijst-admin voelt los van de rest van de app omdat hij op drie plekken de app-shell verlaat:

1. **Admin Panel** = `Dialog` popup → sidebar weg, voelt afgesloten.
2. **Admin is fase-gebonden** → eerst tab "Sluit" kiezen, dan admin openen. Onlogisch.
3. **`/taken/beheer`** = full-screen route zonder `SidebarLayout` → sidebar weg.
4. **"Nieuwe Template"** knop staat prominent, maar er kan maar 1 actieve lijst per fase/dept bestaan (DB-trigger). Knop levert alleen verwarring + dubbele lijsten op.
5. **FIFO-koeling taak** is 1 mega-string met komma's — onleesbaar, niet per item afvinkbaar.

De rode draad: de app heeft een nette `SidebarLayout` wrapper die andere pagina's (Dashboard, Kassatelling) gebruiken — admin/beheer doen dat niet. Daar zit de échte fix.

---

## Plan

### 1. `/taken/beheer` binnen de app-shell
- `src/pages/TakenBeheer.tsx`: render `ListManager` binnen `<SidebarLayout>` (zelfde wrapper als Dashboard/Kassatelling).
- `ListManager` `variant="page"` aanpassen: niet meer `fixed inset-0` / eigen sticky header die het volledige viewport claimt, maar een normale pagina-container (max-width, padding, sticky header binnen content-kolom). Sidebar blijft links zichtbaar.
- Esc-shortcut blijft, terug-knop in eigen header blijft.

### 2. Admin als echte route `/taken/admin`
- Nieuwe pagina `src/pages/TakenAdmin.tsx` in `<SidebarLayout>`.
- Toont **overzicht van alle actieve lijsten** voor de locatie (kaartjes per fase × department):
  ```text
  West                                Midsland
  ┌──────────────────────┐            ┌──────────────────┐
  │ Bediening · Openen   │            │ Openen   12 taken│
  │ 14 taken             │            ├──────────────────┤
  │ [Lijst beheren →]    │            │ Tussen   8  taken│
  ├──────────────────────┤            ├──────────────────┤
  │ Bediening · Sluiten  │            │ Sluiten 22 taken │
  │ 22 taken             │            └──────────────────┘
  │ [Lijst beheren →]    │
  ├──────────────────────┤
  │ Keuken · Sluiten     │
  │ 18 taken             │
  │ [Lijst beheren →]    │
  └──────────────────────┘
  ```
- "Lijst beheren" → `navigate('/taken/beheer?location=…&phase=…&dept=…')` — geen fase-switch nodig.
- West-instellingen (Apparaat-modus + Subcategorieën-beheer) verhuizen mee naar deze pagina, niet meer in popup.
- Admin-knop in `FohTasks.tsx`: na success in `AdminPasswordDialog` → `navigate('/taken/admin')`. Bestaande Admin-Dialog + state (`adminPanelOpen`, `adminTab`, `newTemplateDialogOpen`, `groupedTemplates`-rendering) verwijderen.

### 3. "Nieuwe Template" knop weg
- Knop + `newTemplateDialogOpen`-dialog + bijbehorende create-flow uit de UI. Logica blijft in DB beschikbaar, maar niet meer aanroepbaar.

### 4. FIFO-koeling taak opsplitsen (West · Keuken · Sluit)
- Bestaande mega-taak archiveren (template + actieve taak vandaag).
- 12 losse rows in `foh_daily_templates` (location=West, department=achterkant, phase=sluit, template_name=Standaard, category=`FIFO koeling`, oplopende `sort_order`). Titels = enkel productnaam:
  - Kip · Tempeh · Kebab · Soepen · Zalm & Forel · Bananenpannenkoeken (koellade) · Brioche · Zoet (alleen als echt op) · Tomatenjam · Relish · Wortelspread · Kaas
- Categorie `FIFO koeling` via `foh_category_order` onderaan keuken-blok zetten.
- Sync-trigger zet ze meteen in vandaag's lijst.

---

## Volgorde van uitvoeren
1. **FIFO splitsen** (snelle data-fix, direct zichtbaar).
2. **`/taken/beheer` in SidebarLayout** (kleine wrapper-fix, lost direct grootste klacht op).
3. **`/taken/admin` route + overzicht + verwijder oude Dialog/knop** (groter refactor).

## Niet aanraken
- Wachtwoord-dialog (2017/2020) blijft 1-op-1.
- ListManager interne logica (autosave, drag/drop, sync naar actieve taken).
- DB-schema, edge functions, taakgeneratie, RLS-policies.
- Andere routes/pagina's.

## Resultaat
- Sidebar **altijd zichtbaar** in admin én beheer — voelt als één doorlopende app.
- 1 klik op Admin → overzicht van **alle** lijsten ongeacht actieve fase.
- Geen "Nieuwe Template" meer → geen kans op dubbele lijsten.
- FIFO-koeling = 12 afvinkbare items i.p.v. 1 onleesbare regel.
