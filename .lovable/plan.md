# Ontdooi-lijst — categorie hernoemen

## Wat verandert er
- De categorie **"FIFO koeling"** (West, Keuken, sluit) wordt hernoemd naar **"Ontdooien (vriezer → koelcel)"**.
- De 12 losse taken (Kip, Tempeh, Kebab, Soepen, Zalm & Forel, Bananenpannenkoeken (koellade), Brioche, Zoet (alleen als echt op), Tomatenjam, Relish, Wortelspread, Kaas) blijven exact zoals ze zijn — korte productnamen, losse vinkjes.
- De `sort_order`-waarden worden netjes opnieuw gezet (10, 20, 30, …) in de door jou aangegeven volgorde, zodat de nummering 1–12 klopt.

## Geen wijzigingen aan
- Taaktitels.
- Andere categorieën in West Keuken sluit.
- Andere lijsten of locaties.
- UI-code (puur data).

## Technisch
Eén data-operatie via de bestaande `foh_rename_category(_location, _department, _old, _new)` RPC. Die functie:
1. Hernoemt de categorie in `foh_daily_templates`.
2. Hernoemt 'm ook in alle actieve `foh_tasks` (niet-archived) — dus de wijziging is **vandaag direct zichtbaar** in de live sluitlijst.
3. Werkt `foh_category_order` bij zodat de volgorde-instellingen behouden blijven.

Daarna een korte UPDATE op `foh_daily_templates` om `sort_order` per item te zetten in de gewenste volgorde.

```text
West · Keuken · sluit
└── Ontdooien (vriezer → koelcel)   (hernoemd uit "FIFO koeling")
    1. Kip
    2. Tempeh
    3. Kebab
    4. Soepen
    5. Zalm & Forel
    6. Bananenpannenkoeken (koellade)
    7. Brioche
    8. Zoet (alleen als echt op)
    9. Tomatenjam
    10. Relish
    11. Wortelspread
    12. Kaas
```
