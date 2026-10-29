/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName: string
  oldEmail?: string
  newEmail?: string
  email?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: Props) => (
  <MailLayout
    preheader="Bevestig de wijziging van je e-mailadres voor de Pura Vida-app."
    titel="Bevestig je nieuwe e-mailadres"
    reden="Je ontvangt deze mail omdat er een e-mailwijziging is aangevraagd voor je account in de interne app van Pura Vida. Niet aangevraagd? Neem dan contact op met je beheerder."
  >
    <Paragraaf>
      Er is een verzoek gedaan om het e-mailadres van je {siteName}-account te wijzigen{oldEmail ? ` van ${oldEmail}` : ''}{newEmail ? ` naar ${newEmail}` : ''}. Klik op de knop hieronder om deze wijziging te bevestigen.
    </Paragraaf>
    <Knop href={confirmationUrl} label="E-mailwijziging bevestigen" />
  </MailLayout>
)

export default EmailChangeEmail
