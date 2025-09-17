import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Vote, CheckCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  max_candidates: number;
}

interface Candidate {
  id: string;
  user_id: string;
  election_id: string;
  platform_statement: string;
  status: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function VoterDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      // Fetch active elections
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      if (electionsError) throw electionsError;
      setElections(electionsData || []);

      // Fetch candidates for each election
      const candidatesPromises = electionsData?.map(async election => {
        const { data: candidatesData, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('election_id', election.id)
          .eq('status', 'approved');

        if (error || !candidatesData) return { data: [] };

        // Fetch profiles separately for each candidate
        const candidatesWithProfiles = await Promise.all(
          candidatesData.map(async candidate => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', candidate.user_id)
              .single();

            return {
              ...candidate,
              profiles: profileData || { full_name: 'Unknown', email: 'unknown@example.com' }
            };
          })
        );

        return { data: candidatesWithProfiles };
      }) || [];

      const candidatesResults = await Promise.all(candidatesPromises);
      const candidatesMap: Record<string, Candidate[]> = {};
      
      electionsData?.forEach((election, index) => {
        candidatesMap[election.id] = candidatesResults[index]?.data || [];
      });
      
      setCandidates(candidatesMap);

      // Fetch user's votes
      if (user) {
        const { data: votesData } = await supabase
          .from('votes')
          .select('election_id, candidate_id')
          .eq('voter_id', user.id);

        const votesMap: Record<string, string> = {};
        votesData?.forEach(vote => {
          votesMap[vote.election_id] = vote.candidate_id;
        });
        setUserVotes(votesMap);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        title: "Error",
        description: "Failed to load elections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (electionId: string, candidateId: string) => {
    if (!user) return;

    try {
      // Check if user already voted
      if (userVotes[electionId]) {
        toast({
          title: "Already Voted",
          description: "You have already cast your vote for this election.",
          variant: "destructive",
        });
        return;
      }

      // Cast vote
      const voteHash = `${user.id}-${electionId}-${candidateId}-${Date.now()}`;
      
      const { error } = await supabase
        .from('votes')
        .insert({
          election_id: electionId,
          candidate_id: candidateId,
          voter_id: user.id,
          vote_hash: voteHash
        });

      if (error) throw error;

      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [electionId]: candidateId
      }));

      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been securely recorded.",
      });
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: "Voting Error",
        description: "Failed to cast your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isElectionActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Elections</h1>
          <p className="text-muted-foreground">
            Participate in active elections and view results
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Vote className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {elections.length} Active Election{elections.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {elections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Active Elections
            </h3>
            <p className="text-muted-foreground">
              There are currently no elections available for voting.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {elections.map(election => {
            const electionCandidates = candidates[election.id] || [];
            const hasVoted = !!userVotes[election.id];
            const isActive = isElectionActive(election.start_date, election.end_date);

            return (
              <Card key={election.id} className="card-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{election.title}</CardTitle>
                      <CardDescription>{election.description}</CardDescription>
                    </div>
                    <Badge 
                      variant={hasVoted ? "default" : isActive ? "secondary" : "outline"}
                      className={hasVoted ? "bg-success text-success-foreground" : ""}
                    >
                      {hasVoted ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Voted
                        </>
                      ) : isActive ? (
                        "Active"
                      ) : (
                        "Ended"
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(election.end_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {electionCandidates.length} Candidate{electionCandidates.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {electionCandidates.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No candidates available
                      </p>
                    ) : (
                      electionCandidates.map(candidate => (
                        <div 
                          key={candidate.id} 
                          className={`p-3 border rounded-lg ${
                            userVotes[election.id] === candidate.id 
                              ? 'border-success bg-success-light' 
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {candidate.profiles?.full_name || 'Unknown Candidate'}
                              </h4>
                              {candidate.platform_statement && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {candidate.platform_statement}
                                </p>
                              )}
                            </div>
                            {!hasVoted && isActive && (
                              <Button
                                size="sm"
                                onClick={() => handleVote(election.id, candidate.id)}
                                className="ml-4"
                              >
                                Vote
                              </Button>
                            )}
                            {userVotes[election.id] === candidate.id && (
                              <CheckCircle className="h-5 w-5 text-success ml-4" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}