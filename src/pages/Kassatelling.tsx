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
        {/* Eén grote card die alles omvat */}
        <div className="bg-muted rounded-lg border border-border p-6 shadow-sm">
          {/* Tab buttons bovenaan */}
          <div className="flex gap-3 mb-6">
            {(['overdag', 'avond'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`min-w-[120px] flex items-center justify-center text-sm font-medium px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-card text-foreground border border-border hover:bg-muted hover:shadow-sm'
                }`}
              >
                {tab === 'overdag' ? 'Open' : 'Sluit'}
              </button>
            ))}
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
