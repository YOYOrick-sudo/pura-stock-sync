import { SidebarLayout } from '@/components/SidebarLayout';
import { BronnenBlok } from '@/components/cijfers/BronnenBlok';

export default function Bronnen() {
  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-8">
        <div>
          <h1 className="text-2xl font-semibold">Bronnen & sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sync draait automatisch via cron. Handmatig triggeren alleen bij problemen.
          </p>
        </div>
        <BronnenBlok />
      </div>
    </SidebarLayout>
  );
}
