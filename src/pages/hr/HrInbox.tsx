import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Users, Home, FileText } from 'lucide-react';
import { useInboxCounts, useInboxApplications } from '@/hooks/hr/useInboxCounts';
import { useAccommodationOccupancy } from '@/hooks/hr/useAccommodations';
import { InboxTab } from '@/types/hr';
import { InboxCard } from '@/components/hr/InboxCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function HrInbox() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InboxTab>('new');
  
  const { data: counts, isLoading: countsLoading } = useInboxCounts();
  const { data: applications, isLoading: applicationsLoading } = useInboxApplications(activeTab);
  const { data: occupancy } = useAccommodationOccupancy();

  const totalAvailable = occupancy?.reduce((sum, a) => sum + a.available_spots, 0) ?? 0;

  return (
    <SidebarLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">HR Inbox</h1>
            <p className="text-muted-foreground">Beheer sollicitaties en opvolging</p>
          </div>
          <Button onClick={() => navigate('/hr/applicants/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Kandidaat
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/hr/applicants')}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Openstaand</p>
              <p className="text-xl font-semibold">
                {countsLoading ? <Skeleton className="h-6 w-8" /> : (counts?.new ?? 0) + (counts?.today ?? 0) + (counts?.overdue ?? 0)}
              </p>
            </div>
          </Card>
          
          <Card className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/hr/housing')}>
            <div className="p-2 rounded-lg bg-secondary/10">
              <Home className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vrije Slaapplaatsen</p>
              <p className="text-xl font-semibold">{totalAvailable}</p>
            </div>
          </Card>
          
          <Card className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/hr/templates')}>
            <div className="p-2 rounded-lg bg-accent/10">
              <FileText className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Templates</p>
              <p className="text-xl font-semibold">Beheer</p>
            </div>
          </Card>
        </div>

        {/* Inbox Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InboxTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new" className="relative">
              Nieuw
              {counts && counts.new > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {counts.new}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="today" className="relative">
              Vandaag
              {counts && counts.today > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {counts.today}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="relative">
              Achterstallig
              {counts && counts.overdue > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                  {counts.overdue}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {applicationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((application) => (
                  <InboxCard 
                    key={application.id} 
                    application={application}
                    onClick={() => navigate(`/hr/applicants/${application.id}`)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {activeTab === 'new' && 'Geen nieuwe sollicitaties zonder eigenaar'}
                  {activeTab === 'today' && 'Geen acties gepland voor vandaag'}
                  {activeTab === 'overdue' && 'Geen achterstallige acties'}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
