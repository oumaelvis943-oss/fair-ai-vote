import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, Vote, TrendingUp, Activity, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Election {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
}

interface AnalyticsData {
  totalVotes: number;
  totalCandidates: number;
  totalEligibleVoters: number;
  voteTimeData: any[];
  candidateVotes: any[];
  voterTurnout: number;
}

export default function ElectionAnalytics() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchAnalytics(selectedElection);
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('id, title, status, start_date, end_date, is_public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
      
      if (data?.length > 0 && !selectedElection) {
        setSelectedElection(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const fetchAnalytics = async (electionId: string) => {
    setLoading(true);
    try {
      // Fetch vote count
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('election_id', electionId);

      if (votesError) throw votesError;

      // Fetch candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionId);

      if (candidatesError) throw candidatesError;

      // Fetch eligible voters
      const { data: eligibleVoters, error: eligibleError } = await supabase
        .from('eligible_voters')
        .select('*')
        .eq('election_id', electionId);

      if (eligibleError) throw eligibleError;

      // Process vote time data (group by hour)
      const votesByHour = votes?.reduce((acc: any, vote) => {
        const hour = new Date(vote.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const voteTimeData = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}:00`,
        votes: votesByHour?.[hour] || 0
      }));

      // Process candidate votes
      const candidateVoteCount = votes?.reduce((acc: any, vote) => {
        acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1;
        return acc;
      }, {});

      const candidateVotes = candidates?.map(candidate => ({
        name: `Candidate ${candidate.user_id.substring(0, 8)}`,
        votes: candidateVoteCount?.[candidate.id] || 0,
        candidateId: candidate.id
      })) || [];

      const totalEligibleVoters = eligibleVoters?.length || 0;
      const totalVotes = votes?.length || 0;
      const voterTurnout = totalEligibleVoters > 0 ? (totalVotes / totalEligibleVoters) * 100 : 0;

      setAnalytics({
        totalVotes,
        totalCandidates: candidates?.length || 0,
        totalEligibleVoters,
        voteTimeData,
        candidateVotes,
        voterTurnout
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const selectedElectionData = elections.find(e => e.id === selectedElection);

  return (
    <div className="space-y-6">
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Election Analytics
          </CardTitle>
          <CardDescription>
            Real-time analytics and insights for your elections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {elections.map((election) => (
              <button
                key={election.id}
                onClick={() => setSelectedElection(election.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedElection === election.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {election.title}
              </button>
            ))}
          </div>

          {selectedElectionData && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold">{selectedElectionData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedElectionData.start_date).toLocaleDateString()} - {new Date(selectedElectionData.end_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={selectedElectionData.status === 'active' ? 'default' : 'secondary'}>
                  {selectedElectionData.status}
                </Badge>
                {selectedElectionData.is_public && (
                  <Badge variant="outline">Public</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="text-2xl font-bold">{analytics.totalVotes}</p>
                  </div>
                  <Vote className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Candidates</p>
                    <p className="text-2xl font-bold">{analytics.totalCandidates}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Eligible Voters</p>
                    <p className="text-2xl font-bold">{analytics.totalEligibleVoters}</p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Turnout Rate</p>
                    <p className="text-2xl font-bold">{analytics.voterTurnout.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="timeline" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Vote Timeline</TabsTrigger>
              <TabsTrigger value="results">Vote Results</TabsTrigger>
              <TabsTrigger value="distribution">Vote Distribution</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Voting Activity by Hour
                  </CardTitle>
                  <CardDescription>
                    See when voters are most active throughout the day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.voteTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="votes" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Vote Results by Candidate</CardTitle>
                  <CardDescription>
                    Current vote count for each candidate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.candidateVotes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="votes" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Vote Distribution</CardTitle>
                  <CardDescription>
                    Percentage breakdown of votes by candidate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.candidateVotes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="votes"
                        >
                          {analytics.candidateVotes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}