/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: Props) => (
  <MailLayout
    preheader="Je account voor de Pura Vida-app staat klaar."
    titel="Welkom bij Pura Vida"
    reden="Niet verwacht? Dan kun je deze mail negeren."
  >
    <Paragraaf>Je hebt toegang tot de app van Pura Vida Collective. Stel je wachtwoord in en je kunt meteen aan de slag.</Paragraaf>
    <Knop href={confirmationUrl} label="Wachtwoord instellen" />
  </MailLayout>
)

export default InviteEmail
