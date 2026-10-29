# Prijzen, opslag (derving/personeelseten) en leverancierskeuze

Uitbreiding van de bestelmodule. Bestelt niets en verstuurt niets.

## A. Opslag derving + personeelseten

| Object | Wat |
|---|---|
| `verbruik_opslag_groep` | Groep, naam, opslag_pct, categorieen (artikelen.categorie), besteleenheden. Alleen eigenaar/admin wijzigt. |
| `opslag_groep_voor(artikel_id, besteleenheid)` | vat/fust → `tap_glas` (gaat vóór categorie); tray/doos/krat bij drank → `flesjes_blikjes`; anders via categorie. Disposables, schoonmaak en keukenmateriaal: geen groep (0%). |
| `voorraad_artikel.opslag_groep` | Automatisch gevuld (trigger). Gekoppeld artikel heeft voorrang, anders: naam met koffie/thee → `koffie_thee`, tel-eenheid fles/blik → `flesjes_blikjes`. |
| `voorraad_effectieve_opslag_pct(id)` | Eén bron: eigen `verbruiksopslag_pct` als die > 0, anders de groeps-%. |

Groepen: vers 10%, houdbaar 5%, flesjes_blikjes 2%, tap_glas 5%, koffie_thee 10%.

**Geen dubbele opslag.** De opslag wordt alleen in `voorraad_stand_berekenen` toegepast (`opslag = kassa × effectieve %`). `v_voorraad_stand` toont `opslag_groep` en `effectieve_opslag_pct`. De perioden in de leercurve (`voorraad_periode.onverklaard`) bevatten géén opslag. Ze meten juist het onverklaarde verbruik, en daarmee wordt de opslag geijkt. Gecontroleerd: voor alle artikelen geldt stand = geteld + ontvangen + correcties − kassa − opslag, en opslag = kassa × effectieve %/100.

**Leren.** `leercurve_bijwerken()` maakt per vestiging × groep een voorstel van soort `opslag_groep`. Dat gebeurt pas bij ≥ 3 afgesloten volledige perioden van artikelen zonder eigen %. Het voorstel is de mediaan van `pct_van_kassa`, en komt er alleen als het ≥ 2 procentpunt afwijkt van de huidige %. Het voorstel is zichtbaar in `v_leer_voorstellen_open` en wordt nooit automatisch toegepast.

**Advies (bot).** De bot stuurt in `gegevens` mee: `opslag_groep`, `opslag_pct`, `verwacht_kassa` (verwacht verbruik vóór opslag, in besteleenheden) en `verwacht_verbruik` (inclusief opslag). De opslag geldt voor het verwachte fysieke verbruik, vóór aftrek van voorraad en wat onderweg is. `v_advies_nauwkeurigheid` vergelijkt `verwacht_kassa` met de werkelijke kassa als die er is, zodat de opslag niet als modelfout telt. Oude regels zonder `verwacht_kassa` houden de oude vergelijking. De edge function controleert dat deze velden getallen zijn (opslag_pct 0–100).

### Personeelsdrankjes (vanaf 1-11, "Personeel sluitje", 100% korting)
Bevinding (alleen gelezen, de sync is niet aangepast):
- `extractItems` in de Lightspeed-sync filtert niet op prijs. Regels van €0 blijven staan met hun `amount`, en `aggregateVerkoop` telt ze op per product per dag.
- De sync slaat alleen bonnen over waarvan de status niet `PAID` is. In `kassa_verkoop_dag` staan nu al 4.690 regels met aantal > 0 en omzet €0, de laatste van vandaag. Volledig afgeprijsde regels komen dus binnen.
- Of een bon die **helemaal** €0 is in L-Series ook de status `PAID` krijgt, kon ik niet zien zonder een echte bon. Controleer dit na 1-11 op één personeelsbon: staat het drankje in `kassa_verkoop_dag` met omzet 0?
- Dubbel tellen gebeurt niet: per bon en product wordt één keer opgeteld, en de opslag staat los van de kassa.

## B. Prijzen

| Object | Wat |
|---|---|
| `prijs_waarneming` | Prijs per besteleenheid excl. btw, met inhoud, basis-eenheid (kg/l/st) en prijs per basis. vestiging NULL = beide. Uniek op (vestiging, leverancier, artikelnummer of naam, verpakking, datum, bron). Bij een herhaalde rij wordt de prijs bijgewerkt. |
| `verpakking_naar_basis(verpakking, naam)` | 435gr → 0,435 kg · 24x20cl → 4,8 l · 12x33cl → 3,96 l · 1 L · 70 cl · 5kg · 10x1kg · 10x5x100gr → 5 kg · 6 st. Bij een lege verpakking wordt de laatste maat uit de naam gebruikt. Anders NULL: niet vergelijkbaar. |
| `prijs_inhoud(...)` | Een bekende `inhoud_per_besteleenheid` (leverancier_artikel_vestiging, daarna leverancier_artikelen) gaat vóór de tekst. |
| `v_prijs_aankoop` | Aankopen met prijs > 0 en aantal > 0. Emballage telt niet mee. Een Kooyman-factuurregel die al als API-order bestaat (zelfde naam en aantal, ≤ 7 dagen verschil) telt niet mee. |
| `v_prijs_signaal` | Per vestiging × leverancier × artikel (of naam) × verpakking. Zonder herkenbare verpakking: per productnaam, zodat 1 rol en 6 rollen niet worden gemengd. |
| `prijs_signalen_bord(vestiging)` | Hiermee leest het bord de signalen. Teamleden zien alleen het prijsniveau, niet de inkoophistorie. |

**Drempels in `v_prijs_signaal`:**
- nu = Kooyman live (bron `kooyman_api`, ≤ 3 dagen oud), anders de laatst betaalde prijs.
- normaal = mediaan van de laatste 3 vergelijkbare aankopen. Is "nu" de laatste factuur, dan telt die factuur zelf niet mee.
- Er komt een pijl als n_vergelijk ≥ 2 en het verschil ≥ 3% is.
- Tooltip: "was €x, nu €y".

**Bord:** een pijl van 14px, zonder tekst ernaast, alleen als de view `pijl` op waar zet. Zo'n pijl staat op de bordregel en, voor open regels, in "Indicatie per leverancier".

**Waarschuwing voor eigenaar/admin:** extra kosten = (nu − normaal) × aantal. Je ziet een waarschuwing bij (≥ 5% én ≥ €5) of bij ≥ €25. Daarvoor zijn ook minimaal 2 vergelijkbare aankopen nodig.

**Bot-actie `prijzen`:** `POST bot-bestelbord` met dezelfde Bearer-token, `{"actie":"prijzen","rijen":[…]}`, maximaal 1000 rijen. Een vestiging bovenaan is niet nodig.
- Velden per rij: `vestiging?`, `leverancier_naam`, `artikelnummer?`, `naam`, `verpakking?`, `eenheid?`, `prijs_excl`, `waargenomen_op` (YYYY-MM-DD), `bron` (kooyman_api|catalogus|factuur|handmatig), `geverifieerd?`.
- Antwoord: `{ok, nieuw, bijgewerkt, gekoppeld}`.
- Koppelen gebeurt in deze volgorde: artikelnummer bij de leverancier, dan alias van dezelfde vestiging, dan exacte naam in de gekoppelde historie. Bij twijfel wordt er niet gekoppeld.

**Historie:** alle 685 Kooyman-factuurregels hangen nu aan Kooyman (458 Midsland, 227 West). Daarvan zijn er 515 aan een artikel gekoppeld (347 Midsland, 168 West). Dat gebeurde alleen bij een eenduidige naam-match op dezelfde vestiging. Er is niets verwijderd of gedupliceerd. De voorraadontvangst leest leveranciersnaam en productnaam rechtstreeks uit de regel en verandert dus niet.

## C. Leverancierskeuze (basis; de bot kiest in zijn concept-mandje)

| Object | Wat |
|---|---|
| `leverancier_levering` | Per leverancier × vestiging: levert, leverdagen (0 = zo, NULL = onbekend), kosten. Kooyman: ma–za (aanname). Bidfood: dagen onbekend. Hanos, Drank Dozijn en Wielinga Wijn leveren niet op West. |
| `leverancier_keuze_regel` | `vast`: Koffie & thee (smaakbepalend), Brood & bakkerij, Wielinga Wijn (huiswijn). `alternatief_goedgekeurd` vult de eigenaar later. |
| `v_leverancier_opties` | Prijs per kg/l/st: mediaan van de laatste 3 aankopen (≤ 180 dagen), anders de nieuwste waarneming. Geverifieerd = eigen aankoop of Kooyman live ≤ 120 dagen. |
| `v_prijsverschil_leverancier` | Huidige leverancier (meeste volume in 365 dagen) tegenover de goedkoopste die levert, met dezelfde basis-eenheid. Jaarvolume wordt doorgerekend naar 365 dagen (minimaal 30 dagen periode). Structureel = ≥ 3 aankopen en ≥ 5% verschil. |

## Open punten
- Leverdagen, minimumorders, bezorgkosten en gratis-vanaf zijn bijna overal onbekend; vul ze in `leverancier_levering` in.
- Cocktails met frisdrank: dat frisdrankverbruik komt later uit cocktailrecepten en telt nu nog niet mee in het kassaverbruik.
- Personeel sluitje vanaf 1-11: controleer één echte bon (zie A).
- `v_prijsverschil_leverancier` heeft nu nog geen structurele verschillen: de meeste artikelen komen bij één leverancier vandaan. Dit groeit met Kooyman-live- en catalogusprijzen.
- Kooyman-API-orders en Kooyman-facturen staan allebei in de historie. Voor prijzen zijn ze ontdubbeld. Of de bestaande voorraadontvangst ze dubbel telt, is niet aangepast en apart te controleren.
