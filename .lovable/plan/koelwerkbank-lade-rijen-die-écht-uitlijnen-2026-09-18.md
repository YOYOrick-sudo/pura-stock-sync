# Koelwerkbank: lade-rijen die écht uitlijnen

## Probleem
In een lade zijn de eerste 4 producten 2-per-rij en de rest 3-per-rij, maar:
- Bij 5 of 8 producten eindigt de laatste rij rafelig: één of twee kleine kaartjes met een leeg gat ernaast (zie Links onder: kiemen-rij sluit niet af).
- Kaartjes met een naam van twee regels zijn hoger dan kaartjes met één regel, waardoor kaartjes binnen één rij niet gelijk zijn.
- Namen worden afgekapt ("Granaata"), wat het onrustig maakt.

## Oplossing
Het raster binnen een lade wordt slimmer, in `src/components/voorraad/LadeGrid.tsx`:

- **Verdeling op basis van het aantal producten.** De eerste 4 blijven 2-per-rij. Voor de rest geldt: precies per 3 indelen als het opgaat; bij 1 resterend product wordt dat één kaart over de volle breedte; bij 2 resterende producten twee kaarten van elk de halve breedte (netjes aansluitend op de rijen erboven). Geen lege gaten meer, bij elk aantal.
- **Gelijke hoogte binnen elke rij**: kaartjes centreren hun naam verticaal en krijgen een vaste minimumhoogte, dus een naam van twee regels maakt de rij niet scheef.
- **Buitenkanten kloppen altijd**: elke rij loopt van linker- tot rechterrand van de lade, met overal dezelfde tussenruimte — ook op iPad-breedte.

Slepen en het instellingenvenster (tik op kaartje) blijven ongewijzigd. Geen data-, database- of migratiewijziging.

## Verificatie
Typecheck + build. Daarna in de preview op iPad-breedte controleren met de echte data: Links boven (7 producten: 2/2/3), Links onder (6: 2/2/2), Rechts onder (meerdere producten) — elke rij vol, alle randen uitgelijnd, geen afgekapte namen die storen.
