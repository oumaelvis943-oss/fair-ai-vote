import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ElectionResults {
  id: string;
  title: string;
  description: string;
  status: string;
  voting_algorithm: string;
  candidates: Array<{
    id: string;
    position: string;
    user_id: string;
    vote_count: number;
    percentage: number;
    profiles: {
      full_name: string;
    };
  }>;
}

export default function ResultsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (electionId) {
      fetchResults();
    }
  }, [electionId]);

  const fetchResults = async () => {
    try {
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

      if (electionError) throw electionError;

      // Fetch candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, position, user_id')
        .eq('election_id', electionId)
        .eq('status', 'approved');

      if (candidatesError) throw candidatesError;

      // Fetch profiles separately
      const candidatesWithProfiles = await Promise.all(
        (candidates || []).map(async (candidate) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', candidate.user_id)
            .single();
          
          return {
            ...candidate,
            vote_count: 0,
            percentage: 0,
            profiles: { full_name: profile?.full_name || 'Unknown' }
          };
        })
      );

      setResults({
        ...election,
        candidates: candidatesWithProfiles
      });

    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load election results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Results Not Found
            </CardTitle>
            <CardDescription>
              The requested election results could not be found
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        <Card className="card-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8" />
              Election Results
            </CardTitle>
            <CardDescription className="text-lg">
              {results.title}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vote Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.candidates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No approved candidates for this election</p>
              </div>
            ) : (
              results.candidates.map((candidate, index) => (
                <div key={candidate.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{candidate.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{candidate.position || 'No Position'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{candidate.vote_count} votes</p>
                      <p className="text-sm text-muted-foreground">{candidate.percentage}%</p>
                    </div>
                  </div>
                  <Progress value={candidate.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
