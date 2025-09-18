import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Vote, CheckCircle, Users, Shield, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SecureVotingInterface from '@/components/voting/SecureVotingInterface';
import BlockchainVerification from '@/components/voting/BlockchainVerification';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [pastElections, setPastElections] = useState<Election[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votingLoading, setVotingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('elections');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      // Fetch active elections
      const { data: activeData, error: activeError } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      if (activeError) throw activeError;
      setActiveElections(activeData || []);

      // Fetch past elections
      const { data: pastData, error: pastError } = await supabase
        .from('elections')
        .select('*')
        .in('status', ['completed', 'ended'])
        .order('end_date', { ascending: false });

      if (pastError) throw pastError;
      setPastElections(pastData || []);

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

  const openVotingInterface = async (election: Election) => {
    setVotingLoading(true);
    try {
      // Fetch candidates for the election
      const { data: candidatesData, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', election.id)
        .eq('status', 'approved');

      if (error) throw error;

      // Fetch profiles for each candidate
      const candidatesWithProfiles = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
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

      setCandidates(candidatesWithProfiles);
      setSelectedElection(election);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    } finally {
      setVotingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-8 card-shadow border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Vote className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-primary">Secure Voter Dashboard</CardTitle>
                  <CardDescription className="text-lg">
                    Participate in blockchain-secured, encrypted elections
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {selectedElection ? (
            <SecureVotingInterface 
              election={selectedElection}
              candidates={candidates}
              onVoteSubmitted={() => {
                setSelectedElection(null);
                fetchElections();
              }}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="elections" className="flex items-center gap-2">
                  <Vote className="h-4 w-4" />
                  Elections
                </TabsTrigger>
                <TabsTrigger value="verification" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification
                </TabsTrigger>
                <TabsTrigger value="blockchain" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Blockchain
                </TabsTrigger>
              </TabsList>

              <TabsContent value="elections" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="card-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Vote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{activeElections.length}</p>
                          <p className="text-sm text-muted-foreground">Active Elections</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="card-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{Object.keys(userVotes).length}</p>
                          <p className="text-sm text-muted-foreground">Secure Votes Cast</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="card-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">256-bit</p>
                          <p className="text-sm text-muted-foreground">Encryption</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Elections */}
                <Card className="card-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle>Secure Elections</CardTitle>
                    </div>
                    <CardDescription>
                      Blockchain-secured elections with encrypted voting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="ml-2">Loading secure elections...</span>
                      </div>
                    ) : activeElections.length === 0 ? (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          No active elections at this time. Check back later or contact your administrator.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-4">
                        {activeElections.map((election) => (
                          <Card key={election.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{election.title}</h3>
                                    <Badge variant="default" className="bg-primary">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Secure
                                    </Badge>
                                    {userVotes[election.id] && (
                                      <Badge variant="secondary">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Encrypted Vote Cast
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground mb-4">{election.description}</p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      Ends: {new Date(election.end_date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Shield className="w-4 h-4" />
                                      AES-256 Encrypted
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    onClick={() => openVotingInterface(election)}
                                    disabled={!!userVotes[election.id] || votingLoading}
                                    className="institutional-gradient"
                                  >
                                    {votingLoading ? 'Loading...' : userVotes[election.id] ? 'Vote Encrypted' : 'Cast Secure Vote'}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Past Elections */}
                {pastElections.length > 0 && (
                  <Card className="card-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Past Elections</CardTitle>
                      </div>
                      <CardDescription>
                        Completed blockchain elections and results
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {pastElections.map((election) => (
                          <Card key={election.id} className="border-muted">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold">{election.title}</h3>
                                    <Badge variant="outline">Completed</Badge>
                                    {userVotes[election.id] && (
                                      <Badge variant="secondary">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Verified on Blockchain
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground mb-2">{election.description}</p>
                                  <div className="text-sm text-muted-foreground">
                                    Ended: {new Date(election.end_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="verification">
                <BlockchainVerification />
              </TabsContent>

              <TabsContent value="blockchain">
                <Card className="card-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle>Blockchain Explorer</CardTitle>
                    </div>
                    <CardDescription>
                      View blockchain statistics and security information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Security Level</p>
                              <p className="font-semibold">Military Grade</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Encryption</p>
                              <p className="font-semibold">AES-256</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        All votes are secured with blockchain technology, ensuring immutability and verifiability. 
                        Your privacy is protected through advanced cryptographic techniques.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}