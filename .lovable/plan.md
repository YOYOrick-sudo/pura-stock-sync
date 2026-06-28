Herindelen van de **Sluitlijst West (Voorkant)** in 5 logische categorieën, plus 3 nieuwe taken onder **Shop**.

## Categorieën (in deze volgorde)

**1. Bijvullen**
- Smoothies maken voor de volgende dag
- Smoothie-pakken bijvullen
- Melk en frisdrank bijvullen
- Juice fruit aanvullen
- Fruit vrieslade aanvullen
- Koffiebonen bijvullen in hopper
- Koffiebonen in de shop aanvullen
- Limonadeflessen aanvullen (1 van ieder op reserve in de koelcel)
- Takeaway koffie en smoothie aanvullen
- Koffie & smoothiebekers bijvullen

**2. Schoonmaak Bar**
- Blenders + kannen schoon (handwas!)
- Juicer schoonmaken (handwas!)
- Juspers schoon
- Lades schoon
- Dienbladen schoon
- Tangen zoet/hartig schoon (handwas!)
- Melkkannetjes in vaat
- Melkstation schoon + rooster in vaat
- Deksels op voorgesneden fruit
- Restwater karaf → bamboeplant

**3. Shop** *(nieuwe categorie + 3 nieuwe taken)*
- Shop zakjes en flesjes aanvullen (FIFO) — **nieuw**
- Zakjes naar voren — **nieuw**
- Shirts aanvullen (geen lege hangers) — **nieuw**

**4. Terras**
- Kussens naar binnen
- Terrasbakjes in grijze bak (naar binnen)
- Plantjes in grijze bak (naar binnen)
- Bord naar binnen

**5. Sanitair**
- Toilet schoonmaken

## Wat ik doe

- **Update** `foh_daily_templates` (West / sluit / voorkant): nieuwe `category` + opnieuw genummerde `sort_order` (10, 20, 30…) per bovenstaande volgorde.
- **Insert** 3 nieuwe template-taken onder categorie "Shop".
- Spiegel dezelfde wijzigingen op vandaag's actieve `foh_tasks` (niet-gearchiveerd, niet-afgevinkt): bestaande taken hercategoriseren/hersorteren, en de 3 nieuwe Shop-taken aanmaken voor vandaag zodat ze direct zichtbaar zijn.
- Zet `foh_category_order` (West/voorkant): Bijvullen (10), Schoonmaak Bar (20), Shop (30), Terras (40), Sanitair (50).
- Midsland en West Openlijst blijven ongewijzigd.

Akkoord?