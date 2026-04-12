

# Fix: FohTasks achtergrond-lagen omdraaien

## Probleem
De buitenste achtergrond is wit (`--card`) en de binnenste container is grijs (`--muted`). Dit is omgekeerd t.o.v. de rest van de app, waardoor de takenmodule er "raar" uitziet.

## Oplossing — 2 regels in `src/components/foh/FohTasks.tsx`

**Line 1698** — buitenste div:
- `backgroundColor: 'hsl(var(--card))'` → `backgroundColor: 'hsl(var(--background))'`

**Line 1701** — container:
- `backgroundColor: 'hsl(var(--muted))'` → `backgroundColor: 'hsl(var(--card))'`

## Verificatie
Alle overige kleuren in FohTasks.tsx zijn al correct gemigreerd naar `hsl(var(--*))` tokens. Er zijn geen hardcoded hex of legacy rgba waarden meer. Dit is de enige fix die nodig is.

## Omvang
1 bestand, 2 regels. Puur visueel.

