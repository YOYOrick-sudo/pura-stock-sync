/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName: string
  siteUrl?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: Props) => (
  <MailLayout
    preheader="Kies een nieuw wachtwoord voor je Pura Vida-account."
    titel="Wachtwoord resetten"
    reden="Je ontvangt deze mail omdat er een nieuw wachtwoord is aangevraagd voor de interne app van Pura Vida Collective. Niet aangevraagd? Dan kun je deze mail negeren — je huidige wachtwoord blijft geldig."
  >
    <Paragraaf>
      We ontvingen een verzoek om het wachtwoord van je {siteName}-account te resetten. Klik op de knop hieronder om een nieuw wachtwoord te kiezen.
    </Paragraaf>
    <Knop href={confirmationUrl} label="Nieuw wachtwoord instellen" />
  </MailLayout>
)

export default RecoveryEmail
