# Falafel uit de koelcel (zelf aanpasbaar) + döner-zakken

## Wat je wilt

1. **Falafel** hoeft niet in de koelcel, behalve als het druk is — en je wilt dat zelf kunnen aanpassen, net zoals bananencake (uit/aanzetten via instellingen).
2. **Döner kebab** in de koelcel: 1 vacuümzak (midden) is genoeg; zit het in kleine zakjes, dan zijn 2 zakjes goed.

## Huidige stand (gecontroleerd)

- Falafel ligt nu als actieve telregel in de koelcel (zwarte bak) én in de vriezer.
- Döner ligt in de koelcel als "gevacumeerd pakje" zonder vast aantal-afspraak.
- Het instellingenscherm (Instellingen → Koelwerkbank indelen) beheert vandaag **alleen de werkbanklades**: slepen, reserve-aantal, bakmaat, vulnorm, lade aan/uit. Koelcel-, vriezer- en magazijnitems kun je daar **nog niet** zelf aanpassen — dat is precies wat je nu mist.

## Plan

### 1. Koelcel & vriezer beheerbaar maken in instellingen
Het instellingenscherm krijgt onder het laderaster een extra onderdeel **"Koelcel, vriezer en magazijn"**: per plek een lijst met producten, met per product:
- **Aan/uit-schakelaar** (archiveren / weer activeren — zelfde principe als bananencake en de Opzetkoeling-lade)
- **Doelaantal** aanpassen (bijv. 1 zak, 3 stuks)
- Korte omschrijving/formaat aanpassen (bijv. "vacuümzak midden")

Zo kun je falafel voortaan zelf aanzetten als het druk wordt en weer uitzetten als het rustig is — zonder mij.

### 2. Falafel nu uit de koelcel
- Koelcel-falafel (`a7175615`, zwarte bak) op **niet actief** zetten (archiveren, niet verwijderen — historie blijft).
- Vriezer-falafel blijft gewoon actief: falafel komt uit de vriezer, ontdooien blijft de vervolgstap bij een tekort op de werkbank.
- Gevolg voor de ronde: falafel wordt alleen nog op de werkbank geteld (half is goed, bodempje → aanvullen/ontdooien), de koelcel vraagt er niet meer naar.

### 3. Döner: 1 vacuümzak midden (of 2 kleine zakjes)
- Koelcel-döner (`6e399eda`): doel **1 vacuümzak**, formaat-omschrijving **"vacuümzak midden — kleine zakjes: 2"**, zodat de teller ziet wat "goed" is.
- In de ronde telt hij dan als aanwezig bij 1 middenzak of 2 kleine zakjes; minder → melding volgens de bestaande keten (döner komt uit de vriezer).

### 4. Testen
- Build controleren.
- Live op telefoonformaat (390px) met het West-testaccount:
  - instellingenscherm toont het nieuwe koelcel/vriezer-onderdeel; falafel staat daar uit en is weer aan te zetten;
  - de voorraadronde vraagt niet meer naar koelcel-falafel;
  - döner toont "1 vacuümzak midden (kleine zakjes: 2)".
- Testaccount daarna weer uitschakelen, geen testdata achterlaten.

## Technische details
- `src/pages/settings/KoelwerkbankIndeling.tsx` + nieuw component (bijv. `src/components/voorraad/PlekItemsBeheer.tsx`) dat `koelcel_check_items` per plek (koelcel/vriezer/magazijn) toont met aan/uit en doel-aanpassing (bestaande mutaties/patroon uit `LadeGrid.tsx` hergebruiken).
- Data via bestaande hooks in `src/hooks/useKoelcelCheck.ts`; updates via `supabase--run_sql` (falafel actief=false, döner doel/formaat), gelogd in `migratie_logboek`.
- Geen schema-wijzigingen nodig; geen verwijderingen, alleen archiveren.
- Let op: vulnorm-keuze in instellingen kent nu alleen vol/half — de 'bodem'-optie (bodempje is goed) voeg ik daar ook aan toe, zodat je die voortaan zelf kunt instellen.
