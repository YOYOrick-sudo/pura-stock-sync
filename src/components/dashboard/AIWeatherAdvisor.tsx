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
      
      setSuggestions(data.suggestions || []);
      setFeedbackStates({});
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

  const handleAcceptSuggestion = async (suggestionId: string) => {
    try {
      await supabase
        .from('ai_suggestions')
        .update({ user_feedback: 'accepted' })
        .eq('id', suggestionId);
      
      toast.success('Feedback opgeslagen');
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast.error('Fout bij opslaan feedback');
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      const note = feedbackStates[suggestionId]?.note || null;
      
      await supabase
        .from('ai_suggestions')
        .update({ 
          user_feedback: 'rejected',
          feedback_note: note
        })
        .eq('id', suggestionId);
      
      toast.success('Feedback opgeslagen');
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
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

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" style={{ color: '#1B7867' }} />
          AI Suggesties ({suggestions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className="p-4 rounded-polar-md"
              style={{ 
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(197, 197, 202, 0.3)'
              }}
            >
              <h4 className="font-semibold text-base mb-2" style={{ color: '#282E3A' }}>
                {suggestion.text}
              </h4>
              
              <p className="text-sm mb-3" style={{ color: '#73747B' }}>
                {suggestion.reasoning}
              </p>
              
              {feedbackStates[suggestion.id]?.showNote && (
                <Textarea
                  placeholder="Waarom niet relevant? (optioneel)"
                  value={feedbackStates[suggestion.id]?.note || ''}
                  onChange={(e) => setFeedbackStates(prev => ({
                    ...prev,
                    [suggestion.id]: { ...prev[suggestion.id], note: e.target.value }
                  }))}
                  className="mb-3 min-h-[60px]"
                />
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCreateTask(suggestion.id, suggestion.text, suggestion.reasoning)}
                  style={{ backgroundColor: '#1B7867', color: '#FFFFFF' }}
                  className="rounded-polar-md"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Maak Taak
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAcceptSuggestion(suggestion.id)}
                  className="rounded-polar-md"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Nuttig
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (feedbackStates[suggestion.id]?.showNote) {
                      handleRejectSuggestion(suggestion.id);
                    } else {
                      setFeedbackStates(prev => ({
                        ...prev,
                        [suggestion.id]: { showNote: true, note: '' }
                      }));
                    }
                  }}
                  className="rounded-polar-md"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {feedbackStates[suggestion.id]?.showNote ? 'Verstuur' : 'Niet relevant'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAdvice()}
            className="rounded-polar-md"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Ververs suggesties
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
