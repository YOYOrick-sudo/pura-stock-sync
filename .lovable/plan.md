## Plan: dubbele verticale scroll in de tijdlijn definitief oplossen

Ja, ik snap precies wat je bedoelt: je wilt niet dat de namen links en de balkjes rechts los van elkaar verticaal kunnen scrollen. Er moet maar één verticale scroll zijn voor het hele rooster, zodat elke naam altijd exact naast zijn/haar balkje blijft staan.

### Onderzoek / oorzaak

In de preview is zichtbaar dat er twee verticale scrollbars ontstaan:

```text
[ Namenkolom ] [ Tijdlijn met balkjes + eigen verticale scrollbar ]
              ^ deze rechter scrollbar veroorzaakt het probleem
```

De oorzaak zit in `src/pages/personeel/Tijdlijn.tsx`:

- De buitenste container rond namen + tijdlijn heeft `overflow-y-auto`.
- De rechter tijdlijnkolom heeft `overflow-x-auto`.
- In CSS betekent `overflow-x-auto` in combinatie met hoge content vaak dat de browser óók verticale overflow op dat element afhandelt.
- Daardoor kan de rechter tijdlijnkolom zelfstandig verticaal scrollen, terwijl de linker namenkolom op een andere scrollpositie blijft.

### Juiste fix

Ik ga de scroll-architectuur splitsen in:

1. **Één verticale scroll-laag**
   - De buitenste container blijft de enige `overflow-y-auto`.
   - Deze container bevat zowel de namenkolom als de tijdlijnrijen.
   - Scroll je op namen, balkjes of lege ruimte: alles beweegt samen.

2. **Één horizontale scroll-laag alleen voor de datums/tijdlijn**
   - De rechterkolom behoudt horizontaal scrollen voor de maanden/dagen.
   - Verticaal scrollen wordt daar expliciet uitgezet.
   - Dus rechts mag alleen links/rechts bewegen, niet omhoog/omlaag.

3. **Timeline-inner krijgt vaste volledige hoogte**
   - De rechter timeline-content krijgt expliciet hoogte:

```text
headerhoogte + alle rijen samen
```

   - Daardoor hoeft de rechter scrollcontainer geen eigen verticale overflow te maken.

4. **Sticky headers blijven behouden**
   - Maandrij, dagrij en density bar blijven bovenaan sticky.
   - Linker header boven “Naam / Woonruimte” blijft ook sticky.
   - Namenkolom blijft horizontaal vast staan met `sticky left-0`.

5. **Extra veiligheidsfix tegen scroll chaining**
   - Ik voeg `overscroll`/overflow-regels toe zodat muiswiel/touchpad-scroll niet per ongeluk door de rechterkolom wordt “gevangen”.
   - Dit voorkomt dat het op desktop en iPad opnieuw apart gaat voelen.

### Verwacht resultaat

Na de fix:

```text
Verticaal scrollen:
[ Namenkolom + balkjes samen ]  één beweging, altijd uitgelijnd

Horizontaal scrollen:
[ Alleen tijdlijn/dagen bewegen ]  namen blijven links vast
```

### Te wijzigen bestand

- `src/pages/personeel/Tijdlijn.tsx`

Geen databasewijzigingen nodig.