import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PolarKPICard } from '@/components/polar/KPICard';
import { ModernKPICard } from '@/components/polar/ModernKPICard';

const DesignPreview = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Design Preview</h1>
            <p className="text-sm text-slate-500">Vergelijk de huidige en nieuwe moderne stijl</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Intro */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Wat zie je hier?</h2>
          <p className="text-slate-600">
            Links: de <strong>huidige stijl</strong> met inline styles en crème achtergrond.<br />
            Rechts: de <strong>nieuwe moderne stijl</strong> met Tailwind, witte cards, subtiele shadows en hover effecten.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* LEFT: Current Style */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <h2 className="text-lg font-semibold text-slate-700">Huidige Stijl</h2>
            </div>
            
            {/* Simulated current background */}
            <div 
              className="rounded-2xl p-6 space-y-4"
              style={{ backgroundColor: '#F6F7DD' }}
            >
              {/* Current KPI Cards with inline styles (simulated) */}
              <div 
                style={{
                  backgroundColor: '#FEFFF1',
                  borderRadius: '16px',
                  padding: '24px',
                  border: 'none'
                }}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#7A7B6D',
                  marginBottom: '8px'
                }}>
                  Omzet vandaag
                </div>
                <div style={{ 
                  fontSize: '56px', 
                  fontWeight: 600, 
                  color: '#282E3A',
                  lineHeight: 1
                }}>
                  €2.847
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#7A7B6D',
                  marginTop: '8px'
                }}>
                  +12% vs vorige week
                </div>
              </div>

              <div 
                style={{
                  backgroundColor: '#FEFFF1',
                  borderRadius: '16px',
                  padding: '24px',
                  border: 'none'
                }}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#7A7B6D',
                  marginBottom: '8px'
                }}>
                  Bestellingen
                </div>
                <div style={{ 
                  fontSize: '56px', 
                  fontWeight: 600, 
                  color: '#282E3A',
                  lineHeight: 1
                }}>
                  47
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#7A7B6D',
                  marginTop: '8px'
                }}>
                  Vandaag verwerkt
                </div>
              </div>

              <div 
                style={{
                  backgroundColor: '#FEFFF1',
                  borderRadius: '16px',
                  padding: '24px',
                  border: 'none'
                }}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#7A7B6D',
                  marginBottom: '8px'
                }}>
                  Taken voltooid
                </div>
                <div style={{ 
                  fontSize: '56px', 
                  fontWeight: 600, 
                  color: '#282E3A',
                  lineHeight: 1
                }}>
                  12/15
                </div>
              </div>
            </div>

            {/* Style notes */}
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Kenmerken:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Inline styles (moeilijk te onderhouden)</li>
                <li>• Crème achtergrond (#F6F7DD)</li>
                <li>• Geen hover effecten</li>
                <li>• Geen shadows (flat design)</li>
                <li>• Grote getallen (56px)</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Modern Style */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <h2 className="text-lg font-semibold text-slate-700">Nieuwe Moderne Stijl</h2>
            </div>
            
            {/* Modern background */}
            <div className="bg-slate-100 rounded-2xl p-6 space-y-4">
              <ModernKPICard 
                title="Omzet vandaag"
                value="€2.847"
                trend={{ value: '+12% vs vorige week', positive: true }}
              />
              
              <ModernKPICard 
                title="Bestellingen"
                value="47"
                subtitle="Vandaag verwerkt"
              />
              
              <ModernKPICard 
                title="Taken voltooid"
                value="12/15"
                trend={{ value: '80% compleet', positive: true }}
              />
            </div>

            {/* Style notes */}
            <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2">Kenmerken:</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Tailwind classes (makkelijk te onderhouden)</li>
                <li>• Lichtgrijze achtergrond (slate-100)</li>
                <li>• Hover: lift + meer shadow</li>
                <li>• Subtiele shadows (depth)</li>
                <li>• Strakker lettertype (48px, bold)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Interactieve Demo</h2>
          <p className="text-slate-600 mb-6">Hover over de kaarten om het verschil te zien:</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernKPICard 
              title="Gasten vandaag"
              value="156"
              subtitle="25 reserveringen"
            />
            <ModernKPICard 
              title="Gemiddelde besteding"
              value="€18,25"
              trend={{ value: '+€2,10', positive: true }}
            />
            <ModernKPICard 
              title="Wachttijd"
              value="8 min"
              trend={{ value: '-2 min', positive: true }}
            />
            <ModernKPICard 
              title="Beoordeling"
              value="4.8"
              subtitle="⭐ Vandaag"
            />
          </div>
        </div>

        {/* Color Comparison */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Kleurenpalet Vergelijking</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current colors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-4">Huidige Kleuren</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#F6F7DD' }}></div>
                  <div>
                    <div className="font-medium text-slate-900">#F6F7DD</div>
                    <div className="text-sm text-slate-500">Page achtergrond</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#FEFFF1' }}></div>
                  <div>
                    <div className="font-medium text-slate-900">#FEFFF1</div>
                    <div className="text-sm text-slate-500">Card achtergrond</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#1B7867' }}></div>
                  <div>
                    <div className="font-medium text-slate-900">#1B7867</div>
                    <div className="text-sm text-slate-500">Pura Vida groen (blijft!)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* New colors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-4">Nieuwe Kleuren</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200"></div>
                  <div>
                    <div className="font-medium text-slate-900">slate-50</div>
                    <div className="text-sm text-slate-500">Page achtergrond</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 shadow-sm"></div>
                  <div>
                    <div className="font-medium text-slate-900">white + shadow</div>
                    <div className="text-sm text-slate-500">Card achtergrond</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#1B7867' }}></div>
                  <div>
                    <div className="font-medium text-slate-900">#1B7867</div>
                    <div className="text-sm text-slate-500">Pura Vida groen (blijft!)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Bevalt de nieuwe stijl?</h2>
          <p className="text-emerald-100 mb-6">
            Als je tevreden bent, kan ik alle componenten migreren naar deze moderne look.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/dashboard"
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Terug naar Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DesignPreview;
