import { useCallback, useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';
import { KasControleContent } from './KasControle';
import { AdminPasswordDialog } from '@/components/foh/AdminPasswordDialog';
import { WisselkassaAanvraagButton } from '@/components/kassa/WisselkassaAanvraagButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { segmentTabsKlasse } from '@/components/pura';

type Tab = 'overdag' | 'avond' | 'controle';

export default function Kassatelling() {
  const isMobile = useIsMobile();
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
      <div className={isMobile ? 'page-container min-w-0 max-w-full' : 'page-container'}>
        <div>
          <div className={isMobile ? 'mb-4 flex min-w-0 flex-col gap-2 [&_button]:min-h-11' : 'mb-4 flex flex-wrap items-center gap-2 md:mb-6 md:gap-3'}>
            {isMobile ? (
              <div className="min-w-0 max-w-full overflow-x-auto">
                <div className={`${segmentTabsKlasse} !w-max min-w-full flex-nowrap rounded-polar-lg bg-muted`}>
                  {tabs.map(t => (
                    <Button key={t.key} variant="ghost" size="touch" onClick={() => handleTabClick(t.key)} className={`shrink-0 whitespace-nowrap ${activeTab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : tabs.map(t => (
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

          <div className={isMobile ? 'min-w-0 max-w-full [&_div]:min-w-0 [&_input]:!min-h-11 [&_input]:!min-w-0 [&_input]:!max-w-full [&_input]:!text-base [&_textarea]:!text-base [&_button]:min-h-11 [&_div:has(>input)]:!flex-col [&_div:has(>input)]:!items-stretch [&_div:has(>input)]:!gap-2 [&_div:has(>input)>input]:!w-full [&_div:has(>table)]:!overflow-x-auto [&_div:has(>table)]:!p-2 [&_table]:tabular-nums [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-10 [&_th:first-child]:bg-card [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-card [&_td]:!px-2 [&_th]:!px-2' : undefined}>
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
