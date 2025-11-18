import { SidebarLayout } from '@/components/SidebarLayout';
import { PolarColors } from '@/components/polar/colors';
import { PolarAlert, PolarCheckbox, PolarFormCard, PolarFormField, PolarKPICard } from '@/components/polar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function StyleGuide() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [checkboxValue, setCheckboxValue] = useState(false);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const ColorBlock = ({ color, name, hex }: { color: string; name: string; hex: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          width: '100%',
          height: '80px',
          backgroundColor: color,
          borderRadius: '12px',
          border: '1px solid rgba(197, 197, 202, 0.5)',
          marginBottom: '8px',
        }}
      />
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A' }}>
        {name}
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#73747B' }}>
        {hex}
      </div>
    </div>
  );

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div style={{ position: 'relative', marginTop: '12px' }}>
      <pre
        style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          backgroundColor: '#282E3A',
          color: '#FEFFF1',
          padding: '16px',
          borderRadius: '12px',
          overflowX: 'auto',
        }}
      >
        {code}
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#FEFFF1',
        }}
      >
        {copiedCode === id ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(197, 197, 202, 0.5)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
      }}
    >
      <h2
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#282E3A',
          marginBottom: '24px',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px' }}>
        <h1
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '32px',
            fontWeight: 600,
            color: '#282E3A',
            marginBottom: '8px',
          }}
        >
          Pura Vida Design System
        </h1>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            color: '#73747B',
            marginBottom: '32px',
          }}
        >
          De complete style guide met alle Polar styling standaarden voor consistente ontwikkeling
        </p>

        {/* Colors Section */}
        <Section title="1. Kleuren Palet">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
            <ColorBlock color={PolarColors.puravida.cream} name="Cream (Background)" hex="#FEFFF1" />
            <ColorBlock color={PolarColors.puravida.moonlight} name="Moonlight (Sidebar)" hex="#F6F7DD" />
            <ColorBlock color={PolarColors.white} name="White (Cards)" hex="#FFFFFF" />
            <ColorBlock color={PolarColors.puravida.midnight} name="Midnight (Primary Text)" hex="#282E3A" />
            <ColorBlock color={PolarColors.text.secondary} name="Secondary Text" hex="#73747B" />
            <ColorBlock color={PolarColors.brand.primary} name="Pura Vida Sea (Brand)" hex="#1B7867" />
            <ColorBlock color={PolarColors.brand.primaryHover} name="Sea Hover" hex="#156556" />
            <ColorBlock color={PolarColors.puravida.sunset} name="Sunset (Accent)" hex="#E27726" />
            <ColorBlock color={PolarColors.status.success} name="Success" hex="#10B981" />
            <ColorBlock color={PolarColors.status.warning} name="Warning" hex="#E64D4D" />
            <ColorBlock color={PolarColors.status.pending} name="Pending" hex="#FF9800" />
          </div>
          <CodeBlock
            id="colors"
            code={`import { PolarColors } from '@/components/polar/colors';

// Usage:
backgroundColor: PolarColors.puravida.cream
color: PolarColors.brand.primary`}
          />
        </Section>

        {/* Typography Section */}
        <Section title="2. Typografie">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#282E3A',
                }}
              >
                H1 Heading - 24px, 600 weight
              </div>
              <CodeBlock
                id="h1"
                code={`style={{
  fontFamily: 'Inter, sans-serif',
  fontSize: '24px',
  fontWeight: 600,
  color: '#282E3A',
}}`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  color: '#282E3A',
                }}
              >
                Title - 18px, 500 weight
              </div>
              <CodeBlock
                id="title"
                code={`style={{
  fontFamily: 'Inter, sans-serif',
  fontSize: '18px',
  fontWeight: 500,
  color: '#282E3A',
}}`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#282E3A',
                }}
              >
                Body Text - 14px, 400 weight
              </div>
              <CodeBlock
                id="body"
                code={`style={{
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  color: '#282E3A',
}}`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#73747B',
                }}
              >
                Secondary Text - 14px, 400 weight, #73747B
              </div>
              <CodeBlock
                id="secondary"
                code={`style={{
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  color: '#73747B',
}}`}
              />
            </div>
          </div>
        </Section>

        {/* Border Radius Section */}
        <Section title="3. Border Radius Hiërarchie">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                8px - Kleine elementen (sidebar menu items, badges)
              </div>
              <div
                style={{
                  width: '200px',
                  height: '40px',
                  backgroundColor: '#F6F7DD',
                  borderRadius: '8px',
                  border: '1px solid rgba(197, 197, 202, 0.5)',
                }}
              />
              <CodeBlock id="radius-sm" code={`borderRadius: '8px' // rounded-polar-sm`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                12px - Buttons, inputs, medium componenten
              </div>
              <div
                style={{
                  width: '200px',
                  height: '40px',
                  backgroundColor: '#1B7867',
                  borderRadius: '12px',
                }}
              />
              <CodeBlock id="radius-md" code={`borderRadius: '12px' // rounded-polar-md`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                16px - Cards, panels, grote containers
              </div>
              <div
                style={{
                  width: '200px',
                  height: '80px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(197, 197, 202, 0.5)',
                }}
              />
              <CodeBlock id="radius-lg" code={`borderRadius: '16px' // rounded-polar-lg`} />
            </div>
          </div>
        </Section>

        {/* Cards Section */}
        <Section title="4. Cards">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Standaard Card - Wit met border en subtle shadow
              </div>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>
                  Dit is een standaard card gebruikt voor content
                </div>
              </div>
              <CodeBlock
                id="card-standard"
                code={`style={{
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(197, 197, 202, 0.5)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
}}`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Dashboard Card - Met sidebar background (#F6F7DD)
              </div>
              <div
                style={{
                  backgroundColor: '#F6F7DD',
                  border: '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>
                  Dashboard cards gebruiken de moonlight achtergrond
                </div>
              </div>
              <CodeBlock
                id="card-dashboard"
                code={`style={{
  backgroundColor: '#F6F7DD',
  border: '1px solid rgba(197, 197, 202, 0.5)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
}}`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Double Layer Card - Outer card met inner white card
              </div>
              <div
                style={{
                  backgroundColor: '#F6F7DD',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>
                    Inner white card voor extra contrast
                  </div>
                </div>
              </div>
              <CodeBlock
                id="card-double"
                code={`// Outer card
style={{
  backgroundColor: '#F6F7DD',
  borderRadius: '16px',
  padding: '24px',
}}

// Inner card
style={{
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '16px',
}}`}
              />
            </div>
          </div>
        </Section>

        {/* Buttons Section */}
        <Section title="5. Buttons">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Primary Button
              </div>
              <Button>Primary Action</Button>
              <CodeBlock id="button-primary" code={`<Button>Primary Action</Button>`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Secondary Button
              </div>
              <Button variant="secondary">Secondary Action</Button>
              <CodeBlock id="button-secondary" code={`<Button variant="secondary">Secondary Action</Button>`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Ghost Button
              </div>
              <Button variant="ghost">Ghost Action</Button>
              <CodeBlock id="button-ghost" code={`<Button variant="ghost">Ghost Action</Button>`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Outline Button
              </div>
              <Button variant="outline">Outline Action</Button>
              <CodeBlock id="button-outline" code={`<Button variant="outline">Outline Action</Button>`} />
            </div>
          </div>
        </Section>

        {/* Form Elements Section */}
        <Section title="6. Form Elementen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Text Input
              </div>
              <Input placeholder="Voer tekst in..." />
              <CodeBlock id="input" code={`<Input placeholder="Voer tekst in..." />`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Textarea
              </div>
              <Textarea placeholder="Voer lange tekst in..." rows={3} />
              <CodeBlock id="textarea" code={`<Textarea placeholder="Voer lange tekst in..." rows={3} />`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Checkbox (Polar Component)
              </div>
              <PolarCheckbox
                checked={checkboxValue}
                onChange={setCheckboxValue}
                label="Ik ga akkoord met de voorwaarden"
              />
              <CodeBlock
                id="checkbox"
                code={`<PolarCheckbox
  checked={value}
  onChange={setValue}
  label="Ik ga akkoord"
/>`}
              />
            </div>
          </div>
        </Section>

        {/* Status Indicators Section */}
        <Section title="7. Status Indicators">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Badges
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <CodeBlock
                id="badges"
                code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Status Dots (8px circles)
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                    }}
                  />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>Success</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#FF9800',
                    }}
                  />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>Pending</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#E64D4D',
                    }}
                  />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>Error</span>
                </div>
              </div>
              <CodeBlock
                id="dots"
                code={`<div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#10B981', // success
}} />`}
              />
            </div>
          </div>
        </Section>

        {/* Spacing Section */}
        <Section title="8. Spacing & Layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Standaard Padding voor Cards: 32px (polar-8)
              </div>
              <div
                style={{
                  backgroundColor: '#F6F7DD',
                  border: '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '16px',
                  padding: '32px',
                }}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>
                  Card content met 32px padding
                </div>
              </div>
              <CodeBlock id="padding-card" code={`padding: '32px'`} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Gap tussen elementen
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#73747B',
                  }}
                >
                  • 8px - Kleine gaps (tussen labels en inputs)
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#73747B',
                  }}
                >
                  • 16px - Medium gaps (tussen form fields)
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#73747B',
                  }}
                >
                  • 24px - Large gaps (tussen sections)
                </div>
              </div>
              <CodeBlock
                id="gaps"
                code={`gap: '8px'   // klein
gap: '16px'  // medium
gap: '24px'  // groot`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                Page Padding: 32px 48px
              </div>
              <CodeBlock
                id="page-padding"
                code={`// In SidebarLayout.tsx
padding: '32px 48px'`}
              />
            </div>
          </div>
        </Section>

        {/* Live Components Section */}
        <Section title="9. Live Polar Componenten">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                PolarAlert - Verschillende variants
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <PolarAlert variant="info">Dit is een informatieve melding</PolarAlert>
                <PolarAlert variant="success">Actie succesvol uitgevoerd</PolarAlert>
                <PolarAlert variant="warning">Let op: dit vereist aandacht</PolarAlert>
                <PolarAlert variant="error">Er is een fout opgetreden</PolarAlert>
              </div>
              <CodeBlock
                id="alert"
                code={`<PolarAlert variant="info">Melding</PolarAlert>
<PolarAlert variant="success">Success</PolarAlert>
<PolarAlert variant="warning">Waarschuwing</PolarAlert>
<PolarAlert variant="error">Fout</PolarAlert>`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                PolarFormCard - Form container met fields
              </div>
              <PolarFormCard title="Voorbeeld Formulier">
                <PolarFormField label="Naam" description="Voer je volledige naam in" required>
                  <Input placeholder="Jan Jansen" />
                </PolarFormField>
                <PolarFormField label="Bio" description="Vertel iets over jezelf">
                  <Textarea placeholder="Ik ben..." rows={3} />
                </PolarFormField>
              </PolarFormCard>
              <CodeBlock
                id="form-card"
                code={`<PolarFormCard title="Formulier">
  <PolarFormField label="Naam" required>
    <Input placeholder="Naam" />
  </PolarFormField>
</PolarFormCard>`}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '12px',
                }}
              >
                PolarKPICard - Dashboard statistics card
              </div>
              <div style={{ maxWidth: '300px' }}>
                <PolarKPICard
                  title="Totaal Taken"
                  value="24"
                  compact
                  contentText={{
                    primary: '8 voltooid vandaag',
                    secondary: '+12% vs vorige week',
                  }}
                />
              </div>
              <CodeBlock
                id="kpi-card"
                code={`<PolarKPICard
  title="Totaal Taken"
  value="24"
  compact
  contentText={{
    primary: '8 voltooid vandaag',
    secondary: '+12% vs vorige week'
  }}
/>`}
              />
            </div>
          </div>
        </Section>

        {/* Usage Guidelines */}
        <Section title="10. Gebruik & Best Practices">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#282E3A',
                lineHeight: '1.6',
              }}
            >
              <strong>✅ DO:</strong>
              <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                <li>Gebruik inline styles met exacte Pura Vida kleuren</li>
                <li>Volg de border-radius hiërarchie (8px / 12px / 16px)</li>
                <li>Gebruik Inter font voor alle tekst</li>
                <li>Importeer kleuren uit PolarColors voor consistentie</li>
                <li>Gebruik subtiele borders en shadows voor depth</li>
              </ul>
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#282E3A',
                lineHeight: '1.6',
              }}
            >
              <strong>❌ DON'T:</strong>
              <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                <li>Gebruik geen random border-radius waardes (bijv. 10px, 14px)</li>
                <li>Gebruik geen Tailwind classes voor Polar componenten</li>
                <li>Verzin geen nieuwe kleuren - gebruik het palet</li>
                <li>Gebruik geen text-white of bg-white zonder context</li>
                <li>Mix geen verschillende design systemen</li>
              </ul>
            </div>
            <div
              style={{
                backgroundColor: '#F6F7DD',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#282E3A',
                  marginBottom: '8px',
                }}
              >
                💡 Pro Tip
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#282E3A',
                  lineHeight: '1.6',
                }}
              >
                Bij nieuwe features: refereer altijd naar deze style guide in plaats van kleuren/styling te
                improviseren. Kopieer code snippets direct voor consistente implementatie.
              </div>
            </div>
          </div>
        </Section>
      </div>
    </SidebarLayout>
  );
}
