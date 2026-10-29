# Gerechten als rustige tabel + tabel als standaard in het design system

## Wat je straks ziet
Het scherm Keuken → Gerechten krijgt dezelfde rustige tabelstijl als je tweede voorbeeld: één regel per gerecht, vaste kolommen, alles netjes onder elkaar.

Kolommen (per categorie-blok, zoals nu):

| Gerecht | Kaart | Prijs | Bevat | Kan bevatten | (acties) |
|---|---|---|---|---|---|

- **Gerecht**: naam (vet), daaronder één regel omschrijving in klein grijs (afgekapt). "Vegan" en "Nog te controleren" worden kleine stipjes/labels op dezelfde regel, niet meer los eronder.
- **Kaart**: de kaarttekens (VG, GL, N...) naast elkaar in één kolom, uitleg blijft bij tikken/hover.
- **Prijs**: rechts uitgelijnd, "16,60 / 25,00" met daaronder klein "klein / groot".
- **Bevat**: allergenen-chips op één rij (gecontroleerd = rood, uit recept = lichter met stip "Uit recept").
- **Kan bevatten**: sporen in een eigen kolom, zodat de Bevat-kolom niet meer dubbel gevuld is.
- Leeg = "—" in grijs, zoals in je voorbeeld. Orange stip + korte tekst bij "Nog geen recept gekoppeld" of ontbrekende allergeneninfo.
- Vaste rijhoogte (~56px), dunne lijnen tussen rijen, kopregel in licht grijs met normale (niet hoofdletter) koppen.
- Bewerken/archiveren blijven rechts (alleen managers), 44px tikdoelen.

Op telefoon (smal scherm) vallen Kaart en Kan bevatten weg uit de tabel en komen onder de naam; tabel scrolt nooit horizontaal.

Veiligheid verandert niet: bij "Moet vrij zijn van" blijven ongecontroleerde gerechten in het blok "Niet te garanderen — eerst navragen in de keuken".

## Design system
- Op /design-system wordt het voorbeeld "Tabel" vervangen door deze stijl als standaard: kopregel licht grijs, normale koppen, rijen 52-56px, "—" voor leeg, status als stip + tekst, pijltje/acties rechts.
- Er komt een gedeelde tabel-opmaak (lichte variant op het bestaande tabel-onderdeel) die Gerechten gebruikt; andere schermen pas ik niet aan tenzij je dat vraagt.

## Niet aangeraakt
GerechtDialog, database, bestellijst, tellen, takenlijst, MEP. Geen nieuwe libraries.

## Technisch
- Nieuw: `src/components/ui/data-table.tsx` (wrappers rond bestaande `Table*` met standaardklassen: `rounded-polar-lg border`, header `bg-muted/50 text-sm font-medium normal-case`, rij `h-14`, `EmptyCell` "—", `StatusDot`).
- `src/pages/kitchen/Gerechten.tsx`: div-grid rijen vervangen door `DataTable`; kolommen `hidden md:table-cell` voor Kaart/Kan bevatten.
- `src/components/kitchen/GerechtKaartInfo.tsx`: `GerechtReceptAllergenen` splitsen in bevat- en sporen-deel.
- `src/pages/DesignSystem.tsx`: sectie Tabel bijwerken met de nieuwe standaard.
- Controle met screenshots desktop/tablet/telefoon; bestaande tests `gerecht-labels.test.ts` opnieuw draaien.
