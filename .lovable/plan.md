# 1a afronden: interne orders op artikelen + richting-agnostische keten

## 1. OrderDashboard op artikelen (laatste 1a-bouwtaak)

Vandaag is de bestellijst een hardgecodeerde array van 16 productnamen in `OrderDashboard.tsx` met localStorage als geheugen, en schrijft `useSendInternalOrder` alleen `product_name` + `unit: 'stuks'`. Daardoor is een orderregel niet aan een artikel te koppelen.

Wat er komt:
- De lijst wordt geladen uit `artikel_locaties` van de eigen vestiging waar `aanvul_bron = 'intern'`, gesorteerd op `tel_volgorde`, met `max_voorraad` als ijzervoorraad en `min_voorraad` als signaalgrens. Categorie komt uit `artikelen.categorie`.
- Invoer blijft hetzelfde gebaar: huidige voorraad tikken, aan te vullen = max − huidig (nooit negatief). Hoeveelheid wordt numeriek (decimalen toegestaan voor kg/liter-artikelen).
- Eenheid is geen invoer meer: per artikel wordt de basiseenheid gebruikt (of de gemarkeerde keuken-/besteleenheid uit `artikel_eenheden` als die er is). Zichtbaar als label, niet als veld.
- `useSendInternalOrder` schrijft per regel `artikel_id`, `eenheid_id`, numerieke `quantity`, en vult `product_name`/`unit` als **snapshot** vanuit artikel en eenheid.
- "Extra product" (vrije regel) blijft mogelijk voor uitzonderingen, maar wordt zichtbaar gemarkeerd als losse regel zonder artikelkoppeling — die regels blokkeren later een automatische koppeling in 1b.
- De ontvangstkant (`MidslandOrders`, `InternalOrders`) toont naast de snapshotnaam een teken of de regel gekoppeld is aan een artikel.

**Datavoorwaarde (belangrijk):** er bestaan nu 0 rijen met `aanvul_bron = 'intern'`. West heeft 17 `eigen_productie`- en 64 `leverancier`-rijen. Zonder databehandeling is de nieuwe lijst leeg. Onderdeel van deze stap is daarom een migratie die de 16 huidige lijstproducten matcht op bestaande artikelen en voor West `aanvul_bron = 'intern'`, `bron_vestiging = 'Midsland'`, `max_voorraad` = huidige ijzervoorraad en `tel_volgorde` = huidige lijstvolgorde zet. Producten die niet 1-op-1 op een artikel matchen (bijv. Handzeep, Zeep vaatwasser) krijgen een nieuw artikel of komen in het migratielogboek — geen stille aannames.

## 2. Richting: de guard eruit

Nu: `/voorraad` en `/internal-orders` staan achter `LocationGuard West`, `/midsland-bestellingen` achter `LocationGuard Midsland`, en `MidslandOrders` heeft `from_location = 'West'` en `to_location = 'Midsland'` hardgecodeerd in de query. Dat is een aanname die niet in het architectuurdocument staat: `aanvul_bron`/`bron_vestiging` zijn richting-agnostisch.

Wat er komt:
- `/internal-orders` wordt het enige scherm voor beide kanten en verliest de LocationGuard (blijft `ProtectedRoute`). De bestaande tabs Verzonden/Ontvangen doen het richtingswerk al; "Nieuwe bestelling" verschijnt alleen als de eigen vestiging artikelen met `aanvul_bron = 'intern'` heeft.
- De ontvangstkant krijgt in de tab Ontvangen de acties die nu alleen in `MidslandOrders` zitten: goedkeuren, afwijzen, geleverd/deels geleverd melden met ontvangstnotitie. Daarmee ziet en behandelt Midsland de West-order op hetzelfde scherm, en werkt de omgekeerde richting later zonder nieuw scherm.
- `/midsland-bestellingen` blijft bestaan als redirect naar `/internal-orders` (bestaande links en gewoontes breken niet). `MidslandOrders` verdwijnt als apart scherm zodra de acties zijn overgezet.
- `/voorraad` houdt `LocationGuard West` niet als richtingsregel maar wordt vestiging-neutraal: het toont de tellijst van je eigen vestiging. Wie geen interne artikelen heeft, ziet een lege staat met uitleg.
- Het architectuurdocument krijgt een korte notitie: richting volgt uit `aanvul_bron` + `bron_vestiging`, niet uit routeguards.

## 3. Fixlijst-teller

Bij het invoeren/openen van een methode een tellertje: "nog N openstaande logboekregels van dit recept", met doorklik naar de Fixlijst gefilterd op dat recept.

## 4. Verificatie (West-account, echte klikronde)

Er zijn 4 actieve West-accounts. Ik log met een West-sessie in en loop door:
- `/voorraad`: lijst laadt uit artikelen, invoeren, aanvulling klopt, versturen.
- `/internal-orders`: order verschijnt in Verzonden met artikelkoppeling.
- Daarna Midsland-sessie: dezelfde order in Ontvangen, goedkeuren en geleverd melden.
- Databasecheck op de weggeschreven regels: `artikel_id` en `eenheid_id` gevuld, `quantity` numeriek, snapshot correct.
Bevindingen worden per scherm gerapporteerd, inclusief wat niet lukt.

## Praktijk en risico

- De keukentablet in West telt straks vanuit de artikelstamgegevens; wijzigt iemand de ijzervoorraad in Instellingen → Voorraadketen, dan verandert de lijst direct. Dat is gewenst, maar betekent dat de lijst niet meer lokaal "vast" staat — bij een lege of foute configuratie is de tellijst leeg. Daarom de lege staat met uitleg in plaats van een leeg scherm.
- Openstaande invoer blijft in localStorage bewaard per artikel-id, zodat een haperende wifi of herladen midden in het tellen niets kost.
- Bestaande orders blijven leesbaar: oude regels zonder `artikel_id` tonen gewoon hun snapshotnaam.
- Risico bij het weghalen van de guard: Midsland-medewerkers zien nu een scherm dat ze niet kenden. Daarom redirect vanaf de oude route en dezelfde acties op dezelfde plek.

## Technisch

Bestanden: `src/components/OrderDashboard.tsx`, `src/hooks/useInternalOrders.ts`, `src/pages/kitchen/InternalOrders.tsx`, `src/pages/Voorraad.tsx`, `src/pages/MidslandOrders.tsx` (opgaat in InternalOrders), `src/App.tsx`, `src/components/keten/MethodeDialog.tsx` + `MethodesTab.tsx` (teller), plus één migratie voor de `aanvul_bron = 'intern'`-configuratie van West. `internal_order_items.artikel_id`/`eenheid_id` bestaan al en blijven nullable voor vrije regels.
