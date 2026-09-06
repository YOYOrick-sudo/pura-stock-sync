import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Pura Vida"

interface WisselkassaAanvraagProps {
  vestiging?: string
  aanvrager?: string
  tijdstip?: string
}

const WisselkassaAanvraagEmail = ({ vestiging, aanvrager, tijdstip }: WisselkassaAanvraagProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Nieuwe wisselkassa nodig — {vestiging || 'vestiging onbekend'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nieuwe wisselkassa nodig</Heading>
        <Text style={intro}>
          Er is een nieuwe wisselkassa aangevraagd. Kun je deze regelen?
        </Text>
        <Hr style={hr} />
        <Text style={label}>Vestiging</Text>
        <Text style={value}>{vestiging || 'Onbekend'}</Text>
        <Text style={label}>Aangevraagd door</Text>
        <Text style={value}>{aanvrager || 'Onbekend'}</Text>
        <Text style={label}>Tijdstip</Text>
        <Text style={value}>{tijdstip || 'Onbekend'}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Automatisch verstuurd vanuit Kascontrole in {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WisselkassaAanvraagEmail,
  subject: (d: Record<string, any>) => `Nieuwe wisselkassa nodig — ${d.vestiging || 'vestiging onbekend'}`,
  to: Deno.env.get('WISSELKASSA_AANVRAAG_EMAIL'),
  displayName: 'Wisselkassa-aanvraag',
  previewData: { vestiging: 'Daily', aanvrager: 'Sanne', tijdstip: '6 sep 2026, 14:53' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#16A34A', margin: '0 0 12px' }
const intro = { fontSize: '15px', color: '#0F172A', margin: '0 0 16px', lineHeight: '1.6' }
const label = { fontSize: '11px', fontWeight: '600' as const, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 4px' }
const value = { fontSize: '15px', color: '#0F172A', margin: '0 0 16px' }
const hr = { borderColor: '#E2E8F0', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0', lineHeight: '1.5' }
