# Design system grondig herzien + Bestellijst als eerste make-over

Gebaseerd op drie reviews: (1) shadcnblocks, 18 app-categorieën met broncode en schermen, (2) ons eigen design system, (3) de Bestellijst-pagina. Kleuren, vormen en afronding blijven zoals ze zijn.

## 1. Wat de reviews vonden

**shadcnblocks, wat bij ons past:**
- Eén dichtheid, overal hetzelfde: werkvlak 16px rand, 16px tussen blokken, 8px tussen kleine onderdelen.
- Tabel: kolomkop één keer, klein en gedempt; getallen rechts met vaste cijferbreedte; voetregel met totaal links.
- Leeg resultaat: kolomkoppen blijven staan, één gecentreerde regel eronder.
- Filterbalk boven de tabel (zoeken links, filters ernaast); totalen en acties onder of rechts.
- Status: één korte badge met tekst, nooit alleen kleur.
- Rij-acties: één vaste plek rechts ("…"); de rij zelf opent details.
- Kengetal: klein label, groot getal, daaronder hooguit 3 regels uitsplitsing.
- Formulier: label boven het veld, 8px label/veld, 16px tussen velden, 24px tussen secties; Annuleren + Opslaan rechtsonder.
- Instellingen: tekst links, schakelaar rechts, lijn ertussen.
- Voortgang/stappen boven de inhoud (besteld → onderweg → geleverd).
- Afvinken: cirkel/vinkje + doorgestreepte tekst.

**Bewust anders dan shadcnblocks (door keuken/iPad):**
- Geen zijwaarts scrollende tabellen: op de telefoon worden rijen gestapeld (naam boven, aantal en datum eronder).
- Tikdoel minimaal 44px (shadcnblocks gebruikt 32–36px).
- Geen hover-uitleg; uitleg alleen via tikken (info-icoon of lade).

**Ons design system, gevonden fouten:**
- Badges verwijzen naar kleuren die niet bestaan (pv-success/warning/info), dus groen/oranje valt soms weg.
- Hover van de secundaire knop verwijst naar een niet-bestaande kleur.
- Tab-knoppen mogen 40px zijn, terwijl de regel 44px zegt.
- Lege staat en kengetalkaart zijn 20px rond in plaats van 16px.
- Standaardkaart heeft kop met 24px rand en grote titel; onze patronen 16px en klein. Twee standaarden.
- Lettertype `font-heading` bestaat niet.
- De automatische controle laat nieuwe fouten toe in bestanden die al op de uitzonderingslijst staan.
- Vaak herhaald zonder bouwblok: zoekveld met icoon (4x), lege melding (4x), klikbare instellingsrij (7x), genummerde stap (15x), kaart-opmaak (10x).

**Bestellijst, belangrijkste punten:**
- Telefoon: vaste kolommen nemen 216–224px, productnamen worden afgekapt; tabs tonen alleen icoon + getal.
- "Alles geleverd" is 36px en heet op de telefoon alleen "Alles".
- Leverdatum verdwijnt op de telefoon.
- Geen paginakop; "+ Product" springt alleen naar het invoerveld (twee ingangen).
- Invoerveld: aantal, verpakking en knop wringen op smal scherm.
- Status op zes manieren (vinkje, rode badge, stip, "op bord"-tekst, cirkel).
- Overzicht verdwijnt onder iPad-breedte.
- Hetzelfde lege vinkje betekent "besteld" en elders "geleverd".
- Menu "…" verschilt per tabel.
- Getallen dubbel (tab-teller + kaart-teller).
- Knoppen in vier hoogtes, afstanden wisselen tussen 12 en 16px.

## 2. Nieuwe regels (één bron, met Goed/Fout op /design-system)

**Opbouw**
1. Pagina = paginakop (in app-balk) → optionele filterbalk → werkvlak. Rechts op lg+ één overzichtskaart.
2. Afstand: 16px tussen blokken, 12px binnen kaarten, 8px tussen kleine onderdelen. Geen andere waarden.
3. Eén primaire knop per pagina, op een vaste plek. Geen tweede ingang naar dezelfde actie.

**Lijsten**
4. Elke lijst is een tabel in een kaart: kaartkop (icoon, titel, teller, één actie) → kolomkoppen één keer → groepsrijen → voetregel met totaal.
5. Getallen rechts, vaste cijferbreedte, eenheid klein erachter.
6. Telefoon: geen zijwaarts scrollen; rij stapelt in twee regels, belangrijke info (datum, te laat) blijft zichtbaar.
7. Leeg: kolomkoppen blijven, één rustige regel. Laden: grijze rijen. Fout: één regel + Opnieuw.
8. Lege of nul-groepen ingeklapt onderaan.

**Acties**
9. Rij tikken = details (lade). Overige acties alleen in "…" rechts, overal dezelfde volgorde.
10. Vinkje links betekent altijd "klaar met deze stap"; de kolomkop of stapnaam zegt welke stap.
11. Knoppen: primair (gevuld), secundair (rand), stil (ghost), gevaar. Hoogte 44px op werkschermen; 36px alleen binnen een groepsrij-kop die zelf 44px is — vervalt: groepsacties ook 44px.

**Status en getallen**
12. Maximaal één statusbadge per rij, met tekst, in een vaste kolom. Oranje = let op, rood = fout, groen = klaar.
13. Een getal staat maar op één plek in beeld.
14. Kengetal: label, groot getal, hooguit drie uitsplitsingen.

**Tekst en apparaat**
15. Geen uitleg in beeld; info-icoon of lade. Geen hover-afhankelijkheid.
16. Tabs altijd met korte tekst, ook op de telefoon.
17. Formulier: label boven veld, Annuleren + Opslaan rechtsonder.

Oude regels die verdwijnen of worden samengevoegd: 20/14px-afronding, losse pill-tabs, "36px compact knop", dubbele regels in geheugen en projectkennis.

## 3. Bouwblokken (components/pura) aanvullen en rechttrekken

- Herstellen: badge-kleuren, secundaire knop-hover, tabs 44px, afronding lege staat/kengetal 16px, standaardkaartkop gelijk aan ons patroon, `font-heading` weg.
- Nieuw: `PaginaKop`, `TabelVoet`, `RijMenu`, `StatusKolom`, `StapelRij` (telefoonweergave van een tabelrij), `Stappen` (besteld → onderweg → geleverd), `ZoekVeld`, `InstellingRij`, `FormKaart`, `GenummerdeStap`, `KengetalVerdeling`.
- Bestanden opsplitsen per familie (pagina, lijst, kaarten, formulier, meldingen); bestaande namen blijven werken.

## 4. Design system-pagina

- Opsplitsen per onderdeel: Start, Maten, Bouwblokken, Recepten, Regels, Controlelijst.
- Vier paginarecepten met werkend voorbeeld: Lijstpagina (Bestellijst), Werklijst/afvinken (Taken, MEP), Instellingen/beheer, Overzicht (Dashboard).
- Start begint met "Welk type pagina bouw je?" en verwijst naar het recept.
- Controlelijst van ~12 punten voor oplevering, gelijk aan de regels.

## 5. Make-over Bestellijst (eerste toets)

- Tabs met tekst op elke breedte, 44px; teller alleen in de tab, niet nogmaals in de kaart.
- "+ Product" is de enige primaire knop en opent de invoer; invoer op telefoon in twee regels (product / aantal + verpakking + Toevoegen).
- Op het bord, Advies, Onderweg, Geleverd: dezelfde tabel-in-kaart met voetregel en totaal; op telefoon `StapelRij` met datum en "te laat" zichtbaar.
- Eén statuskolom met één badge; vinkje links met duidelijke stapnaam (Besteld / Geleverd).
- Overal hetzelfde "…"-menu (Bewerken, Leverancier, Verwijderen); Geleverd: Terugzetten in het menu.
- "Alles geleverd" 44px met volledige tekst.
- In de bewerklade bovenaan de stappen besteld → onderweg → geleverd (alleen tonen, uit bestaande gegevens).
- Overzicht onder iPad-breedte als inklapbare kaart bovenaan.
- Tellen-tab: zelfde rijen, statusbadge in de kolom, uitleg naar info-icoon.

## Grenzen
Alleen schermen en bouwblokken. Geen database, functies, berekeningen of mutaties; bestaande handlers en opslag letterlijk gelijk. Geen kleuren, fonts, afronding wijzigen. Rollenplan niet aanraken. Niet publiceren. Andere modules niet ombouwen; alleen de gedeelde reparaties (badge-kleur, knop-hover, kaartkop) werken overal door — dat wordt per pagina gecontroleerd.

## Risico
- Badge- en kaartkopherstel verandert ongemerkt het uiterlijk op andere pagina's (Taken, HR, Kassa). Ik maak vóór en na screenshots van de 8 meest gebruikte pagina's.
- Gestapelde rijen op de telefoon worden hoger; lijsten van 18+ regels scrollen langer. Daarom blijft één rij per product, alleen de meta-regel eronder.

## Technisch
- `components/ui/badge.tsx`, `button.tsx`, `card.tsx`: alleen tokenverwijzingen en kop-padding/titelgrootte.
- `components/pura/`: `pagina.tsx`, `lijst.tsx`, `kaarten.tsx`, `formulier.tsx`, `meldingen.tsx`, `index.ts`; `patronen.tsx` blijft als doorverwijzing.
- `pages/design-system/*` per sectie; `DesignSystem.tsx` als dunne schil.
- `designregels.test.ts`: telling per bestand die alleen mag dalen; nieuwe controles op `pv-`-kleuren, `font-heading`, `min-h-10` in tabs, imports uit components/polar in nieuwe bestanden.
- Geheugen (`design/paginapatronen`, Core-regels) en AGENTS.md bijgewerkt naar één set regels; roadmap-taak toegevoegd.
- Na bouw: tests, screenshots /design-system en Bestellijst op 390/834/1280px.
