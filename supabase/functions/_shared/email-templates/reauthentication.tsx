/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { MailLayout, Paragraaf, Code } from './_layout.tsx'

interface Props {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({ token }: Props) => (
  <MailLayout
    preheader="Je verificatiecode."
    titel="Je verificatiecode"
    reden="Niet aangevraagd? Dan kun je deze mail negeren."
  >
    <Paragraaf>Vul deze code in de app in om door te gaan.</Paragraaf>
    <Code>{token}</Code>
  </MailLayout>
)

export default ReauthenticationEmail
