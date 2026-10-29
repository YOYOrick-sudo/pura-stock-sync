/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: Props) => (
  <MailLayout
    preheader="Je inloglink voor de Pura Vida-app."
    titel="Inloggen"
    reden="Niet aangevraagd? Dan kun je deze mail negeren."
  >
    <Paragraaf>Met deze knop log je direct in bij de Pura Vida-app. De link werkt een keer.</Paragraaf>
    <Knop href={confirmationUrl} label="Inloggen" />
  </MailLayout>
)

export default MagicLinkEmail
