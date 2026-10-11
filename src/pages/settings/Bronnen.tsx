import { SidebarLayout } from '@/components/SidebarLayout';
import { BronnenBlok } from '@/components/cijfers/BronnenBlok';

export default function Bronnen() {
  return (
    <SidebarLayout>
      <div className="page-stack max-w-6xl pb-8">
        <p className="text-sm text-muted-foreground">
          Sync draait automatisch via cron. Handmatig triggeren alleen bij problemen.
        </p>
        <BronnenBlok />
      </div>
    </SidebarLayout>
  );
}
