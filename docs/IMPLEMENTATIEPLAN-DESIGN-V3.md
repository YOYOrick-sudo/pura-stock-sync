# Implementatieplan design v3

Het regelboek is `docs/UI-REGELS.md`. De lagen (tokens, atomen, blokken, overlays, shell) staan op `main` in `d524b4d4`. Dit plan is alleen de scherm-fase. Geen code in deze PR.

Tellingen komen uit een grep op `src` op 6 nov 2026, ná die merge. `text-primary` telt alleen de klasse, niet `text-primary-foreground`. `h-[` telt niet `min-h-[`; die staat apart waar hij meedoet.

## 1. Inventaris

`src/App.tsx` heeft 55 `<Route path>`. Daarvan zijn 4 redirects, 1 vangnet en 1 dev-route. De overige 49 zijn productschermen. Geen van die 49 geeft `titel` aan `Paginakop`. De enige aanroepen van `Paginakop` staan in `pages/design-system/` en ook daar zonder titel (`Canoniek.tsx` regel 116, `ShadcnVoorbeeld.tsx` regel 61).

Redirects, geen scherm en geen PR: `/bestelronde`, `/inkooporders`, `/internal-orders`, `/midsland-bestellingen`.

Dubbele menu-iconen, `src/hooks/useNavigatieItems.ts` regels 9–27: `Settings` op Voorraadketen, Koelwerkbank en Instellingen; `ClipboardList` op Bestelbord, het verborgen Bestellen, en Onderhoud.

Gedeelde blokken die nog niet het boek zijn:

| Blok | Waar | Wat mis is |
| --- | --- | --- |
| `pura/EmptyState.tsx` | Bestelbord, KeukenAdviesTabel, KeukenTelblok, BronnenBlok, drie cijfergrafieken | `text-[`, `shadow-card`, `bg-primary/10` (2), `text-primary` (2). Geïllustreerde lege staat. |
| `kitchen/EmptyState.tsx` | MepDag, MepPlanning, Recipes, Gerechten, KitchenTasks, ServiceTasks, ServiceStaff | `shadow-soft`, `bg-primary/5`, `text-primary`. |
| `pura/StatusBadge.tsx` | bestelbord-tabs, intern onderweg, keten, cijfers, MEP-voor-West, tickets | `bg-primary/10`, `text-primary` (3). Tweede pill naast `ui/badge`. |
| `hr/StatusBadge.tsx` | HrInbox, ApplicantDetail | Eigen statuspill, niet `ui/badge`. |
| `pura/SegmentedTabs.tsx` | TicketList | Actieve tab gevuld primary, `min-h-[`, `text-primary` (2). |
| `pura/StatCard.tsx` | TicketList | `shadow-card`. |
| `pura/PageSubheader.tsx` | TicketList | Commentaar nog op de oude kop. Geen canoniek blok. |
| `ui/table.tsx` regel 7 | elke tabel | Wrapper `overflow-auto`. |
| `components/polar/` (18 bestanden) | importeurs hieronder | Oude set. De map mag weg als de importeurs weg zijn. |

`segmentTabsKlasse` in `pura/patronen.tsx` is niet `SegmentedTabs`. Die klasse blijft de tablijst van het boek.

### Routes

Canonieke blokken die bijna overal horen: `Paginakop` mét titel (`text-xl` op 390, `text-2xl` vanaf 834), één groene knop of geen, `LegeStaatBlok`, `LaadRijen` of `Skeleton` op 48 px, `FoutRegel`. Lijsten worden `Lijstrij`, `Afvinkrij` of `Telrij`. Drie of meer kolommen vanaf `md` worden `Table`, op 390 rijen.

| Route | Bestand(en) | Wat mis is | Blokken |
| --- | --- | --- | --- |
| `/` | `pages/Auth.tsx` | `rounded-[` 1, `text-[` 9, `h-[` 1, `min-h-[` 1, `shadow-card`, `bg-primary/10`, `text-primary` 2. Eigen kaart, geen shell. | Eigen inlog, geen zijbalk. Knoppen 44, radius 12, één groene knop. |
| `/auth/callback`, `/auth/set-password` | `pages/auth/SetPassword.tsx`, `components/auth/StartScherm.tsx`, `HerstelKnop.tsx` | SetPassword: `rounded-[` 3, `text-primary` 4. StartScherm: `text-[` 2, `h-[`, `min-h-[`, `text-primary`. HerstelKnop: `text-[`, `h-[`, `min-h-[`. | Zelfde als login. |
| `/dashboard` | `pages/Dashboard.tsx`, `dashboard/TerschellingEventsCard.tsx`, `WasteCalendarCard.tsx`, `WeatherWidget.tsx`, `IdeaBox.tsx`, `AIWeatherAdvisor.tsx`, `WasteAlertBanner.tsx`, `HandoverCard.tsx` | Dashboard: `text-primary`, polar-import. Events: `rounded-[`, `text-[` 3, `shadow-card`, `text-primary` 2, polar. WasteCalendar: `rounded-[` 6, `text-[` 8, `shadow-card`, `text-primary` 3. Weather: `text-[` 4, `shadow-card`. IdeaBox: `shadow-card`. AIWeather: hex. Handover: `rounded-[` 2, `shadow-card`. | `Paginakop`, `Kengetal` / `Werkkaart`. Geen `PolarKPICard`. |
| `/taken-bediening` | `pages/foh/FohModule.tsx` plus de foh-blokken in de drie PR’s hieronder | De pagina zelf is alleen de shell. De overtredingen zitten in `FohTasks.tsx` en de rondes. | `Paginakop` titel Taken. Tabs van `ui/tabs`. |
| takenlijst op die route | `foh/FohTasks.tsx` (rond regel 931), `ListManager.tsx`, `TaakVervolgPaneel.tsx`, `InfoKnop.tsx`, `SectieBalk.tsx`, `RepeatBadge.tsx`, `TaakBewerkKnop.tsx` | FohTasks: `rounded-[`, `text-[`, polar-import `PolarColors`. TaakVervolg: `text-[` 11, `h-[` 2, `text-primary` 2. InfoKnop: `rounded-[` 2, `bg-primary/10`. | `Lijstrij` of `Afvinkrij`, `Dialoog` voor bewerken. Geen polar-kleuren. |
| afvinkronde | `foh/AfvinkRonde.tsx` | `rounded-[` 5, `text-[` 11, `h-[`, `bg-primary/10` 2, `text-primary` 6. Eigen vinkje `h-[26px]`. | `Afvinkrij`. |
| sluitlijst | `foh/SluitRondeWest.tsx`, `VoorraadRonde.tsx`, `BainMarie.tsx`, `KoelcelCheckBlok.tsx`, `VulPeil.tsx`, `KetenLijstRij.tsx`, `VriezerNaarKoelcelRij.tsx`, `FalafelAanvulRij.tsx` | VoorraadRonde is het zwaarst: `rounded-[` 23, `text-[` 41, `h-[` 3, `bg-primary/10` 2, `bg-primary/5` 3, `text-primary` 14. BainMarie: `text-[` 10, `bg-primary/10`. KetenLijstRij: `text-[` 10. Falafel: `text-[` 11. Vriezer: `text-[` 5. KoelcelCheckBlok heeft geen treffer op de verboden patronen; de opbouw blijft eigen. | `Afvinkrij`, `Telrij`, `Lijstrij`, `Sectiekop`. |
| `/taken/beheer` | `pages/TakenBeheer.tsx` | polar-import `PolarDialog`. | `Dialoog` of `Sheet`. |
| `/taken/admin` | `pages/TakenAdmin.tsx` | Geen treffer. Wel geen `Paginakop`. | `Paginakop`, `Lijstrij`. |
| `/taken-analyse` | `pages/foh/FohAnalytics.tsx` | Geen treffer op de pagina. Wel geen `Paginakop`. | `Paginakop`, `Table` of `Werkkaart`. |
| `/kassatelling` | `pages/Kassatelling.tsx` | `text-primary` 1. | `Paginakop`, `Telrij` of `Table`. |
| `/kas-controle` | `pages/KasControle.tsx` | Geen treffer. Wel geen `Paginakop`. Manager-only. | `Paginakop`, `Table`. |
| `/voorraad`, `/voorraad/onderweg`, `/voorraad/stand` | `pages/voorraad/Bestellen.tsx`, `Onderweg.tsx`, `Stand.tsx`, `components/voorraad/*` | Bestellen: `h-[`, `min-h-[`, `bg-primary/10` 2, `text-primary` 4. Onderweg: `h-[`, `min-h-[`. Stand: geen treffer. LadeGrid: `rounded-[` 14, `text-[` 23, `bg-primary/10` 7. BakmaatUitleg: `text-[` 10. KetenPerProduct: `rounded-[` 3, `bg-primary/10`. ExtraBestellenDialog: `overflow-auto`, `bg-primary/10`. | Module staat uit in het menu (`locations: []`). Toch stylen. `Paginakop`, `Telrij`, `Lijstrij`, `Table`. |
| `/settings` | `pages/Settings.tsx` | `text-primary` 4. Owner. | `Paginakop`, `Lijstrij` of formulier. |
| `/settings/team` | `pages/settings/Team.tsx` | `bg-primary/10`, `text-primary` 3. Owner. | `Paginakop`, `Table`, `Dialoog`. |
| `/settings/bronnen` | `pages/settings/Bronnen.tsx` | Geen treffer. Wel geen `Paginakop`. Owner. | `Paginakop`. |
| `/settings/mep` | `pages/settings/MepInstellingen.tsx` | `text-[` 2, `h-[`, `min-h-[`, `text-primary`. | `Paginakop`, `Formulierveld`. |
| `/settings/keten` | `pages/settings/KetenBeheer.tsx`, `components/keten/*` | KetenBeheer zelf licht. LeveranciersTab: `h-[`, `bg-primary/10`. FixlijstTab, InterneProducten, MethodesTab: `text-[`. ArtikelDialog, MethodeDialog, ArtikelLocatiesTab: `h-[`. | `Paginakop`, `Lijstrij`, `Sheet`. Manager. |
| `/settings/koelwerkbank` | `pages/settings/KoelwerkbankIndeling.tsx` | Geen treffer. Wel geen `Paginakop`. Manager, alleen West in het menu. | `Paginakop`. |
| `/kitchen/bestelbord` | `pages/kitchen/Bestelbord.tsx`, `bestelbord/BestelbordTabs.tsx`, `BordTabel.tsx`, `RegelInfo.tsx` | Pagina: `h-[`, `min-h-[`, `bg-primary/10`, `text-primary`, import `pura/EmptyState`. Tabs gebruiken `StatusBadge` als teller. BordTabel: `text-primary`. RegelInfo: `text-[`. | `Paginakop`, `Table` vanaf `md`, `Lijstrij` op 390, `LegeStaatBlok`. Tabs blijven `ui/tabs`. Teller is meta, geen tweede statuspill. |
| tellen op het bord | `bestelbord/KeukenTelblok.tsx` | Import `pura/EmptyState`. | `Telrij`, `LegeStaatBlok`. |
| intern op het bord | `InternBestellen.tsx`, `InternGroepV2.tsx`, `InternOnderweg.tsx`, `InternOnderwegV2.tsx`, `MepVoorWest.tsx`, `MepVoorWestV2.tsx`, `MandjeVragen.tsx` | `RijMeta` met `—` als de meta leeg is (`InternBestellen.tsx` regel 78, `InternGroepV2.tsx` regel 99). StatusBadge, soms twee pills op één rij (`InternOnderwegV2.tsx` regel 55–56). | `Lijstrij` of `Telrij`, één badge. Vlaggen niet verplaatsen. |
| `/kitchen/mep` | `pages/kitchen/MepDag.tsx`, `MepDagKiezer.tsx`, `MepTaakToevoegen.tsx`, `MepTaakBewerken.tsx`, `MepAfrondDialog.tsx`, `MepPerPersoon.tsx`, `MepToevoegenDialog.tsx` | MepDag: `text-[` 10, `h-[` 4, `bg-primary/10` 7, `bg-primary/5` 4, `kitchen/EmptyState`. MepTaakToevoegen is het zwaarst na VoorraadRonde: `text-[` 10, `h-[` 7, `min-h-[` 7, `bg-primary/10` 9, `bg-primary/5` 10, `text-primary` 6. | `Paginakop`, `Afvinkrij`, `Sectiekop`, `Dialoog`, `LegeStaatBlok`. |
| `/kitchen/mep/week` | `pages/kitchen/MepWeek.tsx` | `text-[` 3, `h-[`, `min-h-[`. RequireWest. | `Paginakop`, `Lijstrij` of `Table`. |
| `/kitchen/mep/oud` | `pages/kitchen/MepPlanning.tsx` | `text-[` 5, `text-primary`, `kitchen/EmptyState`. RequireWest. | `Paginakop`, `Lijstrij`, `LegeStaatBlok`. |
| `/kitchen/mep/beheer` | `pages/kitchen/MepBeheer.tsx` | `text-[` 1. RequireWest. | `Paginakop`, `Table` of `Lijstrij`, `Dialoog`. |
| `/kitchen/snel-printen` | `pages/kitchen/SnelPrinten.tsx`, `PrintStatusBalk.tsx`, `StickerProductCombobox.tsx` | SnelPrinten: `text-[` 6, `h-[`, `bg-primary/10`. PrintStatusBalk: eigen `StatusBadge`, `h-[`, `min-h-[`. Combobox: `h-[`, `text-primary`. | `Paginakop`, `Lijstrij` of `Werkkaart`, `ui/badge`, `LegeStaatBlok`. Printopdracht niet dubbel versturen. |
| `/kitchen/ingredienten` | `pages/kitchen/Ingredienten.tsx`, `IngredientCombobox.tsx` | Pagina: `text-[` 3, `h-[` 10, `min-h-[` 9, `bg-primary/10` 3, `text-primary` 3. Combobox: `border-1.5` (enig overgebleven gebruik), `h-[` 2, `text-primary`. | `Paginakop`, `Table` vanaf `md`, `Sheet` voor detail. |
| `/kitchen/gerechten` | `pages/kitchen/Gerechten.tsx`, `GerechtDialog.tsx`, `AllergeenFilter.tsx`, `AllergenenBadges.tsx`, `AllergenenEditDialog.tsx` | Gerechten: `h-[` 3, `text-primary` 5, `kitchen/EmptyState`. Dialog: `h-[` 5, `bg-primary/10`. Filter: `bg-primary/10`. Badges: `text-[` 3. | `Paginakop`, `Lijstrij` of `Table`, `Dialoog`, `LegeStaatBlok`. |
| `/kitchen/recipes`, `/nieuw`, `/:id`, `/:id/bewerken` | `Recipes.tsx`, `RecipeDetail.tsx`, `RecipeForm.tsx` | Recipes: `h-[` 2, `text-primary`, `kitchen/EmptyState`. Detail: `text-[` 3. Form: `text-[` 8, `h-[` 5, `bg-primary/10` 2. | `Paginakop`, `Lijstrij`, `Formulierveld`, `LegeStaatBlok`. Eén PR, dezelfde bestanden. |
| `/mt-punt` | `pages/MtPunt.tsx` | `h-[` 4, `min-h-[` 4, `text-primary` 2. RequireMtLid. | `Paginakop`, `Lijstrij`, `Dialoog`. |
| `/cijfers` | `pages/Cijfers.tsx`, `components/cijfers/*` | Pagina: `text-[` 4, `h-[`, hex 1. BronnenBlok: `rounded-[` 5, `text-[` 7, `shadow-card` 3, beide oude blokken. Hoofdgrafiek: `rgb(` 4, `shadow-card` 4. Heatmap, uurverloop, weekdag, vestiging, loonkosten, loze uren: `rounded-[` en `shadow-card`. `deltaKleur.ts`: `rgb(` 6. `types.ts` en grafiekbestanden: hex voor reeksen. | `Paginakop`, `Werkkaart`, `LegeStaatBlok`. Reekskleur via `--chart-*`, niet via `#hex` in het component. |
| `/lightspeed/callback` | `pages/LightspeedCallback.tsx` | `rounded-[`, `shadow-card`, `text-primary`, `--app-canvas` (enig overgebleven gebruik buiten `index.css`). | `bg-background`. Geen eigen canvas-token. |
| `/onderhoud` | `pages/maintenance/Onderhoud.tsx`, `TicketList.tsx`, `TicketDetail.tsx`, `NewTicketForm.tsx` | De pagina zelf is schoon. TicketList: `PageSubheader`, `SegmentedTabs`, `StatCard`, `shadow-card`, `text-[` 2. TicketDetail: `shadow-card` 3, twee of drie `StatusBadge`s op één kop (regels 113–120). Form: `h-[` 4, `bg-primary/10`, `text-primary` 3. | `Paginakop`, `Kengetal`, `ui/tabs`, `Lijstrij`, `Sheet`, één badge per rij. |
| `/hr`, `/hr/applicants/new`, `/hr/applicants/:id`, `/hr/housing`, `/hr/housing/new` | `pages/hr/*`, `hr/InboxCard.tsx`, `hr/StatusBadge.tsx`, `NextActionModal.tsx` | Inbox: `bg-primary/10`, `text-primary` 2. Detail: `bg-primary/10`, `text-primary` 3, hr-badge. HousingPlanner: `text-primary`. Formulieren: geen treffer, wel geen `Paginakop`. Modal: `h-[`. | `Paginakop`, `Lijstrij`, `ui/badge`, `Dialoog`. |
| `/personeel`, `/wonen`, `/wonen/:id`, `/collegas`, `/settings` | `PersoneelLayout.tsx`, `Tijdlijn.tsx`, `Wonen.tsx`, `WonenDetail.tsx`, `Collegas.tsx`, `PersoneelSettings.tsx`, `HousingCard.tsx`, `HousingOccupancyStrip.tsx`, `PlanningBlock.tsx`, `ColorPickerModal.tsx`, `PersonModal.tsx`, `lib/personeel-utils.ts` | Layout heeft een eigen `h1` (`text-2xl`) en `rounded-[`. Tijdlijn: `rounded-[`, `text-[` 4, `bg-primary/10`, `overflow-auto` 2. Wonen: geen treffer. Detail: `rounded-[` 10. Collegas: `rounded-[`, `text-[`, `bg-primary/10`. Settings: `rounded-[` 3, hex 2. ColorPicker en PlanningBlock: hex als dienstkleur. | `Paginakop` in de layout, de lokale `h1` weg. `Lijstrij`, `Sheet`. Dienstkleur blijft data. Manager-only. |
| `/style-guide` | `pages/StyleGuide.tsx` | `rounded-[`, `h-[`, hex 14, polar-import. | Schrappen, niet restylen. |
| `/design-preview` | `pages/DesignPreview.tsx` | hex 25, polar-import 2. | Schrappen. |
| `/design-system`, `/design-system/voorbeeld` | `DesignSystem.tsx`, `DesignSystemVoorbeeld.tsx`, `design-system/ShadcnVoorbeeld.tsx`, `Canoniek.tsx`, `Regelboek.tsx` | ShadcnVoorbeeld: hex 24 en `rgb(` 2 in de tokenvergelijking, `shadow-soft` 1. Canoniek: `rounded-[` 3, `text-[` 3, `Paginakop` zonder titel. Regelboek: `rounded-[` 2. | De vergelijking mag hex als documentatie van shadcn houden, niet als chrome. `Paginakop` in de voorbeelden krijgt een titel. |
| `/preview/interne-levering-v2` | `pages/kitchen/InterneLeveringV2Voorbeeld.tsx`, `preview/TaakVervolgVoorbeeld.tsx` | Alleen in dev. TaakVervolgVoorbeeld: `rounded-[` 4, `text-[` 6, `bg-primary/10`. | Meenemen met de intern-PR. Geen productroute. |
| `*` | `pages/NotFound.tsx` | Geen treffer. | Korte lege staat, geen illustratie. |

Niet in de router, wel in `src`: `pages/HomeHub.tsx` met `WaveBackground.tsx`, `KitchenTasks.tsx`, `KitchenMenu.tsx`, `ServiceModule.tsx`, `Kassa.tsx`, `KassatellingOverdag.tsx`, `components/reservations/*`. `NotificationsDropdown.tsx` (`text-[` 4, `shadow-elevated`, `text-primary`) heeft geen importeur. Die stylen of schrappen we niet tot Yorick zegt dat ze blijven. Zie open vragen.

`ui/button.tsx` heeft `text-primary` op de variant `link`. Dat is de atoom, geen scherm. De opruim-PR haalt die klasse weg of de grep-regel sluit `text-primary-foreground` uit en laat `link` als laatste vallen.

## 2. Volgorde

Eerst blokken die veel schermen raken, zodat een scherm-PR niet steeds dezelfde pill of lege staat herschrijft. Dan de vloer, dan beheer, dan auth, dan weggooien. Eén scherm of één gedeeld blok per PR. Recepten zijn vier routes en één PR, omdat het dezelfde drie bestanden zijn. Hetzelfde geldt voor de vijf personeel-routes niet: die splitsen, want het zijn aparte pagina’s.

### Gedeeld

1. **Lege staat.** `pura/EmptyState` en `kitchen/EmptyState` worden `LegeStaatBlok`. Reden: zeven schermen importeren ze.
2. **Statuspill.** `pura/StatusBadge` wordt `ui/badge`. Eén icoon uit de drie, het woord blijft.
3. **HR-pill.** `hr/StatusBadge` wordt dezelfde badge.
4. **Tabs in onderhoud.** `SegmentedTabs` wordt `ui/tabs`.
5. **Kengetal.** `StatCard` wordt `Kengetal`.
6. **Subkop.** `PageSubheader` verdwijnt uit TicketList; de actie gaat naar de paginakop.
7. **Menu-iconen.** Alleen `useNavigatieItems.ts`, na de keuze hieronder.
7b. **Kleine ui-primitieven.** `ui/command.tsx`, `ui/calendar.tsx`, `ui/scroll-area.tsx`, `ui/navigation-menu.tsx`, `ui/data-table.tsx`, `ui/radio-group.tsx`, `ui/separator.tsx` hebben nog een `h-[` of `text-primary`. Eén PR, vóór de schermen die ze gebruiken (stickers, artikelstam, takenlijst, bain-marie, cijfers).

### Werkvloer

8. Bestelbord (bord, tabs, zonder-prijs). Niet tellen en niet intern.
9. Tellen (`KeukenTelblok`).
10. Interne levering, inclusief de dev-preview. Vlaggen blijven de schakelaar.
11. Afvinkronde.
12. Sluitlijst (`SluitRondeWest`, `VoorraadRonde`, Bain-marie, koelcel, vriezer, falafel, ketenrij).
13. Takenlijst: de rest van `FohTasks` en de taak-dialogen.
14. MEP dag.
15. MEP week.
16. MEP planning (`/kitchen/mep/oud`).
17. MEP beheer.
18. Stickers.
19. Artikelstam.
20. Gerechten.
21. Recepten, de vier routes samen.
22. Keten en koelwerkbank.

### Beheer

23. Instellingen, team, bronnen, MEP-instellingen.
24. MT-punt.
25. Cijfers: bronnen en koppelingen.
26. Cijfers: grafieken.
27. Personeel: layout en tijdlijn.
28. Personeel: wonen en woning.
29. Personeel: collega’s.
30. Personeel: instellingen.
31. Onderhoud.
32. Dashboard.
33. Kas-controle en kassatelling.
34. Voorraadmodule (de drie routes, menu staat uit).
35. HR: inbox.
36. HR: kandidaat, nieuw en detail.
37. HR: huisvesting, planner en formulier.
38. Taken beheren, taken admin, taken-analyse.

### Auth en opruimen

39. Login, wachtwoord, startscherm, herstel, PWA-hint, de drie Require-schermen, NotFound.
40. `/design-system` gelijk trekken met het boek. `Paginakop` in de voorbeelden krijgt een titel.
41. `/style-guide` en `/design-preview` uit de router, bestanden weg.
42. `components/polar` weg, als grep geen import meer vindt.
43. Tokens en tailwind: `shadow-soft`, `shadow-card`, `shadow-elevated`, `borderWidth.1.5`, `--app-canvas`, `--shadow-card`. Allowlist leeg. `ui/table` verliest `overflow-auto` pas in deze PR, als elk scherm zijn tabel al zonder horizontale scroll doet.

38 scherm- of blok-PR’s (1 tot en met 38), plus 7b, plus de vijf opruimstappen 39–43. Samen 44 PR’s.

## 3. Per PR

Elke PR hieronder heeft dezelfde acceptatie, plus wat er specifiek bij staat.

Acceptatie, uit de checklist van het boek:

- De PR noemt het bestand en wat er stond.
- Tikvlak `h-11` of `min-h-11` (44). Rij `min-h-12` (48). De klasse staat in de PR-tekst.
- Eén `bg-primary` knop in beeld, of geen. Een dialoog dekt de pagina.
- Leeg, laden en fout zijn drie blokken waar de pagina data haalt.
- In de bestanden van de PR is de grep op `rounded-[`, `text-[`, `h-[`, `min-h-[` voor een maat die de schaal al heeft, `#[0-9A-Fa-f]{3,8}` buiten dienstkleur-data, `rgb(`, `shadow-soft`, `shadow-card`, `shadow-elevated`, `border-1.5`, `bg-primary/10`, `bg-primary/5` en `text-primary` gelijk aan 0.
- `npm run build` slaagt. `npx tsc --noEmit` geeft geen nieuwe fout. Lint op de aangeraakte bestanden geeft geen nieuwe fout.
- Geen migratie. Geen scherm dat de PR niet noemt.

Test in de preview, voor elke PR: de route openen op 390, 834 en 1280. Lege lijst, een lijst met rijen, en een mislukte lading (netwerk uit of een onbereikbare aanroep) elk één keer. Yorick kijkt zelf. De PR bevat geen screenshots.

Risico dat voor elke vloer-PR geldt: `RequireWest`, `RequireManager`, `RequireOwner` en `RequireMtLid` blijven om de route zitten. Een locatiewissel mag een West-only pagina naar `/dashboard` sturen, zoals de shell nu doet als de route niet in `locations` zit.

| PR | Bestanden | Extra risico en test |
| --- | --- | --- |
| 1 | beide EmptyState-bestanden en hun importeurs | Tekst van de lege staat blijft letterlijk. Test: bestelbord zonder regels, MEP-dag zonder taken, recepten zonder resultaten. |
| 2 | `pura/StatusBadge.tsx` en importeurs | Eén badge per rij. `InternOnderwegV2` verliest de tweede pill; de tekst gaat in de meta. Test: een rij met waarschuwing en een rij zonder. |
| 3 | `hr/StatusBadge.tsx`, inbox, kandidaat | Statuswoorden blijven dezelfde. Test: een kandidaat in elke status die de badge nu kent. |
| 4 | `SegmentedTabs.tsx`, `TicketList.tsx` | Filterwaarden van de tickets blijven. Test: elke filter toont dezelfde tickets als daarvoor. |
| 5 | `StatCard.tsx`, `TicketList.tsx` | De drie tellingen blijven. Test: de getallen kloppen met de lijst. |
| 6 | `PageSubheader.tsx`, `TicketList.tsx` | De actie van de subkop blijft bereikbaar in de paginakop. |
| 7 | `useNavigatieItems.ts` | Alleen het icoon. Url, groep, `locations`, `managerOnly`, `ownerOnly`, `mtOnly` blijven. Test: Midsland ziet geen West-only keten-item dat hij nu niet ziet; een MT-only account ziet alleen MT-routes. |
| 7b | `ui/command.tsx`, `calendar.tsx`, `scroll-area.tsx`, `navigation-menu.tsx`, `data-table.tsx`, `radio-group.tsx`, `separator.tsx` | Alleen de losse maat of `text-primary`. Geen scherm. Een kalender die Bain-marie of cijfers opent, blijft dezelfde dag kiezen. |
| 8 | `Bestelbord.tsx`, `BestelbordTabs.tsx`, `BordTabel.tsx`, `RegelInfo.tsx`, `pura/blokken.tsx` (`Stappen`, `bg-primary/10`) | Bestellen, prijsfilter en de tabblad-staat blijven. Geen tweede groene knop naast de pagina-actie. Test: een regel toevoegen, de zonder-prijs-filter, wisselen van tab. |
| 9 | `KeukenTelblok.tsx` | De tel-mutatie en de eenheid blijven. Test: een aantal opslaan en opnieuw laden. |
| 10 | intern-bestanden, `interneLeveringV2.ts`, dev-preview | `interne_levering_v2` en `ontvangst_v2` blijven de schakelaar. Test uit: het oude intern-pad. Test aan (Test-locatie): het v2-pad. Een vrije naam gaat nog steeds ter controle naar Midsland. |
| 11 | `AfvinkRonde.tsx` | Afvinken blijft dezelfde mutatie. Opnieuw proberen bevestigt nog steeds expliciet. Test: één regel afvinken, verversen, de vink staat. |
| 12 | sluit-bestanden hierboven, `ui/calendar` als 7b al binnen is | `SluitRondeWest.tsx` heeft geen treffer op de verboden patronen; hij gaat mee omdat de ronde dezelfde mutaties deelt. Aanvulketen, vulpeil en bain-marie-print blijven. Print gaat niet twee keer de wachtrij in. Test: een sluitregel, een bain-marie-label, een regel die al geprint is. |
| 13 | `FohTasks.tsx` na het uitsplitsen van de rondes, plus taak-dialogen | Herhaling, datum en vervolg van een taak blijven. Test: taak afvinken, taak met vervolg openen, datum wisselen. |
| 14 | MEP-dag-bestanden | RequireWest. Een taak toevoegen, afronden en per persoon blijven. Test: West haalt de dag; Midsland komt op `/dashboard`. |
| 15 | `MepWeek.tsx` | RequireWest. De weekmutatie blijft. |
| 16 | `MepPlanning.tsx` | RequireWest. Slepen en herordenen blijven. Test: twee regels omwisselen en verversen. |
| 17 | `MepBeheer.tsx` | RequireWest. Templates, handelingen, openingsdagen blijven drie tabs. |
| 18 | `SnelPrinten.tsx`, printbalk, combobox | De print-RPC blijft één insert. Test: één sticker, daarna de balk; geen tweede rij voor dezelfde actie. |
| 19 | `Ingredienten.tsx`, `IngredientCombobox.tsx` | Samenvoegen en de artikelmutatie blijven. `border-1.5` weg uit dit bestand. Test: zoeken, openen, opslaan. |
| 20 | gerechten-bestanden | Allergenen blijven een filter, geen garantie. Test: filter aan, gerecht openen, opslaan. |
| 21 | de drie receptbestanden | Nieuw, detail en bewerken blijven dezelfde routes. Test: een recept openen en een veld opslaan. |
| 22 | keten-bestanden, `KoelwerkbankIndeling.tsx` | Manager. Vestiging-filter West/Midsland blijft. Test: een leverancier, een product, de koelwerkbank-indeling. |
| 23 | Settings, Team, Bronnen, MepInstellingen, `MtLedenUitnodigen.tsx` (`h-[` 3, `min-h-[` 3, `text-primary`) | Owner of de bestaande rol. Uitnodigen van een MT-lid blijft dezelfde mutatie. Geen nieuwe knop die een owner-actie aan een ander geeft. |
| 24 | `MtPunt.tsx` | RequireMtLid. Een niet-MT account komt niet op de pagina. |
| 25 | `Cijfers.tsx`, `BronnenBlok.tsx`, backfill, sync | Owner. Lightspeed-koppeling en sync-knop blijven. Test: bronnenlijst, geen sync starten tenzij de knop dezelfde mutatie aanroept. |
| 26 | de grafiekbestanden, `deltaKleur.ts`, `types.ts` | Alleen kleur en kader. Getallen en reeksen blijven. Hex van een reeks verhuist naar `--chart-*` of blijft data als Yorick dat kiest. |
| 27 | `PersoneelLayout.tsx`, `Tijdlijn.tsx`, `PincodeNumpad.tsx` (`text-[`) | De pincode-poort blijft, inclusief het numpad. `overflow-auto` op de tijdlijn weg zonder dat een dag onbereikbaar wordt: de dag wordt een rij of een blok onder elkaar. Manager. |
| 28 | `Wonen.tsx`, `WonenDetail.tsx`, `HousingCard.tsx` | Bezetting en woningmutatie blijven. |
| 29 | `Collegas.tsx`, `PersonModal.tsx` | Nieuw en bewerken blijven. |
| 30 | `PersoneelSettings.tsx`, `ColorPickerModal.tsx`, `PlanningBlock.tsx`, `personeel-utils.ts` | Hex van een dienstkleur blijft data. De chrome errond verliest `rounded-[` en vaste grijzen. |
| 31 | onderhoud-bestanden | Ticket aanmaken, status en de drie tellingen blijven. Eén badge per rij. |
| 32 | dashboard-bestanden | Polar-KPI weg. De taken-teller blijft dezelfde query. |
| 33 | `KasControle.tsx`, `Kassatelling.tsx` | Manager op kas-controle. Een telling opslaan blijft dezelfde mutatie. |
| 34 | `voorraad/*` | Module blijft verborgen in het menu. Directe url werkt nog voor wie de route heeft. |
| 35 | `HrInbox.tsx`, `InboxCard.tsx` | Statusfilter blijft. |
| 36 | `ApplicantForm.tsx`, `ApplicantDetail.tsx`, hr-badge | Opslaan van een kandidaat blijft. |
| 37 | `HousingPlanner.tsx`, `HousingForm.tsx` | Bezetting blijft. |
| 38 | `TakenBeheer.tsx`, `TakenAdmin.tsx`, `FohAnalytics.tsx` | `PolarDialog` wordt `Dialoog`. Lijstbeheer blijft. |
| 39 | Auth, SetPassword, StartScherm, HerstelKnop, PWAInstallHint, ProtectedRoute, Require*, NotFound | Login met de twee keukenlocaties blijft. Geen wachtwoord in de diff. PWA-registratie niet aanraken buiten de hint-kaart. |
| 40 | `pages/design-system/*`, `DesignSystemVoorbeeld.tsx` | De voorbeelden tonen het boek. Hex in de shadcn-vergelijkingstabel mag, als chrome-klasse niet. |
| 41 | StyleGuide, DesignPreview, de twee routes | Niets importeert ze daarna. Grep op de bestandsnamen is 0. |
| 42 | `components/polar/**` | Grep `from '@/components/polar` is 0, dan de map weg. |
| 43 | `tailwind.config.ts`, `index.css`, `ui/table.tsx`, `designregels.allowlist.ts` | Grep op de verboden patronen in `src` is 0, met de uitzonderingen in hoofdstuk 5. Allowlist leeg. |

## 4. Vangnet

`src/test/designregels.test.ts` houdt de allowlist. Nu mag een bestand een oude klasse hebben als het op de lijst staat. Dat keert om, per afgeronde PR:

- De PR voegt de bestanden die hij aanraakt toe aan een vaste set `AFGEROND` in `src/test/designregels.allowlist.ts`, of haalt ze uit `BESTAANDE_AFWIJKINGEN`. Eén van de twee, niet allebei.
- De test faalt als een afgerond bestand nog een verboden patroon heeft: `rounded-[`, `text-[`, `bg-[#` en `text-[#`, `shadow-soft`, `shadow-card`, `shadow-elevated`, `border-1.5`, `bg-primary/10`, `bg-primary/5`.
- De test faalt ook als `BESTAANDE_AFWIJKINGEN` een bestand noemt dat niet meer afwijkt. De lijst krimpt dus verplicht.
- Een nieuw bestand buiten de allowlist faalt nu al. Dat blijft.
- `components/ui` en `components/pura/canoniek.tsx` vallen onder de harde regel, niet onder de allowlist. Een terugval in een atoom faalt meteen.

De laatste PR laat `BESTAANDE_AFWIJKINGEN` leeg zijn. De test verwacht dan een lege lijst.

## 5. Klaar

Het traject is klaar als dit allemaal waar is:

- Grep in `src` op `rounded-[`, `text-[`, `shadow-soft`, `shadow-card`, `shadow-elevated`, `border-1.5`, `bg-primary/10`, `bg-primary/5`, `text-primary` (niet `text-primary-foreground`), `--app-canvas` en `from '@/components/polar` is 0.
- `rgb(` en `#hex` zijn 0 in componenten en pagina’s. De schaduwregel in `index.css` die het boek voorschrijft (`0 1px 2px rgb(0 0 0 / 0.05)`) mag blijven. Een dienstkleur in `PlanningBlock` en de kleurkiezer mag een hex-waarde als data houden, niet als klasse.
- `components/polar` bestaat niet.
- `docs/UI-REGELS.md` is het enige regelboek. `docs/STYLING_GUIDE.md` wijst alleen daarheen.
- Elke productroute uit de tabel in hoofdstuk 1 is door Yorick nagelopen op 390, 834 en 1280.
- De allowlist is leeg.

## 6. Open vragen

Alleen keuzes die het boek niet al vastlegt.

1. **Menu-iconen.** Het boek stelt voor: Instellingen houdt `Settings`, Bestelbord houdt `ClipboardList`, Voorraadketen krijgt `Network`, koelwerkbank `Refrigerator`, onderhoud `Wrench`. Klopt dat, of kies je andere?
2. **Reekskleur in cijfers.** Hex in `types.ts` en een paar grafieken is de kleur van een lijn, niet van een knop. Advies: verhuizen naar de bestaande `--chart-*` tokens. Mogen die hex-waarden blijven staan als data?
3. **Pagina’s buiten de router.** `HomeHub` (met `WaveBackground`), `KitchenTasks`, `KitchenMenu`, `ServiceModule`, `Kassa`, `KassatellingOverdag`, `components/reservations` en `NotificationsDropdown` (geen importeur) hebben geen route. Advies: niet stylen en in de opruim-PR verwijderen als niets ze importeert. Moeten ze blijven?
4. **`body` is 15 px.** Het boek zet de rollen op 14 en 16. Advies: in PR 43 `body` naar 16 px. Ja of nee?

Geen vraag meer over de shell, de radius, het vinkje of de meta-kleur. Dat staat in het boek.
