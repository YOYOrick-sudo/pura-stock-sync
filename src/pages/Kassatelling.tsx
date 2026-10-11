import { useCallback, useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';
import { KasControleContent } from './KasControle';
import { AdminPasswordDialog } from '@/components/foh/AdminPasswordDialog';
import { WisselkassaAanvraagButton } from '@/components/kassa/WisselkassaAanvraagButton';

type Tab = 'overdag' | 'avond' | 'controle';

export default function Kassatelling() {
  const [activeTab, setActiveTab] = useState<Tab>('avond');
  const [pwOpen, setPwOpen] = useState(false);
  const [controleUnlocked, setControleUnlocked] = useState(
    () => sessionStorage.getItem('kas_controle_unlocked') === 'true'
  );

  const handleTabClick = useCallback((tab: Tab) => {
    if (tab === 'controle' && !controleUnlocked) {
      setPwOpen(true);
      return;
    }
    setActiveTab(tab);
  }, [controleUnlocked]);

  const handleUnlockSuccess = useCallback(() => {
    sessionStorage.setItem('kas_controle_unlocked', 'true');
    setControleUnlocked(true);
    setActiveTab('controle');
  }, []);

  const tabs: { key: Tab; label: string }[] = useMemo(() => ([
    { key: 'overdag', label: 'Open' },
    { key: 'avond', label: 'Sluit' },
    { key: 'controle', label: 'Kas-controle' },
  ]), []);

  // Render alle tab-inhoud altijd, en verberg de inactieve. Dit voorkomt
  // dat het openen van de wachtwoord-popup tegelijk een zware re-mount
  // van de kassatelling triggert.
  return (
    <SidebarLayout>
      <div className="page-container">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2 md:mb-6 md:gap-3">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => handleTabClick(t.key)}
                className={`min-h-11 min-w-[88px] flex flex-1 items-center justify-center text-sm font-medium px-4 py-2.5 rounded-polar-lg transition-all cursor-pointer sm:flex-none sm:min-w-[120px]
                  ${activeTab === t.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground border border-border hover:bg-muted'
                  }`}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto">
              <WisselkassaAanvraagButton />
            </div>
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
        onSuccess={handleUnlockSuccess}
      />
    </SidebarLayout>
  );
}
