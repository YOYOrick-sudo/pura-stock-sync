import { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { toast } from 'sonner';

export function IdeaBox() {
  const [idea, setIdea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { userLocation } = useUserLocation();

  const handleSubmit = async () => {
    if (!idea.trim() || !userLocation) return;

    setSubmitting(true);
    try {
      const submissionId = crypto.randomUUID();
      const { error } = await supabase
        .from('idea_box_submissions')
        .insert({
          id: submissionId,
          idea_text: idea.trim(),
          location: userLocation,
        });

      if (error) throw error;

      // Send email to MT team
      const recipients = [
        'josefien@puravidafoodbar.nl',
        'jorian@puravidafoodbar.nl',
        'yorick@puravidafoodbar.nl',
      ];

      await Promise.all(
        recipients.map((email) =>
          supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'idea-box-notification',
              recipientEmail: email,
              idempotencyKey: `idea-${submissionId}-${email}`,
              templateData: {
                ideaText: idea.trim(),
                location: userLocation,
              },
            },
          })
        )
      );

      toast.success('Bedankt! Je idee is anoniem verstuurd naar het MT.');
      setIdea('');
    } catch (error) {
      console.error('Error submitting idea:', error);
      toast.error('Er ging iets mis bij het versturen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-card border border-border/60 rounded-md shadow hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-secondary">
            <Lightbulb size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Ideeënbus</h3>
          <span className="text-xs text-muted-foreground">— anoniem</span>
        </div>
        
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Deel je idee, suggestie of feedback..."
          maxLength={500}
          className="min-h-[80px] text-sm resize-none mb-2"
          disabled={submitting}
        />
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {idea.length}/500
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!idea.trim() || submitting}
          >
            <Send size={14} />
            {submitting ? 'Versturen...' : 'Verstuur'}
          </Button>
        </div>
    </div>
  );
}
