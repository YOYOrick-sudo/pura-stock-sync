import { SidebarLayout } from '@/components/SidebarLayout';
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
      <div style={{ width: '100%', height: '80px', backgroundColor: color, borderRadius: '16px', border: '1px solid rgba(197, 197, 202, 0.5)', marginBottom: '8px' }} />
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A' }}>{name}</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#73747B' }}>{hex}</div>
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
    <div style={{ backgroundColor: '#FEFFF1', border: '1px solid rgba(197, 197, 202, 0.5)', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
      <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#282E3A', marginBottom: '24px' }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px' }}>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '32px', fontWeight: 600, color: '#282E3A', marginBottom: '8px' }}>Pura Vida Design System</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#73747B', marginBottom: '32px' }}>Alle buttons gebruiken nu 16px border-radius. 12px is volledig verwijderd.</p>

        <Section title="Border Radius Hiërarchie">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>8px - Kleine elementen</div>
              <div style={{ width: '200px', height: '40px', backgroundColor: '#F6F7DD', borderRadius: '8px', border: '1px solid rgba(197, 197, 202, 0.5)' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>16px - Buttons, cards, inputs</div>
              <div style={{ width: '200px', height: '40px', backgroundColor: '#1B7867', borderRadius: '16px' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#282E3A', marginBottom: '12px' }}>20px - Extra grote containers</div>
              <div style={{ width: '200px', height: '60px', backgroundColor: '#FEFFF1', borderRadius: '20px', border: '1px solid rgba(197, 197, 202, 0.5)' }} />
            </div>
          </div>
        </Section>

        <Section title="Buttons (16px radius)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <Button size="sm">Small</Button>
                <Button>Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </SidebarLayout>
  );
}
