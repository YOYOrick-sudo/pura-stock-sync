import { SidebarLayout } from '@/components/SidebarLayout';
import { BronnenBlok } from '@/components/cijfers/BronnenBlok';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Bronnen() {
  const isMobile = useIsMobile();
  return (
    <SidebarLayout>
      <div className={isMobile ? 'page-stack pb-8 min-w-0 max-w-full break-words [overflow-wrap:anywhere] [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:shrink-0 [&_button]:whitespace-normal [&_input]:min-h-11 [&_input]:text-base [&_.p-5]:p-3 [&_.justify-between]:flex-wrap [&_.justify-between]:gap-2 [&_.flex.gap-2]:flex-wrap [&_.space-y-1]:overflow-x-auto [&_.space-y-1>div.flex]:min-w-[40rem] [&_.space-y-1>div.flex>div:first-child]:sticky [&_.space-y-1>div.flex>div:first-child]:left-0 [&_.space-y-1>div.flex>div:first-child]:z-10 [&_.space-y-1>div.flex>div:first-child]:bg-card' : 'page-stack max-w-6xl pb-8'}>
        <p className="text-sm text-muted-foreground">
          Sync draait automatisch via cron. Handmatig triggeren alleen bij problemen.
        </p>
        <BronnenBlok />
      </div>
    </SidebarLayout>
  );
}
