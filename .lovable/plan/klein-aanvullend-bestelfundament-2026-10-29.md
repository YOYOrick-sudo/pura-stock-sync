# Klein, aanvullend bestelfundament

## Resultaat en afbakening
De externe bot krijgt een smalle toegang tot de open bestellijst van één vestiging en kan later bevestigde bestellingen terugmelden. Geen bestellingen versturen, adviezen, mails, nieuwe schermen of nieuwe libraries. Bestaande bordregels, handmatige bediening, policies en functies blijven intact.

**Classificatie:** data / RLS / edge function; het leverancierlabel is uitsluitend een kleine presentatie-aanvulling.

## Gecontroleerd: één concrete botsing
Op `bestel_signalen` bestaat de trigger `set_updated_at_bestel_signalen`. Elke UPDATE verandert daardoor ook `updated_at`, terwijl C uitsluitend status, besteld_op, bestelreferentie en besteld_via toestaat (en bij optioneel koppelen uitsluitend de drie koppelkolommen).

**Ik verander deze trigger niet. Zonder uitzondering voor dit bestaande tijdstempel bouw ik de muterende bordacties niet.** GET, artikelzoeken en historie-import kunnen wel worden gebouwd. De bestaande handmatige bestelactie blijft ongewijzigd.

De overige gecontroleerde structuur past: leverancierkanaal accepteert `api`; vestigingsconfig heeft al `actief` en `deleted_at`; artikel_locaties heeft `is_actief`; service-role-toegang wordt niet door een andere bordguard geblokkeerd.

## Toevoegingen
1. **Eén migratie:** vijf nullable kolommen op `bestel_signalen`, gevraagde FK’s/validatie en index; `pg_trgm` en zo mogelijk `unaccent`. Geen bestaande rijen bijwerken.
2. **Vijf nieuwe tabellen:** `artikel_aliassen`, `leverancier_artikel_vestiging`, `bot_instellingen`, `bot_audit_log`, `bestel_historie_import`. Expliciete GRANTs en RLS in dezelfde migratie. Vestigingsgebonden leestabellen gebruiken `heeft_vestiging`; beheer schrijft via `is_inkoop_beheerder`. Audit schrijft uitsluitend via service role; instellingen en historie zijn uitsluitend voor beheerders.
3. **Zoeken en koppelen:** `rpc_zoek_artikel` normaliseert tekst en levert maximaal vijf kandidaten met scores. Exacte match eerst, daarna trigram; alleen actieve artikelen/aliassen van de opgegeven vestiging. Geen artikelen automatisch aanmaken. Nieuwe koppeltriggers weigeren leveranciers die voor die vestiging niet actief zijn. Ook bronartikelen en voorkeurleveranciers blijven vestigingsgebonden.
4. **Leveranciers:** uitsluitend ontbrekende namen en ontbrekende vestigingsconfig toevoegen. Zes leveranciers actief voor beide locaties; Hanos, In One / Veltman Vis, Drank Dozijn en Wielinga Wijn alleen Midsland. Geen bestaande config aanpassen, geen klantnummers of sleutels invullen.
5. **Botfunctie:** alleen nieuwe map `supabase/functions/bot-bestelbord/`, constant-time tokencontrole, nood-uit, max. 60 aanroepen/minuut met een gedeelde databasecontrole, invoervalidatie en audit zonder token. GET vereist West/Midsland en retourneert uitsluitend de genoemde bordvelden plus leveranciernaam. Historie-import maximaal 500 rijen, deduplicatie ook bij ontbrekend extern ordernummer, alles transactioneel. De bord-POST is geblokkeerd zoals hierboven vermeld; na toestemming voor het tijdstempel maximaal 100 regels, één transactie, rijvergrendeling en idempotente resultaten per id. Optioneel `koppel` laat ik weg om dit klein te houden.
6. **Historieview:** `v_bestel_historie_top` met `security_invoker = true`, gegroepeerd per vestiging en artikel (ruwe naam wanneer nog niet gekoppeld), aantal bestelmomenten en laatste hoeveelheid, eenheid en leverancier. Geen automatische verwerking.
7. **Bestelbord:** alleen leveranciernaam als klein grijs label indien gekoppeld; geen verandering aan toevoegen, afvinken, hoeveelheden, verpakking of historie. Bestaande mutaties in `useBestelbord.ts` blijven byte-identiek; labelgegevens worden aanvullend opgehaald en per vestiging begrensd.

## Bestanden en technische uitvoering
- Eén nieuwe migratie in `supabase/migrations/`; herhaalbare creaties met `IF NOT EXISTS` en cataloguschecks waar PostgreSQL die syntaxis niet ondersteunt. Geen bestaande functies vervangen. Nieuwe service-role-only RPC’s voor transacties, rate limit en auditcontrole; geen client-toegang tot botmutaties.
- Nieuwe botfunctie met kleine lokale validatie-/testbestanden; bestaande functies niet aanpassen. Alleen indien nodig een functie-specifieke configuratie, geen wijziging van projectinstellingen.
- Alleen minimale label-aanvulling in `src/pages/kitchen/Bestelbord.tsx` en een aanvullend labelbestand; bestaande hookmutaties niet wijzigen.
- `AGENTS.md` voor de nieuwe structurele afspraken, `roadmap.md` voor deze opdracht en korte test-/rollbackdocumentatie. Down uitsluitend als uitleg; niet uitvoeren en geen data wissen. Extensies blijven bij terugdraaien staan als andere onderdelen ze gebruiken.

## Secret en niet publiceren
`BOT_BESTELBORD_TOKEN` is nog niet ingesteld. **Yorick vult zelf een sterke, unieke waarde in via Project Settings → Secrets**, niet in chat. Ik genereer geen token en gebruik geen andere bestaande sleutel. Zonder deze secret bouw/test ik de botfunctie niet; de migratie en andere toevoegingen kunnen wel doorgaan.

Geen publicatie of handmatige deployment. Let op: Lovable Cloud verwerkt nieuwe functiebestanden automatisch; als “niet deployen” ook dat uitsluit, lever ik de functie uitsluitend als niet-actieve bron buiten de functions-map aan, en is live testen niet mogelijk.

## Verificatie
- Voor/na vergelijken: bestaande borddata, bestaande policies, triggers en definities van functies ongewijzigd; uitsluitend de toegestane kolommen erbij.
- Testen van normalisatie, exacte match, typfout, top-5, geen West/Midsland-lekkage en weigering van Midsland-only leveranciers in West.
- Auth: ongeldig/ontbrekend token, nood-uit, ongeldige vestiging/body, 101 bordregels, 501 importrijen en de 61e aanroep geweigerd; geen token in audit.
- Transacties en idempotentie: dubbele import, verkeerde vestiging, gesloten/bestelde bordregel, niet-actieve leverancier en herhaalde POST. Geen echte bordregels voor tests wijzigen; tijdelijke nieuwe testgegevens uitsluitend binnen een rollbacktransactie.
- Bestelbord met echte login op desktop/iPad controleren; toevoegen en handmatig afvinken blijven hetzelfde. Botscenario live alleen met door Yorick ingestelde secret.

## Praktijk en risico’s
- Team werkt zoals nu; de bot bestelt in deze fase niets. `besteld` mag een toekomstige bot pas na leverancierbevestiging terugmelden, anders verdwijnt een nog benodigde bestelling uit de open lijst.
- Zonder aliassen/verpakkingskoppelingen blijven matches onzeker. Bot beslist over score; niets stil samenvoegen of koppelen.
- Bij nood-uit of ontbrekend token blijft handmatig bestellen werken. Historie en audit groeien; geen automatische opschoning in deze opdracht.
- Bestaande print-, n8n- en inkoopflows worden niet aangeraakt. Nieuwe leverancierconfig verschijnt wel in bestaande leveranciersoverzichten.

**Benodigde keuze:** mag de bestaande trigger ook bij botupdates `updated_at` blijven bijwerken? Zo niet, blijven de muterende bordacties buiten deze oplevering. Geef ook aan als automatisch beschikbaar maken van de nieuwe functie niet is toegestaan.

**Eén standaardisatie-suggestie:** leg later per vestiging één voorkeursleverancier en verpakking per artikel vast.