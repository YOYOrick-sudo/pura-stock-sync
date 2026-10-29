# Design system: grondig opschonen met shadcnblocks als leidraad

Kleuren, vormen en afronding blijven zoals ze zijn. Het gaat om opbouw, vaste bouwblokken en duidelijke regels, zodat een nieuwe module "in elkaar klikt".

## 1. Wat shadcnblocks laat zien (app-blokken bekeken)
Bekeken: Data Table, Crud Companies, Stats Card, Todo List, Settings (Profile, Notifications, Members), Invite User, Order History/Summary, Sidebar/Application Shell, Timeline, Onboarding, Chart Card.
Terugkerende principes die bij ons passen:
1. **Pagina = kop + werkvlak.** Dunne kop (titel, teller, zoek rechts, één donkere/primaire knop). Nooit meer dan één primaire knop.
2. **Tabel in een kaart**: kolomkoppen klein en gedempt, rijen met alleen een dunne lijn, getallen rechts en tabular, voetregel "x van y" of totaal.
3. **Status als zachte pill in eigen kolom**, maximaal één per rij.
4. **Rij-acties alleen via "…"** rechts; de rij zelf opent details.
5. **Kengetal-kaart**: klein label, één groot getal, daaronder hooguit 3 regels met stip + waarde + %.
6. **Instellingenlijst**: titel + één regel uitleg links, schakelaar rechts, scheidingslijn ertussen.
7. **Formulier in kaart**: label boven veld, twee kolommen waar het kan, knoppen rechtsonder (Annuleren ghost, Opslaan primair).
8. **Ledenlijst**: avatar + naam + ondertekst, rol als select, "…" rechts; zoek links, primaire knop rechts boven.
9. **Takenlijst**: cirkel-vinkje links, titel, gedempte meta-regel, datum met icoon rechts, subtaken inklapbaar.
10. **Stappen/tijdlijn**: horizontale stappen met stip + lijn voor processen (bestelling: besteld → onderweg → geleverd).
11. **Wizard**: "1/5" boven titel, één kolom, één knop onderaan.
12. **Lege ruimte is structuur**: vaste afstand 16px tussen blokken, 12px in kaarten, geen extra tussenkoppen.

## 2. Wat er nu misgaat bij ons
- Bouwblokken staan in één bestand (16 stuks) maar dekken niet: instellingenlijst, formulierkaart, ledenlijst, takenrij, stappen, wizard, kengetal met verdeling, tabelvoet.
- Nog 10 bestanden gebruiken de oude set; maar 3 pagina's de nieuwe.
- De design system-pagina is één bestand van 1357 regels, moeilijk te volgen; regels staan verspreid (pagina, geheugen, projectkennis).
- Er is geen "recept" per paginatype, dus elke module kiest zelf.

## 3. Oplossing
**A. Bouwblokken compleet (components/pura)**
Opsplitsen in losse bestanden per familie (pagina, lijst/tabel, kaarten, formulier, feedback) met één index. Nieuw: `PaginaKop`, `TabelVoet`, `KengetalVerdeling`, `InstellingRij`, `FormKaart`, `PersoonRij`, `TaakRij`, `Stappen`, `WizardKop`, `RijMenu`. Bestaande blijven werken (zelfde namen).

**B. Vier paginarecepten** (elk als werkend voorbeeld op /design-system):
- Lijstpagina (Bestellijst, Ingrediënten, Sollicitanten)
- Werklijst/afvinken (Taken, MEP)
- Instellingen/beheer (Settings, rollen, templates)
- Overzicht/dashboard (Dashboard, Cijfers)
Elk recept: opbouw, welke bouwblokken, wat mag rechts, telefoongedrag.

**C. Regels herschreven tot één korte lijst** (max 15, elk met Goed/Fout-voorbeeld), verdeeld in Opbouw, Lijsten, Acties, Status, Tekst, Telefoon/iPad. Tegenstrijdige of dubbele regels in geheugen en design system verwijderen; één bron.

**D. Design system-pagina** opsplitsen per onderdeel (Start, Maten, Bouwblokken, Recepten, Regels, Controlelijst) in losse bestanden; Start begint met "Welk paginatype bouw je?" → recept.

**E. Toetsen op de Bestellijst**: PaginaKop, TabelVoet met totaal, RijMenu, Stappen in de bewerklade (besteld/onderweg/geleverd). Werking, opslaan en gegevens blijven gelijk.

**F. Bewaking**: bestaande test uitbreiden: geen import uit components/polar in nieuwe bestanden; maximaal één `variant="default"`-knop per pagina-kop (waar meetbaar).

## Grenzen
Alleen schermen en bouwblokken. Geen database, functies of berekeningen. Geen kleuren, fonts, afronding wijzigen. Rollenplan niet aanraken. Niet publiceren. Andere modules worden niet omgebouwd (alleen Bestellijst als toets).

## Technisch
- `src/components/pura/` → `pagina.tsx`, `lijst.tsx`, `kaarten.tsx`, `formulier.tsx`, `feedback.tsx`; `patronen.tsx` blijft als doorverwijzing.
- `src/pages/design-system/*` per sectie; `DesignSystem.tsx` wordt dunne schil.
- `mem://design/paginapatronen.md` + index Core bijgewerkt; AGENTS.md-regel over components/pura vervangen.
- Na bouw: typecheck, tests, screenshots /design-system op 390/834/1280px.
