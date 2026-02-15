import { SidebarLayout } from '@/components/SidebarLayout';
import { PolarAlert, PolarCheckbox, PolarFormCard, PolarFormField, PolarKPICard } from '@/components/polar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Copy, Check, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function StyleGuide() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const ColorBlock = ({ color, name, hex }: { color: string; name: string; hex: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ width: '100%', height: '80px', backgroundColor: color, borderRadius: '16px', border: '1px solid #D5D8E0', marginBottom: '8px' }} />
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A' }}>{name}</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#636878' }}>{hex}</div>
    </div>
  );

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div style={{ position: 'relative', marginTop: '12px' }}>
      <pre style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#282E3A', color: '#FEFFF1', padding: '16px', borderRadius: '16px', overflowX: 'auto' }}>{code}</pre>
      <button onClick={() => copyToClipboard(code, id)} style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#FEFFF1' }}>
        {copiedCode === id ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ backgroundColor: '#FEFFF1', border: '1px solid #D5D8E0', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
      <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#282E3A', marginBottom: '24px' }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px' }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '32px', fontWeight: 600, color: '#282E3A', marginBottom: '8px' }}>Pura Vida Design System</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#636878', marginBottom: '32px' }}>Complete styling guide voor consistente UI ontwikkeling</p>

        <Section title="Kleuren Palet">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
            <ColorBlock color="#FEFFF1" name="Cream" hex="#FEFFF1" />
            <ColorBlock color="#F6F7DD" name="Moonlight" hex="#F6F7DD" />
            <ColorBlock color="#282E3A" name="Midnight" hex="#282E3A" />
            <ColorBlock color="#636878" name="Secondary Text" hex="#636878" />
            <ColorBlock color="#1B7867" name="Pura Vida Sea" hex="#1B7867" />
            <ColorBlock color="#22C55E" name="Success" hex="#22C55E" />
            <ColorBlock color="#F59E0B" name="Warning" hex="#F59E0B" />
            <ColorBlock color="#EF4444" name="Error" hex="#EF4444" />
          </div>
          <CodeBlock
            id="colors"
            code={`// Gebruik altijd design system tokens
className="bg-background text-foreground"
className="bg-polar-moonlight text-polar-midnight"
className="border-polar-border"`}
          />
        </Section>

        <Section title="Border Radius Hiërarchie">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>8px - Kleine elementen</div>
              <div style={{ width: '200px', height: '40px', backgroundColor: '#F6F7DD', borderRadius: '8px', border: '1px solid #D5D8E0' }} />
              <CodeBlock id="radius-8" code={`className="rounded-polar-sm" // 8px`} />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>16px - Buttons, cards, inputs</div>
              <div style={{ width: '200px', height: '40px', backgroundColor: '#1B7867', borderRadius: '16px' }} />
              <CodeBlock id="radius-16" code={`className="rounded-polar-lg" // 16px`} />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>20px - Extra grote containers</div>
              <div style={{ width: '200px', height: '60px', backgroundColor: '#FEFFF1', borderRadius: '20px', border: '1px solid #D5D8E0' }} />
              <CodeBlock id="radius-20" code={`className="rounded-polar-xl" // 20px`} />
            </div>
          </div>
        </Section>

        <Section title="Typography">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h1 className="polar-h1">Heading 1 - 24px / 600</h1>
              <CodeBlock id="typo-h1" code={`className="polar-h1"`} />
            </div>
            <div>
              <h2 className="polar-title">Title - 18px / 500</h2>
              <CodeBlock id="typo-title" code={`className="polar-title"`} />
            </div>
            <div>
              <p className="polar-body">Body text - 14px / 400</p>
              <CodeBlock id="typo-body" code={`className="polar-body"`} />
            </div>
            <div>
              <p className="polar-secondary">Secondary text - 14px / 400 (#636878)</p>
              <CodeBlock id="typo-secondary" code={`className="polar-secondary"`} />
            </div>
          </div>
        </Section>

        <Section title="Buttons (16px radius)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>Sizes</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <Button size="sm">Small</Button>
                <Button>Medium (default)</Button>
                <Button size="lg">Large</Button>
              </div>
              <CodeBlock
                id="button-sizes"
                code={`<Button size="sm">Small</Button>
<Button>Medium</Button>
<Button size="lg">Large</Button>`}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>Variants</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
              <CodeBlock
                id="button-variants"
                code={`<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>`}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>Disabled State</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button disabled>Primary Disabled</Button>
                <Button variant="secondary" disabled>Secondary Disabled</Button>
              </div>
              <CodeBlock
                id="button-disabled"
                code={`<Button disabled>Disabled</Button>`}
              />
            </div>
          </div>
        </Section>

        <Section title="Cards">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>Standard Card</div>
              <div style={{ backgroundColor: '#FEFFF1', border: '1px solid #D5D8E0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)' }}>
                <h3 className="polar-title" style={{ marginBottom: '8px' }}>Card Title</h3>
                <p className="polar-secondary">Card content goes here</p>
              </div>
              <CodeBlock
                id="card-standard"
                code={`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card content</CardContent>
</Card>`}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>Dashboard Card (Moonlight background)</div>
              <div style={{ backgroundColor: '#F6F7DD', border: '1px solid #D5D8E0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)' }}>
                <h3 className="polar-title" style={{ marginBottom: '8px' }}>Dashboard Card</h3>
                <p className="polar-secondary">Used for dashboard KPIs</p>
              </div>
              <CodeBlock
                id="card-dashboard"
                code={`<div className="bg-polar-moonlight rounded-polar-lg border border-polar-border p-6">
  <h3 className="polar-title">Dashboard Card</h3>
</div>`}
              />
            </div>
          </div>
        </Section>

        <Section title="Form Elements">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <Label>Text Input</Label>
              <Input placeholder="Enter text..." className="mt-2" />
              <CodeBlock
                id="form-input"
                code={`<Label>Text Input</Label>
<Input placeholder="Enter text..." />`}
              />
            </div>
            <div>
              <Label>Textarea</Label>
              <Textarea placeholder="Enter longer text..." className="mt-2" />
              <CodeBlock
                id="form-textarea"
                code={`<Label>Textarea</Label>
<Textarea placeholder="Enter longer text..." />`}
              />
            </div>
            <div>
              <Label>Checkbox</Label>
              <div className="mt-2">
                <PolarCheckbox
                  checked={checkboxValue}
                  onChange={setCheckboxValue}
                  label="I agree to terms"
                />
              </div>
              <CodeBlock
                id="form-checkbox"
                code={`<PolarCheckbox
  checked={checked}
  onChange={setChecked}
  label="I agree to terms"
/>`}
              />
            </div>
            <div>
              <Label>Radio Group</Label>
              <RadioGroup value={radioValue} onValueChange={setRadioValue} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option1" id="option1" />
                  <Label htmlFor="option1">Option 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option2" id="option2" />
                  <Label htmlFor="option2">Option 2</Label>
                </div>
              </RadioGroup>
              <CodeBlock
                id="form-radio"
                code={`<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
</RadioGroup>`}
              />
            </div>
            <div>
              <Label>Toggle (Switch)</Label>
              <div style={{ fontSize: '14px', color: '#636878', marginTop: '8px', marginBottom: '16px' }}>
                Toggles (switches) are used for binary on/off settings. They provide immediate visual feedback and trigger instant changes.
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#282E3A', marginBottom: '4px' }}>Email Notifications</div>
                    <div style={{ fontSize: '14px', color: '#636878' }}>Receive email updates for new reservations</div>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#282E3A', marginBottom: '4px' }}>Auto-confirm</div>
                    <div style={{ fontSize: '14px', color: '#636878' }}>Automatically confirm new reservations</div>
                  </div>
                  <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#282E3A', marginBottom: '4px' }}>SMS Reminders</div>
                    <div style={{ fontSize: '14px', color: '#636878' }}>Send SMS reminders 2 hours before reservation</div>
                  </div>
                  <Switch checked={smsReminders} onCheckedChange={setSmsReminders} />
                </div>
              </div>

              <div style={{ marginTop: '32px' }}>
                <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '16px' }}>Toggle States</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#282E3A', marginBottom: '8px' }}>Off</div>
                    <Switch checked={false} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: '#282E3A', marginBottom: '8px' }}>On</div>
                    <Switch checked={true} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: '#282E3A', marginBottom: '8px' }}>Disabled (Off)</div>
                    <Switch checked={false} disabled />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: '#282E3A', marginBottom: '8px' }}>Disabled (On)</div>
                    <Switch checked={true} disabled />
                  </div>
                </div>
              </div>

              <CodeBlock
                id="form-switch"
                code={`<Label>Toggle Setting</Label>
<Switch 
  checked={isEnabled} 
  onCheckedChange={setIsEnabled} 
/>

// Disabled state
<Switch checked={true} disabled />`}
              />
            </div>
          </div>
        </Section>

        <Section title="Status Indicators">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>Badges</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              <CodeBlock
                id="status-badges"
                code={`<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>Status Dots</div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                  <span className="polar-body">Success</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <span className="polar-body">Warning</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <span className="polar-body">Error</span>
                </div>
              </div>
              <CodeBlock
                id="status-dots"
                code={`<div className="w-2 h-2 rounded-full bg-green-500" />
<div className="w-2 h-2 rounded-full bg-yellow-500" />
<div className="w-2 h-2 rounded-full bg-red-500" />`}
              />
            </div>
          </div>
        </Section>

        <Section title="Live Polar Components">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>PolarAlert</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <PolarAlert variant="info">Dit is een informatieve melding</PolarAlert>
                <PolarAlert variant="success">Actie succesvol voltooid</PolarAlert>
                <PolarAlert variant="warning">Let op: belangrijk bericht</PolarAlert>
                <PolarAlert variant="error">Er is een fout opgetreden</PolarAlert>
              </div>
              <CodeBlock
                id="polar-alert"
                code={`<PolarAlert variant="info">Informatieve melding</PolarAlert>
<PolarAlert variant="success">Succesvol</PolarAlert>
<PolarAlert variant="warning">Waarschuwing</PolarAlert>
<PolarAlert variant="error">Foutmelding</PolarAlert>`}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>PolarKPICard</div>
              <div style={{ maxWidth: '300px' }}>
                <PolarKPICard
                  title="Totaal Verkoop"
                  value="€12,345"
                  compact
                  statusColor={{
                    bg: '#F6F7DD',
                    text: '#1B7867',
                    icon: <CheckCircle2 size={16} />
                  }}
                  contentText={{
                    primary: '+12.5% vs vorige maand',
                    secondary: 'Boven target'
                  }}
                />
              </div>
              <CodeBlock
                id="polar-kpi"
                code={`<PolarKPICard
  title="Totaal Verkoop"
  value="€12,345"
  compact
  statusColor={{
    bg: '#F6F7DD',
    text: '#1B7867',
    icon: <CheckCircle2 size={16} />
  }}
  contentText={{
    primary: '+12.5% vs vorige maand'
  }}
/>`}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>PolarFormCard</div>
              <PolarFormCard title="Voorbeeld Formulier">
                <PolarFormField label="Naam" description="Invullen van gegevens" required>
                  <Input placeholder="Voer naam in..." />
                </PolarFormField>
                <PolarFormField label="Beschrijving">
                  <Textarea placeholder="Optionele beschrijving..." />
                </PolarFormField>
              </PolarFormCard>
              <CodeBlock
                id="polar-form"
                code={`<PolarFormCard title="Formulier">
  <PolarFormField label="Naam" description="Help text" required>
    <Input placeholder="Voer naam in..." />
  </PolarFormField>
</PolarFormCard>`}
              />
            </div>
          </div>
        </Section>

        <Section title="Spacing & Layout">
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A' }}>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>• Card padding: <code style={{ backgroundColor: '#F6F7DD', padding: '2px 8px', borderRadius: '4px' }}>32px</code></li>
              <li>• Section spacing: <code style={{ backgroundColor: '#F6F7DD', padding: '2px 8px', borderRadius: '4px' }}>24px</code></li>
              <li>• Element spacing: <code style={{ backgroundColor: '#F6F7DD', padding: '2px 8px', borderRadius: '4px' }}>16px</code></li>
              <li>• Small spacing: <code style={{ backgroundColor: '#F6F7DD', padding: '2px 8px', borderRadius: '4px' }}>8px</code></li>
              <li>• Page padding: <code style={{ backgroundColor: '#F6F7DD', padding: '2px 8px', borderRadius: '4px' }}>32px 48px</code></li>
            </ul>
            <CodeBlock
              id="spacing"
              code={`className="p-8"        // 32px padding
className="space-y-6"   // 24px vertical spacing
className="gap-4"       // 16px gap
className="space-x-2"   // 8px horizontal spacing`}
            />
          </div>
        </Section>

        <Section title="Dialogs & Modals">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#636878', marginBottom: '16px' }}>
            Alle dialogs en modals volgen dezelfde Polar styling voor consistentie
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 className="polar-title" style={{ marginBottom: '12px' }}>Live Voorbeeld</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open Voorbeeld Dialog</Button>
                </DialogTrigger>
                <DialogContent style={{
                  backgroundColor: '#FEFFF1',
                  borderRadius: '24px',
                  border: '1px solid #D5D8E0',
                  padding: '32px',
                  maxWidth: '480px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                  <DialogHeader>
                    <DialogTitle style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#282E3A',
                      marginBottom: '8px',
                    }}>
                      Dialog Titel
                    </DialogTitle>
                    <DialogDescription style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#636878',
                      marginBottom: '24px',
                    }}>
                      Dit is een beschrijving van de dialog, uitleggen wat de gebruiker kan doen.
                    </DialogDescription>
                  </DialogHeader>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#282E3A',
                        marginBottom: '8px',
                        display: 'block',
                      }}>
                        Input Label
                      </label>
                      <Input 
                        placeholder="Voer iets in..."
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '14px',
                          border: '1px solid #C1C5CF',
                          padding: '12px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Button 
                        variant="outline"
                        style={{
                          borderRadius: '14px',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        Annuleren
                      </Button>
                      <Button
                        style={{
                          backgroundColor: '#1B7867',
                          color: '#FFFFFF',
                          borderRadius: '14px',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        Opslaan
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <h3 className="polar-title" style={{ marginBottom: '12px' }}>Implementatie</h3>
              <CodeBlock
                id="dialog-styling"
                code={`<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent style={{
    backgroundColor: '#FEFFF1',
    borderRadius: '24px',
    border: '1px solid #D5D8E0',
    padding: '32px',
    maxWidth: '480px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  }}>
    <DialogHeader>
      <DialogTitle style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        fontWeight: 600,
        color: '#282E3A',
        marginBottom: '8px',
      }}>
        Titel
      </DialogTitle>
      <DialogDescription style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 400,
        color: '#636878',
        marginBottom: '24px',
      }}>
        Beschrijving
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>`}
              />
            </div>

            <div>
              <h3 className="polar-title" style={{ marginBottom: '12px' }}>Styling Specificaties</h3>
              <ul style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Container:</strong> Cream background (#FEFFF1), 24px border-radius, subtle border, box-shadow</li>
                <li><strong>Title:</strong> 18px, weight 600, Midnight color</li>
                <li><strong>Description:</strong> 14px, weight 400, Secondary text color (#636878)</li>
                <li><strong>Inputs:</strong> White background (contrast!), 14px border-radius, subtle border</li>
                <li><strong>Buttons:</strong> 14px border-radius, primary/secondary variants</li>
                <li><strong>Spacing:</strong> 32px padding, 24px between sections, 16px between fields</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Usage Guidelines">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 className="polar-title" style={{ marginBottom: '12px', color: '#22C55E' }}>✅ DO</h3>
              <ul style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Gebruik Tailwind classes voor styling waar mogelijk</li>
                <li>Gebruik design system tokens (polar-*, bg-background, etc.)</li>
                <li>Volg de border-radius hiërarchie (8px, 16px, 20px)</li>
                <li>Gebruik PolarComponents voor consistentie</li>
                <li>Test componenten in light én dark mode</li>
              </ul>
              <CodeBlock
                id="do-example"
                code={`// ✅ GOED
<Button variant="primary">Opslaan</Button>
<div className="rounded-polar-lg bg-polar-moonlight p-6">
  <h3 className="polar-title">Title</h3>
</div>`}
              />
            </div>
            <div>
              <h3 className="polar-title" style={{ marginBottom: '12px', color: '#EF4444' }}>❌ DON'T</h3>
              <ul style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#282E3A', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Gebruik geen random border-radius waardes</li>
                <li>Gebruik geen directe hex colors in componenten</li>
                <li>Gebruik geen inline styles zonder goede reden</li>
                <li>Mix geen verschillende design systems</li>
                <li>Vergeet geen hover/focus states</li>
              </ul>
              <CodeBlock
                id="dont-example"
                code={`// ❌ FOUT
<button style={{ borderRadius: '14px', background: '#abc123' }}>
  Random styling
</button>

// ❌ FOUT
<div className="rounded-[15px] bg-[#F6F7DD]">
  Non-standard values
</div>`}
              />
            </div>
          </div>
        </Section>
      </div>
    </SidebarLayout>
  );
}
