# Eén MEP-lijst, ook met de taken voor later

Nu staan taken die op een andere dag gepland zijn (bijv. ei koken op vrijdag) in een apart blok onderaan. Dat voelt alsof ze niet in "Alle taken" staan. Het wordt één doorlopende lijst.

## Wat er verandert

- De lijst "Alle taken" bevat álles wat nog gedaan moet worden: de taken van vandaag, meegenomen taken van eerdere dagen én de taken die voor een latere dag gepland staan (tot 14 dagen vooruit).
- Volgorde binnen de lijst: eerst te laat, dan vandaag, daarna de latere dagen op datum.
- Een taak voor een andere dag houdt zijn duidelijke dag-label op de rij (bijv. "Vrijdag 25 sep.") en een rustiger uiterlijk, zodat je in één oogopslag ziet dat hij niet van vandaag is.
- Het aparte blok "Gepland voor een andere dag" verdwijnt.
- De teller boven de lijst blijft de voortgang van deze dag tonen ("3/7 klaar"), met erachter "· 2 voor later" en "· 1 te laat". Latere taken tellen dus niet mee in het percentage van vandaag.
- Ook in de weergaven per persoon en per handeling komen de latere taken mee in de groepen.
- Slepen om te herschikken blijft alleen mogelijk voor de taken van deze dag.

## Technisch

- `src/pages/kitchen/MepDag.tsx`: `groepen` opbouwen uit `[...dagTaken, ...laterTaken]` in plaats van alleen `dagTaken`; het aparte `laterTaken`-Card-blok verwijderen (en de nu ongebruikte import opruimen).
- Sortering van latere taken achteraan blijft zoals die uit `useMepTaken` komt (bak 2, op datum).
- Voortgang, `klaar` en `teLaat` blijven op `dagTaken` gebaseerd; de kopregel-tellers blijven ongewijzigd.
- Groepskoppen tonen `klaar/totaal` van hun eigen rijen; latere taken tellen daar mee in het totaal — daarom bij de groepskop alleen de dag-taken meetellen om verwarring te voorkomen.
- Geen database- of hookwijziging nodig; de query haalt latere taken al op.
