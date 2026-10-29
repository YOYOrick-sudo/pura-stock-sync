# Uitleg: inloggen, rollen en afscherming (huidige stand) + voorstel simpel model

Alleen uitleg en een voorstel. Bij goedkeuren wordt er niets gebouwd zonder aparte opdracht.

## 1. Inlogmethodes (src/pages/Auth.tsx)

- **Daily** = West: vast account `purawestkeuken@puravidafoodbar.nl`. **Foodbar** = Midsland: vast account `puramidsland@puravidafoodbar.nl`. **Persoonlijk**: eigen e-mail.
- Alle drie loggen in met **e-mail + wachtwoord** (`signInWithPassword`). Er is geen pincode-login.
- Het zijn **gedeelde accounts per locatie**, niet per iPad. Elk iPad dat op "Daily" tikt, gebruikt hetzelfde account.
- Locatie: na het inloggen leest het scherm `user_roles.location` en logt je uit als die niet bij de knop past. Daarbij wordt niet op `is_active` gefilterd. Loopt de controle vast of geeft hij een fout, dan wordt de controle overgeslagen. Bij Persoonlijk is er geen controle.
- Daarna bepaalt `src/contexts/UserLocationContext.tsx` de locatie. Dat gebeurt uit de **actieve** `user_roles`-rijen; staan er meerdere, dan kies je ertussen. De laatste keuze wordt per gebruiker op het apparaat bewaard.
- Bediening of keuken op West is alleen een apparaatinstelling (`foh_device_mode_west` in `FohTasks.tsx`). Het is geen apart account en geen afscherming.

Huidige accounts (database, actief):

| Account | Rol | Locatie |
|---|---|---|
| helga@, yorick@, jdbonne10@gmail.com | owner | West + Midsland |
| mulder.yorick@gmail.com | staff | West + Midsland |
| puramidsland@ (Foodbar) | staff | Midsland |
| purawestkeuken@ (Daily) | staff | West |

## 2. Rollen nu

- **app_role-enum**: admin, manager, kitchen_staff, hr, owner, team_lead, employee, staff. In gebruik zijn alleen owner en staff (admin en manager zitten nog in de code).
- **user_roles**: één rij per rol per locatie, met `is_active`. Functies in de database: `has_role`, `heeft_vestiging` (mag deze gebruiker bij die locatie), `is_manager_same_location`, `get_user_role`.
- **mt_leden** (op e-mail) met `is_mt_lid()`. Dit staat los van rollen: MT-lid betekent alleen toegang tot MT-punten.
- **profiles-vlaggen**:
  - `mag_cijfers_zien` wordt alleen in de database gebruikt (RLS op `uren_dagen`, `omzet_uren`, `kassa_verkoop_dag`, Lightspeed/Eitje).
  - `mag_loonkosten_zien` regelt in de database `uren_shifts`. In het scherm verbergt hij alleen delen van Cijfers (`src/hooks/useMagLoonkostenZien.ts`). /cijfers zelf blijft owner-only.
- **Schermen**:
  - `src/hooks/useRole.ts`: owner/admin geldt als owner én manager.
  - Paginabewakers: `ProtectedRoute`, `RequireManager`, `RequireOwner` en `RequireMtLid`. `RequireWest` staat in App.tsx. `LocationGuard` bestaat, maar wordt nergens gebruikt.
  - Het menu (`src/components/AppSidebar.tsx`) filtert op locatie, managerOnly, ownerOnly en mtOnly. Accounts met alleen MT-lidmaatschap zien alleen MT-punten.
- **Pagina's per groep (src/App.tsx)**:
  - Elke ingelogde gebruiker met een rol: dashboard, taken, kassatelling, voorraad, keuken, onderhoud en **HR**. Ook `/taken/beheer` en `/taken/admin` hebben geen managercontrole.
  - Alleen manager: kas-controle, voorraadketen, koelwerkbank, personeel.
  - Alleen owner: settings, team, bronnen, cijfers.

## 3. Afscherming alleen in de schermen, niet in de database

Elke ingelogde gebruiker mag in de database lezen **en** schrijven, dus ook de gedeelde iPad-accounts:

- **Lezen en schrijven:** `artikelen`, `recipes` (wijzigen), `recept_ingredienten` (ook verwijderen), `sticker_producten`, `foh_category_order` (ook verwijderen), alle `mep_*`-instellingen en templates, `telrondes`/`telronde_regels`, `inkoop_orders`/`inkoop_order_regels` (wijzigen), `vestiging_instellingen` (wijzigen), `personeel_locations`, `personeel_teams`.
- **Alleen lezen, voor iedereen:** leveranciers, prijzen (`prijs_waarneming`), gerechten en Horeko-tabellen, `maintenance_tickets`, `print_jobs`.
- **Wel per locatie afgeschermd** (via `heeft_vestiging`): `foh_tasks`, `kitchen_tasks`, `handover_memos`, `bestel_signalen`, voorraadtellingen.
- **Wel goed afgeschermd:** `user_roles`, `personeel_people` en -housing, `candidates`/`applications`, uren/omzet/kassa-cijfers, `mt_punten`, `profiles` (eigen profiel of manager).

Afscherming die alleen in het scherm zit:
- Kas-controle-wachtwoord **`2017`** staat in de broncode (`src/pages/Kassatelling.tsx`).
- Personeel-pincode **`0000`** staat in de broncode (`src/pages/personeel/PersoneelLayout.tsx`).
- Beide worden in de browser vergeleken en per sessie onthouden.
- De HR-pagina is alleen een scherm. De gegevens zelf zijn wel beschermd (alleen admin/hr), dus staff ziet een lege pagina.

## 4. Zwakke plekken

1. **Gedeelde accounts per locatie.** Je kunt niet zien wie iets deed, een wachtwoord intrekken raakt alle iPads tegelijk, en wie het wachtwoord kent kan thuis inloggen.
2. **Het iPad-account is "staff"** en mag dus via de database recepten, artikelen, MEP-templates, inkooporders en vestiginginstellingen wijzigen, zonder dat het scherm dat toont.
3. **Codes in de broncode** (`2017`, `0000`) zijn voor iedereen zichtbaar in de app-bestanden.
4. **De locatiecontrole bij inloggen** wordt overgeslagen bij een fout en kijkt niet naar `is_active`. De echte grens ligt in `heeft_vestiging`, en die is goed.
5. **Rollenwildgroei.** Er zijn 8 rollen terwijl er 2 in gebruik zijn. "admin" geldt als owner. Owners hebben per locatie aparte rijen nodig.
6. **Vlaggen in `profiles`.** De gebruiker mag zijn eigen profiel bijwerken. Er bestaan beveiligingstriggers (`protect_mag_*`), maar het blijft een tweede plek voor rechten naast `user_roles`.
7. **Bij een rolcontrolefout laat de app je door** (dat is bewust, voor haperende wifi). Daardoor moet de database het echte werk doen.
8. Ongebruikte bewakers (`LocationGuard`) en overblijfselen (`stats_unlocked`) maken het geheel onoverzichtelijk.

## 5. Voorstel: minimaal, simpel model

**Rollen: drie in gebruik, de rest uitfaseren.**
- `owner`: alles, alle locaties. Geldt voor jou en Helga (en Jorian als dat zo bedoeld is).
- `mt`: MT-punten, plus optioneel cijfers en personeel. Dit vervangt `mt_leden` als losse lijst, of `mt_leden` blijft als enige bron. Kies één van de twee.
- `apparaat`: een gedeelde iPad, met één locatie en één soort (`bediening` of `keuken`).

**Accounts:**

| Account | Rol | Locatie | Soort |
|---|---|---|---|
| eigenaar(s) | owner | beide | – |
| 4 MT-leden | mt (+ owner waar van toepassing) | – | – |
| west-bediening@ | apparaat | West | bediening |
| west-keuken@ | apparaat | West | keuken |
| midsland-bediening@ | apparaat | Midsland | bediening |
| midsland-keuken@ (later) | apparaat | Midsland | keuken |

**Inloggen op gedeelde iPads:**
- Eén keer instellen met e-mail en een sterk wachtwoord, daarna permanent ingelogd blijven (gebeurt nu al).
- Het inlogscherm toont geen gedeelde wachtwoorden of vaste e-mailknoppen meer. Een owner koppelt het iPad één keer.
- Is een iPad kwijt, dan alleen dat ene account uitzetten.
- Wie iets doet op een gedeelde iPad: optioneel een naamkeuze per actie (zoals bij kassatelling). Dat is geen beveiliging, alleen een vastlegging.

**In de database (RLS), dus echt afgedwongen:**
- Elke tabel krijgt één van drie niveaus:
  - Operationeel: per locatie via `heeft_vestiging`.
  - Beheer: alleen owner, eventueel mt.
  - Gevoelig: cijfers, personeel, HR, kas-controle alleen owner/mt, nooit `apparaat`.
- Alle regels met "iedereen mag schrijven" omzetten. Een `apparaat`-account mag alleen dagwerk vastleggen: taken afvinken, MEP, tellingen, kassatelling, bestelbord, printen. Recepten, artikelen, templates, instellingen en inkoop worden owner-only.
- De `mag_*`-vlaggen vervallen of worden afgeleid van de rol.

**Alleen in de schermen (gemak, geen beveiliging):**
- Welke menu-items en welke startpagina iemand ziet (bediening- of keuken-iPad).
- Grote knoppen en vereenvoudigde schermen per soort apparaat.
- Wachtwoord `2017` en pincode `0000` verdwijnen: toegang volgt dan uit de rol in de database.

**Risico's als je hierheen gaat:**
- Het strakker maken van RLS kan bestaande flows breken: printer, n8n, de bot en de MEP-dagopbouw. Daarom eerst per tabel nagaan wie er schrijft, dan pas aanscherpen.
- Bestaande gedeelde accounts eerst parallel laten draaien naast de nieuwe iPad-accounts en daarna pas uitzetten.
- Dit is werk in meerdere stappen: eerst de rolindeling, dan RLS per niveau, dan het opruimen van de schermen.

## Open vraag voor jou

Moet "MT" ook cijfers en personeel mogen zien, of blijft dat alleen voor de owner?
