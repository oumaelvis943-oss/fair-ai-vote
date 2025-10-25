import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Vote, Shield, User, MapPin, Home, GraduationCap, AlertCircle } from 'lucide-react';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { useAuth } from '@/hooks/useAuth';

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  positions: any[];
}

interface Candidate {
  id: string;
  user_id: string;
  position: string;
  platform_statement: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface EligibleVoter {
  id: string;
  email: string;
  full_name: string;
  eligible_posts: string[];
  has_voted: boolean;
  residence?: string;
  house?: string;
  year_class?: string;
}

interface GoogleVotingInterfaceProps {
  election: Election;
}

export default function GoogleVotingInterface({ election }: GoogleVotingInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [eligibleVoter, setEligibleVoter] = useState<EligibleVoter | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserAndEligibility();
    } else {
      setLoading(false);
    }
  }, [user, election.id]);

  const checkUserAndEligibility = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Check if user signed in with Google
      const { data: { session } } = await supabase.auth.getSession();
      setIsGoogleUser(session?.user?.app_metadata?.provider === 'google');

      // Check voting eligibility
      const { data, error } = await supabase.functions.invoke('check-voting-eligibility', {
        body: {
          electionId: election.id,
          voterEmail: user.email,
        },
      });

      if (error) throw error;

      if (data.eligible) {
        setEligibleVoter({
          id: data.voter_id,
          email: user.email,
          full_name: data.voter_name,
          eligible_posts: data.eligible_posts || [],
          has_voted: false,
        });
        await fetchEligibleCandidates(data.eligible_posts);
      } else {
        toast({
          title: "Not Eligible",
          description: data.reason,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error checking eligibility:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check voting eligibility.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setEligibilityChecked(true);
    }
  };

  const fetchEligibleCandidates = async (eligiblePosts: string[]) => {
    try {
      console.log('Fetching candidates for election:', election.id);
      console.log('Eligible posts:', eligiblePosts);
      
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          id,
          user_id,
          position,
          platform_statement,
          status,
          form_responses
        `)
        .eq('election_id', election.id)
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching candidates:', error);
        throw error;
      }

      console.log('All approved candidates:', data);
      
      // Filter by eligible posts
      const filteredCandidates = (data || []).filter((candidate: any) => 
        eligiblePosts.includes(candidate.position)
      );
      
      console.log('Filtered candidates for eligible posts:', filteredCandidates);

      // Get profiles separately
      const candidatesWithProfiles = await Promise.all(filteredCandidates.map(async (candidate: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', candidate.user_id)
          .single();
        
        return {
          ...candidate,
          profiles: profile || { full_name: 'Unknown', email: 'Unknown' }
        };
      }));
      
      console.log('Candidates with profiles:', candidatesWithProfiles);
      setCandidates(candidatesWithProfiles);
      
      if (candidatesWithProfiles.length === 0) {
        toast({
          title: "No Candidates Available",
          description: "There are no approved candidates for your eligible positions yet.",
        });
      }
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Error",
        description: "Failed to load candidates.",
        variant: "destructive",
      });
    }
  };

  const submitVotes = async () => {
    if (Object.keys(selectedVotes).length === 0) {
      toast({
        title: "No Votes Selected",
        description: "Please select at least one candidate to vote for.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit votes via edge function to ensure proper validation
      const { data, error } = await supabase.functions.invoke('submit-votes', {
        body: {
          electionId: election.id,
          votes: selectedVotes,
          voterEmail: user?.email,
        },
      });

      if (error) throw error;

      toast({
        title: "Votes Submitted Successfully",
        description: "Your votes have been recorded securely.",
      });

      // Update local state
      setEligibleVoter(prev => prev ? { ...prev, has_voted: true } : null);
      setSelectedVotes({});

    } catch (error: any) {
      console.error('Error submitting votes:', error);
      toast({
        title: "Voting Failed",
        description: error.message || "Failed to submit votes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteSelection = (position: string, candidateId: string) => {
    setSelectedVotes(prev => ({
      ...prev,
      [position]: candidateId,
    }));
  };

  const getPositionIcon = (position: string) => {
    const positionLower = position.toLowerCase();
    if (positionLower.includes('residence') || positionLower.includes('coordinator')) {
      return <MapPin className="h-4 w-4" />;
    }
    if (positionLower.includes('house') || positionLower.includes('captain')) {
      return <Home className="h-4 w-4" />;
    }
    if (positionLower.includes('year') || positionLower.includes('class') || positionLower.includes('lead')) {
      return <GraduationCap className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <Card className="card-shadow">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Vote className="h-6 w-6" />
            Google Sign-In Required
          </CardTitle>
          <CardDescription>
            Please sign in with your Google account to vote in this election
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              We use Google Sign-In to verify your identity and ensure secure voting.
            </AlertDescription>
          </Alert>
          
          <GoogleSignIn onSignInSuccess={checkUserAndEligibility} />
        </CardContent>
      </Card>
    );
  }

  if (!isGoogleUser && eligibilityChecked) {
    return (
      <Card className="max-w-2xl mx-auto card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            Google Sign-In Required
          </CardTitle>
          <CardDescription>
            This voting interface requires Google Sign-In for identity verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must sign in with Google to access this voting interface. Please sign out and sign in again using Google.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => supabase.auth.signOut()}
            variant="outline"
            className="w-full"
          >
            Sign Out and Use Google Sign-In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!eligibleVoter) {
    return (
      <Card className="max-w-2xl mx-auto card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            Not Eligible to Vote
          </CardTitle>
          <CardDescription>
            Your email is not registered for this election
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your Google account email ({user.email}) is not in the eligible voters list for this election. 
              Please contact the administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (eligibleVoter.has_voted) {
    return (
      <Card className="max-w-2xl mx-auto card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-success">
            <Vote className="h-6 w-6" />
            Vote Already Submitted
          </CardTitle>
          <CardDescription>
            Thank you for participating in this election
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You have already voted in this election. Multiple votes are not allowed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Group candidates by position
  const candidatesByPosition = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.position]) {
      acc[candidate.position] = [];
    }
    acc[candidate.position].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  return (
    <div className="space-y-6">
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            {election.title} - Voting
          </CardTitle>
          <CardDescription>
            Welcome {eligibleVoter.full_name}! You are eligible to vote for the following positions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You can vote for multiple positions. Select one candidate per position and submit all votes together.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Your Eligible Positions:</h4>
            <div className="flex flex-wrap gap-2">
              {eligibleVoter.eligible_posts.map((post) => (
                <Badge key={post} variant="outline" className="flex items-center gap-1">
                  {getPositionIcon(post)}
                  {post}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(candidatesByPosition).map(([position, positionCandidates]) => (
        <Card key={position} className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPositionIcon(position)}
              {position}
            </CardTitle>
            <CardDescription>
              Select one candidate for this position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {positionCandidates.map((candidate) => (
              <Card 
                key={candidate.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVotes[position] === candidate.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleVoteSelection(position, candidate.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{candidate.profiles.full_name}</h4>
                        {selectedVotes[position] === candidate.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {candidate.profiles.email}
                      </p>
                      {candidate.platform_statement && (
                        <p className="text-sm">{candidate.platform_statement}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card className="card-shadow">
        <CardContent className="pt-6">
          <Button 
            onClick={submitVotes}
            disabled={Object.keys(selectedVotes).length === 0 || isSubmitting}
            className="w-full institutional-gradient"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Submitting Votes...
              </>
            ) : (
              <>
                <Vote className="mr-2 h-4 w-4" />
                Submit Votes ({Object.keys(selectedVotes).length} selected)
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            Once submitted, your votes cannot be changed. Please review your selections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}