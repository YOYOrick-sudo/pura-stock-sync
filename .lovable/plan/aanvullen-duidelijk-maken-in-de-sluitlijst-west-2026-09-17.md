# Aanvullen duidelijk maken in de sluitlijst (West)

Je hebt gelijk: nu zegt de lijst alleen dát iets ergens anders nagekeken moet worden ("Forel moet nu nagekeken worden bij uit de vriezer ontdooien"). Dat is geen opdracht en niemand weet wat hij moet doen. Terwijl het antwoord altijd hetzelfde en heel simpel is: pak het een niveau lager vandaan en leg het terug.

Voor forel staan er drie regels klaar (koelwerkbank, koelcel, vriescel), dus de keten klopt — alleen de taal en de knoppen niet.

## Wat er verandert

**1. "Op" wordt een echte opdracht**

Staat hetzelfde product ook een niveau lager, dan heet de knop niet meer "Op" maar wat je moet doen:

- Koelwerkbank forel leeg → knop **Bijvullen uit de koelcel**
- Koelcel forel leeg → knop **Halen uit de vriescel**

**2. Eén compact venster met twee uitkomsten**

Tik je erop, dan staat er één zin: "Pak 1 forel uit de vriescel en leg hem in de koelcel." Daaronder twee grote knoppen:

- **Gedaan** — regel is afgevinkt. Kwam het uit de vriescel, dan print de "Ontdooid"-sticker meteen, zonder extra tik.
- **Is ook leeg** — dan pas schuift het door: eerst naar het niveau daaronder, en als dat er niet is naar het bestelbord, de mise-en-place of de bestellijst voor Midsland. Met het tekortaantal, net als nu.

**3. Duidelijke teksten onder elke regel**

In plaats van "Als het op is → uit de vriezer (ontdooien)" komt er te staan waar het vandaan komt en wat de volgende stap is als dat óók op is, bijvoorbeeld: "Aanvullen uit de vriescel · daarna bestelbord". Meldingen worden concreet: "1 forel uit de vriescel gehaald, sticker wordt geprint" in plaats van "moet nagekeken worden bij".

**4. Vriescel weet wat eruit ging**

Haal je iets uit de vriescel, dan wordt dat op die vriescelregel vastgelegd. Bij de maandagcheck zie je dan bij dat product "deze week uit gehaald", zodat je weet waar je moet tellen in plaats van de hele vriezer door te lopen.

## Wat hetzelfde blijft

- De vier blokken: vriescel (maandag), koelcel, koelwerkbank, toppings.
- "Te weinig" met het aantal dat nog ligt, en het tekort dat doorgaat naar de bestellijst.
- De bestellijst voor Midsland en het bestelbord onder Voorraad.
- De stickerflow via de printer.

## In de praktijk

Sluitende medewerker loopt de koelcel langs: forel ontbreekt → tikt "Halen uit de vriescel" → pakt hem, tikt "Gedaan" → sticker rolt eruit. Duurt tien seconden en er is niets om te onthouden. Ligt er in de vriescel ook niets meer, dan is "Is ook leeg" één tik en staat het bestelverzoek klaar.

Risico dat we bewust nemen: iemand tikt "Gedaan" zonder het echt te pakken. Dat is niet te voorkomen in software; wel zie je op maandag terug wat er uit de vriescel gehaald zou zijn.

## Technisch

- `src/hooks/useKoelcelCheck.ts`: nieuwe mutatie `vulAanUitNiveau({ item, onderItem })` die de bovenliggende regel op `aanwezig` zet en de onderliggende vriescelregel registreert (`status: 'uit_vriezer'`). `vervolgactieVoorRegel` blijft de keten bepalen, maar krijgt daarnaast een `instructie`-tekst en de uiteindelijke eindbestemming voor het onderschrift.
- `src/components/foh/KoelcelCheckBlok.tsx`: knoplabel afgeleid van de keten; nieuw compact `AanvulDialog` (zelfde stijl als `TekortDialog`, 44px+ tikdoelen); "Is ook leeg" roept de bestaande `meldOp` aan op het onderliggende niveau zodat het tekort correct doorschuift; ontdooisticker wordt in de "Gedaan"-flow geprint.
- Geen databasewijziging nodig: `koelcel_checks` heeft al `status`, `doorgezet_naar` en `aantal_doorgezet`.
