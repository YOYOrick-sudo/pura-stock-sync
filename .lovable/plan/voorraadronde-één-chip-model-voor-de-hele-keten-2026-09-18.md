# Voorraadronde: één chip-model voor de hele keten

Het groene chipje "op de MEP" werkt. Dat wordt nu het model voor álle meldingen in de voorraadronde, met een strakke scheiding tussen drie betekenissen.

## Wat er nu staat (onderzocht)

Tijdens het tellen kun je nu deze meldingen tegenkomen:

| Melding | Nu | Waar vandaan |
|---|---|---|
| "2 bakken onderweg" | amber tekst onder de naam | openstaande Midsland-bestelling |
| "op het bestelbord" | amber tekst onder de naam | open bestelbordregel |
| "op de MEP" | groen chipje rechts | open MEP-taak van vandaag |
| "bijvullen" | amber chipje rechts | bakje onder de vulnorm |
| afwijkende telling | amber rand + amber vinkje | je hebt iets anders geteld dan het doel |
| Binnengekomen / Nog niet binnen | amber kaart met vrachtwagen | er staat een bestelling open |

Wat je **niet** ziet tijdens het tellen: waar dit product vandaan komt. Dat zit wel in het systeem (bron per product en de keten werkbank → koelcel → vriezer/magazijn), maar verschijnt pas op de aanvulbon aan het einde. Juist bij de koelcel- en vriesceltelling is dat dé vraag: "moet ik dit zelf maken, komt dit uit de vriezer, of komt het uit Midsland?"

Daarnaast is de vormgeving los gegroeid: de ronde gebruikt losse amber-kleuren, terwijl de MEP-lijst met de standaard badges werkt. Drie kleuren betekenen nu deels hetzelfde.

## Het model: drie betekenissen, drie stijlen

```text
[ Wortelspread            uit Midsland ]              [ onderweg ]
  1 bak · GN 1/6
```

1. **Ketenchip — grijs, links onder de naam.** Vast per product: waar de aanvulling vandaan komt als het niet op peil is. Teksten volgen de bestaande keten: "uit de koelcel", "uit de vriescel", "uit het magazijn", "uit Midsland", "zelf maken", "snijden", "bestellen". Dit is naslag, geen actie.
2. **Statuschip — groen, rechts in de kopregel.** "hier loopt al iets": onderweg / op het bestelbord / op de MEP. Er staat er altijd maar één, in die voorrangsvolgorde, zodat er nooit drie labels naast elkaar hangen.
3. **Amber — alleen waar jij nu iets moet doen.** Blijft bij "Binnengekomen / Nog niet binnen", "bijvullen" en de afwijkende telling. Verdwijnt als kleur voor mededelingen.

Regel voor het systeem: **grijs = informatie, groen = al geregeld, amber = actie nodig.** Die regel gaat ook op de aanvulbon en de eindlijsten gelden, zodat "vandaag maken" daar amber blijft en de rest groen.

### Waar de ketenchip wel en niet verschijnt

Alleen waar hij iets toevoegt: koelcel, vriescel, magazijn en het werkblad (toppings). In de koelwerkbanklades niet — daar is de aanvulling zelf al de boodschap en zou de chip alleen ruis toevoegen op een klein scherm.

## Scheiding in de keten blijft intact

- Puur weergave. Tellen, tekorten, doorschuiven naar het niveau eronder, MEP-prioriteit, batches, bestelverpakkingen en de eindbonnen veranderen niet.
- De ketenchip toont het niveau direct eronder, niet de diepste bron: de koelcelregel van wortelspread zegt "uit de vriescel", de vriescelregel zegt "zelf maken". Precies zoals de bon het ook doorzet.
- "onderweg" blijft alleen op het Midsland-niveau, zoals nu.
- Producten zonder gekoppeld niveau eronder tonen hun eigen bestemming (zelf maken / snijden / uit Midsland / bestellen).

## Technisch

- Nieuw klein hulpcomponent `VoorraadChip` in `src/components/foh/VoorraadRonde.tsx` met drie varianten (`info` = `bg-muted text-muted-foreground`, `klaar` = `bg-primary/10 text-primary`, `actie` = `bg-amber-400/15 text-amber-700 dark:text-amber-300`), 11px, afgerond — alle bestaande chips gaan hier doorheen.
- `statusChips` wordt één `statusChip` met voorrang onderweg > bestelbord > MEP; de amber-teksten onder de naam vervallen.
- Ketenchip afgeleid van `vervolgactieVoorRegel(item, items)` uit `src/hooks/useKoelcelCheck.ts`: bij `soort: 'niveau'` het bestaande `HERKOMST_LABEL` van het onderliggende niveau, anders een korte variant van `bestemmingVoorBron` ("zelf maken", "snijden", "uit Midsland", "bestellen"). `TelRegel` krijgt daarvoor één extra prop; de labelteksten komen als constante in de hook, zodat beheer en ronde dezelfde bron gebruiken.
- Geen database-, RLS- of migratiewerk; geen wijziging aan bestellen, MEP-taken of printen.
- Verificatie: typecheck + build, en in de preview de ronde doorlopen op tabletbreedte met een Midsland-product (rode kool), een product met openstaande bestelling, een product met MEP-taak van vandaag en een vriescelregel — en controleren dat de aanvulbon erna identiek is aan nu.
