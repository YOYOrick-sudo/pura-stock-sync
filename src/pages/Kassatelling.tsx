import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useUserLocation } from '@/contexts/UserLocationContext';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';
import { KasControleContent } from './KasControle';
import { AdminPasswordDialog } from '@/components/foh/AdminPasswordDialog';

type Tab = 'overdag' | 'avond' | 'controle';

export default function Kassatelling() {
  const { userLocation } = useUserLocation();
  const [activeTab, setActiveTab] = useState<Tab>('avond');
  const [pwOpen, setPwOpen] = useState(false);
  const [controleUnlocked, setControleUnlocked] = useState(
    () => sessionStorage.getItem('kas_controle_unlocked') === 'true'
  );

  const handleTabClick = (tab: Tab) => {
    if (tab === 'controle' && !controleUnlocked) {
      setPwOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overdag', label: 'Open' },
    { key: 'avond', label: 'Sluit' },
    { key: 'controle', label: 'Kas-controle' },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-card rounded-[20px] border border-border p-6 shadow-soft">
          <div className="flex gap-3 mb-6 flex-wrap">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => handleTabClick(t.key)}
                className={`min-w-[120px] flex items-center justify-center text-sm font-medium px-4 py-2.5 rounded-[20px] transition-all cursor-pointer
                  ${activeTab === t.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground border border-border hover:bg-muted'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            {activeTab === 'overdag' && <KassatellingOverdag />}
            {activeTab === 'avond' && <Kassa />}
            {activeTab === 'controle' && controleUnlocked && <KasControleContent embedded />}
          </div>
        </div>
      </div>

      <AdminPasswordDialog
        open={pwOpen}
        onOpenChange={setPwOpen}
        password="2017"
        onSuccess={() => {
          sessionStorage.setItem('kas_controle_unlocked', 'true');
          setControleUnlocked(true);
          setActiveTab('controle');
        }}
      />
    </SidebarLayout>
  );
}
