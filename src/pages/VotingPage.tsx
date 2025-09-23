import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Vote, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import GoogleVotingInterface from '@/components/voting/GoogleVotingInterface';
import { Skeleton } from '@/components/ui/skeleton';

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  positions: any[];
  is_public: boolean;
}

export default function VotingPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (electionId) {
      fetchElection();
    }
  }, [electionId]);

  const fetchElection = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

      if (error) throw error;

      setElection({
        ...data,
        positions: Array.isArray(data.positions) ? data.positions : []
      });

      // Check if election is currently active
      const now = new Date();
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);

      if (now < startDate) {
        toast({
          title: "Voting Not Started",
          description: `Voting will begin on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`,
          variant: "destructive",
        });
      } else if (now > endDate) {
        toast({
          title: "Voting Ended",
          description: `Voting ended on ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
          variant: "destructive",
        });
      } else if (data.status !== 'active') {
        toast({
          title: "Voting Unavailable",
          description: `This election is currently ${data.status}`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error fetching election:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load election details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isVotingActive = () => {
    if (!election) return false;
    
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);
    
    return election.status === 'active' && now >= startDate && now <= endDate;
  };

  const getVotingStatus = () => {
    if (!election) return null;
    
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);
    
    if (now < startDate) {
      return {
        type: 'not-started',
        message: `Voting starts ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`,
        icon: <Clock className="h-4 w-4" />
      };
    } else if (now > endDate) {
      return {
        type: 'ended',
        message: `Voting ended ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
        icon: <AlertCircle className="h-4 w-4" />
      };
    } else if (election.status !== 'active') {
      return {
        type: 'inactive',
        message: `Election is currently ${election.status}`,
        icon: <AlertCircle className="h-4 w-4" />
      };
    } else {
      return {
        type: 'active',
        message: `Voting is open until ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="max-w-md card-shadow">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Election Not Found
            </CardTitle>
            <CardDescription>
              The requested election could not be found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The election you're trying to access doesn't exist or has been removed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const votingStatus = getVotingStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <Card className="card-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
              <Vote className="h-8 w-8" />
              Uchaguzi MFA Voting
            </CardTitle>
            <CardDescription className="text-lg">
              {election.title}
            </CardDescription>
            {election.description && (
              <p className="text-muted-foreground mt-2">
                {election.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {votingStatus && (
              <Alert className={votingStatus.type === 'active' ? '' : 'border-destructive'}>
                {votingStatus.icon}
                <AlertDescription>
                  {votingStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Voting Interface */}
        {isVotingActive() ? (
          <GoogleVotingInterface election={election} />
        ) : (
          <Card className="card-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">
                Voting Currently Unavailable
              </CardTitle>
              <CardDescription>
                This election is not currently accepting votes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {votingStatus?.message || 'Voting is not available at this time.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}