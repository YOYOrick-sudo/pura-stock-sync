# Bestelbot afronden

Ik kan de link niet openen, maar ik ga ervan uit dat hij gaat over de punten die nog open stonden bij het fundament voor de bestelbot.

## 1. Twee reviewpunten oplossen (nieuwe, aanvullende migratie)
- **Historie-import:** oude bestellingen worden niet meer geweigerd als een leverancier of artikel inmiddels inactief is. De vestiging moet wel kloppen, dus een West-leverancier kan nooit bij Midsland-historie terechtkomen, en andersom ook niet.
- **Schrijfrechten historie:** ingelogde gebruikers kunnen niet meer zelf historie toevoegen of wijzigen. Dat gaat alleen via de bot, met auditlog. Managers houden leesrechten.

## 2. Bot-koppeling `bot-bestelbord`
- Eigen token `BOT_BESTELBORD_TOKEN`. Ik vraag het aan via het normale secret-formulier en Yorick vult het zelf in. Ik verzin geen waarde.
- Noodschakelaar `bot_bestelbord_actief`: staat die uit, dan weigert de bot alles (503).
- **GET ?vestiging=…** geeft alleen de open regels van die vestiging, met de leveranciernaam erbij.
- **POST bestellen:** zet maximaal 100 regels op besteld, met referentie en `besteld_via='bot'`. Alles gebeurt in één keer, dus volledig of niet. Twee keer dezelfde aanroep doet geen kwaad. Per regel krijg je "ok" of "overgeslagen" met de reden.
- **POST koppel:** slaat alleen leverancier, artikel en zekerheid op bij open regels. Een leverancier die voor die vestiging niet actief is, wordt geweigerd.
- **POST import_historie:** maximaal 500 rijen per keer. Dubbele rijen worden overgeslagen.
- Elke aanroep komt in het auditlog, ook mislukte. Het token wordt nooit gelogd. Limiet: 60 aanroepen per minuut.

## Wat het in de praktijk betekent
- Het bestelbord blijft voor het team precies hetzelfde werken.
- Als de bot een regel op besteld zet, wordt de bestaande "laatst gewijzigd"-tijd van die regel automatisch bijgewerkt. Dat doet de app nu ook bij handmatig bestellen. Ik pas daar niets aan. Laat het weten als je dit niet wilt.
- Zolang het token niet is ingevuld, weigert de bot elke aanroep.

## Technisch
- Nieuwe migratie: de bewakingstrigger slaat de actief-check over bij `bestel_historie_import` en houdt de vestigingscheck. Ingelogde gebruikers verliezen insert/update op die tabel en de bijbehorende manager-schrijfpolicies vervallen.
- De koppeling draait op een server-functie met `verify_jwt=false` en vergelijkt het token in constante tijd. Ze roept alleen de bot-databasefuncties aan, met beheerrechten (die bestaan al en zijn afgeschermd voor de browser).
- Testen: de bestaande integratietests aanvullen met GET, POST (twee keer achter elkaar), weigeren van een verkeerde vestiging en de noodschakelaar. Niet publiceren.
