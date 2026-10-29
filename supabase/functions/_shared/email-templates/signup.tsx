/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Knop } from './_layout.tsx'

interface Props {
  siteName: string
  siteUrl: string
  recipient?: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, confirmationUrl }: Props) => (
  <MailLayout
    preheader="Bevestig je e-mailadres om toegang te krijgen tot de Pura Vida-app."
    titel="Bevestig je e-mailadres"
    reden="Je ontvangt deze mail omdat dit adres is aangemeld voor de interne app van Pura Vida Collective. Niet aangemeld? Dan kun je deze mail negeren."
  >
    <Paragraaf>
      Bedankt voor je aanmelding bij {siteName}. Klik op de knop hieronder om je e-mailadres te bevestigen en toegang te krijgen tot de app.
    </Paragraaf>
    <Knop href={confirmationUrl} label="E-mailadres bevestigen" />
  </MailLayout>
)

export default SignupEmail
