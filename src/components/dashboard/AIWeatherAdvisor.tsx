import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, RefreshCw, Lightbulb, Utensils, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';

interface Suggestion {
  id: string;
  text: string;
  reasoning: string;
}

interface AIWeatherAdvisorProps {
  onRefresh: () => void;
}

export function AIWeatherAdvisor({ onRefresh }: AIWeatherAdvisorProps) {
  const { userLocation } = useUserLocation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { 
    showNote: boolean; 
    note: string;
  }>>({});
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    fetchAdvice();
  }, [userLocation]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('weather-ai-advisor', {
        body: { location: userLocation }
      });
      
      if (error) throw error;
      
      setAdvice(data.advice);
      setShowRejectNote(false);
      setRejectNote('');
    } catch (error) {
      console.error('Error fetching advice:', error);
      toast.error('Kon advies niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (suggestionId: string, title: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Je moet ingelogd zijn');
        return;
      }

      const { error: taskError } = await supabase
        .from('foh_tasks')
        .insert({
          location: userLocation,
          title: title,
          due_date: new Date().toISOString().split('T')[0],
          priority: 2,
          category: 'Weer & AI',
          phase: null,
        });

      if (taskError) throw taskError;

      toast.success('Taak aangemaakt');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Fout bij aanmaken taak');
    }
  };

  const handleAcceptAdvice = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAdvice } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('location', userLocation)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('suggestion_type', 'daily_advice')
        .is('user_feedback', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (todayAdvice && todayAdvice.length > 0) {
        await supabase
          .from('ai_suggestions')
          .update({ user_feedback: 'accepted' })
          .eq('id', todayAdvice[0].id);
      }

      toast.success('Advies geaccepteerd');
      setTimeout(() => fetchAdvice(), 500);
    } catch (error) {
      console.error('Error accepting advice:', error);
      toast.error('Fout bij opslaan feedback');
    }
  };

  const handleRejectAdvice = async () => {
    if (!showRejectNote) {
      setShowRejectNote(true);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAdvice } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('location', userLocation)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('suggestion_type', 'daily_advice')
        .is('user_feedback', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (todayAdvice && todayAdvice.length > 0) {
        await supabase
          .from('ai_suggestions')
          .update({ 
            user_feedback: 'rejected',
            feedback_note: rejectNote || null
          })
          .eq('id', todayAdvice[0].id);
      }

      toast.success('Feedback opgeslagen');
      setTimeout(() => fetchAdvice(), 500);
    } catch (error) {
      console.error('Error rejecting advice:', error);
      toast.error('Fout bij opslaan feedback');
    }
  };

  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" style={{ color: '#1B7867' }} />
            AI Dagadvies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm" style={{ color: '#73747B' }}>Advies wordt gegenereerd...</p>
        </CardContent>
      </Card>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" style={{ color: '#1B7867' }} />
          AI Dagadvies
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Productideeën Sectie */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#282E3A' }}>
              <Utensils className="h-5 w-5" style={{ color: '#1B7867' }} />
              Productideeën ({advice.product_ideas.length})
            </h3>
            <div className="space-y-3">
              {advice.product_ideas.map((idea, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-polar-md"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(197, 197, 202, 0.3)'
                  }}
                >
                  <h4 className="font-semibold text-base mb-2" style={{ color: '#282E3A' }}>
                    {idea.title}
                  </h4>
                  <p className="text-sm whitespace-pre-line" style={{ color: '#282E3A' }}>
                    {idea.description}
                  </p>
                  
                  {/* Actie knoppen per product */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleCreateTask(idea.title, idea.description)}
                      style={{ backgroundColor: '#1B7867', color: '#FFFFFF' }}
                      className="rounded-polar-md"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Maak Taak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kwaliteitschecks Sectie */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#282E3A' }}>
              <ClipboardCheck className="h-5 w-5" style={{ color: '#1B7867' }} />
              Kwaliteitschecks ({advice.quality_checks.length})
            </h3>
            <div className="space-y-2">
              {advice.quality_checks.map((check, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-polar-md flex items-start gap-3"
                  style={{ 
                    backgroundColor: '#F6F7DD',
                    border: '1px solid rgba(197, 197, 202, 0.3)'
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ backgroundColor: '#1B7867', color: '#FFFFFF' }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1" style={{ color: '#282E3A' }}>
                      {check.title}
                    </h4>
                    <p className="text-sm" style={{ color: '#282E3A' }}>
                      {check.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback knoppen onderaan */}
          <div className="pt-4 border-t space-y-3" style={{ borderColor: 'rgba(197, 197, 202, 0.3)' }}>
            {showRejectNote && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Waarom is dit niet relevant? (optioneel)"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAcceptAdvice}
                className="rounded-polar-md"
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Nuttig advies
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectAdvice}
                className="rounded-polar-md"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {showRejectNote ? 'Verstuur feedback' : 'Niet relevant'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchAdvice()}
                className="rounded-polar-md"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Nieuw advies
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
