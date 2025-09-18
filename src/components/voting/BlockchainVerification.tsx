import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, CheckCircle, XCircle, Hash, Clock, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationResult {
  verified: boolean;
  voteHash: string;
  blockNumber: number;
  timestamp: string;
  verificationDetails: {
    voteExists: boolean;
    blockIntegrity: boolean;
    signatureValid: boolean;
    merkleVerification: boolean;
    chainIntegrity: boolean;
  };
}

export default function BlockchainVerification() {
  const { toast } = useToast();
  const [voteHash, setVoteHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verifyVote = async () => {
    if (!voteHash.trim()) {
      toast({
        title: "Hash Required",
        description: "Please enter a vote hash to verify.",
        variant: "destructive"
      });
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-vote', {
        body: {
          voteHash: voteHash.trim()
        }
      });

      if (error) throw error;

      setResult(data);

      if (data.verified) {
        toast({
          title: "Vote Verified",
          description: "Vote has been successfully verified on the blockchain.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Vote could not be verified. Please check the hash and try again.",
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
    } finally {
      setVerifying(false);
    }
  };

  const getVerificationIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  const getVerificationBadge = (verified: boolean) => {
    return verified ? (
      <Badge variant="default" className="bg-success text-success-foreground">
        Verified
      </Badge>
    ) : (
      <Badge variant="destructive">
        Failed
      </Badge>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="card-shadow">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-primary">Blockchain Vote Verification</CardTitle>
          <CardDescription>
            Verify any vote using its cryptographic hash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Hash className="h-4 w-4" />
            <AlertDescription>
              Enter a vote hash to verify its authenticity and integrity on our blockchain.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="voteHash">Vote Hash</Label>
            <Input
              id="voteHash"
              placeholder="Enter the 64-character vote hash..."
              value={voteHash}
              onChange={(e) => setVoteHash(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={verifyVote}
            disabled={!voteHash.trim() || verifying}
            className="w-full institutional-gradient"
          >
            {verifying ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Verifying on Blockchain...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Verify Vote
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getVerificationIcon(result.verified)}
                Verification Results
              </CardTitle>
              {getVerificationBadge(result.verified)}
            </div>
            <CardDescription>
              Blockchain verification completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Vote Hash:</span>
                <div className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                  {result.voteHash}
                </div>
              </div>
              <div>
                <span className="font-medium">Block Number:</span>
                <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  #{result.blockNumber}
                </div>
              </div>
            </div>

            <div>
              <span className="font-medium">Timestamp:</span>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Verification Details</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">Vote Exists in Database</span>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(result.verificationDetails.voteExists)}
                    <span className="text-xs">{result.verificationDetails.voteExists ? 'Pass' : 'Fail'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">Block Integrity</span>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(result.verificationDetails.blockIntegrity)}
                    <span className="text-xs">{result.verificationDetails.blockIntegrity ? 'Pass' : 'Fail'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">Digital Signature</span>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(result.verificationDetails.signatureValid)}
                    <span className="text-xs">{result.verificationDetails.signatureValid ? 'Pass' : 'Fail'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">Merkle Tree Inclusion</span>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(result.verificationDetails.merkleVerification)}
                    <span className="text-xs">{result.verificationDetails.merkleVerification ? 'Pass' : 'Fail'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">Blockchain Integrity</span>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(result.verificationDetails.chainIntegrity)}
                    <span className="text-xs">{result.verificationDetails.chainIntegrity ? 'Pass' : 'Fail'}</span>
                  </div>
                </div>
              </div>
            </div>

            {result.verified && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This vote has been successfully verified on the blockchain. 
                  It has not been tampered with and is cryptographically secure.
                </AlertDescription>
              </Alert>
            )}

            {!result.verified && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Vote verification failed. This could indicate tampering, 
                  an invalid hash, or system errors.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}