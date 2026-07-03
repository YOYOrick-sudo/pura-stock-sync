/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brand, h1, text, button, footer } from './_shared-styles.ts'

interface Props {
  siteName: string
  oldEmail?: string
  newEmail?: string
  email?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Bevestig je nieuwe e-mailadres voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Bevestig je nieuwe e-mailadres</Heading>
        <Text style={text}>
          Er is een verzoek gedaan om het e-mailadres van je {siteName}-account te wijzigen{oldEmail ? ` van ${oldEmail}` : ''}{newEmail ? ` naar ${newEmail}` : ''}. Klik op de knop hieronder om deze wijziging te bevestigen.
        </Text>
        <Button style={button} href={confirmationUrl}>E-mailwijziging bevestigen</Button>
        <Text style={footer}>
          Heb je dit niet aangevraagd? Neem dan contact op met je beheerder.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
