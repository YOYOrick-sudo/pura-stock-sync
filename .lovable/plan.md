# Koelwerkbank: alle producten in de lades, versleepbaar

## Wat er nu misgaat

Falafel, forel, gerookte zalm, döner en de rest staan er wél in en zijn actief. Ze zijn alleen onvindbaar: sinds de koelwerkbank per lade wordt geteld, komt elk product zonder lade in één blok "Overige reserve — nog geen vaste lade". Op dit moment heeft géén enkel product een lade, dus alle 26 producten zitten in dat ene blok en de negen lades erboven staan leeg.

## Wat we doen

1. **Producten alvast over de negen lades verdelen**, als startindeling die je daarna zelf versleept:

```text
Links boven      Eiwitten: falafel, döner kebab, gekookte eieren, eimengsel
Links midden     Eiwitten: forel, gerookte zalm, tempeh
Links onder      Reserve eiwitten / ruimte vrij
Midden boven     Spreads & mayonaises (werkbakjes)
Midden midden    Reservelade: reservebakjes spreads & mayonaises
Midden onder     Reservelade: overige reserve
Rechts boven     Groente & fruit: paprika, rode peper, avocado, blauwe bessen
Rechts midden    Groente & fruit: aubergine, geroosterde groenten, rode kool, granaatappel, zoetzure gember
Rechts onder     Zuivel & kaas, brood: feta, hüttenkäse, kaas, kokosyoghurt, vegan roomkaas, broodbakken, stokbrood
```

Midden midden en Midden onder worden reservelades; de rest blijft werklade.

2. **Verslepen blijft leidend.** In Koelwerkbank indelen sleep je elk product naar een andere lade; de startindeling is alleen een vertrekpunt. Je kunt ook lades hernoemen en op werk/reserve zetten.
3. **Niets valt weg.** Een product dat (nog) geen lade heeft blijft altijd zichtbaar, maar dan netjes per categorie (Eiwitten, Groente & fruit, ...) onderaan het werkbankblok in plaats van onder de misleidende kop "Overige reserve". Lege lades worden in de telronde en de kastweergave niet getoond.
4. **Aanvullen blijft zoals afgesproken**: leeg of te laag bakje gaat precies tot de standaardvoorraad op de aanvulbon (koelcel → vriescel met Ontdooid-sticker → MEP → Midsland → bestelbord).

## Technisch

- Migratie: `lade_id` zetten op actieve West-werkbankregels volgens bovenstaande verdeling (op naam gematcht), `rol = 'reserve'` op Midden midden en Midden onder; regel in `migratie_logboek`.
- `src/components/foh/VoorraadRonde.tsx`: restblok zonder lade groeperen per `categorieVan(item)` met `CATEGORIE_VOLGORDE`, sleutels `werkbank:cat:<categorie>`; `kastVakken` filtert lades zonder items.
- Geen nieuwe libraries, geen wijziging aan de telling of de aanvulroutes.

## Testen

West → Sluiten → Keuken → Voorraadronde → Koelwerkbank: negen lades met producten, falafel/forel/zalm/döner in de eiwittenlades. Beheer → Koelwerkbank indelen: product naar een andere lade slepen, terug in de ronde staat het op de nieuwe plek.
