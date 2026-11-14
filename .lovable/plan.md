# Alleen de 43 geselecteerde toegangsproblemen herstellen

## Praktijk en afbakening
Dit is een wijziging van database-toegang (RLS), niet van schermen. De wijziging geldt direct voor zowel preview als live, ook zonder Publish.

Alleen de 43 geselecteerde meldingen en de daarbij genoemde brede regels worden aangepakt. Andere meldingen worden niet gewijzigd of genegeerd. Geen wijzigingen aan koppelingen, printeraansturing, wachtrij, taakberekeningen of historische gegevens.

## Voorgestelde toegang
- **Gegevens met een vestiging:** gebruik de bestaande `fase2_mag_vestiging`-controle. Teamleden zien hun eigen vestiging; eigenaar/admin behoudt beide vestigingen en Test. Telregels volgen de vestiging van hun telronde; orderregels die van hun order.
- **Tellingen en dagelijkse handelingen:** schrijven blijft mogelijk voor bevoegde medewerkers van de betreffende vestiging. Instellingen, openingsdagen, sluitdatums, MEP-templates en taakcategoriebeheer mogen alleen managers van die vestiging of eigenaar/admin wijzigen.
- **Gedeelde artikel-, gerecht-, recept- en allergenengegevens:** lezen vereist een actieve rol in `user_roles`, niet alleen een ingelogd account. Gedeelde gegevens blijven beschikbaar voor beide locaties. Waar volledige rijen ook inkoopprijzen of kostprijzen bevatten (Horeko en leverancier-artikelen), wordt rechtstreeks lezen beperkt tot manager/eigenaar; geen kostprijsgegevens naar keukentablets.
- **Artikelstam wijzigen:** alleen manager/eigenaar. Recepten en ingrediënten wijzigen blijft mogelijk voor medewerkers met toegang tot de bijbehorende receptlocatie, inclusief gedeelde recepten; accounts zonder actieve rol worden geweigerd.
- **Inkooporders en -regels:** rechtstreeks lezen/schrijven vereist de bestaande `is_inkoop_beheerder`-controle én toegang tot de vestiging. Hiermee worden ook financiële velden afgeschermd.
- **Prijswaarnemingen:** alleen manager/eigenaar met toegang tot de vestiging.
- **Personeelslocaties en teams:** beheer alleen manager/eigenaar. Lezen van deze keuzelijsten blijft mogelijk voor accounts met een actieve rol, zodat bestaande medewerkersschermen niet hun namenlijsten verliezen; er worden geen persoonlijke personeelsdossiers ontsloten.
- **Onderhoudstickets en opmerkingen:** lezen alleen voor bevoegde accounts van de ticketvestiging; opmerkingen volgen het ticket.
- **Printjobs:** lezen alleen binnen de eigen vestiging. NULL blijft voor lezen bij West horen, zoals de bestaande printerafspraak; aanmaken, claimen en printen blijven ongemoeid.
- **Sticker-suggesties:** gedeelde lijst blijft leesbaar en bruikbaar voor accounts met een actieve rol; geen wijziging van printgedrag.

## Concrete risico's vóór uitvoering
- Een medewerker die vandaag rechtstreeks inkooporders bijwerkt, kan dat na afscherming niet meer. Bestellen en ontvangen moeten daarom expliciet met medewerkers- en managerrollen gecontroleerd worden.
- Horeko-tabellen bevatten receptinformatie én kosten in dezelfde rij. Beperking tot managers kan bestaande recepten-/allergenenweergaven leeg maken. Controleer de afhankelijkheden vóór toepassing; als een medewerkersscherm deze bron rechtstreeks nodig heeft, stop en bespreek een veilige afgescheiden weergave in plaats van blind toegang te blokkeren.
- De app deelt een database tussen preview en live. Een foute regel kan tijdens een dienst vertellen, instellingen wijzigen of historische printstatus tonen blokkeren. Geen nieuwe werkafspraak voor het team; ontbrekende actieve rollen moeten wel door een eigenaar worden hersteld.
- Er worden geen gegevens verwijderd of herschreven. Historie groeit zoals nu; gesloten dagen, seizoenen en lopende bestellingen blijven behouden.

## Technische uitvoering
1. Controleer per geselecteerde tabel alle huidige policies en scherm-/RPC-afhankelijkheden. Bevestig de vestigingskolom of de koppeling naar de bovenliggende rij.
2. Pas alleen de in de geselecteerde meldingen genoemde brede policies aan via één gerichte migratie. Gebruik bestaande rol- en vestigingsfuncties; voor gedeelde stamgegevens controleer een actieve rol server-side. Houd service-role-automatiseringen werkend.
3. Controleer andere permissieve regels op dezelfde tabel om te voorkomen dat ze de nieuwe regels alsnog omzeilen. Als een niet-geselecteerde regel een noodzakelijke extra wijziging vereist, meld dit vóór een uitbreiding van de opdracht.
4. Verifieer de daadwerkelijk gewijzigde policies in de database. Test anoniem, ingelogd zonder actieve rol, medewerker West/Midsland, manager en eigenaar, zonder echte bestellingen, tellingen of prints aan te maken; schrijfpaden alleen met rollback.
5. Hercontroleer de geselecteerde problemen. Markeer alleen volledig herstelde geselecteerde meldingen als opgelost met `manage_security_finding`; andere meldingen blijven ongewijzigd.

## Oplevering
Noem het aantal opgeloste en resterende geselecteerde meldingen, aantoonbaar geteste toegangen en eventuele niet-verifieerbare schermen. Geen frontendpublicatie. Eventuele nieuwe veilige gegevensweergaven vallen niet automatisch binnen deze opdracht.
