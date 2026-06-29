## Probleem

Het beheren van de takenlijst gebeurt nu via geneste dialogs: Admin Panel (popup) → "Lijst beheren" (popup binnen popup) → bewerk-popovers. Dat is krap, voelt traag (animaties stapelen), je verliest context op tablet, en bulk-bewerken is omslachtig. De ListManager (~1.250 regels logica) zit gepropt in een `<Dialog>` van max 650px breed.

Andere goede tools (Notion databases, Linear, Todoist, Asana list view) lossen dit op met een **dedicated full-page editor**: breed canvas, sticky header met context + acties, inline editing, kolom-achtige structuur, alles direct zichtbaar zonder te scrollen door modals.

## Wat we bouwen

**1. Eigen route in plaats van dialog**

Nieuwe pagina `/taken/beheer` (achter hetzelfde admin-wachtwoord 2017/2020). Vanuit de takenlijst opent de "Lijst beheren"-knop deze pagina i.p.v. een popup. Sluiten = terug naar `/taken-bediening` (of waar je vandaan kwam) via een `← Terug`-knop in de header. State (locatie, fase, afdeling, gekozen template) gaat mee via URL search params zodat refresh werkt en je deep-linken kunt.

**2. Layout van het beheerscherm**

```text
┌───────────────────────────────────────────────────────────────┐
│ ← Terug   Lijst beheren · West · Sluit · Voorkant      [Opslaan-indicator] │
├──────────────┬────────────────────────────────────────────────┤
│ TEMPLATES    │  TAKEN IN GEKOZEN LIJST                        │
│ (smal,       │                                                │
│  links)      │  ▸ Bijvullen                      [+ taak]    │
│              │     ⋮⋮ Limonadeflessen aanvullen…  [ma di ..] │
│ • Sluitlijst │     ⋮⋮ Diepvries bijvullen          [dagelijks]│
│   voorkant ✓ │  ▸ Schoonmaak Bar                  [+ taak]    │
│ • Openlijst  │     …                                          │
│   voorkant   │  ▸ Extra Maandag                   [+ taak]    │
│              │                                                │
│ + Nieuwe     │  [Categorie reorder ↑↓ aan zijkant per groep]  │
│   lijst      │                                                │
└──────────────┴────────────────────────────────────────────────┘
```

- **Sticky header**: context + autosave-status ("Opgeslagen", "Bezig met opslaan…"). Geen aparte "Opslaan"-knop nodig — alles is autosave (debounce 500 ms, blijft zoals nu).
- **Linker kolom (240 px)**: alle templates voor deze locatie/fase/afdeling. Klik = laad rechts. "+ Nieuwe lijst" onderaan. Actieve template krijgt een vinkje.
- **Rechter kolom (rest)**: taken gegroepeerd per categorie, breed genoeg om titel, dag-chips, tijdsinschatting en acties op één regel te tonen. Inline edit zonder popover (gewoon een hover-pencil → input ter plaatse). Drag-handle links, repeat-chips rechts, delete als hover-icoon.
- **Categorie-acties** (West): ⌃/⌄ knoppen naast de categorie-titel om te reorderen, ⋮-menu voor hernoemen/verwijderen — geen aparte beheerschermen meer.
- **Onderaan elke categorie**: één "+ taak"-knop die direct een nieuwe rij toevoegt met focus in het titelveld (geen dialog).

**3. Wegwerken van popup-stapels**

- "Admin Panel" templates-tab verdwijnt: die hele tab gaat op in deze pagina.
- `templateEditorOpen`-dialog (oude editor) wordt verwijderd — alleen de pagina blijft.
- Categorie-hernoemen / verwijderen / reorderen: niet meer via `prompt()` / aparte popup, maar inline in de pagina.
- Het admin-wachtwoorddialog blijft zoals het is (snel, gepolijst) — alleen wordt na correct wachtwoord nu genavigeerd naar `/taken/beheer?...` i.p.v. een dialog te openen.

**4. UX details die het natuurlijk laten voelen**

- Brede regels (geen 650 px crop) → hele taaktitel altijd leesbaar.
- Autosave-status duidelijk zichtbaar (header pill: "Opgeslagen · 2s geleden").
- `Esc` of `←` → terug naar takenlijst.
- Op tablet: linker kolom collapsed naar een dropdown ("Lijst: Sluitlijst voorkant ▾") zodat alle breedte naar taken gaat.
- Keyboard: `Enter` op een taakveld = opslaan + nieuwe rij eronder (snelle bulk-invoer).
- Categorie- en taakvolgorde-wijzigingen syncen direct naar de live taken van vandaag (gedrag dat er al is blijft hetzelfde).

## Wat we niet aanraken

- Datamodel (`foh_daily_templates`, `foh_category_order`, `foh_tasks`) blijft identiek.
- Autosave-, sync- en dedup-logica uit huidige `ListManager` wordt hergebruikt — we verplaatsen alleen de schil van Dialog naar Page en herschikken de layout.
- Wachtwoordlogica (2017 / 2020 per locatie) ongewijzigd.
- Takenlijst-pagina zelf (`FohTasks.tsx`) blijft visueel hetzelfde; alleen de knop "Lijst beheren" navigeert nu.

## Technische opzet

- Nieuwe route `src/pages/TakenBeheer.tsx` (in router toegevoegd), achter dezelfde auth-guard als de takenpagina.
- `ListManager.tsx` wordt gesplitst:
  - `ListManagerPage.tsx` — de full-screen layout + sticky header.
  - Bestaande hooks/queries/handlers (templates query, autosave, dnd, sync) verhuizen 1-op-1 mee; geen logicawijziging.
- `FohTasks.tsx`: `listManagerOpen` state + `<ListManager .../>` block verwijderen; knop wordt `navigate('/taken/beheer?location=...&phase=...&dept=...&template=...')`.
- Categorie-beheer (`handleMoveCategory`, `handleRenameCategory`, `handleDeleteCategory`) verhuist mee als props/handlers in de page.
- Browser back-knop werkt vanzelf doordat het een echte route is.

## Resultaat

Eén rustig, breed scherm waarin je templates kiest, taken bewerkt, categorieën ordent en nieuwe taken toevoegt — zonder popup-na-popup, zonder wachten op animaties, met alle context tegelijk in beeld.
