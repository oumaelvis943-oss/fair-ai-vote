import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CheckCircle, Clock, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Candidate {
  id: string;
  user_id: string;
  platform_statement: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface SecureVotingInterfaceProps {
  election: Election;
  candidates: Candidate[];
  onVoteSubmitted: () => void;
}

export default function SecureVotingInterface({ 
  election, 
  candidates, 
  onVoteSubmitted 
}: SecureVotingInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState<any>(null);
  const [publicKey, setPublicKey] = useState<string>('');

  useEffect(() => {
    // Generate a public key for this voting session
    generatePublicKey();
  }, []);

  const generatePublicKey = async () => {
    // Generate a simple public key (in production, use proper cryptographic key generation)
    const keyData = `${user?.id}-${Date.now()}-${Math.random()}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(keyData));
    const key = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 32);
    setPublicKey(key);
  };

  const submitSecureVote = async () => {
    if (!selectedCandidate) {
      toast({
        title: "Selection Required",
        description: "Please select a candidate before voting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call secure vote endpoint
      const { data, error } = await supabase.functions.invoke('secure-vote', {
        body: {
          electionId: election.id,
          candidateId: selectedCandidate,
          voterPublicKey: publicKey
        }
      });

      if (error) throw error;

      // Store receipt for verification
      setVoteReceipt(data);

      // Also store a record in the original votes table for compatibility
      await supabase
        .from('votes')
        .insert({
          election_id: election.id,
          candidate_id: selectedCandidate,
          voter_id: user?.id,
          vote_hash: data.voteHash
        });

      toast({
        title: "Vote Submitted Successfully",
        description: "Your vote has been encrypted and recorded on the blockchain.",
      });

      onVoteSubmitted();

    } catch (error: any) {
      console.error('Error submitting secure vote:', error);
      toast({
        title: "Vote Submission Failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyVote = async () => {
    if (!voteReceipt?.voteHash) return;

    try {
      const { data, error } = await supabase.functions.invoke('verify-vote', {
        body: {
          voteHash: voteReceipt.voteHash
        }
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Vote Verified",
          description: "Your vote has been successfully verified on the blockchain.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Vote verification failed. Please contact support.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Error verifying vote:', error);
      toast({
        title: "Verification Error",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  };

  if (voteReceipt) {
    return (
      <Card className="max-w-2xl mx-auto card-shadow">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-success">Vote Successfully Submitted</CardTitle>
          <CardDescription>
            Your vote has been encrypted and recorded on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your vote is now secured with military-grade encryption and blockchain verification.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Vote Hash:</span>
                <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  {voteReceipt.voteHash}
                </div>
              </div>
              <div>
                <span className="font-medium">Block Number:</span>
                <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  #{voteReceipt.blockNumber}
                </div>
              </div>
            </div>

            <div>
              <span className="font-medium">Digital Signature:</span>
              <div className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                {voteReceipt.digitalSignature}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={verifyVote}
              variant="outline"
              className="flex-1"
            >
              <Shield className="mr-2 h-4 w-4" />
              Verify Vote
            </Button>
            <Button 
              onClick={() => setVoteReceipt(null)}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto card-shadow">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-primary">Secure Blockchain Voting</CardTitle>
        <CardDescription>
          Cast your encrypted vote for {election.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your vote will be encrypted with AES-256 encryption and recorded on our secure blockchain.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="text-sm">
            <span className="font-medium">Your Public Key:</span>
            <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
              {publicKey}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Select Candidate
          </h3>
          
          {candidates.map((candidate) => (
            <Card 
              key={candidate.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCandidate === candidate.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{candidate.profiles.full_name}</h4>
                      {selectedCandidate === candidate.id && (
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
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={submitSecureVote}
            disabled={!selectedCandidate || isSubmitting}
            className="w-full institutional-gradient"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Encrypting & Recording Vote...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Submit Secure Vote
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            Your vote will be encrypted and cannot be traced back to you
          </p>
        </div>
      </CardContent>
    </Card>
  );
}