# Plan: prijzen, opslag en leverancierskeuze (zelf geaccepteerd)

1. Opslaggroepen-tabel, groepsfunctie, kolom op voorraad_artikel en één functie voor de effectieve opslag. Die functie gebruiken in de stand en in het voorstel van de leercurve. Daarnaast het groepsvoorstel en de nauwkeurigheid op basis van verwacht_kassa.
2. prijs_waarneming, verpakking_naar_basis, bot-actie `prijzen`, v_prijs_aankoop, v_prijs_signaal, plus het leesrecht via prijs_signalen_bord.
3. Kooyman-factuurregels koppelen (alleen eenduidige matches op dezelfde vestiging).
4. leverancier_levering, leverancier_keuze_regel, v_leverancier_opties en v_prijsverschil_leverancier, met startgegevens.
5. Bord: prijspijl met tooltip, en een waarschuwing alleen voor de eigenaar in "Indicatie per leverancier".
6. Tests: SQL-controles en een vitest voor de hulpfuncties. Documentatie in docs/prijzen-en-opslag.md.

Niet aanraken: foh_tasks/takenlijst, menukaart/gerechten/recepten/Horeko/allergenen, Lightspeed-sync. Bestaande flows alleen uitbreiden.
