## Plan

1. **Set-password scherm robuust maken**
   - De route bestaat wel, maar toont alleen het wachtwoordformulier als er al een auth-sessie is.
   - Ik pas dit aan zodat invite/recovery links met moderne tokens (`code`, hash tokens en callback varianten) expliciet verwerkt worden voordat de pagina beslist dat de link ongeldig is.
   - De pagina krijgt duidelijke states: link verwerken, nieuw wachtwoord kiezen, succesvol ingesteld, of link ongeldig/verlopen.

2. **Persoonlijk inloggen zichtbaar en testbaar houden**
   - De loginpagina heeft al een persoonlijke modus achter de link “Inloggen met persoonlijk account”.
   - Ik controleer en verbeter waar nodig de tekst/flow zodat dit niet verborgen of onduidelijk voelt voor medewerkers.

3. **Redirects en routes nalopen**
   - `/auth/set-password` en `/auth/callback` blijven allebei naar dezelfde set-password flow wijzen.
   - Ik controleer dat invite/password-reset links naar de gepubliceerde custom domain route wijzen.

4. **Flow zelf testen op live route**
   - Ik test de publieke pagina met Playwright op de gepubliceerde URL: directe route, callback-route en persoonlijke login-weergave.
   - Daarna laat ik je weten wat zichtbaar is en welke flow klaarstaat.

5. **Nieuwe mail pas na fix**
   - Als de frontend-fix is goedgekeurd en gepubliceerd, stuur ik opnieuw een password-reset/invite afhankelijk van de accountstatus, zodat je een verse link met de juiste route ontvangt.