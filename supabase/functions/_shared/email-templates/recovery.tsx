/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brand, h1, text, button, footer } from './_shared-styles.ts'

interface Props {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Wachtwoord resetten voor je {siteName}-account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Wachtwoord resetten</Heading>
        <Text style={text}>
          We ontvingen een verzoek om het wachtwoord van je {siteName}-account te resetten. Klik op de knop hieronder om een nieuw wachtwoord te kiezen.
        </Text>
        <Button style={button} href={confirmationUrl}>Nieuw wachtwoord kiezen</Button>
        <Text style={footer}>
          Heb je dit niet aangevraagd? Dan kun je deze mail veilig negeren — je huidige wachtwoord blijft geldig.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
