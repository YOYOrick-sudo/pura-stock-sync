# Wisselkassa-aanvraag: blijft hangen bij versturen

## Wat ik heb gecontroleerd (geen aannames)

- In de database staat **geen enkele wisselkassa-aanvraag** — de tabel is leeg.
- De tabel `wisselkassa_aanvragen` heeft wel toegangsregels, maar **geen rechten (GRANT)** voor ingelogde gebruikers. Opslaan van de aanvraag kan daardoor nooit lukken, en die fout wordt nu stil weggeslikt.
- In de logboeken van de mailfunctie staat de afgelopen dagen **geen enkele aanroep**. De mail wordt dus niet eens geprobeerd; het scherm blijft ervoor al hangen.
- De knop haalt eerst de ingelogde gebruiker op via een netwerk-aanroep zonder tijdslimiet. Als die aanroep blijft hangen (dat is precies wat we eerder bij de trage app zagen), blijft het knopje eeuwig draaien: er is geen enkele afbreek- of foutmelding.

## Wat ik ga oplossen

1. **Rechten op de aanvragen-tabel zetten** zodat het opslaan van een aanvraag daadwerkelijk lukt (invoegen voor ingelogde gebruikers, volledige toegang voor het systeem, lezen blijft beperkt tot manager/eigenaar).
2. **Geen netwerk-aanroep meer om te weten wie je bent**: de app gebruikt de al aanwezige sessiegegevens. Scheelt een stap die kan blijven hangen.
3. **Harde tijdslimiet van 15 seconden** op het versturen. Duurt het langer, dan stopt het draaiende bolletje en zie je: "Versturen duurde te lang — probeer het opnieuw."
4. **Echte foutmeldingen**: mislukt het opslaan of de mail, dan zie je dat direct in beeld in plaats van een stil draaiend bolletje. De popup sluit alleen als het echt gelukt is.

## Verificatie (dit doe ik zelf, niet alleen beloven)

- Ik voer een echte aanvraag uit in de app als ingelogde gebruiker.
- Ik controleer daarna: (a) staat de aanvraag in de database, (b) staat de mail in het verzendlogboek met status verzonden, (c) sluit de popup met een bevestiging.
- Let op: die test stuurt een **echte mail naar helga@puravidafoodbar.nl**. Wil je dat liever niet, zeg het erbij — dan test ik naar jouw eigen adres en zet ik daarna Helga's adres terug.

## Niet in scope

- Geen wijziging aan het uiterlijk van de popup of de tekst van de mail.
- Geen wijziging aan de kassatelling of kas-controle zelf.
