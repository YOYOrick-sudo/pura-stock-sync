/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: Props) => (
  <MailLayout
    preheader="Kies een nieuw wachtwoord."
    titel="Nieuw wachtwoord"
    reden="Niet aangevraagd? Dan blijft je wachtwoord gewoon hetzelfde."
  >
    <Paragraaf>Klik op de knop en kies een nieuw wachtwoord voor de Pura Vida-app.</Paragraaf>
    <Knop href={confirmationUrl} label="Nieuw wachtwoord instellen" />
  </MailLayout>
)

export default RecoveryEmail
