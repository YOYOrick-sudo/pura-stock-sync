## Probleem met huidige strook

`2 → 6 / 8` + sparkline is te abstract. Een HRM-medewerker moet eerst nadenken: "wat is dat pijltje, wat zijn die staafjes". Dat is niet "in één blik duidelijk".

## Versimpelde aanpak

Eén tegel per slaapplek met **drie heldere onderdelen** in mensentaal, en een hover/info-icoon voor wie meer wil weten.

```text
┌─────────────────────────────────────────────────┐
│  ● Midsland                          [Vol]  ⓘ   │
│                                                 │
│  Nu:    5 van 8 plekken bezet                   │
│  Druk:  juni en juli (volledig vol)             │
│  Vrij:  vanaf 15 augustus                       │
└─────────────────────────────────────────────────┘
```

### Drie regels in plain Dutch

1. **Nu**: `5 van 8 plekken bezet` — direct duidelijk wat er vandaag is.
2. **Druk**: maand(en) waarin het vol of overboekt is, bv. `juni en juli (volledig vol)` of `eind juni (overboekt)`. Weglaten als er geen drukke periode in het venster is.
3. **Vrij**: eerste datum waarop er weer ruimte komt, bv. `vanaf 15 augustus`. Weglaten als er nu al ruimte is.

### Status-badge rechtsboven (één woord)

- `Ruimte` (groen) — onder 80% bezet nu
- `Bijna vol` (amber) — 80–100%
- `Vol` (amber) — exact op capaciteit
- `Overboekt` (rood) — boven capaciteit nu of in venster

### Info-tooltip (ⓘ rechtsboven)

Hover/tap toont uitleg:
> "Bezetting in de zichtbare periode van de tijdlijn. Bewoners lossen elkaar af, dus het kan tijdelijk vol zijn en daarna weer ruimte hebben."

### Sparkline blijft — maar subtieler en optioneel

Onderaan de tegel een dunne (16px hoge) tijdlijn-balk in housing-color, rood op overboekte dagen. Géén legenda, géén nadruk — puur visuele aanvulling op de tekstregels. Wie het niet snapt, leest gewoon de tekst.

## Implementatie

**Vervangen**: `src/components/personeel/HousingOccupancyStrip.tsx`
- Bereken per housing:
  - `current` (vandaag bezet)
  - `cap` (capaciteit, kan null zijn)
  - `peakRanges`: aaneengesloten dag-ranges waarin `count >= cap` (drukke periodes), gegroepeerd per maand voor leesbaarheid
  - `firstFreeAfterToday`: eerste dag ≥ vandaag waarop `count < cap`, alleen tonen als nu vol
  - `overbookedRanges`: aaneengesloten ranges waarin `count > cap`
  - `status`: `'free' | 'almost' | 'full' | 'overbooked'`
- Format helpers:
  - `formatPeriodInWords([rangeStart, rangeEnd])` → "juni en juli", "eind juni", "15 t/m 22 juli"
  - Gebruik `date-fns` met `nl` locale

**Tegel-layout**:
```tsx
<div className="rounded-[14px] bg-card border px-4 py-3 space-y-2">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: h.color}} />
      <span className="text-sm font-medium">{h.name}</span>
    </div>
    <div className="flex items-center gap-1.5">
      <Badge variant={statusVariant}>{statusLabel}</Badge>
      <Tooltip>...ⓘ...</Tooltip>
    </div>
  </div>
  <div className="space-y-1 text-sm">
    <div><span className="text-muted-foreground w-12 inline-block">Nu</span> {current} van {cap} plekken bezet</div>
    {peakLabel && <div><span className="text-muted-foreground w-12 inline-block">Druk</span> {peakLabel}</div>}
    {freeLabel && <div><span className="text-muted-foreground w-12 inline-block">Vrij</span> {freeLabel}</div>}
  </div>
  <div className="flex items-end gap-[1px] h-4 opacity-70">
    {/* dunne sparkline */}
  </div>
</div>
```

**Geen wijzigingen aan**:
- `Tijdlijn.tsx` — gebruikt het component al, props blijven hetzelfde.
- Hooks, database.

## Waarom dit beter werkt

- **Plain Dutch**: "5 van 8 plekken bezet" leest zoals iemand het zou zeggen. Geen pijltjes te ontcijferen.
- **Drie vragen beantwoord**: hoeveel nu, wanneer druk, wanneer vrij — dat is wat HRM altijd wil weten.
- **Status in één woord**: badge rechtsboven geeft directe scan-waarde voordat je gaat lezen.
- **Tooltip voor uitleg**: wie zich afvraagt wat het betekent krijgt context, zonder de tegel druk te maken.
- **Sparkline blijft als bonus**: voor wie patronen wil zien, maar verstoort de tekst niet.

## Test (door jou)
1. Tegel toont badge die overeenkomt met situatie (Ruimte/Bijna vol/Vol/Overboekt).
2. Drie regels lezen natuurlijk in het Nederlands.
3. Tooltip op ⓘ legt uit wat de strook toont.
4. Bij slaapplek zonder capaciteit: alleen `Nu: 3 bewoners` zonder badge.
