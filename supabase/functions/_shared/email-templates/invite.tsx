/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brand, h1, text, button, footer } from './_shared-styles.ts'

interface Props {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je bent uitgenodigd voor de {siteName} app</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Je bent uitgenodigd</Heading>
        <Text style={text}>
          Welkom bij het interne platform van {siteName}. Klik op de knop hieronder om je persoonlijke wachtwoord in te stellen en direct in te loggen.
        </Text>
        <Button style={button} href={confirmationUrl}>Wachtwoord instellen</Button>
        <Text style={footer}>
          Heb je deze uitnodiging niet verwacht? Dan kun je deze mail negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
