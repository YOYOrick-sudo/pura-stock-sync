# Roadmap

- [x] Bestellijst verduidelijken: zoeken/toevoegen gescheiden, overzicht ingeklapt, hoeveelheid één keer en verpakkingsdetails in lade; 94 tests geslaagd, 2 bekende Deno-fouten, automatische build OK; niet gepubliceerd.
- [ ] Bestellijst visuele controle — controlesessie blijft op laadscherm, ook met eigen sessie; toevoegen/prijsfilter en telefoon/iPad/desktop niet end-to-end bevestigd; geen testbestelling opgeslagen.

- [x] Mobiel stap 20: één onderbalk met Meer-blad van onderen, gedeelde iconen/actieve staten en rechtstreekse MT-vakken; zichtbaarheidsfilters/desktop behouden; 94 tests geslaagd, 2 bekende Deno-fouten, automatische build OK.
- [ ] Mobiel stap 20 visuele controle — controlesessie toont Geen toegang; openen/kiezen/vegen en pixelvergelijking niet visueel bevestigd; geen rechten of gegevens aangepast.

- [x] Mobiel stap 19: vijf restschermen — kleine mobiele aanpassingen voor overlopen, 44px tikvlakken en dubbele StyleGuide-kop; 90 tests geslaagd, 2 bekende Deno-fouten, automatische build OK; desktop en functies behouden.
- [ ] Mobiel stap 19 afgeschermde visuele controle — StyleGuide/DesignPreview blijven laden in controlesessie; openbare restschermen gecontroleerd op 320/390/743/744/768/1280px; wachtwoord niet gewijzigd.

- [x] Mobiel stap 18: zes instellingenschermen — ellipsis, 44px invoer/selects, veegbare tabs, lokale tabelscroll met vaste eerste kolom en passende ladeproducten; 90 tests geslaagd, 2 bekende Deno-fouten, automatische build OK; rollen/rechten, opslaan en desktopklassen behouden.
- [ ] Mobiel stap 18 visuele controle — eigen controlesessie toont Geen toegang op alle zes routes bij 390/744px; geen rechten of gegevens gewijzigd.

- [x] Mobiel stap 17: Cijfers — veegbare periodekeuzes, begrensde kalender, 44px knoppen en KPI-iconen/grafiekruimte onder 744px; 90 tests geslaagd, 2 bekende Deno-fouten, automatische build OK; toegang, berekeningen en desktopopmaak behouden.
- [ ] Mobiel stap 17 visuele controle — eigen controlesessie toont Geen toegang op /cijfers bij 390/744px; geen toegang of gegevens gewijzigd.

- [x] Mobiel stap 16: Personeel — veegbare tabs, 44px pagina-/kamer-/kleuracties, passende instellingen en scrollende tijdlijn onder 744px; 90 tests geslaagd, 2 bekende Deno-fouten, automatische build OK; pincode, verwerking en desktopklassen ongewijzigd.
- [ ] Mobiel stap 16 visuele controle — eigen controlesessie toont Geen toegang op alle personeelsroutes bij 390/744px; geen rechten of gegevens gewijzigd.

- [x] Mobiel stap 15: vijf HR-schermen — veegbare tabs, passende formulieren, 44px acties en één mobiele kop; 90 tests geslaagd, 2 bekende Deno-fouten, automatische build OK; bestaande functies en desktopklassen vergeleken en ongewijzigd.
- [ ] Mobiel stap 15 visuele controle — eigen controlesessie toont Geen toegang op HR, kandidaat toevoegen, huisvesting en woonruimte toevoegen bij 390/744px; detail daardoor niet bereikbaar, geen rechten of gegevens gewijzigd.

- [x] Mobiel stap 14: Takenbeheer, admin en analyse — één mobiele kop, rijmenu's, 44px filters en passende grafiekcontainers; 90 tests geslaagd, 2 bekende Deno-fouten, build OK; verwerking onveranderd.
- [ ] Mobiel stap 14 visuele controle — controlesessie toont Geen toegang op alle drie routes; geen rechten of taken gewijzigd.

- [x] Mobiel stap 13: MEP-week, beheer en oude planning — passende weekbalk, veegbare tabs, 44px knoppen en één mobiele app-kop; 90 tests geslaagd, 2 bekende Deno-fouten, build OK; verwerking onveranderd.
- [ ] Mobiel stap 13 visuele controle — controlesessie toont Geen toegang op alle drie routes; geen rechten of taken gewijzigd.

- [x] Mobiel stap 12: Gerechten, Ingrediënten en Receptformulier — namen/invoer meer ruimte, 44px tikvlakken, opslaanbalk boven onderbalk; 90 tests geslaagd, 2 bekende Deno-fouten, build OK; verwerking ongewijzigd.
- [ ] Mobiel stap 12 visuele controle — controlesessie toont Geen toegang op de drie schermen; geen rechten of gegevens gewijzigd.

- [x] Mobiel stap 11: Bestellen, Onderweg en Voorraadstand — compacte mobiele rijen en 44px tikvlakken; 90 tests geslaagd, 2 bekende Deno-fouten, build OK; queries/berekeningen onveranderd.
- [ ] Mobiel stap 11 visuele controle — alle drie routes tonen Geen toegang in controlesessie; geen rechten, orders of tellingen gewijzigd.

- [x] Mobiel stap 10: Onderhoud — mobiele layout, 44px tikvlakken, compacte meldingen en foto's; 90 tests geslaagd, 2 bekende Deno-fouten, build OK.
- [ ] Mobiel stap 10 visuele controle — controlesessie krijgt geen toegang; geen rechten of gegevens aangepast.

- [x] 9a. Deadlinebadge in Bord/Advies/Onderweg, locatiegebonden read-only query en minuutklok; 32 tests geslaagd, build OK. Geen publicatie, database-uitvoering of rollenplan.
- [ ] 9b. Exacte historische SQL-registratie — geblokkeerd: platform weigert bestanden in supabase/migrations zonder database-uitvoering; SQL niet opnieuw uitgevoerd. Visuele controle geblokkeerd: controlesessie toont Geen toegang; rollen niet aangepast.

- [x] Voorraadproef gebouwd met momentafhankelijke daggrens; seed6/6/127, testdata0, taken count/md5 gelijk; controles en niet volledig uitgevoerde UI-regressiepaden in docs/voorraadproef-testresultaten.md; niet gepubliceerd.

- [x] 7a. Bestelfundament: één migratie, vijf nullable bordvelden, vijf tabellen, zes functies/view, leveranciersconfig en optioneel label; bestaande data/policies/trigger/hook vergeleken, 7 nieuwe + 14 bestaande tests geslaagd.
- [ ] 7b. Bot-bestelbord en live bot/import/rate-limittests — geblokkeerd door ontbrekende BOT_BESTELBORD_TOKEN en expliciete keuze over bestaande updated_at-trigger; niets gedeployd/gepubliceerd.

- [x] 1. Live test stickerblok (3e taak in keuken-sluitlijst) — bevestigd, account weer inactief
- [x] 2. Groente & fruit om de dag tellen met weekstrip — gebouwd en live getest (tel-dag + niet-tel-dag + gesloten dinsdag)
- [ ] 3. Mayo GN-liter-telling + avocado spread per pot (plan 2026-09-24 goedgekeurd)
- [x] 4. Flessengroep hernoemen + olijfolie, zonnebloemolie en Japanse mayonaise toevoegen
- [x] 5. Open- en sluitlijsten wisselbaar maken tussen NL en EN per apparaat
- [ ] 6. Volledige visuele kwaliteitsronde mobiel, iPad en desktop — gedeelde basis en P0/P1-correcties in uitvoering
- [x] 8. Design system herzien (shadcnblocks-analyse, 18 regels, 4 recepten) + Bestellijst make-over; Bestellijst zelf niet in preview bekeken (login)

- [ ] 10. Mobiel stap 1: onderbalk (<744px), ruimte onderin, Personeel-navigatie, geen zijwaarts overlopen

- [x] Bestelbord: overzichtskaarten strakker (kaarten blijven)
