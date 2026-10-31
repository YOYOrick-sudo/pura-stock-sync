# Blauwe bessen — eerst uit de koelcel

## Oorzaak
Beide actieve West-regels zijn al correct gekoppeld: blauwe bessen in de werkbank en in de koelcel delen dezelfde productsleutel. De uitleg toont aanvullen uit de koelcel. De knop **Bijbestellen** slaat die controle echter over: hij behandelt alle niveaus als leeg en stuurt rechtstreeks naar het bestelbord. Er is geen bewijs dat de koelcel daadwerkelijk leeg was.

## Gerichte correctie
- Bij blauwe bessen in de aanvulronde: afvinken blijft betekenen dat het team uit de koelcel heeft aangevuld.
- De bestelknop opent een korte keuze met bestaande knoppen: **Aanvullen uit koelcel** of **Koelcel is leeg — bijbestellen**. Alleen de tweede keuze gebruikt de bestaande bestelactie; de eerste gebruikt de bestaande afvinkactie. Geen automatische bestelling bij een lege werkbank.
- Beperken tot de gekoppelde blauwe-bessenregels; geen algemene ketenwijziging en zeker geen omgekeerde koelcel→werkbank-koppeling, die een kringloop zou veroorzaken.
- Geen wijziging aan voorraadnormen, berekeningen, rechten of andere producten. De koelcelregel heeft nu bestelpunt 1; dat blijft ongemoeid omdat de aanvulronde bij expliciet ‘leeg’ al met 0 bestelt.
- De bestaande open bestelbordregel niet automatisch verwijderen; apart herstel vereist akkoord, omdat niet bekend is of er echt uit de koelcel is aangevuld.

## Controle
Gemockte tests voor de echte aanvulactie: aanvullen maakt geen bestelling; expliciet lege koelcel gebruikt de bestaande bestelactie; gekoppelde koelcel blijft de bron. Geen echte telling, bestelling of printjob aanmaken. Automatische bouwcontrole lezen en het keuzescherm waar mogelijk veilig bekijken.

## Praktijk en risico
West-team, tijdens bijvullen op de keukentablet. Eén extra keuze bij bijbestellen voorkomt dat een lege werkvoorraad als lege koelcel wordt gezien. Niemand hoeft aantallen te onthouden. Niet bevestigen betekent niet bestellen. Bestaande historische meldingen blijven staan: deze wijziging corrigeert geen reeds aangemaakte order. Zonder publicatie verandert alleen de preview-interface; er zijn geen databasewijzigingen.

## Technisch
Categorie: gerichte UI-/actiebevestiging met bestaande mutaties, daarom het zwaardere data-impactniveau. Bestaande design-systemcomponenten, geen nieuwe bibliotheek of globale state. Alleen AfvinkRonde, een kleine beslishelper indien nodig en gerichte tests wijzigen.
