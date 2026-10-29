# Voorraadproef en lichte leercurve

## Gebruik
Bestellijst → **Even tellen (proef)** → Bediening/Keuken. Woensdag vóór opening tellen, ook open koffie/hopper en Fritz in koeling én magazijn. Invoer start leeg. Geen telling is onbekend, nooit nul. Afwijking boven `max(abs(berekend)*20%,2)` vraagt een tweede blinde telling; die tweede is leidend. Beide blijven bewaard. Retry gebruikt dezelfde id en bron_ref.

## Daggrenzen
**Voor opening:** ontvangsten (historie/bord), correcties en kassaverbruik met datum **>= teldatum**.
**Na sluiting:** uitsluitend datum **> teldatum**.
Periodes gebruiken exact dezelfde grens aan beide kanten: `[daggrens(begin), daggrens(eind))`. Gemengde momenten en nul/lengte-onmeetbare dagen zijn onvolledig en leren niet mee. De bestaande kassa-werkdag 06:00–06:00 Amsterdam wordt niet opnieuw ingedeeld. Woensdagdeadline is 06:00 Amsterdam, ook bij een gesloten woensdag.

Historische besteldatum is slechts een ontvangstbenadering. Bordontvangst telt alleen bij geleverd_op. Niet-lege referenties dedupliceren alleen binnen dezelfde vestiging en leverancier. Doos24 vraagt bevestigde vorm, losse fles telt 1. Deellevering is alleen oorspronkelijke hoeveelheid min één ongewijzigd open restant met dezelfde eenheid/vorm; anders hoeveelheid NULL en onvolledig. Geen teksthoeveelheden raden.

## Formules
`stand = geteld + ontvangen + correcties − netto_kassa − netto_kassa*verbruiksopslag_pct/100`.
`onverklaard = begin + ontvangen + correcties − eind − kassa`; opslag niet nogmaals aftrekken.
Na minimaal 3 volledige periodes met positieve som kassa: voorstel `100*som(onverklaard)/som(kassa)`. Eén periode met absolute afwijking >30%: onderzoeken. Minimaal 4 vergelijkbare afgeronde adviezen met MAPE >25%: advies controleren. MAPE gebruikt later_verkocht, nulverbruik apart. Ontbrekende bron/conversie blijft NULL.

## Rechten en grenzen
Acht nieuwe tabellen met eigen-vestiging RLS en expliciete grants. Staff schrijft uitsluitend telling-invoer; server bepaalt identiteit, snapshot en betrouwbaarheid. Instellingen/correcties owner/admin; voorstelbeoordeling alleen status/beoordelaar/tijd. Akkoord past **geen** opslag toe. Geen anon-toegang. Vier views zijn security_invoker. De beperkte definer-leeshulp geeft uitsluitend proefbewegingen zonder omzet/prijzen; bestaande financiële rechten blijven intact.

De nieuwe advieswrapper en `leercurve_bijwerken()` zijn alleen service-role uitvoerbaar (nachtfunctie ook postgres). Bestaande functies/kolommen/takenlijst worden niet gewijzigd. Geen bestellingen of verzendingen. Geen publicatie tijdens deze opdracht.

## Planning
SQL-job **leercurve-nachtelijk**: `45 2 * * *`, dagelijks **02:45 UTC** (03:45 winter, 04:45 zomer). Eén run/dag, idempotent; schrijft alleen nieuwe logs, periodes en voorstellen. Geen externe oproep.

## Controle
Seed: 6 proefartikelen, 6 ontvangst-, 127 verbruikskoppelingen (123 koffie +4 Fritz). Testdata krijgt `TEST voorraadproef – verwijderen` en wordt verwijderd; echte seed blijft zonder tellingen. Integratiechecks staan in `tests/voorraadproef.integration.py` en `tests/voorraadproef.sql`; reken-/validatieregels in de bestaande Bun-testomgeving.