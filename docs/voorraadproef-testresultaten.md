# Voorraadproef — controle 29 oktober 2026

## Gemaakte objecten
Migraties 0043–0049: acht tabellen (`voorraad_artikel`, `voorraad_ontvangst_koppeling`, `voorraad_verbruik_koppeling`, `voorraad_telling`, `voorraad_correctie`, `advies_log`, `voorraad_periode`, `leer_voorstel`), vier security-invoker views, daggrens/deadline/herteldrempelhelpers, beperkte bronlezer/standberekening, telling-/relatietriggers, atomische advieswrapper, kassadeckinghelper, nachtfunctie. Geen bestaande kolommen of functies vervangen; correcties uitsluitend op nieuwe proefobjecten. Bot alleen adviesmetadata/nieuwe wrapper. UI alleen nieuw blok onder Advies. Bestaande takenbestanden ongewijzigd.

Seed gecontroleerd: **6 artikelen / 6 ontvangst /127 verbruik**, 123 koffie +4 Fritz. Na opruimen **0 tellingen, 0 logs, 0 periodes, 0 voorstellen, 0 testadvies**. Geen echte artikelen of koppelingen verwijderd.

## Sectie 9 per punt
1. **Geslaagd:** foh_tasks vóór/na `34300`; MD5 van ids gesorteerd met komma `c332313457cb1a241c812f88cbd0ccc1`, exact gelijk. Geen takenmutaties uitgevoerd.
2. **Geslaagd:** zes echte artikelen NULL/voorraad onbekend, badge tellen; handmatige nachtjob zonder telling genereert geen stand/voorstel.
3. **Geslaagd:** echte browserflow TEST-artikel: anker10, eerste20 → blind hertellen, tweede21 leidend; snapshot10/verschil11 pas daarna zichtbaar. SQL handmatige som96.2, exact20%/2 toegestaan, 120.01/7.01 hertellen.
4. **Geslaagd:** dubbel bron_ref SQL geweigerd; browser hertelling eigen id/relatie; retry-code leest bestaande id/ref. Verbindingsverlies plus retry niet daadwerkelijk gesimuleerd.
5. **Geslaagd kern:** alle bewegingsrefs volledig uniek per vestiging; historie/bordzelfde referentie één ontvangst; doos24/fles1; deellevering zonder restant NULL, één passend open restant numeriek, gewijzigd/besteld restant NULL; retour negatief. Zelfde ordernummer bij verschillende leveranciers/vestigingen en ontbrekende vorm niet afzonderlijk live gefixtured.
6. **Geslaagd:** ochtendontvangst op teldag inbegrepen (10+5=15), sluit uitgesloten (10); correcties idem; netto retour/kassa/opslag (100+5−8−0.8=96.2), periode onverklaard42 zonder dubbele opslag; woensdag05:59/06:00 Amsterdam; gesloten dag blijft deadline. Bestaande kassa06:00-bucketing niet gewijzigd, geen nieuwe Lightspeed-bon rond06:00 geïmporteerd.
7. **Geslaagd:** nachtfunctie tweemaal, geen stapeling; ≥3 periodes/opslagvoorstel; >30% onderzoek; ≥4 adviezen/MAPE100; MAPE25/25.01; expliciete nul apart, metadata ontbreekt NULL; akkoord wijzigt opslag niet. Geen vaste verliesboeking.
8. **Geslaagd:** staff eigen blinde telling via UI; ander bestaand een-vestigingsaccount ziet/schrijft andere vestiging niet; berekende invoer geweigerd; staff instellingen/ruwe kassa/nachtfunctie/wrapper geweigerd; owner alleen beoordeling, afgeleide voorstelkolom geweigerd; anon geweigerd. Zeven Python-toegangschecks geslaagd. Eerste test onthulde te ruime automatische grants; nieuwe proefgrants expliciet ingetrokken en hertest geslaagd, bestaande grants niet gewijzigd.
9. **Geslaagd:** echte bot-HTTP GET beide locaties, zonder/met metadata en herhaling `{ok,aantal,gekoppeld,gelogd}`; ongeldige factor400; andere proefvestiging400; SQL behoud op_bord-vinkje en volledige rollback bij fout ná adviesvervanging. Bestaande GET/bestellen/koppel/import codepaden ongewijzigd; zeven bestaande bottests geslaagd. Nieuwe metadata alleen als botadviesactie; geen echte order.
10. **Deels:** West/Midsland op390×844 en768×1024, desktop1280×1800 bekeken; rolkeuze en avocado-keuzelijst gecontroleerd. Blind tellen/hertellen/opgeslagen lezen volledig doorlopen. 34 Bun-tests +14 Python-tests geslaagd; laatste preview `build OK`. Bestaande besteld/geleverd/deels/restant en snelkeuze/prijs niet allemaal opnieuw via UI gemuteerd; SQL deelontvangst getest. Eerste resize zonder nieuw scherm gaf oude sidebar; verse schermen tonen correcte mobiele layout.
11. **Geslaagd:** alle eigen tijdelijke bronfixtures via subtransactie teruggedraaid; UI/bottestdata gericht verwijderd; countcontrole bevestigt nul restdata en echte seed zonder tellingen. Geen publicatie. Botfunctie wel bijgewerkt voor gevraagde HTTP-test.

## Cron
`leercurve-nachtelijk`, `45 2 * * *`, actief, commando `select public.leercurve_bijwerken();` in public-schema. Dagelijks02:45 UTC,03:45 winter/04:45 zomer; één run/dag. Alleen nieuwe leergegevens, geen verzending.

## Zelf testen
1. Bestellijst → Even tellen (proef) → Tellen; vul alle lege plekken in, Opslaan.
2. Bij Tel nog één keer: opnieuw alle plekken blind invullen; na opslaan pas vergelijking.
3. Test bij haperende verbinding: invoer blijft staan en Opnieuw opslaan gebruikt dezelfde identiteit.

## Praktijkrisico
Historische besteldatum is niet bewezen afleverdatum. Onbekende/deelsgeleverde conversies blijven onvolledig en mogen geen automatisch orderbesluit sturen. Eén vaste afspraak: bediening telt alle drie proefartikelen vóór de woensdagopening.

Werkwijze: Bouwdiscipline.