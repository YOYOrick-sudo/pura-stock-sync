/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Code } from './_layout.tsx'

interface Props {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({ token }: Props) => (
  <MailLayout
    preheader="Je verificatiecode voor de Pura Vida-app."
    titel="Verificatiecode"
    reden="Je ontvangt deze mail omdat er een verificatiecode is aangevraagd voor de interne app van Pura Vida Collective. Niet aangevraagd? Dan kun je deze mail negeren."
  >
    <Paragraaf>Gebruik onderstaande code om je actie te bevestigen:</Paragraaf>
    <Code>{token}</Code>
  </MailLayout>
)

export default ReauthenticationEmail
