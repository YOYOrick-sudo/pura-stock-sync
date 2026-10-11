# Volledige visuele kwaliteitsronde — mobiel, iPad en desktop

## Doel
Elk werkelijk gebruikt scherm van West en Midsland krijgt dezelfde rustige, professionele Pura Vida-uitstraling en blijft technisch exact hetzelfde werken. We behandelen dit als een gecontroleerde kwaliteitsronde, niet als één grote ongerichte restyle.

## Maatstaf
Een scherm is pas klaar wanneer:
- niets buiten beeld valt of onbedoeld horizontaal schuift op 390px mobiel, 820px iPad en 1280px desktop;
- de app-header de enige paginatitel is en acties, filters en tabs steeds op dezelfde plek staan;
- tikdoelen minimaal 44px zijn op telefoon en iPad;
- kaarten, knoppen, velden, tabs, dialogen, iconen, statuskleuren, rondingen en tussenruimtes het bestaande design system volgen;
- lange Nederlandse en Engelse teksten, lege lijsten, laden, fouten en veel data netjes blijven passen;
- desktop compact en scanbaar is, terwijl mobiel de belangrijkste actie eerst toont;
- destructieve acties herkenbaar zijn en bevestiging houden;
- er geen nieuwe kleuren, lettertypen, schaduwen of libraries bijkomen.

## Praktijk
- **Team:** gebruikt Taken, Kassa, MEP, Voorraad en Stickers tijdens een dienst op telefoon of iPad; de eerstvolgende handeling moet zonder uitleg duidelijk zijn.
- **Managers/eigenaren:** gebruiken HR, Personeel, Instellingen en Cijfers vooral op tablet en desktop; veel informatie moet snel vergelijkbaar blijven.
- **Nieuwe gewoonte:** geen. Bestaande knoppen, termen en routes blijven herkenbaar.
- **Als data ontbreekt of wifi hapert:** loading-, fout-, offline- en niet-gesynchroniseerde toestanden blijven zichtbaar en mogen niet door de visuele aanpassing verdwijnen.
- **Na een maand:** lange lijsten, historie en drukke datasets moeten blijven schalen zonder overvolle kaarten of afgesneden bediening.

## Aanpak in gecontroleerde fases

### 1. Nulmeting en schermregister
- Alle routes, tabs, detailweergaven, dialogen en belangrijke lege/loading/fouttoestanden registreren.
- Per scherm screenshots en meetpunten vastleggen op mobiel, iPad en desktop.
- Problemen rangschikken:
  - **P0:** buiten beeld, overlappende bediening, onbruikbare actie;
  - **P1:** incoherente opbouw, te kleine tikdoelen, slechte mobiele datadichtheid;
  - **P2:** afwerking zoals spacing, icon alignment en teksthiërarchie.
- West en Midsland apart controleren waar inhoud of rechten verschillen.

### 2. Gedeelde basis eerst herstellen
Eerst de systeemoorzaken oplossen, zodat niet tientallen pagina’s los worden opgelapt:
- één consistente pagina-container en verticale ritmiek onder de vaste app-header;
- één patroon voor subacties, filters, tabs, statusregels en lege/loading/fouttoestanden;
- gedeelde knoppen gebruiken in plaats van afwijkende losse knoppen;
- dialogen mobiel begrenzen tot het zichtbare scherm, met scrollbare inhoud en vaste bereikbare acties;
- tabellen op mobiel bewust omzetten naar compacte rijen/kaarten of gecontroleerd scrollen;
- veilige schermranden, sticky delen en sidebar opnieuw controleren;
- bestaande semantische kleuren en dark/night-mode behouden.

### 3. Operationele kern — hoogste prioriteit
Per module eerst mobiel/iPad, daarna desktop:
1. **Taken:** Openen, Tussen, Borrel, Sluiten, Periodiek, NL/EN, categorieën, edit/drag, voorraadronde en au bain-marie.
2. **Kassa:** Open, Sluit, Kas-controle, validatie, dagbeoordeling en wisselkassa.
3. **MEP:** dag, alle taken, week, plannen, bewerken, afronden en beheer.
4. **Voorraad:** Bestellen, Onderweg, Stand, telrondes, voorstellen en bestelacties.
5. **Koelwerkbank/voorraadronde:** lades, koelcel, vriezer, magazijn, flessen, toppings en aanvulbon.
6. **Stickers:** productkeuze, aantallen, printstatus en fout/herhaaltoestanden.

Na iedere module controleren we dat afvinken, opslaan, plannen, tellen, versturen en printen functioneel ongewijzigd blijven.

### 4. Keuken en inhoud
- Receptenlijst, receptdetail en bewerken/nieuw.
- Ingrediënten, gerechten en allergenen.
- Bestelbord en keukenmenu.
- Instellingen voor MEP, koelwerkbank en voorraadketen.
- Extra aandacht voor iPad staand, natte/vette handen en bediening zonder hover.

### 5. Beheer en inzicht
- Dashboard en overdracht.
- Onderhoud: lijst, nieuw ticket en detail.
- HR: inbox, kandidaat, formulier en huisvesting.
- Personeel: tijdlijn, wonen, collega’s en instellingen.
- Cijfers: filters, KPI’s, grafieken en looninformatie.
- Team, bronnen en algemene instellingen.
- Auth/startscherm, pincode, toegangsweigering en 404.

Financiële en personeelsinformatie blijft achter de bestaande manager-/owner-beveiliging; gedeelde tablets krijgen niets extra te zien.

### 6. Eindcontrole als echte gebruiker
Voor West en Midsland aantoonbaar doorlopen:
- mobiel 390×844;
- iPad 820×1180, plus iPad mini-breedte 744px voor sidebarstabiliteit;
- desktop 1280×1800.

Per scherm controleren:
- screenshot en visuele vergelijking;
- geen horizontale overflow, overlap of afgesneden tekst;
- toetsenbordfocus en tikdoelen;
- light- en night-mode op representatieve schermen;
- console-, runtime- en netwerkfouten;
- de centrale gebruikersactie end-to-end met echte sessie en representatieve data;
- terugzetten/opruimen van testdata.

## Technisch kader
- Dit is een **UI-wijziging**: geen database-, RLS-, route-, printer-, n8n- of voorraad/MEP-logica aanpassen.
- Bestaande guards en de ene bestaande backend-client blijven ongewijzigd.
- Eerst gedeelde presentatiecomponenten stabiliseren, daarna alleen schermspecifieke uitzonderingen.
- Wijzigingen gaan in kleine module-batches; na elke batch volgt buildcontrole en browsercontrole voordat de volgende begint.
- Bestaande open roadmap-feature voor GN-liter-telling valt buiten deze kwaliteitsronde en wordt niet ongemerkt meegenomen.

## Concreet risico en beheersing
- **Grootste risico:** een algemene layoutwijziging kan sticky bediening, dialogen of drukke tel-/takenlijsten verslechteren. Daarom eerst nulmeting, vervolgens kleine batches en na elke batch een functionele regressietest.
- **Operationeel risico:** een verplaatste knop kan tijdens een dienst tot een gemiste telling of verkeerd verzonden bestelling leiden. Primaire acties blijven daarom dezelfde naam, betekenis en volgorde houden.
- **Datrisico:** geen schema- of datamutaties; functionele tests gebruiken tijdelijke gegevens die direct worden opgeruimd.
- **Koppelingsrisico:** print-, realtime- en bestelacties worden niet inhoudelijk gewijzigd, maar wel na de visuele aanpassing opnieuw doorlopen.

## Oplevering
Een afvinkbaar schermregister met per scherm: mobiel, iPad, desktop, light/night waar relevant, visueel resultaat, functionele controle en eventuele resterende beperking. Geen module geldt als afgerond zonder aantoonbare controle.
