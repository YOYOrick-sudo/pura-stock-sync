/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop, APP_REGEL } from './_layout.tsx'

interface Props {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, confirmationUrl }: Props) => (
  <MailLayout
    preheader={`Je bent uitgenodigd voor de ${siteName} app. Kies je wachtwoord om in te loggen.`}
    titel="Je bent uitgenodigd"
    reden="Je ontvangt deze mail omdat je bent uitgenodigd voor de interne app van Pura Vida. Niet verwacht? Dan kun je deze mail negeren."
  >
    <Paragraaf>
      Welkom bij het interne platform van {siteName}. Klik op de knop hieronder om je persoonlijke wachtwoord in te stellen en direct in te loggen.
    </Paragraaf>
    <Paragraaf>{APP_REGEL}</Paragraaf>
    <Knop href={confirmationUrl} label="Wachtwoord instellen" />
  </MailLayout>
)

export default InviteEmail
