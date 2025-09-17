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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/30 dark:to-blue-950/10">
      <div className="p-6 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-2xl -z-10"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Vote className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Voting Portal
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Exercise your democratic right to vote
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-foreground">
                    {elections.length} Active Election{elections.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Updated live</p>
              </div>
            </div>
          </div>
        </div>

        {elections.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-muted bg-gradient-to-br from-blue-50/30 to-indigo-50/20 dark:from-blue-950/10 dark:to-indigo-950/5">
            <CardContent>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                No Active Elections
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There are currently no elections available for voting. Check back later or contact your administrator.
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
                <Card key={election.id} className="card-shadow border-0 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mt-1">
                          <Vote className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-foreground">{election.title}</CardTitle>
                          <CardDescription className="mt-1 text-muted-foreground">{election.description}</CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={hasVoted ? "default" : isActive ? "secondary" : "outline"}
                        className={`${hasVoted 
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md border-0" 
                          : isActive 
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
                          : "border-muted-foreground/30"
                        } px-3 py-1`}
                      >
                        {hasVoted ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Voted
                          </>
                        ) : isActive ? (
                          <>
                            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                            Active
                          </>
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
                          className={`p-4 border rounded-xl transition-all duration-200 ${
                            userVotes[election.id] === candidate.id 
                              ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-md' 
                              : 'border-border hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                userVotes[election.id] === candidate.id
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {candidate.profiles?.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">
                                  {candidate.profiles?.full_name || 'Unknown Candidate'}
                                </h4>
                                {candidate.platform_statement && (
                                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    {candidate.platform_statement}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!hasVoted && isActive && (
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(election.id, candidate.id)}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-md"
                                >
                                  <Vote className="h-3 w-3 mr-1" />
                                  Vote
                                </Button>
                              )}
                              {userVotes[election.id] === candidate.id && (
                                <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Selected</span>
                                </div>
                              )}
                            </div>
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
    </div>
  );
}