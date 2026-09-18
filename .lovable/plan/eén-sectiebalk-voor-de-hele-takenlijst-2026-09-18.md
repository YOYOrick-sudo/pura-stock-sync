# Eén sectiebalk voor de hele takenlijst

## Wat het onderzoek laat zien
Er zijn nu drie verschillende "kopbalken" in dezelfde lijst:

| | Takensectie ("Samen / Laatste loodjes") | Voorraadronde | Au bain-marie (nu) |
|---|---|---|---|
| Hoek | 12px | 14px | 14px |
| Rand + schaduw | rand + fijne schaduw | rand, geen schaduw | rand, geen schaduw |
| Binnenruimte | 12px / 14px | 14px / 12px | 14px / 12px |
| Icoon | geen | rond icoontje links | rond icoontje links |
| Titel | 15px, vet | 15px, vet | 15px, vet |
| Stand | pil rechts "0/14" | tekstregel eronder "0/15 onderdelen geteld" | tekstregel eronder |
| Inklappen | nee | pijltje rechts | pijltje rechts |
| Ruimte eronder | 12px, sectie 32px | 8px, geen vaste sectieruimte | idem |

Au bain-marie is dus wél gelijk aan de voorraadronde, maar die twee wijken samen af van de takensecties — daar viel het oog van de gebruiker op. De takensectie is de meest voorkomende vorm en wordt de standaard.

## Wat er komt: één vorm
Alle drie de balken (takensecties, voorraadronde, au bain-marie) worden identiek:

- Zelfde hoek (12px), zelfde grijze vlak, zelfde rand en fijne schaduw, zelfde binnenruimte.
- Titel links in dezelfde vette letter, zonder icoontje ervoor — rustiger en gelijk aan de takensecties.
- De stand altijd rechts als pil: "0/14", "0/15", "2/4". De losse regel "0/15 onderdelen geteld" vervalt; de volledige uitleg ("onderdelen geteld", "stickers geprint") komt bij het uitklappen te staan.
- Is een blok af, dan kleurt de pil groen met een vinkje — hetzelfde signaal bij alle drie.
- Blokken die kunnen in- en uitklappen (voorraadronde, au bain-marie) houden het pijltje, rechts naast de pil. Takensecties krijgen dat niet, die klappen niet in.
- Zelfde ruimte boven en onder elke balk als bij de takensecties, zodat het ritme van de lijst overal gelijk is.

## Wat er niet verandert
Tellen, aanvulbon, bestellingen, MEP, stickers, weggooien, dagregistratie — alles blijft werken zoals nu. Alleen de omlijsting verandert. Geen database- of instellingenwijziging.

## Technisch
- Nieuw gedeeld component `src/components/foh/SectieBalk.tsx`: props `titel`, `klaar`/`totaal` (of vrije `stand`), `afgerond`, optioneel `open` + `onToggle`. Stijl één-op-één overgenomen uit `FohTasks.tsx` regels 3558–3590 (radius 12, `hsl(var(--muted))`, `1px solid hsl(var(--border))`, `boxShadow 0 1px 2px hsl(var(--foreground)/0.03)`, padding `12px 14px`, titel 15px/700, pil 12px/600 `borderRadius 999px`), aangevuld met een `ChevronDown` (rotate bij open) wanneer `onToggle` is meegegeven, en een groene pil + `Check` bij `afgerond`. Tikdoel minimaal 44px hoog.
- `FohTasks.tsx`: de inline kop in `renderDepartmentSection` vervangen door `SectieBalk` (zelfde uiterlijk, geen gedragswijziging). De wrappers rond `VoorraadRonde` en `BainMarie*` krijgen `marginBottom: 32px` zodat de tussenruimte klopt.
- `VoorraadRonde.tsx` (regels 962–991): eigen `kop` vervangen door `SectieBalk` met `klaarAantal`/`alleSleutels.length`; de toelichting "onderdelen geteld" verhuist naar de eerste regel binnen het uitgeklapte blok.
- `BainMarie.tsx`: lokale `SectieBalk` verwijderen en het gedeelde component gebruiken; `Uitleg` met info-icoon blijft binnenin.
- Verificatie: typecheck + build, en in de preview de West-keukenlijst (openen én sluiten) op tabletbreedte bekijken — de drie balken moeten exact even hoog zijn en op dezelfde lijn beginnen en eindigen; dit meet ik in pixels na.
