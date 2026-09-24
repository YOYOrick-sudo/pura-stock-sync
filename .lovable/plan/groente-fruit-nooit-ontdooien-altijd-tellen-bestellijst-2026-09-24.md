# Groente & fruit: nooit ontdooien, altijd tellen → bestellijst

## Uitgangspunt (gecontroleerd in de database)
- Geen enkele actieve groente- of fruitregel is gekoppeld aan de vriescel. Alleen brood, eiwitten, soepen, spreads/mayo's en zoet hebben een vriescel-stap ("ontdooien").
- Groente & fruit gaan bij een tekort nu al naar:
  - **bestelbord** (inkoop, bv. bloemkool, kiemen, verse paprika's)
  - **MEP snijden/bereiden** (bv. tomaatjes, lente-ui, gesneden paprika)
  - **bestellijst Midsland** (bv. oesterzwam, rode kool)
  - **magazijn** (bv. zoetzure gember)

## Wat we bouwen
1. **Vaste regel in de code**: groente & fruit kunnen nooit "ontdooien uit de vriescel" als vervolgactie krijgen — ook niet als er later per ongeluk een vriescelregel met dezelfde productsleutel bijkomt. De ketenzoeker slaat de vriescel over voor deze categorie; zonder andere stap gaat het naar het bestelbord.
2. **Live proeftelling op telefoonformaat**: bloemkool op 2 en kiemen (greenpeez) op 0 tellen en controleren dat de aanvulbon een bestelbordregel toont — nergens het woord "ontdooien" of "vriescel" bij groente & fruit. Daarna de testtelling weer wegpoetsen.

## Wat verandert er voor het team
Niets in de dagelijkse ronde: groente en fruit tellen werkt zoals het hoort. De spreads en mayo's blijven "uit de vriescel ontdooien" zeggen — dat klopt en blijft.

## Risico's
- Klein: de regel is een extra filter op bestaande logica; bestaande vriescel-ketens (döner, soepen, zoet, spreads) blijven ongemoeid.
- Geen dataverlies: we raken alleen categorie-logica, geen tellingen of historie.
