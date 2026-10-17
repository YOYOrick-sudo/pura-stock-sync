# Duidelijk laten zien hoe vol de bak minstens moet zijn

## Waarom het nu vaag is
- Het bakje is te klein (18px) om op de iPad goed te zien.
- Je ziet een gevulde bak, maar niet dat dit het **minimum** is. Het lijkt op "zo vol is hij nu".
- Zonder tekst weet je niet of half groen "half" of "bijna leeg" betekent.

## Nieuwe weergave: een bak met een vulstreep, zoals op een maatbeker
```text
 ┌──────┐
 │      │
 │- - - │  ← stippellijn = minimum
 │▓▓▓▓▓▓│
 └──────┘  Min. ½      Te weinig: aanvullen uit koelcel
```
1. **Groter bakje** (ca. 28x24px), zijaanzicht van een GN-bak, open bovenkant.
2. **Stippellijn op de minimumhoogte** met de vulling tot aan die lijn. Zo lees je: "het moet tot hier komen". Bij vol staat de lijn bovenaan.
3. **Korte vette tekst ernaast** die je in één woord leest: "Vol", "Min. ½" of "Bodem". Niet de lange zinnen van eerst, wel genoeg om geen twijfel te laten.
4. **Te weinig: ...** blijft rechts als tekst, zoals nu.
5. Het info-icoon blijft: "Komt de bak niet tot de streep? Vul aan, of tik Naar MEP / Bron op."

Waarom zo: koks kennen de vulstreep van maatbekers en sausflessen. Vergelijken met een streep gaat sneller dan een tekst lezen, en het korte woord haalt de laatste twijfel weg.

## Wat niet verandert
Knoppen, keten, instellingen en opslag blijven hetzelfde.

## Technisch
- `VulPeil.tsx`: 28x24px, rand `border-muted-foreground/50`, vulling `bg-primary/70` tot het percentage, stippellijn `border-dashed border-foreground/60` op die hoogte.
- `sluitronde.ts`: nieuwe `peilKort(vulnorm)` → "Vol" / "Min. ½" / "Bodem", met test per vulnorm.
- `AfvinkRonde.tsx`: bakje + kort woord (13px, semibold, foreground) + "Te weinig: ..."; InfoKnop-tekst bijwerken.
- Verificatie: tests en screenshots van Sluiten-tab Keuken West op iPad (1024) en telefoon, en het bakje apart vergroot bekijken.
