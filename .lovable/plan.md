# Aanvulling: wie ziet wat, iPad-modus, advies simpel model

Alleen uitleg. Er wordt niets gebouwd.

## 1. Schermen per gebruiker (huidige stand)

Z = in zijbalk, R = route bewaakt in de app. MT-only = Jorian (geen rol).

| Scherm | Owner | Staff-iPad West | Staff-iPad Midsland | MT-only | Bewaking route |
|---|---|---|---|---|---|
| Dashboard, Taken Bediening | Z | Z | Z | nee | ingelogd |
| Kassatelling, Onderhoud | Z | Z | Z | nee | ingelogd (Onderhoud: pincode) |
| Mise-en-place, Gerechten | Z | Z | Z | nee | ingelogd |
| Bestelbord, Stickers, Recepten | Z | Z | niet in zijbalk, URL werkt | nee | ingelogd |
| MEP week/beheer | via URL | via URL | geblokkeerd | nee | alleen West |
| Voorraadketen, Koelwerkbank | Z | nee | nee | nee | manager |
| Kas-controle, Personeel | via URL | nee | nee | nee | manager |
| Cijfers, Settings | Z | nee | nee | nee | owner |
| HR, /taken/beheer, /taken/admin, /settings/mep | via URL | URL werkt | URL werkt | nee | alleen ingelogd |
| MT-punten, MT-actiepunten | Z (als MT-lid) | nee | nee | Z | MT-lid |

HR-gegevens zelf zijn wel in de database afgeschermd. Taken- en MEP-beheer en instellingen zijn dat niet.

## 2. Bediening of keuken op een iPad

- **West:** op de takenpagina kies je per iPad "bediening" of "keuken". Die keuze blijft alleen op dat apparaat bewaard (`foh_device_mode_west`). Het bepaalt alleen welke tab eerst opent, de andere tab blijft gewoon aan te tikken.
- **Midsland:** heeft geen apparaatkeuze. De lijsten zijn per fase ingedeeld (open, tussen, borrel, sluit), niet per bediening of keuken.
- **Verschil tussen keuken- en bediening-iPad:** er is geen verschil. Beide gebruiken hetzelfde account, dus dezelfde zijbalk, dezelfde schermen en dezelfde rechten.

## 3. Advies: simpelste model

**Rollen (bestaande lijst hergebruiken, verder geen nieuwe):**
- `owner`: Yorick.
- `manager`: Josefien en Helga. MT-lid zijn blijft via de MT-ledenlijst lopen.
- `staff`: de bediening-iPad per locatie.
- `kitchen_staff`: de keuken-iPad per locatie. Die rol staat al in de rollenlijst.
- Jorian blijft MT-only, of krijgt `manager` als hij ook operationeel mee moet kijken.

**Zichtbaar per rol:**
- **Owner:** alles.
- **MT/manager:** MT-pagina's, taken- en MEP-beheer, Voorraadketen, Kas-controle en Personeel. Geen Cijfers of loonkosten, tenzij jij die per persoon aanzet.
- **Bediening-iPad:** Dashboard, Taken, Kassatelling, Onderhoud, Gerechten (alleen lezen).
- **Keuken-iPad:** MEP, Bestelbord, Stickers, Recepten (alleen lezen), Gerechten, Taken (opent op de keukentab).

**Drie belangrijkste aanscherpingen in de database, grootste risico eerst:**
1. Recepten, ingrediënten, gerechten en allergenen: wijzigen alleen door owner/manager. Een iPad mag alleen lezen. Een fout hier geeft verkeerde allergeneninformatie.
2. Takensjablonen, MEP-sjablonen, instellingen en leveranciers: wijzigen alleen door owner/manager. De schermen `/taken/beheer`, `/taken/admin` en `/settings/mep` daarnaast afschermen voor managers.
3. Bestellingen, inkoop en voorraad: lezen en schrijven alleen voor de eigen locatie. Prijzen en inkoophistorie alleen voor owner/manager.

**In de schermen regel je alleen de indeling:** welke menu-items iemand ziet en welke tab eerst opent. De echte toegang ligt altijd in de database.
