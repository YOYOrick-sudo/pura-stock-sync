/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brand, h1, text, button, footer } from './_shared-styles.ts'

interface Props {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je inloglink voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Direct inloggen</Heading>
        <Text style={text}>
          Klik op de knop hieronder om in te loggen op {siteName}. Deze link is beperkt geldig.
        </Text>
        <Button style={button} href={confirmationUrl}>Inloggen</Button>
        <Text style={footer}>
          Heb je dit niet aangevraagd? Negeer deze mail dan.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
