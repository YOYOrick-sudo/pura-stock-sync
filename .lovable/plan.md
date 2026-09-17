# Antwoorden + plan: koelcel-check afronden en takenlijst sneller maken

## 1. Is alles getest en staat het op de logische plek?

Ja, getest als West-keukenaccount: het blok staat in de sluitlijst, "Aanwezig" kleurt groen en telt mee in de voortgang, "Naar MEP" zet het product echt op de MEP-lijst met handeling Aanvullen. Beheer van de lijst staat bij Instellingen onder het tabblad Voorraad-check. Testgegevens zijn opgeruimd.

Plek: het blok staat in de sluitlijst van West, onderaan de keuken-taken. Dat is de logische plek, want de koelcelcheck hoort bij het afsluiten van de keuken.

## 2. Vissoep en Tom yum

De twee twijfelitems van het whiteboard worden definitief:

- "Vis" wordt hernoemd naar **Vissoep**
- "Tom yum" blijft **Tom yum**

## 3. Waarom de takenlijst nog lang laadt (West en Midsland)

Oorzaak gevonden in de takenlijst zelf, niet in de database (de tabel is opgeschoond: 24.054 rijen waarvan 23.721 gearchiveerd, 331 voor vandaag, en er liggen goede indexen).

Wat er nu gebeurt bij elke keer openen van de takenlijst:

1. Eerst worden de sjablonen opgehaald (twee aparte bevragingen).
2. Daarna wordt gecontroleerd welke taken vandaag al bestaan.
3. Pas daarna worden de taken zelf opgehaald en wordt het scherm getoond.

Alles gebeurt achter elkaar in plaats van tegelijk, en het scherm blijft leeg tot de laatste stap klaar is. Bovendien wordt die hele reeks opnieuw uitgevoerd bij elke wissel tussen Bediening en Keuken, en bij elke terugkeer naar de pagina — er wordt niets onthouden. Op een iPad met wisselend wifi telt dat snel op tot meerdere seconden.

### Wat ik ga doen

- **Taken eerst tonen.** De lijst wordt direct opgehaald en getoond; het aanmaken van de dagtaken uit de sjablonen loopt daarna op de achtergrond, en de lijst vult zichzelf aan zodra dat klaar is.
- **Één keer per dag aanmaken.** Het aanmaken van dagtaken draait nog maximaal één keer per apparaat per dag (de nachtelijke automatische aanmaak blijft gewoon leidend), niet bij elke keer openen.
- **Wissel tussen Bediening en Keuken doet niets opnieuw ophalen.** Dat is alleen een weergavekeuze; de gegevens zijn er al.
- **Lijst onthouden tussen schermen.** Terugkomen op de takenlijst toont meteen de vorige lijst en ververst stil op de achtergrond, zodat er geen leeg laadscherm meer is.
- **Rustiger laadbeeld.** In plaats van een blanco scherm verschijnen direct de tabs en de bekende lijst.

Niets aan de inhoud, volgorde, categorieën, rechten of de nachtelijke aanmaak verandert. Dit geldt voor West en Midsland.

## Technische details

- `src/components/foh/FohTasks.tsx`: de `initializeTasks`-effectketen (regels ~1567-1589) wacht sequentieel op `shouldResetTasks` → `performClientSideReset` → `generateDailyTasks` → `fetchDailyTasks`. `fetchDailyTasks` wordt naar voren gehaald; generatie/reset draait daarna zonder de render te blokkeren, gevolgd door een stille refetch.
- `effectiveDept` wordt uit de dependency-array van het init-effect gehaald (tabwissel is puur weergave).
- De taken-, periodieke- en medewerkersophaal gaan van losse `useState` + handmatige fetch naar TanStack Query met `staleTime` en `placeholderData`, zodat terugkeer naar het scherm de vorige lijst toont in plaats van een leeg laadscherm. Realtime-subscriptions en optimistische updates blijven ongewijzigd en invalideren dezelfde query-keys.
- Generatie krijgt een dag-guard in localStorage per locatie (naast de bestaande `lastTaskReset_<locatie>`), zodat de drie sjabloonbevragingen niet bij elke mount draaien.
- Hernoemen van het item: `update koelcel_check_items set naam = 'Vissoep' where naam = 'Vis'` (West).
