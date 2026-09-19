# Mobiele voorraadronde (West) + FIFO op de bon

## Doel
De voorraadronde moet goed werken op de telefoon, zodat iemand met de telefoon in de hand de koelcel in loopt en telt — in plaats van de keukentablet. Plus: FIFO wordt de vaste regel op elke aanvulbon.

## Wat er nu al goed is (gecheckt in de code)
- Telregels zijn al telefoon-proof: tikvlak van 56px hoog, plus/min-knoppen 44px, keuzeknopkenmerken minimaal 44px.
- Onder 640px staat alles netjes op één kolom; kaartjes schalen mee.
- Knoppen onderaan ("... klaar", "Naar de aanvulbon") zijn 56px hoog en over de volle breedte.

## Wat er verbeterd wordt

### 1. Telling mag nooit verloren gaan (belangrijkste punt)
De telling staat nu alleen in het geheugen van de pagina tot je doorzet. In de koelcel valt het scherm vanzelf uit of komt er een telefoontje — daarna is de telling weg.
- De lopende telling wordt voortaan lokaal op de telefoon bewaard (per datum en per apparaat).
- Bij het terugkeren in de app staat je telling er nog, met een korte melding "telling teruggezet van zojuist".
- Na het doorzetten van de bon wordt de bewaarde telling gewist.
- Dit past bij de bestaande regel: status mag nooit verloren gaan, ook niet als wifi of scherm hapert.

### 2. Snelle ingang op de telefoon
Nu: takenlijst → fase Keuken → voorraadronde openklappen. In de koelcel wil je dat in één tik.
- Bovenaan de takenlijst op smalle schermen komt een vaste knop "Voorraad tellen" die de ronde direct opent (op de iPad blijft het zoals het is).
- Waar je was gebleven (open lade) wordt onthouden, zodat je na een onderbroken sessie doortelt.

### 3. Rustig scrollen door de ronde
- De kop van de lade waar je aan het tellen bent blijft bovenin het scherm staan tijdens het scrollen (naam + voortgang "3/7"), zodat je altijd weet waar je bent zonder terug te scrollen.

### 4. FIFO op elke aanvulbon
- Bovenaan elke aanvulbon één vaste grijze regel: "Oudste eerst gebruiken (FIFO) — nieuwe voorraad achteraan zetten."
- De extra benadrukte regel bij Broodbakken blijft staan (bij brood is het extra belangrijk).
- Geen data- of ketenwijziging; puur de tekst op de bon.

## Praktijk en risico's
- Wie/wanneer: de medewerker van de avonddienst telt de koelcel en werkbank met de eigen telefoon; de bon wordt daarna op tablet of telefoon doorgezet.
- Wat moet mee veranderen: het team moet de telefoon meenemen in de koelcel; de knop "Voorraad tellen" is de vaste ingang.
- Als niemand telt: er staat niets op de bon, zoals nu — geen automatische aannames.
- Risco's: lokaal bewaren kan tegenstrijdige tellingen opleveren als twee apparaten tegelijk aan dezelfde ronde werken. Oplossing: de bewaarde telling geldt per apparaat en wordt overschreven zodra je doorzet; op de iPad werkt het zoals nu.
- Bestaande flows (bon, ketenchips, printen) veranderen niet.

## Technisch
- `src/components/foh/VoorraadRonde.tsx`: telling en open lade opslaan in localStorage (sleutel met vestiging + datum), herstellen bij mount, wissen na doorzetten; sticky ladekop; FIFO-regel in de bonstap.
- `src/components/foh/FohTasks.tsx`: knop "Voorraad tellen" alleen zichtbaar op smalle schermen, vestiging West.
- Geen database- of RLS-wijziging, geen nieuwe libraries.

## Test
- Testaccount tijdelijk actief zetten (daarna terugzetten op inactief), dan met een telefoonformaat browser doorlopen: telling kwijt na schermverversing en terug, snelle ingang, lade inklapt bij volgende lade, bon met FIFO-regel.
- Daarna zelf op je telefoon checken: kan je met duimen bij alle knoppen en blijft de telling staan als het scherm uitvalt?
