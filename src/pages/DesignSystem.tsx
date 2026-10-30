import { useState } from 'react';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatenSectie, PatronenCompleet, TekstToon } from '@/pages/design-system/Uitbreiding';
import { BasisVoorbeelden } from '@/pages/design-system/PatronenVoorbeelden';
import { Controle, NieuweBlokken, Recepten, Regels, StartKeuze } from '@/pages/design-system/Regelboek';
import { useIsMobile } from '@/hooks/use-mobile';

const SECTIES = [
  { id: 'start', label: 'Start', titel: 'Start', uitleg: 'Welk type pagina bouw je?' },
  { id: 'recepten', label: 'Recepten', titel: 'Paginarecepten', uitleg: 'Vier vaste opbouwen. Elke nieuwe module volgt er één.' },
  { id: 'basis', label: 'Basis', titel: 'Basis', uitleg: 'Tekstniveaus, afstand en statuskleur' },
  { id: 'maten', label: 'Maten', titel: 'Maten', uitleg: 'Hoogte, afronding en iconen zoals ze in de app staan' },
  { id: 'blokken', label: 'Bouwblokken', titel: 'Bouwblokken', uitleg: 'Elk blok met wanneer je het gebruikt' },
  { id: 'regels', label: 'Regels', titel: 'Regels', uitleg: 'Achttien regels, elk met goed en fout' },
  { id: 'toon', label: 'Tekst en toon', titel: 'Tekst en toon', uitleg: 'Kort, vriendelijk, nuchter' },
  { id: 'controle', label: 'Controlelijst', titel: 'Controlelijst', uitleg: 'Loop dit na vóór oplevering' },
];

function Inhoud({ id }: { id: string }) {
  switch (id) {
    case 'start': return <StartKeuze />;
    case 'recepten': return <Recepten />;
    case 'basis': return <BasisVoorbeelden />;
    case 'maten': return <MatenSectie />;
    case 'blokken': return <div className="space-y-10"><PatronenCompleet /><NieuweBlokken /></div>;
    case 'regels': return <Regels />;
    case 'toon': return <TekstToon />;
    default: return <Controle />;
  }
}

/** Openbare naslag voor iedereen die schermen bouwt. Bron: components/pura. */
export default function DesignSystem() {
  const isMobile = useIsMobile();
  const [actief, setActief] = useState('start');
  const ga = (id: string) => { setActief(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className={isMobile ? 'min-w-0 break-words' : undefined}><h1 className="text-lg font-semibold text-foreground">Pura Vida Design System</h1><p className="text-xs text-muted-foreground">Eén bron voor elke module</p></div>
        <Button variant="outline" size="touch" className={isMobile ? 'shrink-0' : undefined} asChild><a href="/dashboard"><Home className="h-4 w-4" />Naar app</a></Button>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden">{SECTIES.map((s) => <Button key={s.id} variant={actief === s.id ? 'secondary' : 'ghost'} size="touch" className="shrink-0" onClick={() => ga(s.id)}>{s.label}</Button>)}</nav>
    </header>
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6">
      <nav className="hidden w-48 shrink-0 lg:block"><div className="sticky top-24 space-y-1">{SECTIES.map((s) => <Button key={s.id} variant={actief === s.id ? 'secondary' : 'ghost'} size="touch" className="w-full justify-start" onClick={() => ga(s.id)}>{s.label}</Button>)}</div></nav>
      <main className="min-w-0 flex-1 space-y-10">{SECTIES.map((s) => <section key={s.id} id={s.id} className="scroll-mt-32 space-y-4">
        <div><h2 className="text-xl font-semibold text-foreground">{s.titel}</h2><p className="text-sm text-muted-foreground">{s.uitleg}</p></div>
        <div className={`rounded-polar-lg border border-border bg-card p-4 sm:p-6 ${isMobile ? 'min-w-0 max-w-full overflow-x-auto [&_button]:min-h-11 [&_button]:min-w-11 [&_input]:min-h-11 [&_input]:text-base' : ''}`}><Inhoud id={s.id} /></div>
      </section>)}</main>
    </div>
  </div>;
}
