# Voorraadronde: één chip-model voor herkomst en status

Het groene chipje "op de MEP" werkt goed. Dat model wordt de standaard voor de hele voorraadronde, zodat elke regel in één oogopslag twee dingen vertelt: **waar het vandaan komt** en **of er al iets voor loopt**.

## Wat er nu is (onderzoek)

In de ronde staan nu door elkaar:
- amber tekstchips onder de naam: "2 bakken onderweg", "op het bestelbord"
- groen chipje rechts: "op de MEP"
- amber chipje rechts: "bijvullen"
- amber kaart met vrachtwagen-icoon bij een openstaande bestelling
- aan het einde de bonnen: bijvullen, MEP, Midsland, bestelbord, vriescel, koelcel, magazijn

Herkomst (Midsland, vriezer, zelf maken, ingekocht, snijden) is per product wél bekend, maar zie je tijdens het tellen nergens. Juist bij de koelcel- en vriesceltelling is dat de vraag die het team stelt: "moet ik dit zelf maken of komt dit uit Midsland?"

## Het model

Elke productregel krijgt maximaal twee chips, altijd op dezelfde plek:

```text
[ Wortelspread                    uit Midsland ]   [ op de MEP ]
  reserve 1 bakje · GN 1/6
```

- **Links, direct onder/naast de naam: herkomstchip (rustig grijs).** Vast per product, verandert nooit: "uit Midsland", "uit de vriezer", "zelf maken", "snijden", "ingekocht", "uit het magazijn". Alleen zichtbaar op de niveaus waar het iets uitmaakt (koelcel, vriescel, magazijn, werkblad) — niet op elke werkbanklade, want daar is de keten al zichtbaar in de aanvulling.
- **Rechts in de kopregel: statuschip (groen, "hier loopt al iets").** Precies één tegelijk, in deze volgorde van voorrang: "onderweg" > "op het bestelbord" > "op de MEP". Zo staan er nooit drie labels naast elkaar.
- **Amber blijft alleen waar actie nodig is:** de "Binnengekomen / Nog niet binnen"-kaart en het chipje "bijvullen". Verder verdwijnt amber uit de kopregel.

Waarom zo: groen = al geregeld, rust; grijs = naslag; amber = jij moet nu iets doen. Drie betekenissen, drie kleuren, geen uitzonderingen.

## Scheiding in de keten blijft intact

- De chips zijn puur weergave. Tellen, tekorten, doorschuiven naar het volgende niveau, bonnen en bestelregels veranderen niet.
- "onderweg" blijft alleen op het niveau waar de bestelling echt hoort (Midsland-regel), zoals nu.
- De herkomstchip toont de bron van dát niveau, niet die van een dieper niveau — de vriescel van wortelspread blijft "zelf maken", de koelcelregel "uit de vriezer".
- Aan het einde van de ronde blijven de aparte lijsten (bijvullen, MEP, Midsland, bestelbord) ongewijzigd; de chips zijn er zodat je tijdens het tellen al weet waar iets belandt.

## Technisch

- Alleen `src/components/foh/VoorraadRonde.tsx`: `statusChips` vervangen door één `statusChip` (voorrangsvolgorde) in dezelfde stijl als het bestaande `mepChip`; nieuw `herkomstChip` naast de formaatregel, `bg-muted`, 11px, afgerond.
- Herkomstteksten als korte variant naast de bestaande `BRON_LABEL` in `src/hooks/useKoelcelCheck.ts` (nieuwe constante `BRON_KORT`), zodat beheer en ronde dezelfde bron gebruiken.
- Geen database-, RLS- of migratiewerk; geen wijziging aan bestellen, MEP of printen.
- Verificatie: typecheck + build, en in de preview de voorraadronde doorlopen met een product uit Midsland, een product met openstaande bestelling en een product met MEP-taak van vandaag.
