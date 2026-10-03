# Aanvulregels lades Links boven en Links midden

Hoe het werkt: elk bakje heeft een grens. Zit het bakje onder die grens, dan moet het worden aangevuld of komt het op de MEP. De mogelijke grenzen zijn: vol, half en bodempje (bij bodempje geldt: alleen een leeg bakje geeft een actie).

| Product | Nu | Nieuw | Wat het team ziet |
|---|---|---|---|
| Oesterzwam (Links boven) | half | **bodempje** | Een bodempje is genoeg, alleen bij leeg aanvullen |
| Verse avocado's (Links boven) | vol | **half** | Half is goed, bij bodempje aanvullen uit de koelcel |
| Granaatappelpitjes (Links boven) | vol | **half** | Bij bodempje op de MEP: **3 granaatappels = half bakje** |
| Geroosterde bloemkool (Links midden) | half | half (blijft) | Bij bodempje op de MEP: **2 stuks** |
| Rode kool (Links midden) | vol | **half** | Half is goed, bij bodempje aanvullen |
| Gegrilde groenten (Links midden) | half | **bodempje** | Pas maken als het bakje praktisch leeg is: MEP **1x halve GN 1/4** |

## Technische details
- Alleen gegevens aanpassen, geen wijzigingen in de app of in de tabelstructuur.
- `koelcel_check_items.vulnorm` per item bijwerken (oesterzwam en gegrilde groenten naar `bodem`; avocado, granaatappelpitjes en rode kool naar `half`).
- MEP-hoeveelheid via `batch_aantal`/`eenheid`: granaatappelpitjes 3 granaatappels (halve GN 1/9), bloemkool 2 stuks, gegrilde groenten 1 halve GN 1/4.
- Elke wijziging vastleggen in `migratie_logboek`. Bestaande tellingen en historie blijven staan.
- Controle: op telefoonformaat testtellingen invoeren (bodempje of leeg per product), controleren of de juiste aanvul- of MEP-regel met de juiste hoeveelheid verschijnt, daarna de testtelling wissen en het testaccount weer uitzetten.
