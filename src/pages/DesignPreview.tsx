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

        {/* Comparison Grid - 3 columns */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT: Current Style */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <h2 className="text-lg font-semibold text-slate-700">Huidige Stijl</h2>
            </div>
            
            {/* Simulated current background */}
            <div 
              className="rounded-2xl p-5 space-y-3"
              style={{ backgroundColor: '#F6F7DD' }}
            >
              <div 
                style={{
                  backgroundColor: '#FEFFF1',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A7B6D', marginBottom: '6px' }}>
                  Omzet vandaag
                </div>
                <div style={{ fontSize: '40px', fontWeight: 600, color: '#282E3A', lineHeight: 1 }}>
                  €2.847
                </div>
                <div style={{ fontSize: '12px', color: '#7A7B6D', marginTop: '6px' }}>
                  +12% vs vorige week
                </div>
              </div>

              <div 
                style={{
                  backgroundColor: '#FEFFF1',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A7B6D', marginBottom: '6px' }}>
                  Bestellingen
                </div>
                <div style={{ fontSize: '40px', fontWeight: 600, color: '#282E3A', lineHeight: 1 }}>
                  47
                </div>
              </div>

              <div 
                style={{
                  backgroundColor: '#FEFFF1',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#7A7B6D', marginBottom: '6px' }}>
                  Taken voltooid
                </div>
                <div style={{ fontSize: '40px', fontWeight: 600, color: '#282E3A', lineHeight: 1 }}>
                  12/15
                </div>
              </div>
            </div>

            {/* Style notes */}
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="text-xs font-semibold text-amber-800 mb-2">Kenmerken:</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Crème achtergrond</li>
                <li>• Geen shadows</li>
                <li>• Geen hover effecten</li>
              </ul>
            </div>
          </div>

          {/* MIDDLE: Modern Grijs */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <h2 className="text-lg font-semibold text-slate-700">Modern Grijs</h2>
            </div>
            
            <div className="bg-slate-100 rounded-2xl p-5 space-y-3">
              <ModernKPICard 
                title="Omzet vandaag"
                value="€2.847"
                trend={{ value: '+12% vs vorige week', positive: true }}
                variant="default"
              />
              
              <ModernKPICard 
                title="Bestellingen"
                value="47"
                variant="default"
              />
              
              <ModernKPICard 
                title="Taken voltooid"
                value="12/15"
                variant="default"
              />
            </div>

            {/* Style notes */}
            <div className="mt-4 p-3 bg-slate-100 rounded-xl border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-700 mb-2">Kenmerken:</h3>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Grijze achtergrond</li>
                <li>• Witte cards + shadow</li>
                <li>• Hover effecten</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Modern Pura Vida (Hybride) */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1B7867' }}></div>
              <h2 className="text-lg font-semibold text-slate-700">Modern Pura Vida</h2>
            </div>
            
            {/* Grey background with green accents */}
            <div className="bg-slate-100 rounded-2xl p-5 space-y-3">
              <ModernKPICard 
                title="Omzet vandaag"
                value="€2.847"
                trend={{ value: '+12% vs vorige week', positive: true }}
                variant="puravida"
              />
              
              <ModernKPICard 
                title="Bestellingen"
                value="47"
                variant="puravida"
              />
              
              <ModernKPICard 
                title="Taken voltooid"
                value="12/15"
                variant="puravida"
              />
            </div>

            {/* Style notes */}
            <div className="mt-4 p-3 rounded-xl border" style={{ backgroundColor: '#E6F4F1', borderColor: '#B3D9D4' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: '#1B7867' }}>Kenmerken:</h3>
              <ul className="text-xs space-y-1" style={{ color: '#2D8B7A' }}>
                <li>• Grijze achtergrond (slate-100)</li>
                <li>• Groene border accent</li>
                <li>• Best of both worlds</li>
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
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Current colors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-4">Huidige Kleuren</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#F6F7DD' }}></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">#F6F7DD</div>
                    <div className="text-xs text-slate-500">Achtergrond</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#FEFFF1' }}></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">#FEFFF1</div>
                    <div className="text-xs text-slate-500">Cards</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Grijs colors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-4">Modern Grijs</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200"></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">slate-100</div>
                    <div className="text-xs text-slate-500">Achtergrond</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm"></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">white</div>
                    <div className="text-xs text-slate-500">Cards + shadow</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pura Vida colors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold mb-4" style={{ color: '#1B7867' }}>Pura Vida (Hybride)</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200"></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">slate-100</div>
                    <div className="text-xs text-slate-500">Achtergrond (neutraal)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border-2" style={{ borderColor: '#B3D9D4' }}></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">#B3D9D4</div>
                    <div className="text-xs text-slate-500">Border accent (on-brand)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#1B7867' }}></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">#1B7867</div>
                    <div className="text-xs text-slate-500">Pura Vida Sea</div>
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
