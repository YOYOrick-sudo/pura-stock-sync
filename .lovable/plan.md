# Koelwerkbank: falafel, forel, zalm en döner weer zichtbaar

## Wat er nu gebeurt

De producten staan er wél in en zijn actief (falafel, forel, gerookte zalm, döner kebab, gekookte eieren, eimengsel, tempeh en alle groenten). Ze zijn alleen onvindbaar geworden: sinds de koelwerkbank per lade wordt geteld, worden alle producten die nog geen lade hebben op één hoop gegooid onder de kop **"Overige reserve — nog geen vaste lade"**. Op dit moment heeft **geen enkel** koelwerkbankproduct een lade toegewezen, dus alle 26 producten zitten in dat ene blok met een naam die suggereert dat het alleen om reserves gaat. De negen lades erboven staan leeg.

## Wat we gaan doen

1. **Producten zonder lade weer per categorie tonen.** In plaats van één blok "Overige reserve" krijgen ze de vertrouwde koppen: Eiwitten, Groente & fruit, Zuivel & kaas, Spreads & mayonaises, Brood, Zoet. Zo staan falafel, forel, zalm en döner weer gewoon onder Eiwitten.
2. **Lege lades verbergen in de telronde.** Een lade zonder producten hoort niet als leeg vakje in de lijst of in de kastweergave te staan.
3. **Duidelijke hint bovenaan het werkbankblok**: "Nog niet ingedeeld in lades — regel dit in Koelwerkbank indelen", met een tikbare verwijzing. Zodra je producten aan lades hangt, schuiven die vanzelf naar hun lade-blok en verdwijnt de hint.
4. **Aanvullen blijft zoals afgesproken**: is een bakje leeg of te laag, dan gaat het precies tot de standaardvoorraad op de aanvulbon (koelcel → vriescel met Ontdooid-sticker → MEP → Midsland → bestelbord).

## Technisch

- `src/components/foh/VoorraadRonde.tsx`: in `categorieGroepen` het werkbank-restblok vervangen door groepering per `categorieVan(item)` met `CATEGORIE_VOLGORDE`-sortering en sleutels `werkbank:cat:<categorie>`; lades zonder items worden al overgeslagen, dezelfde filtering toepassen op `kastVakken` zodat de kastweergave geen lege vakken toont; hint-regel boven het werkbankblok met link naar `/settings/koelwerkbank`.
- Geen databasewijziging, geen nieuwe libraries.

## Testen

West → Sluiten → Keuken → Voorraadronde → Koelwerkbank: onder Eiwitten staan falafel, forel, gerookte zalm, döner kebab, gekookte eieren, eimengsel en tempeh; vol/half/bodempje/leeg werkt; leeg zetten zet het product op de aanvulbon.
