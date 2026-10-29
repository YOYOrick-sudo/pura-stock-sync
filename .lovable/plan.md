# Mobiele inventaris (< 768px) — alleen inventaris, niets gewijzigd

Statische code-audit, geen schermtest. "Voorlopig" = nog visueel toetsen.
Gebruik: K = kern, R = regelmatig, Z = zelden. Werk: S/M/G = klein/middel/groot.

## Algemene knelpunten (raken veel schermen)
1. **Breakpoint klopt niet**: menu schakelt bij 744px (`use-mobile.tsx`), Tailwind `md` bij 768px. Tussen 744–767px: desktop-zijbalk met mobiele inhoud.
2. **Personeel heeft geen menuknop**: `PersoneelLayout` verbergt de app-header (`hideHeader`) en daarmee de hamburger; `-m-6` kan inhoud afsnijden.
3. **Kleine knoppen**: `size="sm"` = 36px, plus losse `h-8`/32px-knoppen op veel schermen (< 44px).
4. **Dubbele kop**: eigen H1 naast app-header op Receptdetail, Kandidaatdetail, ListManager (Taken beheer), StyleGuide.
5. **Pura-bouwblokken** alleen echt in gebruik op Bestelbord; overige schermen eigen opbouw.
6. Goed al: `Table` scrolt zelf, dialogen passen in het scherm, safe areas aanwezig.

## Schermen

| Route | Bestand (src/pages) | Groep | Gebruik | Mobiele knelpunten | Werk |
|---|---|---|---|---|---|
| `/` | Auth.tsx | – | K | 3 keuzevakken naast elkaar | S |
| `/auth/callback`, `/auth/set-password` | auth/SetPassword.tsx | – | Z | geen gevonden (voorlopig) | S |
| `/dashboard` | Dashboard.tsx | Overzicht | K | afvalkalender 7 kolommen, 32px knoppen; banner kleine knoppen | M |
| `/taken-bediening` | foh/FohModule.tsx (FohTasks) | Overzicht | K | heel groot scherm, veel `sm`-knoppen in beheer/dialogen | G |
| `/taken/beheer` | TakenBeheer.tsx (ListManager) | Overzicht | R | eigen H1 (dubbel), kleine acties | M |
| `/taken/admin` | TakenAdmin.tsx | Overzicht | Z | geen page-container | S |
| `/taken-analyse` | foh/FohAnalytics.tsx | Overzicht | Z | kleine periode-/filterknoppen | M |
| `/kassatelling` | Kassatelling.tsx | Beheer | K | tabs ok (44px); formulieren voorlopig | M |
| `/kas-controle` | KasControle.tsx | Beheer | R | 2e tabel in `overflow:hidden` → afgesneden | M |
| `/mt-punt` | MtPunt.tsx | Beheer | R | actierij stapelt niet | S |
| `/onderhoud` | maintenance/Onderhoud.tsx | Beheer | R | kleine terugknoppen, foto-wis 36px | M |
| `/voorraad` (+4 redirects) | voorraad/Bestellen.tsx | Voorraad (verborgen) | R | kleine actieknop | M |
| `/voorraad/onderweg` | voorraad/Onderweg.tsx | Voorraad | R | voorlopig | M |
| `/voorraad/stand` | voorraad/Stand.tsx | Voorraad | R | voorlopig | M |
| `/settings` | Settings.tsx | Beheer | Z | lange lijst, rijen knellen bij lange tekst | S |
| `/settings/team` | settings/Team.tsx | Beheer | Z | 32px invoer/selects, brede beheertabel | M |
| `/settings/bronnen` | settings/Bronnen.tsx | Beheer | Z | voorlopig | M |
| `/settings/mep` | settings/MepInstellingen.tsx | Keuken/Beheer | Z | 4 tabs (scrollen wel) | S |
| `/settings/keten` | settings/KetenBeheer.tsx | Beheer | Z | 5 tabs, complexe tabellen | M |
| `/settings/koelwerkbank` | settings/KoelwerkbankIndeling.tsx | Beheer (West) | Z | ladegrid op telefoon toetsen | M |
| `/cijfers` | Cijfers.tsx | Beheer (owner) | R | periodekiezer 148px zijstrook + kalender te breed, 28–32px knoppen, veel grafieken | G |
| `/lightspeed/callback` | LightspeedCallback.tsx | – | Z | geen | S |
| `/kitchen/recipes` | kitchen/Recipes.tsx | Keuken | K | rijacties 32px | M |
| `/kitchen/recipes/nieuw`, `/:id/bewerken` | kitchen/RecipeForm.tsx | Keuken | R | knop 40px, invoer `min-w-[160px]`, lang formulier | M |
| `/kitchen/recipes/:id` | kitchen/RecipeDetail.tsx | Keuken | K | eigen H1 (dubbel), portieknoppen 36px | M |
| `/kitchen/ingredienten` | kitchen/Ingredienten.tsx | Keuken | R | zoekveld `min-w-[220px]` | S |
| `/kitchen/gerechten` | kitchen/Gerechten.tsx | Keuken | R | vaste kolommen 110+104px, weinig ruimte naam | M |
| `/kitchen/mep` | kitchen/MepDag.tsx | Keuken | K | 3 tabs zonder scroll, persoonscirkels 32px | M |
| `/kitchen/mep/week` | kitchen/MepWeek.tsx | Keuken (West) | R | weeklabel `min-w-[130px]` in smalle balk | M |
| `/kitchen/mep/oud` | kitchen/MepPlanning.tsx | Keuken (oud) | Z | eigen KitchenLayout, 40px knoppen | M |
| `/kitchen/mep/beheer` | kitchen/MepBeheer.tsx | Keuken (West) | Z | KitchenLayout, 3 lange tabs | M |
| `/kitchen/bestelbord` | kitchen/Bestelbord.tsx | Keuken | K | 5 werkmodi in balk, complexe subtabellen | G |
| `/kitchen/snel-printen` | kitchen/SnelPrinten.tsx | Keuken | K | +/- knoppen 32px | S |
| `/hr` | hr/HrInbox.tsx | – (niet in menu) | R | 3 tabs met tellers in vast grid | M |
| `/hr/applicants/new` | hr/ApplicantForm.tsx | HR | Z | kleine terugknop, lang formulier | M |
| `/hr/applicants/:id` | hr/ApplicantDetail.tsx | HR | R | eigen H1 (dubbel), ActionBar `sm` | M |
| `/hr/housing` | hr/HousingPlanner.tsx | HR | Z | kleine knoppen, tijdlijn voorlopig | M |
| `/hr/housing/new` | hr/HousingForm.tsx | HR | Z | kleine terugknop | S |
| `/personeel` | personeel/PersoneelLayout + Tijdlijn | – (niet in menu) | R | geen menuknop, `-m-6`, 36px Vandaag | G |
| `/personeel/wonen`, `/wonen/:id` | personeel/Wonen(Detail).tsx | Personeel | R | erft menuprobleem, kleine kameracties | M |
| `/personeel/collegas` | personeel/Collegas.tsx | Personeel | R | 3 tabs + tellers zonder scroll | M |
| `/personeel/settings` | personeel/PersoneelSettings.tsx | Personeel | Z | select 200px, kleurknoppen 32px | M |
| `/style-guide`, `/design-preview`, `/design-system` | StyleGuide / DesignPreview / DesignSystem | – | Z | StyleGuide dubbele H1; rest ok | S |
| `*` | NotFound.tsx | – | Z | geen | S |

`/mijn`-routes en EmployeeSidebar bestaan niet (meer) in deze code.

## Huidige mobiele navigatie
- **Header**: `components/polar/Header.tsx` met hamburger (44px), paginatitel (H1, uit `getPageTitle`) en vestigingswissel; datum verdwijnt onder `md`. Safe-top toegepast.
- **Menu**: onder 744px een sheet van links (`min(86vw,320px)`), sluit na kiezen. Daarboven vaste zijbalk. Menugroepen: Overzicht, Keuken, Voorraad (verborgen), Beheer. HR en Personeel staan niet in het menu.
- **Wisselen**: alleen via hamburger → menu-item. Geen onderbalk.
- **Viewport-meta**: `width=device-width, initial-scale=1.0, viewport-fit=cover` (goed).
- **Safe areas**: `--safe-*` in index.css; gebruikt door header, main (links/onder), sheet, dialogen; VoorraadRonde sticky balken.
- **Gedeelde layout**: `SidebarLayout`, `page-container`/`page-stack`, `KitchenLayout` (oude MEP), pura: `KaartKop`, `LijstKaart`, `GroepRij`, `InklapGroep`, `DetailLade`, `Stappen`, `StatusLabel`, `RijMenu`, `TabelVoet` (vrijwel alleen Bestelbord), `bestelbord/CompacteTabel`.

## Voorstel onderbalk (mobiel)
Vijf vaste vakken, afhankelijk van rol:
1. **Start** (dashboard)
2. **Taken** (taken-bediening)
3. **MEP** (kitchen/mep)
4. **Bestellen** (bestelbord)
5. **Meer** → Recepten, Snel printen, Kassatelling, Onderhoud, MT-punt, Gerechten, Ingrediënten, HR, Personeel, Cijfers (owner), Instellingen.

Alternatief: Recepten op plek 3 voor keukenteam, MEP onder Meer. Cijfers/HR/Personeel nooit in de balk (gedeelde tablets).

## Voorgestelde volgorde (latere kleine stappen, apart goedkeuren)
1. Breakpoint 744 → gelijktrekken met 768 (alleen menu, desktop/iPad blijven gelijk vanaf 768) — S, eerst iPad portret (744–767) controleren.
2. Menuknop terug op Personeel — S.
3. Onderbalk + "Meer" — M.
4. Kernschermen: Bestelbord, Taken, MEP-dag, Recepten(detail), Dashboard.
5. Daarna regelmatig, dan zelden.

## Risico's
- Breakpoint aanpassen raakt iPad mini/portret (744px): moet zijbalk houden of bewust wisselen — eerst Yorick laten kiezen.
- Onderbalk neemt hoogte in; sticky balken (VoorraadRonde, Bestelbord) moeten erboven blijven.
- Statische audit: afsnijden/overlopen eerst met schermtest bevestigen (320/375/430/744px) vóór een fix.
