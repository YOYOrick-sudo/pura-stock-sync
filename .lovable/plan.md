

# Fix: dark mode logo formaat gelijktrekken

## Probleem
In de sidebar wordt het logo verschillend getoond in light vs dark mode. Twee oorzaken:
1. De twee PNG-bestanden (`pura-vida-logo.png` en `pura-vida-logo-dark.png`) hebben verschillende intrinsieke afmetingen / aspect-ratio's. Bij alleen `h-[92px]` schaalt de breedte automatisch mee, dus de visuele grootte verschilt per logo.
2. `h-[92px]` is groter dan de header zelf (84px) — overflow wordt afgekapt.

## Oplossing
In `src/components/AppSidebar.tsx` het `<img>` voor het sidebar-logo:

- Hoogte verlagen naar `h-12` (48px) zodat het comfortabel past binnen de 84px header (met padding-ruimte boven/onder).
- Vaste breedte toevoegen: `w-[140px]` met `object-contain`, zodat beide logo-bestanden in exact hetzelfde bounding box worden gerendered en visueel even groot lijken — ongeacht hun intrinsieke afmetingen.

Resulterende className:
```
h-12 w-[140px] object-contain
```

## Omvang
1 bestand, 1 className-aanpassing. Geen logica, geen nieuwe assets.

