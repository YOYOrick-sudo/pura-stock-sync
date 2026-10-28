# MEP: taak toewijzen met één tik (West en Midsland)

## Wat je krijgt
- Op elke openstaande taak in de MEP-lijst staat rechts, naast het prullenbakje, een rond persoonsknopje.
  - Niemand toegewezen: een leeg rondje met een stippellijn en een poppetje.
  - Wel toegewezen: een rondje met de eerste letter van die persoon (bijv. "D" voor Devi).
- Tik erop: er klapt een klein lijstje open met alle keukenmedewerkers van die locatie, elk met een rondje en hun eerste letter, zoals in jouw voorbeeld. Bovenaan staat "Niemand" om iemand weer weg te halen.
- Tik op een naam: dan is de taak meteen toegewezen en gaat het lijstje dicht. Je krijgt een korte melding "Fruitsalade → Devi" met **Ongedaan maken**.
- Werkt in alle drie de weergaven (Alle taken, Per persoon, Per handeling). In "Per persoon" springt de taak direct naar het blok van die persoon.
- Onder de lijst staat een kleine teller "N niet toegewezen", zodat je ziet of er nog iets openstaat zonder naam.
- Afgeronde taken krijgen geen knopje.

## In de praktijk
- Geschikt voor de iPad: het knopje is 44px groot en werkt met tikken, niet met hoveren.
- Slepen naar een persoon in "Per persoon" blijft werken; dit is een snellere tweede manier.
- Risico: per ongeluk de verkeerde naam tikken. Daarvoor is Ongedaan maken er, en je kunt het ook gewoon opnieuw kiezen.
- West en Midsland zien elk alleen hun eigen medewerkers. Er verandert niets aan de opslag.

## Technisch
- `src/pages/kitchen/MepDag.tsx`: nieuw `PersoonKiezer`-component (shadcn `Popover`, bestaande tokens) in `TaakRij`, vóór de prullenbak; `onToewijzen(t, persoonId|null)` prop → `bijwerken.mutateAsync({ id, toegewezen_aan })` + toast met undo (zelfde patroon als bestaande drop-op-persoon).
- Initiaal-avatar: `bg-muted` rondje, actief `bg-primary/10 text-primary`.
- Teller "niet toegewezen" onder de lijst: open taken zonder geldige `toegewezen_aan`.
- Naam in de grijze subregel blijft weg zodra de avatar hem toont (geen dubbele info).
