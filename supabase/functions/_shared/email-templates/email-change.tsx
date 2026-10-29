/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName?: string
  oldEmail?: string
  newEmail?: string
  email?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ newEmail, confirmationUrl }: Props) => (
  <MailLayout
    preheader="Bevestig je nieuwe e-mailadres."
    titel="Nieuw e-mailadres"
    reden="Niet aangevraagd? Meld het dan bij Yorick."
  >
    <Paragraaf>Bevestig dat je voortaan inlogt met {newEmail}.</Paragraaf>
    <Knop href={confirmationUrl} label="Bevestigen" />
  </MailLayout>
)

export default EmailChangeEmail
