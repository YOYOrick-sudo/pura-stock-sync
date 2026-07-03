/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import { main, container, brand, h1, text, footer, code } from './_shared-styles.ts'

interface Props {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({ siteName = 'Pura Vida Foodbar', token }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je verificatiecode voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Verificatiecode</Heading>
        <Text style={text}>Gebruik onderstaande code om je actie te bevestigen:</Text>
        <Text style={code}>{token}</Text>
        <Text style={footer}>
          Heb je dit niet aangevraagd? Negeer deze mail dan.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
