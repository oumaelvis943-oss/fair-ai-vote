import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Vote, Calendar, Users, ArrowRight, CheckCircle, Plus, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Election {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
}

interface Application {
  id: string;
  election_id: string;
  status: string;
  created_at: string;
}

export default function VoterDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
    fetchApplications();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .in('status', ['active', 'upcoming'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
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

  const getApplicationStatus = (electionId: string) => {
    return applications.find(app => app.election_id === electionId);
  };

  const activeElections = elections.filter(e => e.status === 'active');
  const upcomingElections = elections.filter(e => e.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Voter Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Participate in elections and apply to become a candidate
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-elevated hover:card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-primary" />
                Active Elections
              </CardTitle>
              <CardDescription>Elections you can vote in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">
                {activeElections.length}
              </div>
              <Button 
                onClick={() => navigate('/vote')} 
                className="w-full btn-primary-gradient gap-2"
                disabled={activeElections.length === 0}
              >
                <Vote className="h-4 w-4" />
                Vote Now
              </Button>
            </CardContent>
          </Card>

          <Card className="card-elevated hover:card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Candidate Applications
              </CardTitle>
              <CardDescription>Apply to become a candidate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">
                {applications.length}
              </div>
              <Button 
                onClick={() => navigate('/apply')} 
                variant="outline" 
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Apply Now
              </Button>
            </CardContent>
          </Card>

          <Card className="card-elevated hover:card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Election Results
              </CardTitle>
              <CardDescription>View past election results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">
                View
              </div>
              <Button 
                onClick={() => navigate('/results')} 
                variant="outline" 
                className="w-full gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                View Results
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Elections */}
            {activeElections.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Active Elections</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeElections.map((election) => {
                    const application = getApplicationStatus(election.id);
                    
                    return (
                      <Card key={election.id} className="card-elevated hover:card-hover transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Vote className="h-5 w-5 text-primary" />
                            </div>
                            <Badge variant="default" className="bg-success text-success-foreground">
                              Active
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{election.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {election.description || "Election details"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Ends {new Date(election.end_date).toLocaleDateString()}
                            </span>
                          </div>

                          {application && (
                            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                You're a candidate ({application.status})
                              </span>
                            </div>
                          )}

                          <Button
                            onClick={() => navigate(`/vote/${election.id}`)}
                            className="w-full btn-primary-gradient gap-2"
                          >
                            Cast Your Vote
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Elections */}
            {upcomingElections.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Upcoming Elections</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingElections.map((election) => {
                    const application = getApplicationStatus(election.id);
                    
                    return (
                      <Card key={election.id} className="card-elevated hover:card-hover transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                              <Vote className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <Badge variant="secondary">
                              Upcoming
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{election.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {election.description || "Election details"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Starts {new Date(election.start_date).toLocaleDateString()}
                            </span>
                          </div>

                          {application ? (
                            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                Application submitted ({application.status})
                              </span>
                            </div>
                          ) : (
                            <Button
                              onClick={() => navigate('/apply')}
                              variant="outline"
                              className="w-full gap-2"
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
              </div>
            )}

            {/* No Elections */}
            {elections.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Vote className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Elections Available</h3>
                  <p className="text-muted-foreground mb-6">
                    There are currently no active or upcoming elections.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}