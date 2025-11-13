import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, TrendingUp, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface VoteResult {
  id: string;
  election_id: string;
  candidate_id: string;
  position: string;
  vote_count: number;
  percentage: number;
  rank: number;
  candidates: {
    id: string;
    position: string;
    platform_statement: string;
    user_id: string;
  };
}

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function ResultsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (electionId) {
      fetchElectionAndResults();
    }
  }, [electionId]);

  const fetchElectionAndResults = async () => {
    try {
      setLoading(true);

      // Fetch election details
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

      if (electionError) throw electionError;
      setElection(electionData);

      // Fetch results
      await fetchResults();

    } catch (error: any) {
      console.error('Error fetching election:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load election data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const { data: resultsData, error: resultsError } = await supabase
        .from('vote_results')
        .select(`
          *,
          candidates (
            id,
            position,
            platform_statement,
            user_id
          )
        `)
        .eq('election_id', electionId)
        .order('position')
        .order('rank');

      if (resultsError) throw resultsError;

      setResults(resultsData || []);

      // Fetch candidate profiles
      if (resultsData && resultsData.length > 0) {
        const userIds = [...new Set(resultsData.map(r => r.candidates.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, any>);
          setCandidateProfiles(profilesMap);
        }
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load results.",
        variant: "destructive",
      });
    }
  };

  const calculateResults = async () => {
    if (!electionId || role !== 'admin') return;

    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-results', {
        body: { electionId }
      });

      if (error) throw error;

      toast({
        title: "Results Calculated",
        description: "Vote results have been calculated successfully.",
      });

      // Refresh results
      await fetchResults();

    } catch (error: any) {
      console.error('Error calculating results:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to calculate results.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Election not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Group results by position
  const resultsByPosition = results.reduce((acc, result) => {
    if (!acc[result.position]) {
      acc[result.position] = [];
    }
    acc[result.position].push(result);
    return acc;
  }, {} as Record<string, VoteResult[]>);

  const canCalculate = role === 'admin' && election.status !== 'draft';

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {election.title} - Results
          </h1>
          <p className="text-muted-foreground">
            {election.description}
          </p>
        </div>
        {canCalculate && (
          <Button
            onClick={calculateResults}
            disabled={calculating}
            variant="outline"
            className="flex items-center gap-2"
          >
            {calculating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Calculating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Calculate Results
              </>
            )}
          </Button>
        )}
      </div>

      {election.status !== 'completed' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This election is {election.status}. Results shown are preliminary and may change.
          </AlertDescription>
        </Alert>
      )}

      {results.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No results available yet. {canCalculate && 'Click "Calculate Results" to generate them.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(resultsByPosition).map(([position, positionResults]) => (
            <Card key={position} className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {position}
                </CardTitle>
                <CardDescription>
                  Total votes cast: {positionResults.reduce((sum, r) => sum + r.vote_count, 0)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {positionResults.map((result) => {
                  const profile = candidateProfiles[result.candidates.user_id];
                  return (
                    <Card 
                      key={result.id}
                      className={`${result.rank === 1 ? 'border-primary shadow-md' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">
                                {profile?.full_name || 'Unknown Candidate'}
                              </h4>
                              {result.rank === 1 && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <Trophy className="h-3 w-3" />
                                  Winner
                                </Badge>
                              )}
                              {result.rank && result.rank <= 3 && result.rank > 1 && (
                                <Badge variant="secondary">
                                  Rank #{result.rank}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {profile?.email || ''}
                            </p>
                            {result.candidates.platform_statement && (
                              <p className="text-sm mb-3">
                                {result.candidates.platform_statement}
                              </p>
                            )}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{result.vote_count} votes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{result.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${result.rank === 1 ? 'bg-primary' : 'bg-secondary'}`}
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
