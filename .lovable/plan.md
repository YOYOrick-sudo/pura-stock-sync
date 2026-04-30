## Probleem met "vandaag"-snapshot

Eén momentopname klopt niet: bewoners lossen elkaar af. Een woonruimte kan vandaag 2/4 zijn, half mei 4/4, en eind juni 0/4. Een vaste teller verbergt die dynamiek.

## Oplossing: piek-bezetting in het zichtbare tijdlijn-venster

Onder de tijdlijn een minimalistische strook met **één tegel per slaapplek**, die de bezetting toont over precies hetzelfde venster dat de gebruiker boven ziet (de zichtbare maanden, niet "vandaag").

Per tegel drie informatie-lagen, oplopend in detail:

```text
┌───────────────────────────────────────────────────────┐
│  ● Midsland                              2 → 6 / 8    │   ← nu → piek / capaciteit
│  ▓▓░▓▓▓▓▓▓░░▓▓▓▓▓░░░░░░  jun                          │   ← mini sparkline van bezetting
│  Piek: 6 op 12 juni · 3 dagen overboekt               │   ← samenvatting (rood = waarschuwing)
└───────────────────────────────────────────────────────┘
```

### Wat er per tegel staat

1. **Naam + bolletje** in housing-color (consistent met tijdlijn-blokjes).
2. **Teller `nu → piek / capaciteit`** — bv. `2 → 6 / 8`. De `→` maakt direct duidelijk dat dit verandert door het venster heen. Bij geen capaciteit: `2 → 6`.
3. **Sparkline (mini-grafiek)**: één smal staafje per dag in het zichtbare venster, hoogte = aantal bewoners op die dag. Gebruik `getDensityPerDay` (filtert op die housing). Kleur: housing-color op normale dagen, rood op overboekte dagen. Geeft direct visueel ritme van afwisseling.
4. **Statusregel**:
   - Geen capaciteit ingesteld: regel weggelaten.
   - Geen overboeking: `Piek: 6 op 12 juni` (alleen de regel als de piek > de huidige bezetting, anders weglaten — ruis vermijden).
   - Wel overboeking: `Piek: 6 op 12 juni · 3 dagen overboekt` in `text-destructive`.

### Afwisseling visualiseren

De sparkline lost precies jouw zorg op: als persoon A van 1–4 april in kamer X zit en B van 5–7 mei, zie je twee korte verhogingen met een dal ertussen. De teller `nu → piek` benadrukt het verschil.

## Implementatie

**Nieuw component**: `src/components/personeel/HousingOccupancyStrip.tsx`
- Props: `housing: PersoneelHousing[]`, `people: Person[]`, `windowStart: Date`, `windowEnd: Date`
- Per housing:
  - `residents = people.filter(p => p.housing_id === h.id)`
  - `densityMap = getDensityPerDay(residents, windowStart, windowEnd)` (helper bestaat al)
  - `current = isActiveOn`-tellen op vandaag
  - `peak = Math.max(...densityMap.values())`, `peakDate = dag met max`
  - `overbookedDays = getOverbookedDays(h, residents, windowStart, windowEnd)` (helper bestaat al)
- Layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`
- Tegel: `rounded-[14px] bg-card border px-3 py-2.5`, sparkline 24px hoog met `flex items-end gap-[1px]`, elk staafje `flex-1`

**Wijziging**: `src/pages/personeel/Tijdlijn.tsx`
- Bereken eenmalig `windowEnd = addDays(windowStart, TOTAL_DAYS - 1)` (al impliciet aanwezig).
- Render `<HousingOccupancyStrip ...>` direct boven de modal-render aan het einde van de pagina.
- Sectiekop: `Woonruimte in zichtbaar venster` (klein, `text-xs uppercase tracking-wide text-muted-foreground`).

## Waarom dit goed werkt

- **Eerlijk over afwisseling**: nu/piek/capaciteit + sparkline tonen het gehele verhaal van het seizoen, niet één moment.
- **Consistent venster**: dezelfde periode als de tijdlijn erboven — ogen volgen logisch van blok naar bezetting.
- **Geen extra queries**: hergebruikt `people` en `housing` uit Tijdlijn, gebruikt bestaande helpers.
- **Minimalistisch**: één tegel, drie informatie-lagen, alleen waarschuwing als er iets te melden is. Geen knoppen, geen dropdowns.

## Geen wijzigingen aan
- Database, hooks, types.
- Bestaande DensityBar (toont totaal aantal mensen, niet per slaapplek — vult elkaar aan).
- HousingCard (Wonen-pagina blijft de detailweergave).

## Optioneel later (niet nu)
Hover op een sparkline-staaf zou de exacte bewoners op die dag kunnen tonen. Voor nu eerst de strook zelf.
