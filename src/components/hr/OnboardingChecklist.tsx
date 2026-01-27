import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Home, FileText, ScrollText, PenLine, Calendar } from 'lucide-react';
import { Application } from '@/types/hr';
import { useUpdateApplication } from '@/hooks/hr/useApplications';
import { format } from 'date-fns';

interface OnboardingChecklistProps {
  application: Application;
}

export function OnboardingChecklist({ application }: OnboardingChecklistProps) {
  const updateApplication = useUpdateApplication();
  const [startDate, setStartDate] = useState(application.start_date || '');

  const handleToggle = (field: keyof Application, value: boolean) => {
    updateApplication.mutate({
      id: application.id,
      data: { [field]: value },
    });
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    updateApplication.mutate({
      id: application.id,
      data: { start_date: date || null },
    });
  };

  const items = [
    {
      id: 'housing_required',
      label: 'Huisvesting nodig',
      checked: application.housing_required,
      icon: Home,
    },
    {
      id: 'housing_arranged',
      label: 'Woonruimte toegewezen',
      checked: application.housing_arranged,
      icon: Home,
      disabled: !application.housing_required,
    },
    {
      id: 'onboarding_docs_sent',
      label: 'Onboarding documenten verstuurd',
      checked: application.onboarding_docs_sent,
      icon: FileText,
    },
    {
      id: 'house_rules_sent',
      label: 'Huisregels verstuurd',
      checked: application.house_rules_sent,
      icon: ScrollText,
      disabled: !application.housing_required,
    },
    {
      id: 'contract_signed',
      label: 'Contract getekend',
      checked: application.contract_signed,
      icon: PenLine,
    },
  ];

  const completedCount = items.filter(item => !item.disabled && item.checked).length;
  const totalCount = items.filter(item => !item.disabled).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Onboarding Checklist</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{totalCount} voltooid
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id} 
              className={`flex items-center gap-3 ${item.disabled ? 'opacity-50' : ''}`}
            >
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={(checked) => handleToggle(item.id as keyof Application, !!checked)}
                disabled={item.disabled || updateApplication.isPending}
              />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <Label 
                htmlFor={item.id} 
                className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
              >
                {item.label}
              </Label>
            </div>
          );
        })}

        <div className="pt-3 border-t border-border">
          <Label className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Startdatum
          </Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full"
          />
          {startDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Start op {format(new Date(startDate), 'd MMMM yyyy')}
            </p>
          )}
        </div>

        {application.housing_required && !application.housing_arranged && (
          <Button variant="outline" size="sm" className="w-full mt-2">
            Woonruimte Toewijzen
          </Button>
        )}
      </div>
    </Card>
  );
}
