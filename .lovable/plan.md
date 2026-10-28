# Bestelbord sneller en duidelijker

Geldt voor West en Midsland (zelfde pagina). Het bestelbord slaat nu al een aantal en een eenheid op, maar de eenheid staat altijd op "stuks". Daarom is er geen databasewijziging nodig.

## Invoerregel (bovenaan)

```text
[ Wat is op?  Hüttenkäse          ]
 Eerder besteld: [Hüttenkäse] [Feta] [Haver] ...   <- tik = invullen
 Aantal:  [-]  2  [+]
 Soort:   (stuks) (doos) (zak) (fles) (pak) (bak) (emmer) (kg)
                                        [ + Erbij ]
```

- **Snel kiezen:** zodra je typt, verschijnen producten die eerder besteld zijn. Tik op een naam en het aantal en de verpakking van de vorige keer worden ook ingevuld.
- **Aantal:** grote −/+ knoppen (44px), je kunt het getal ook zelf typen.
- **Soort/verpakking:** keuzeknoppen. Geen knop is vooraf gekleurd, alleen de gekozen knop wordt gevuld. Kies je niets, dan wordt het "stuks".
- Met Enter of "Erbij" voeg je het product toe. Daarna wordt het veld leeggemaakt en staat de cursor er meteen weer in, zodat je door kunt typen.
- **Staat het product al open?** Dan komt er geen dubbele regel. Je ziet de melding "Staat er al (2 doos) — aantal ophogen?", met één tik om op te hogen.

## Lijst

- Elke regel toont het **aantal en de verpakking vetgedrukt** naast de naam, bijvoorbeeld "Hüttenkäse — **2 doos**".
- Tik op de regel om het aantal of de verpakking aan te passen in een kleine pop-up.
- "Besteld" blijft de hoofdknop. Je krijgt een melding met "Ongedaan maken".
- Het prullenbakje maakt plaats voor "Toch niet nodig". Daarmee gaat de regel naar het archief en wordt hij niet echt gewist, zodat de historie bewaard blijft.

## Technisch

- `Bestelbord.tsx`: nieuwe invoer met suggesties uit de bestaande signalen (unieke namen, laatste aantal en eenheid), een stepper, eenheid-chips, dubbelcheck op open regels en een bewerk-dialog.
- `useBestelbord.ts`: een `wijzig`-mutatie (aantal/eenheid) en `verwijderen` wordt archiveren. Daarvoor kijk ik eerst of `bestel_signalen` een status of archiefkolom aankan. Zo niet, dan komt er een kleine migratie: de kolom `gearchiveerd` met default false en een filter in de query.
- Sluitlijst-signalen en de koppeling met de voorraadketen blijven ongewijzigd.
