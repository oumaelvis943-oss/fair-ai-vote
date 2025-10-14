import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, Vote, Settings, Play, Pause, Eye, Trash2, Edit, Bell, PlayCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDistanceToNow, format } from 'date-fns';

interface Election {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  voting_algorithm: 'fptp' | 'borda_count' | 'ranked_choice';
  max_candidates: number;
  require_approval: boolean;
  is_public: boolean;
  positions: string[];
  created_at: string;
  candidate_count?: number;
  vote_count?: number;
}

interface ElectionsListProps {
  refreshTrigger?: number;
  onEditElection?: (election: Election) => void;
}

export default function ElectionsList({ refreshTrigger, onEditElection }: ElectionsListProps) {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select(`
          *,
          candidates(count),
          votes(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const electionsWithCounts = data.map((election: any) => ({
        id: election.id,
        title: election.title,
        description: election.description,
        start_date: election.start_date,
        end_date: election.end_date,
        status: election.status as 'draft' | 'active' | 'completed' | 'paused',
        voting_algorithm: (election.voting_algorithm || 'fptp') as 'fptp' | 'borda_count' | 'ranked_choice',
        max_candidates: election.max_candidates || 10,
        require_approval: election.require_approval ?? true,
        is_public: election.is_public ?? false,
        positions: election.positions || [],
        created_at: election.created_at,
        candidate_count: election.candidates?.[0]?.count || 0,
        vote_count: election.votes?.[0]?.count || 0
      }));

      setElections(electionsWithCounts);
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

  useEffect(() => {
    fetchElections();
  }, [refreshTrigger]);

  const updateElectionStatus = async (electionId: string, newStatus: 'draft' | 'active' | 'completed' | 'paused') => {
    try {
      const { error } = await supabase
        .from('elections')
        .update({ status: newStatus })
        .eq('id', electionId);

      if (error) throw error;

      const statusMessages = {
        draft: 'reverted to draft',
        active: 'activated',
        completed: 'completed',
        paused: 'paused'
      };

      toast({
        title: "Election Updated",
        description: `Election ${statusMessages[newStatus]} successfully.`,
      });

      fetchElections();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteElection = async (electionId: string) => {
    try {
      const { error } = await supabase
        .from('elections')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', electionId);

      if (error) throw error;

      toast({
        title: "Election Deleted",
        description: "Election has been successfully deleted.",
      });

      fetchElections();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const notifyVoters = async (electionId: string, electionTitle: string) => {
    try {
      // Get all voters (users with voter role or eligible voters for this election)
      const { data: voters, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'voter');

      if (error) throw error;

      // Create notifications for all voters
      const notifications = voters.map(voter => ({
        user_id: voter.user_id,
        election_id: electionId,
        type: 'election_created',
        title: 'New Election Available',
        message: `A new election "${electionTitle}" is now open for candidate applications. Apply now to participate!`
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) throw notifError;

      toast({
        title: "Voters Notified",
        description: `${voters.length} voters have been notified about the election.`,
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
      case 'draft': return 'secondary';
      case 'active': return 'default';
      case 'completed': return 'outline';
      case 'paused': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAlgorithmLabel = (algorithm: string) => {
    switch (algorithm) {
      case 'fptp': return 'FPTP';
      case 'borda_count': return 'Borda Count';
      case 'ranked_choice': return 'Ranked Choice';
      default: return algorithm;
    }
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'fptp': return Vote;
      case 'borda_count': return Users;
      case 'ranked_choice': return Settings;
      default: return Vote;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-shadow">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <Card className="card-shadow">
        <CardContent className="p-6 text-center">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">No Elections Yet</h3>
          <p className="text-muted-foreground">Create your first election to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Election Management</h3>
      {elections.map((election) => {
        const AlgorithmIcon = getAlgorithmIcon(election.voting_algorithm);
        const now = new Date();
        const startDate = new Date(election.start_date);
        const endDate = new Date(election.end_date);
        
        return (
          <Card key={election.id} className="card-shadow hover:institutional-shadow transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{election.title}</CardTitle>
                    <Badge variant={getStatusColor(election.status)} className="capitalize">
                      {election.status}
                    </Badge>
                  </div>
                  {election.description && (
                    <CardDescription>{election.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  {election.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => updateElectionStatus(election.id, 'active')}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Activate
                    </Button>
                  )}
                  {election.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateElectionStatus(election.id, 'paused')}
                        className="flex items-center gap-1"
                      >
                        <Pause className="h-3 w-3" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateElectionStatus(election.id, 'completed')}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        Complete
                      </Button>
                    </>
                  )}
                  {election.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateElectionStatus(election.id, 'active')}
                      className="flex items-center gap-1"
                    >
                      <PlayCircle className="h-3 w-3" />
                      Reactivate
                    </Button>
                  )}
                  {election.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateElectionStatus(election.id, 'active')}
                      className="flex items-center gap-1"
                    >
                      <PlayCircle className="h-3 w-3" />
                      Reactivate
                    </Button>
                  )}
                  {election.status === 'draft' && onEditElection && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditElection(election)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  {election.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => notifyVoters(election.id, election.title)}
                      className="flex items-center gap-1"
                    >
                      <Bell className="h-3 w-3" />
                      Notify Voters
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Election</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{election.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteElection(election.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <AlgorithmIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{getAlgorithmLabel(election.voting_algorithm)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Starts {format(startDate, 'MMM d, yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Ends {format(endDate, 'MMM d, yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{election.candidate_count} candidates</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
                <span>Created {formatDistanceToNow(new Date(election.created_at))} ago</span>
                <span>{election.vote_count} votes cast</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}