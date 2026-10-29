/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: Props) => (
  <MailLayout
    preheader="Je inloglink voor de Pura Vida-app."
    titel="Direct inloggen"
    reden="Je ontvangt deze mail omdat er een inloglink is aangevraagd voor de interne app van Pura Vida. Niet aangevraagd? Dan kun je deze mail negeren."
  >
    <Paragraaf>
      Klik op de knop hieronder om in te loggen op {siteName}. Deze link is beperkt geldig.
    </Paragraaf>
    <Knop href={confirmationUrl} label="Inloggen" />
  </MailLayout>
)

export default MagicLinkEmail
