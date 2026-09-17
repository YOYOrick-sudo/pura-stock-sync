# Batchgrootte per zelfgemaakt product (West)

Nu krijgt elke MEP-taak uit de voorraadronde standaard "1 bak". Dat klopt niet overal: aubergine grill je met 8 stuks tegelijk, granaatappels ook. Daarom leggen we per product vast hoeveel er in één keer gemaakt wordt.

## Alle producten waar dit voor geldt (bron: zelf maken, West)

Dit zijn de 20 actieve producten die het team zelf maakt. Voorstel-batch is wat mij logisch lijkt op basis van het doelaantal — jij vult aan of corrigeert.

| Product | Plek | Formaat | Doel | Voorstel batch |
|---|---|---|---|---|
| Zuurdesem stokbrood (in 3en snijden) | werkbank | broodbak | 1 | 1 broodbak |
| Döner kebab | koelcel | zwarte bak, gevacumeerd | 2 | 2 bakken |
| Eimengsel (scrambled eggs) | werkbank | GN 1/3 midden | 1 | 1 bakje GN 1/3 |
| Falafel | koelcel | zwarte bak | 1 | 1 bak |
| Gekookte eieren (bio) | werkbank | GN 1/6 hoog | 1 | 1 bakje GN 1/6 |
| Aubergine | koelcel | stuks | 8 | 8 stuks |
| Geroosterde groenten (paprika, courgette, venkel) | koelcel | stuks | 4 | 4 stuks |
| Gesneden bloemkool | koelcel | stuks | 1 | 1 stuk |
| Gesneden paprika | koelcel | stuks | 1 | 1 stuk |
| Granaatappels | koelcel | stuks | 8 | 8 stuks |
| Rode peper | koelcel | kilo | 1 | 1 kilo |
| Chimichurrimayonaise | koelcel | bak | 1 | 1 bak |
| Chimichurrimayonaise | werkbank | GN 1/9 midden | 2 | vullen uit koelcelbak (geen eigen batch) |
| Hummus | koelcel | gevacumeerd zakje | 1 | 1 zakje |
| Hummus | werkbank | GN 1/9 midden | 1 | vullen uit koelcelzakje (geen eigen batch) |
| Knoflook-kurkumamayonaise | koelcel | bak | 1 | 1 bak |
| Mayonaises (flessen bijvullen) | werkbank | fles | 1 | 1 fles |
| Zeewier-algenmayonaise | koelcel | bak | 1 | 1 bak |
| Zeewier-algenmayonaise | werkbank | GN 1/9 midden | 2 | vullen uit koelcelbak (geen eigen batch) |
| Feta verkruimeld | koelcel | zak | 4 | 1 zak |

Ontdooiproducten (vriescel → koelcel, bijv. tomatenrelish, wortelspread, bananencake) hebben geen batchgrootte nodig: daar haal je exact het aantal zakjes of bakken dat ontbreekt.

## Wat er daarna gebouwd wordt

1. Een veld "batchgrootte" per product in het voorraadbeheer (aantal + de maat die het product al heeft).
2. De voorraadronde gebruikt die batch op de MEP-taak: "Aubergine grillen — 8 stuks" in plaats van "1 bak".
3. Als er geen batch is ingevuld, blijft het huidige gedrag (1 hele eenheid) staan.

## Technisch

- Kolom `batch_aantal numeric` op `koelcel_check_items` (nullable), via SQL-migratie met regel in `migratie_logboek`. Bestaande RLS en grants blijven ongewijzigd.
- `VoorraadCheckBeheer.tsx`: invoerveld naast de bakmaatkiezer, label toont de eenheid van het product.
- `useVoorraadLades.ts`: `zetBatchAantal({ itemId, aantal })`.
- `VoorraadRonde.tsx` → `mepOpdracht()`: `batch = item.batch_aantal ?? huidige berekening`.
- `useKoelcelCheck.ts`: `mepTaakVoorItem` blijft zoals het is (één taak, opwaarderen bij lagere stand), alleen het aantal komt nu uit de batch.

## Wat ik van je nodig heb

Loop de tabel langs en geef door waar de voorgestelde batch niet klopt. Daarna zet ik de waardes er in één keer in.
