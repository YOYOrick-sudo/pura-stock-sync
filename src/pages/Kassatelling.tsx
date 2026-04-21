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
      <div className="max-w-[1400px] mx-auto">
        <div>
          {/* Tab buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab('overdag')}
              className={`min-w-[120px] flex items-center justify-center text-sm font-medium px-4 py-2.5 rounded-[20px] transition-all cursor-pointer
                ${activeTab === 'overdag' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-foreground border border-border hover:bg-muted'
                }`}
            >
              Open
            </button>
            
            <button
              onClick={() => setActiveTab('avond')}
              className={`min-w-[120px] flex items-center justify-center text-sm font-medium px-4 py-2.5 rounded-[20px] transition-all cursor-pointer
                ${activeTab === 'avond' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-foreground border border-border hover:bg-muted'
                }`}
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
