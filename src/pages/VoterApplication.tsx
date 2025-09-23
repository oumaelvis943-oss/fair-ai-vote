import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Vote, Calendar, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import VoterApplicationForm from '@/components/voter/VoterApplicationForm';

interface Election {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  positions?: any;
}

interface Application {
  id: string;
  election_id: string;
  status: string;
  created_at: string;
}

export default function VoterApplication() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchElections();
    fetchApplications();
  }, [refreshTrigger]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedElections = (data || []).map(election => ({
        ...election,
        positions: Array.isArray(election.positions) ? election.positions : []
      }));
      
      setElections(processedElections);
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

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, election_id, status, created_at')
        .eq('user_id', user?.id);

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleApplicationSubmitted = () => {
    setSelectedElection(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const getApplicationStatus = (electionId: string) => {
    return applications.find(app => app.election_id === electionId);
  };

  if (selectedElection) {
    return (
      <VoterApplicationForm
        election={selectedElection}
        onApplicationSubmitted={handleApplicationSubmitted}
        onBack={() => setSelectedElection(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Candidate Applications</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Apply to become a candidate for active elections and participate in the democratic process
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : elections.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Vote className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Elections</h3>
              <p className="text-muted-foreground mb-6">
                There are currently no active elections accepting candidate applications.
              </p>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Elections Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => {
              const application = getApplicationStatus(election.id);
              const canApply = !application && election.status === 'active';
              
              return (
                <Card key={election.id} className="card-elevated hover:card-hover transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Vote className="h-5 w-5 text-primary" />
                      </div>
                      <Badge 
                        variant={application ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {application ? application.status : election.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{election.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {election.description || "Election details"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Ends {new Date(election.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {election.positions && election.positions.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {election.positions.length} position(s) available
                          </span>
                        </div>
                      )}
                    </div>

                    {application ? (
                      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          Application submitted {new Date(application.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setSelectedElection(election)}
                        disabled={!canApply}
                        className="w-full btn-primary-gradient gap-2"
                      >
                        Apply as Candidate
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
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