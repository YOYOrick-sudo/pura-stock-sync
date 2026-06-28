## Doel
Loginscherm visueel in lijn brengen met de nieuwe zwevende, ChatGPT-achtige sidebar: rustiger, lichter, meer ademruimte. Geen functionele wijzigingen — alleen UI.

## Wat ik aanpas in `src/pages/Auth.tsx`

**Card-container**
- Zachtere shadow (subtiele `shadow-sm` i.p.v. `shadow-elevated`), dunnere `border-border/60`.
- Smallere max-breedte (`max-w-[420px]`) — voelt compacter en moderner, net als de sidebar-kaart.
- Iets minder padding (`p-8` blokken i.p.v. `p-12`) voor een lichter geheel.
- Geen harde scheidingslijn meer tussen header en form — één rustig vlak.

**Logo & header**
- Logo iets kleiner (`h-16` i.p.v. `h-[88px]`) zodat het in verhouding staat met de nieuwe compactere sidebar-stijl.
- Subtitel-regel ("Operationeel Systeem • Pura Vida Foodbar") iets kleiner en luchtiger.

**Locatie-keuze**
- Van grote kaarten naar een **pill-toggle** (segmented control), zelfde taal als de actieve-rij-accenten in de sidebar: actieve pill in `bg-card` met fijne border en subtiele schaduw, inactieve in `bg-muted/40` met `text-muted-foreground`.
- Border-radius 12–14px (matcht sidebar-rijen) i.p.v. 20px.

**Wachtwoordveld**
- Iets hoger (`h-12`), `rounded-xl`, rustigere focus-ring (`focus:ring-2 ring-primary/20` i.p.v. harde border-swap).
- Label kleiner en lichter — minder "formulier", meer "app".

**Knop**
- `rounded-xl` (i.p.v. 20px) zodat het rijmt op de sidebar-pills.
- Hover: lichte lift met `transition-all`, geen zware shadow.

**Achtergrond**
- Blijft `bg-background` (zelfde grijs als content-area), zodat de card net zo "zweeft" als de sidebar-kaart.

## Buiten scope
- Geen wijziging aan login-logica, locatie-mapping, cooldown, PWA-hint, of session-handling.
- Geen nieuwe fonts of kleuren — alles binnen het huidige design-systeem (HSL tokens, primary-green).

## Verificatie
Na de edit: preview openen, controleren dat het scherm rustiger oogt, beide locatie-pills werken, en focus-state op het wachtwoordveld zichtbaar is.
