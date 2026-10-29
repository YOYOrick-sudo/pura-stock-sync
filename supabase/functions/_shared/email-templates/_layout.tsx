/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Head, Html, Preview } from 'npm:@react-email/components@0.0.22'

// Huisstijl uit src/index.css: --primary 163 65% 26%, --background 45 8% 95%.
export const KLEUR_PRIMAIR = '#176D55'
export const KLEUR_CANVAS = '#F3F3F1'
const KLEUR_TEKST = '#1F2937'
const KLEUR_TEKST_ZACHT = '#4B5563'
const KLEUR_MUTED = '#6B7280'
const KLEUR_RAND = '#E5E7EB'
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

// Logo: zelfde bestand als de app (src/assets/pura-vida-logo-sea-cropped.png), verkleind, publiek via CDN.
export const LOGO_URL =
  'https://intern.puravidafoodbar.nl/__l5e/assets-v1/4dc60a39-5e32-42bb-870f-f759785f20e9/pura-vida-logo-email.png'

export const APP_REGEL =
  'De Pura Vida-app is de interne app van Pura Vida Foodbar voor taken, bestellingen en planning. Je logt in via "Persoonlijk" met je eigen e-mailadres en wachtwoord.'

interface LayoutProps {
  preheader: string
  titel: string
  children: React.ReactNode
  reden: string
}

export const Paragraaf = ({ children }: { children: React.ReactNode }) => (
  <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: '24px', color: KLEUR_TEKST_ZACHT, fontFamily: FONT }}>
    {children}
  </p>
)

export const Knop = ({ href, label }: { href: string; label: string }) => (
  <>
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '8px 0 24px' }}>
      <tbody>
        <tr>
          <td align="center" {...({ bgcolor: KLEUR_PRIMAIR } as Record<string, string>)} style={{ borderRadius: '14px', backgroundColor: KLEUR_PRIMAIR }}>
            <a
              href={href}
              target="_blank"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                fontFamily: FONT,
                fontSize: '15px',
                fontWeight: 600,
                lineHeight: '20px',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '14px',
              }}
            >
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <p style={{ margin: '0 0 6px', fontSize: '13px', lineHeight: '20px', color: KLEUR_MUTED, fontFamily: FONT }}>
      Werkt de knop niet? Kopieer dan deze link in je browser:
    </p>
    <p style={{ margin: '0 0 8px', fontSize: '13px', lineHeight: '20px', fontFamily: FONT, wordBreak: 'break-all' }}>
      <a href={href} target="_blank" style={{ color: KLEUR_PRIMAIR, textDecoration: 'underline' }}>{href}</a>
    </p>
  </>
)

export const Code = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      margin: '8px 0 24px',
      display: 'inline-block',
      padding: '16px 24px',
      fontFamily: FONT,
      fontSize: '28px',
      fontWeight: 700,
      letterSpacing: '0.2em',
      color: KLEUR_TEKST,
      backgroundColor: KLEUR_CANVAS,
      borderRadius: '14px',
    }}
  >
    {children}
  </p>
)

export const MailLayout = ({ preheader, titel, children, reden }: LayoutProps) => (
  <Html lang="nl" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>{preheader}</Preview>
    <Body style={{ margin: 0, padding: 0, backgroundColor: KLEUR_CANVAS, fontFamily: FONT }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} {...({ bgcolor: KLEUR_CANVAS } as Record<string, string>)} style={{ backgroundColor: KLEUR_CANVAS }}>
        <tbody>
          <tr>
            <td align="center" style={{ padding: '32px 16px' }}>
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ maxWidth: '560px', width: '100%' }}>
                <tbody>
                  <tr>
                    <td align="center" style={{ padding: '0 0 24px' }}>
                      <img src={LOGO_URL} width={96} height={85} alt="Pura Vida" style={{ display: 'block', border: 0, outline: 'none', width: '96px', height: '85px' }} />
                    </td>
                  </tr>
                  <tr>
                    <td {...({ bgcolor: "#ffffff" } as Record<string, string>)} style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: `1px solid ${KLEUR_RAND}`, padding: '36px 32px' }}>
                      <h1 style={{ margin: '0 0 16px', fontFamily: FONT, fontSize: '22px', lineHeight: '30px', fontWeight: 700, color: KLEUR_TEKST }}>
                        {titel}
                      </h1>
                      {children}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style={{ padding: '24px 16px 0' }}>
                      <p style={{ margin: '0 0 6px', fontFamily: FONT, fontSize: '13px', lineHeight: '20px', fontWeight: 600, color: KLEUR_TEKST_ZACHT }}>
                        Pura Vida Foodbar · Terschelling
                      </p>
                      <p style={{ margin: 0, fontFamily: FONT, fontSize: '12px', lineHeight: '18px', color: KLEUR_MUTED }}>
                        {reden}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </Body>
  </Html>
)
