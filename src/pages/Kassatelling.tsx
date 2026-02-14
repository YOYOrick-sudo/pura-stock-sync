import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useUserLocation } from '@/contexts/UserLocationContext';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';

export default function Kassatelling() {
  const { userLocation } = useUserLocation();
  const [activeTab, setActiveTab] = useState<'overdag' | 'avond'>('avond');

  return (
    <SidebarLayout>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Eén grote moonlight card die alles omvat */}
        <div style={{
          backgroundColor: '#FFF7ED',
          borderRadius: '20px',
          border: '1px solid rgba(197, 197, 202, 0.5)',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        }}>
          {/* Tab buttons bovenaan */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'flex-start' }}>
            <button
              onClick={() => setActiveTab('overdag')}
              onMouseEnter={(e) => {
                if (activeTab !== 'overdag') {
                  e.currentTarget.style.backgroundColor = '#FFF7ED';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'overdag') {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              style={{
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 16px',
                backgroundColor: activeTab === 'overdag' ? '#E27726' : '#FFFFFF',
                color: activeTab === 'overdag' ? '#FFFFFF' : '#282E3A',
                border: activeTab === 'overdag' ? 'none' : '1px solid rgba(197, 197, 202, 0.5)',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Open
            </button>
            
            <button
              onClick={() => setActiveTab('avond')}
              onMouseEnter={(e) => {
                if (activeTab !== 'avond') {
                  e.currentTarget.style.backgroundColor = '#FFF7ED';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'avond') {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              style={{
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 16px',
                backgroundColor: activeTab === 'avond' ? '#E27726' : '#FFFFFF',
                color: activeTab === 'avond' ? '#FFFFFF' : '#282E3A',
                border: activeTab === 'avond' ? 'none' : '1px solid rgba(197, 197, 202, 0.5)',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Sluit
            </button>
          </div>

          {/* Content */}
          <div>
            {activeTab === 'overdag' && <KassatellingOverdag />}
            {activeTab === 'avond' && <Kassa />}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
