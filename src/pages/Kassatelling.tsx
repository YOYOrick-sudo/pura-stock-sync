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
        padding: '0 24px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('overdag')}
            onMouseEnter={(e) => {
              if (activeTab !== 'overdag') {
                e.currentTarget.style.backgroundColor = '#F6F7DD';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'overdag') {
                e.currentTarget.style.backgroundColor = '#FEFFF1';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 16px',
              backgroundColor: activeTab === 'overdag' ? '#1B7867' : '#FEFFF1',
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
                e.currentTarget.style.backgroundColor = '#F6F7DD';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'avond') {
                e.currentTarget.style.backgroundColor = '#FEFFF1';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 16px',
              backgroundColor: activeTab === 'avond' ? '#1B7867' : '#FEFFF1',
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

        {activeTab === 'overdag' && <KassatellingOverdag />}
        {activeTab === 'avond' && <Kassa />}
      </div>
    </SidebarLayout>
  );
}
