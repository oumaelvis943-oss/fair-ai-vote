import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Star, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

interface Candidate {
  id: string;
  user_id: string;
  election_id: string;
  status: string;
  platform_statement: string | null;
  position: string | null;
  form_responses: any;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
  vote_count?: number;
}

interface Election {
  id: string;
  title: string;
  status: string;
}

export default function CandidateEvaluationDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluationNotes, setEvaluationNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchCandidates();
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('id, title, status')
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

  const fetchCandidates = async () => {
    if (!selectedElection) return;
    
    setLoading(true);
    try {
      // Fetch candidates with profile information
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select(`
          *
        `)
        .eq('election_id', selectedElection)
        .order('created_at', { ascending: false });
      
      if (candidatesError) throw candidatesError;

      // Fetch profile information separately for each candidate
      const candidatesWithProfiles = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', candidate.user_id)
            .single();

          return { ...candidate, profile };
        })
      );

      // Fetch vote counts for each candidate
      const candidatesWithVotes = await Promise.all(
        candidatesWithProfiles.map(async (candidate) => {
          const { count, error } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id);

          if (error) {
            console.error('Error fetching vote count:', error);
            return { ...candidate, vote_count: 0 };
          }

          return { ...candidate, vote_count: count || 0 };
        })
      );

      setCandidates(candidatesWithVotes);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (candidateId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidateId);

      if (error) throw error;

      // Update local state
      setCandidates(prev =>
        prev.map(candidate =>
          candidate.id === candidateId
            ? { ...candidate, status: newStatus }
            : candidate
        )
      );

      toast({
        title: "Status Updated",
        description: `Candidate status changed to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const selectedElectionData = elections.find(e => e.id === selectedElection);

  return (
    <div className="space-y-6">
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Candidate Evaluation Dashboard
          </CardTitle>
          <CardDescription>
            Review and manage candidate applications for your elections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={selectedElection}
                onValueChange={setSelectedElection}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select Election" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedElectionData && (
                <Badge variant={selectedElectionData.status === 'active' ? 'default' : 'secondary'}>
                  {selectedElectionData.status}
                </Badge>
              )}
            </div>

            {selectedElectionData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{candidates.length}</p>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {candidates.filter(c => c.status === 'approved').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {candidates.filter(c => c.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No candidates found for this election</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(candidate.status)}`} />
                    <div>
                      <CardTitle className="text-lg">
                        {candidate.profile?.full_name || 'Unknown Candidate'}
                      </CardTitle>
                      <CardDescription>
                        {candidate.profile?.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {candidate.vote_count} votes
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getStatusIcon(candidate.status)}
                      {candidate.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.position && (
                  <div>
                    <p className="text-sm font-medium mb-1">Position</p>
                    <Badge variant="secondary">{candidate.position}</Badge>
                  </div>
                )}

                {candidate.platform_statement && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Platform Statement
                    </h4>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      {candidate.platform_statement}
                    </div>
                  </div>
                )}

                {candidate.form_responses && Object.keys(candidate.form_responses).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Application Responses
                    </h4>
                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                      {Object.entries(candidate.form_responses).map(([key, value]) => (
                        <div key={key} className="border-b border-border/50 pb-2 last:border-0">
                          <p className="text-sm font-medium capitalize mb-1">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Application Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(candidate.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Evaluation Notes</p>
                  <Textarea
                    placeholder="Add evaluation notes for this candidate..."
                    value={evaluationNotes[candidate.id] || ''}
                    onChange={(e) => setEvaluationNotes(prev => ({
                      ...prev,
                      [candidate.id]: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateCandidateStatus(candidate.id, 'approved')}
                    disabled={candidate.status === 'approved'}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateCandidateStatus(candidate.id, 'rejected')}
                    disabled={candidate.status === 'rejected'}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateCandidateStatus(candidate.id, 'pending')}
                    disabled={candidate.status === 'pending'}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Pending
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}