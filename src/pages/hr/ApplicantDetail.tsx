import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Briefcase, FileText } from 'lucide-react';
import { useApplication } from '@/hooks/hr/useApplications';
import { StatusBadge } from '@/components/hr/StatusBadge';
import { ActionBar } from '@/components/hr/ActionBar';
import { ActivityLog } from '@/components/hr/ActivityLog';
import { OnboardingChecklist } from '@/components/hr/OnboardingChecklist';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function ApplicantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: application, isLoading } = useApplication(id);

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SidebarLayout>
    );
  }

  if (!application) {
    return (
      <SidebarLayout>
        <div className="p-6">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Sollicitatie niet gevonden</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/hr')}>
              Terug naar inbox
            </Button>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  const candidate = application.candidate;
  const candidateName = candidate 
    ? `${candidate.first_name} ${candidate.last_name}` 
    : 'Onbekend';

  return (
    <SidebarLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-2 -ml-2"
              onClick={() => navigate('/hr')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
            <h1 className="text-2xl font-heading font-bold text-foreground">{candidateName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground">{application.position}</span>
              {application.target_location && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{application.target_location}</span>
                </>
              )}
              {application.season && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{application.season}</span>
                </>
              )}
            </div>
          </div>
          <StatusBadge status={application.status} className="text-sm px-3 py-1" />
        </div>

        {/* Action Bar */}
        <ActionBar applicationId={application.id} currentStatus={application.status} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Next Action Card */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Volgende Actie</h3>
              {application.next_action_at ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{application.next_action_type || 'Actie'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(application.next_action_at), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-destructive">Geen volgende actie gepland</p>
              )}
            </Card>

            {/* Contact Info Card */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Contactgegevens</h3>
              <div className="space-y-3">
                {candidate?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${candidate.phone}`} className="text-primary hover:underline">
                      {candidate.phone}
                    </a>
                  </div>
                )}
                {application.last_contact_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Laatst contact: {format(new Date(application.last_contact_at), 'd MMMM yyyy', { locale: nl })}
                  </p>
                )}
              </div>
            </Card>

            {/* Application Info Card */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Sollicitatie Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{application.position}</span>
                </div>
                {application.target_location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{application.target_location}</span>
                  </div>
                )}
                {application.source && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Bron: {application.source}</span>
                  </div>
                )}
                {candidate?.cv_url && (
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer">
                      CV Bekijken
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Onboarding Checklist - only show when hired */}
            {application.status === 'hired' && (
              <OnboardingChecklist application={application} />
            )}

            {/* Activity Log */}
            <ActivityLog applicationId={application.id} />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
