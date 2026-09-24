# Groente & fruit om de dag tellen, met weekbeeld

## Wat je straks ziet

In de voorraadronde staat bij **Groente & fruit (koelcel)** altijd een kleine weekstrip, zodat je in één oogopslag ziet wanneer je telt:

```text
GROENTE & FRUIT — KOELCEL
 vr   za   zo   ma   di   wo   do
 24   25   26   27  [28] (29)  30        ← vandaag omrand, tel-dag groen,
                                            gesloten dag grijs doorstreept
```

- **Tel-dag (om de dag):** de groep staat open zoals nu, met bovenaan de strip. Je telt gewoon.
- **Geen tel-dag:** de groep klapt dicht tot één rustige balk: *"Vandaag niet tellen · volgende telling zondag 27 sep"*. Je hoeft niets te doen en de groep telt niet mee in de voortgang van de ronde.

## Hoe de tel-dag wordt bepaald
- Ritme: **om de dag** — de volgende tel-dag is 2 dagen na de vorige telling.
- **Gesloten dagen tellen niet mee**: valt de tel-dag op een gesloten dag (bijv. dinsdag), dan schuift hij door naar de eerstvolgende open dag. Hiervoor gebruiken we dezelfde openingskalender als de MEP-planning, dus wijzigingen in openingstijden werken automatisch door.
- **Vergeten = niet kwijt**: is de tel-dag gemist, dan blijft de telling gewoon "due" en verschijnt hij de eerstvolgende open dag alsnog. Geen handigheidjes nodig.
- De eerste keer (nog nooit geteld) telt de groep meteen mee.

## Wat bewust niet verandert
- Alle andere onderdelen van de ronde (koelwerkbank, spreads, vriescel, magazijn-maandag) blijven zoals ze zijn.
- De telling zelf, de ketenregels en de historie veranderen niet.

## Technische aanpak
- Herberekenen uit bestaande data: laatste afgeronde Groente & fruit-telling uit de tellingstabel + `useMepKalender('West')` voor open/gesloten dagen. Geen nieuwe tabellen; geen instelling die kan verlopen.
- `VoorraadRonde.tsx`: de groep krijgt een `ritme`-status (tel-dag / niet-tel-dag / eerstvolgende tel-dag), de weekstrip is een klein nieuw component (`WeekStrip`) met 7 dagen vanaf vandaag.
- Niet-tel-dagen: groep rendert als ingeklapte balk, buiten de voortgangsteller.

## Praktijk en risico's
- **Wie/wanneer**: keuken West, sluitronde. Het team hoeft het ritme niet te onthouden — de strip laat het zien, en op een vrije dag is de groep gewoon dicht.
- **Seizoen/wisseling**: omdat de cadans uit de laatste telling en de openingskalender komt, blijft hij kloppen als openingstijden veranderen; geen vaste "dinsdag-donderdag-zaterdag"-lijst die kan verouderen.
- **Risico**: als de openingskalender ooit niet klopt, schuift de tel-dag mee — de strip maakt dat zichtbaar (gesloten dag is doorstreept), dus het valt direct op.
- **Test**: live op telefoonformaat — tel-dag (groep open), niet-tel-dag (balk met juiste "volgende telling"), en een gesloten dinsdag die wordt overgeslagen.

## Volgorde van bouwen
1. Eerst de nog openstaande live test van het stickerblok (3e taak in de sluitlijst) afronden.
2. Daarna dit plan.
3. Tot slot het eerder goedgekeurde mayo-/GN-liter-plan (staat klaar om te bouwen).
