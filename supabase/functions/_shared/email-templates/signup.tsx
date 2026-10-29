/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl: string
}

export const SignupEmail = ({ confirmationUrl }: Props) => (
  <MailLayout
    preheader="Bevestig je e-mailadres."
    titel="Bevestig je e-mailadres"
    reden="Niet aangemeld? Dan kun je deze mail negeren."
  >
    <Paragraaf>Nog een stap: bevestig je adres en je account is klaar.</Paragraaf>
    <Knop href={confirmationUrl} label="Bevestigen" />
  </MailLayout>
)

export default SignupEmail
