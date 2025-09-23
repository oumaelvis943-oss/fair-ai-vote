import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, User, Calendar } from 'lucide-react';
import AIInterviewSystem from '@/components/interviews/AIInterviewSystem';

interface Candidate {
  id: string;
  user_id: string;
  position: string;
  status: string;
  election_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function AdminInterviews() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          id,
          user_id,
          position,
          status,
          election_id
        `)
        .eq('status', 'approved');

      if (error) throw error;

      // Get profiles separately
      const candidatesWithProfiles = await Promise.all((data || []).map(async (candidate: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', candidate.user_id)
          .single();
        
        return {
          ...candidate,
          profiles: profile || { full_name: 'Unknown', email: 'Unknown' }
        };
      }));

      setCandidates(candidatesWithProfiles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedCandidate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Interview System</h1>
            <p className="text-muted-foreground">
              Record and analyze candidate interviews
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedCandidate(null)}
          >
            Back to Candidates
          </Button>
        </div>

        <AIInterviewSystem 
          candidate={selectedCandidate} 
          electionId={selectedCandidate.election_id}
          onInterviewComplete={() => {
            toast({
              title: "Interview Completed",
              description: "AI analysis has been saved successfully.",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Interview Management</h1>
        <p className="text-muted-foreground">
          Conduct AI-powered interviews with approved candidates
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="card-shadow">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="p-6 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Approved Candidates</h3>
            <p className="text-muted-foreground">Approved candidates will appear here for interviews.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="card-shadow hover:institutional-shadow transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{candidate.profiles.full_name}</CardTitle>
                      <Badge variant="outline">{candidate.position}</Badge>
                    </div>
                    <CardDescription>{candidate.profiles.email}</CardDescription>
                  </div>
                  <Button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    Start Interview
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}