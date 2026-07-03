/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brand, h1, text, button, footer } from './_shared-styles.ts'

interface Props {
  siteName: string
  siteUrl: string
  recipient?: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Bevestig je {siteName}-account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Bevestig je e-mailadres</Heading>
        <Text style={text}>
          Bedankt voor je aanmelding bij {siteName}. Klik op de knop hieronder om je e-mailadres te bevestigen en toegang te krijgen tot de app.
        </Text>
        <Button style={button} href={confirmationUrl}>E-mailadres bevestigen</Button>
        <Text style={footer}>
          Heb je je niet aangemeld? Dan kun je deze mail negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
