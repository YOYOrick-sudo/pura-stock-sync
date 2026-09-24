# Au bain-marie stickeren als 3e item in de keuken-sluitlijst

## Wat je straks ziet
In de sluitlijst bij Keuken staat het uitklapbare blok **"Au bain-marie — stickers"** direct onder taak 2 ("Bain marie schoonmaken…"), dus als derde item in de lijst:

```text
KEUKEN
1. Bain marie uit en leeg laten lopen…
2. Bain marie schoonmaken en vullen…
   ┌─ Au bain-marie — stickers        0/3 ▾  (uitklapbaar)
   │   Kip          [Sticker printen]
   │   Tom yum      [Sticker printen]
   │   …
3. Grill uit + schoonmaken…
4. Snijplanken door de afwas…
```

Nu hangt datzelfde blok helemaal onderaan, na álle keukentaken — daarom oogt het los van de taken. Het blok is al uitklapbaar; alleen de plek verandert.

## Wat blijft gelijk
- Standaard uitgeklapt; klapt vanzelf dicht als alle stickers geprint zijn.
- Voortgang ("2/3") en "afgerond"-markering in de balk.
- Printen zelf, de laatste-dag-regel (Wegooien i.p.v. sticker) en de ochtend-variant (BainMarieOpen) blijven onaangetast.
- Nummering van de taken loopt gewoon door: de taak na het blok heet nog steeds 3, 4, 5… — het blok zelf krijgt geen nummer.
- Slepen van taken (beheer) blijft werken.

## Technische aanpak
- In `src/components/foh/FohTasks.tsx` wordt het `BainMarieSluit`-blok niet langer als aparte sectie onderaan de keukenlijst gezet, maar **in** de keukenlijst ingevoegd, direct na de laatste taak met "bain marie" in de titel. Zo blijven nummering en drag & drop van de bestaande lijst intact.
- Terugval: zijn die taken (tijdelijk) hernoemd of weg, dan staat het blok weer onderaan zoals nu — er breekt niets.
- Alleen voor West, alleen op de sluitlijst, niet in alleen-lezen-weergave — zelfde voorwaarden als nu.

## Praktijk en risico's
- **Wie/wanneer**: keuken West, avond, iPad. De sticker-stap hoort logisch direct na het schoonmaken van de bain-marie; met deze plek volgt de lijst de werkvloer en wordt printen minder vaak vergeten.
- **Risico**: als de bain-marie-taken ooit hernoemd worden zonder "bain marie" in de titel, schuift het blok terug naar onderaan (zachte terugval, geen fout). De koppeling op titel is bewust simpel gehouden.
- **Test**: na de bouw live controleren op telefoon- en iPad-formaat: blok staat als 3e item, nummers lopen door, uitklappen/inklappen werkt, een sticker printen markeert de voortgang. Er wordt niets geprint tijdens de test zonder dat het zichtbaar en herstelbaar is.
