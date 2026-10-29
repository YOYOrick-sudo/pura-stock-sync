# Roadmap

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
