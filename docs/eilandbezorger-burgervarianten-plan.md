# Midsland: burger met optionele friet

De concrete uitvoering is door Yorick goedgekeurd in de opdracht van 23 november 2026.

- Optionele keuzes expliciet onderscheiden van verplichte bowlmaten; basis + €7 wordt één compleet product, aantal behouden, topping verwijderd.
- Alleen de twee opgegeven combikoppelingen opslaan. Soloproducten en andere koppelingen vult Yorick apart.
- Reguliere extra’s alleen via gerechtgebonden of gerecht/definitief-productgebonden koppelingen; daadwerkelijke optie-toepasselijkheid uit de bestaande cataloguscontrole, betaalde/onbewezen opties blokkeren.
- Testontvangst via de normale ontvanger, geen rechtstreekse testinserts; nul verzendpogingen teruglezen. Alleen betrokken functies uitrollen.

## Praktijk en risico’s
Karin blijft dezelfde burger- en toppingkeuze aanleveren; het team krijgt later één compleet kassaproduct per burger. Niets wijzigt aan bediening of printers. Zonder solokoppelingen worden soloburgers afgekeurd in plaats van gegokt. Bij catalogusstoring blijven reguliere extra’s geblokkeerd; testontvangsten sturen nooit kassaberichten. Historie blijft behouden, extra testnummers krijgen de herkenbare TEST-prefix.

## Technisch
Categorie: data-/backendwijziging, geen RLS/rollenwijziging. Additief veld `keuze_verplicht` standaard true op bestaande mappingtabel; false uitsluitend voor optionele formaatvarianten. Bestaande verplichte formaten blijven gelijk. Extra-sleutels `gerecht|extra` of `gerecht|product-ID|extra`; productniveau heeft voorrang, geen globale fallback. Huidige prijs-/btwcontrole en betaalde-modifierblokkade blijven gelden.