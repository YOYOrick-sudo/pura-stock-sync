import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Pura Vida"

interface IdeaBoxNotificationProps {
  ideaText?: string
  location?: string
}

const IdeaBoxNotificationEmail = ({ ideaText, location }: IdeaBoxNotificationProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Nieuw idee via de Ideeënbus — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>💡 Nieuw idee ontvangen</Heading>
        <Text style={label}>Vestiging</Text>
        <Text style={value}>{location || 'Onbekend'}</Text>
        <Hr style={hr} />
        <Text style={label}>Idee</Text>
        <Text style={ideaStyle}>{ideaText || '(geen tekst)'}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Dit bericht is anoniem verstuurd via de Ideeënbus in {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: IdeaBoxNotificationEmail,
  subject: '💡 Nieuw idee via de Ideeënbus',
  displayName: 'Ideeënbus notificatie',
  previewData: { ideaText: 'Misschien kunnen we een tosti-menu toevoegen?', location: 'West' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#1B7867', margin: '0 0 24px' }
const label = { fontSize: '11px', fontWeight: '600' as const, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 4px' }
const value = { fontSize: '15px', color: '#0F172A', margin: '0 0 16px' }
const ideaStyle = { fontSize: '15px', color: '#0F172A', lineHeight: '1.6', margin: '0 0 16px', padding: '16px', backgroundColor: '#F1F5F9', borderRadius: '12px' }
const hr = { borderColor: '#E2E8F0', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0', lineHeight: '1.5' }
