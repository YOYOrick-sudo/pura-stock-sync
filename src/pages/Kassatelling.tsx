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
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Main card container */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #D5D8E0',
          padding: '24px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}>
          {/* Segmented control */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F8F9FA',
            border: '1px solid #EAECF0',
            borderRadius: '16px',
            padding: '3px',
            marginBottom: '24px',
          }}>
            <button
              onClick={() => setActiveTab('overdag')}
              style={{
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: activeTab === 'overdag' ? 600 : 500,
                padding: '8px 16px',
                backgroundColor: activeTab === 'overdag' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'overdag' ? '#1A1F28' : '#4A4F5E',
                border: 'none',
                borderRadius: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
                boxShadow: activeTab === 'overdag' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Open
            </button>
            
            <button
              onClick={() => setActiveTab('avond')}
              style={{
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: activeTab === 'avond' ? 600 : 500,
                padding: '8px 16px',
                backgroundColor: activeTab === 'avond' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'avond' ? '#1A1F28' : '#4A4F5E',
                border: 'none',
                borderRadius: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
                boxShadow: activeTab === 'avond' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
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
