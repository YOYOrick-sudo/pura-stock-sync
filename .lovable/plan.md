# Ontwerpregels vastleggen + Bestellijst rustiger maken

## Waar het misgaat
1. **Regels staan alleen in tekst, niet in bouwstenen.** "Gebruik het design system" zegt niet hoe een paginakop, een sectiekop, een lijstrij of een samenvattingskaart eruit ziet. Elke module bouwt die daarom zelf, telkens net anders.
2. **Er zijn geen paginabouwstenen.** De app heeft wel knoppen, kaarten en tabellen, maar geen vaste "paginakop", "sectie", "lijstrij", "kengetalkaart" of "lege staat". Op die laag verschillen de modules van elkaar.
3. **Losse stijlen sluipen erin.** Ongeveer 100 schermen gebruiken eigen kleuren, radiussen of lettergroottes buiten de tokens.
4. **Op de Bestellijst zelf** (screenshot):
   - De kolomkoppen "Product · Aantal · Prijs" staan boven elke leveranciersgroep, dus steeds opnieuw.
   - Groepskoppen ("Bidfood 1 —") zijn grijs en klein, en daardoor zwakker dan de rijen eronder.
   - Hetzelfde getal staat twee keer in beeld: 18 in de tab en in de kaart, en € 184,27 in twee kaarten.
   - Rechts staan drie kaarten met elk hun eigen opbouw. "zonder prijs" is groen terwijl het een waarschuwing is.
   - De invoerregel heeft vijf losse vlakken, met evenveel gewicht als de primaire knop.
   - "Bestellijst" is een grote eigen titel. Dat botst met de regel dat er geen H1 komt.
   - De rijen zijn ongeveer 88px hoog in plaats van rond de 48px.

## Wat ik voorstel

### A. Regels concreet maken
- Ik maak één regelblad met het paginaskelet, de typografie per niveau (paginatitel alleen in de app-header, sectiekop, groepskop, rij, meta), rijhoogte 44–48px, afstanden (4 / 8 / 12 / 16), wanneer je een kaart gebruikt en wanneer een tabel, statuskleuren (groen = goed, oranje = let op, grijs = neutraal) en "elk getal maar één keer in beeld".
- Dat regelblad komt in de projectkennis en in het projectgeheugen. Op /design-system komt een sectie "Paginapatronen" met voorbeelden.

### B. Vaste paginabouwstenen
- Kleine, herbruikbare onderdelen: `SectieKop` (titel + teller + i-icoon + één actie), `GroepKop` (naam, aantal, totaal), `LijstTabel` (één keer kolomkoppen, vaste rijhoogte), `KengetalKaart` (icoon, label, groot getal, max. één badge) en `LegeStaat`.
- Alleen opgebouwd uit bestaande shadcn-onderdelen en tokens.

### C. Bestellijst als eerste module ermee
- De grote titel "Bestellijst" verdwijnt; de titel en de locatie staan alleen in de app-header.
- Eén tabel per tab met de kolomkoppen één keer bovenaan. Leveranciers zijn tussenrijen (vet, met rechts aantal en totaal). Rijen worden 48px.
- De invoer wordt één samengestelde balk: zoekveld + aantal met −/+ + eenheid. "Erbij" wordt een icoonknop in de balk, zodat "+ Product" de enige primaire knop blijft.
- De rechterkolom krijgt één kaart "Overzicht" met drie getallen naast elkaar (Open €, Onderweg, Zonder prijs als oranje dot) en daaronder de leverancierstabel. Er worden geen getallen herhaald die al in de tabs staan.
- "zonder prijs" krijgt de waarschuwingskleur in plaats van groen.
- De tabs Advies, Tellen en Onderweg krijgen dezelfde tabelopbouw.

## Volgorde en grenzen
1. Eerst A en B (regels + bouwstenen), daarna C. Andere modules volgen later één voor één, alleen op jouw verzoek.
2. Het blijft bij de weergave: geen database, rechten, edge functions of hooks. Mutaties, telopslag en het rollenplan blijven ongemoeid. Er wordt niet gepubliceerd.

## Technisch
- Nieuw: `src/components/layout/` (`SectieKop`, `GroepKop`, `LijstTabel`, `KengetalKaart`, `LegeStaat`), plus een sectie in `DesignSystem.tsx`.
- Aangepast: `Bestelbord.tsx` en de componenten in `kitchen/bestelbord/`. In `Voorraadproef.tsx` alleen de weergave; `bewaar()` blijft letterlijk gelijk.
- Een `AGENTS.md`-regel: nieuwe schermen bouwen met de paginabouwstenen uit `components/layout`.
- Controle: build, `bun test src` en schermafdrukken op 1280 en 390.
