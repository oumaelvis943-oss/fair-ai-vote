import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, FileText, Send, AlertCircle, CheckCircle } from 'lucide-react';

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  max_candidates: number;
  is_public: boolean;
  positions?: string[];
}

interface CandidateApplicationFormProps {
  election: Election;
  onApplicationSubmitted: () => void;
  onBack: () => void;
}

export default function CandidateApplicationForm({ 
  election, 
  onApplicationSubmitted, 
  onBack 
}: CandidateApplicationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [platformStatement, setPlatformStatement] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!platformStatement.trim()) {
      toast({
        title: "Error",
        description: "Please provide your platform statement",
        variant: "destructive",
      });
      return;
    }

    if (election.positions && election.positions.length > 0 && !selectedPosition) {
      toast({
        title: "Error",
        description: "Please select a position to apply for",
        variant: "destructive",
      });
      return;
    }

    if (platformStatement.length < 100) {
      toast({
        title: "Error",
        description: "Platform statement must be at least 100 characters long",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Check if user has already applied for this election
      const { data: existingApplication } = await supabase
        .from('candidates')
        .select('id, status')
        .eq('user_id', user?.id)
        .eq('election_id', election.id)
        .single();

      if (existingApplication) {
        toast({
          title: "Application Already Exists",
          description: `You have already applied for this election. Status: ${existingApplication.status}`,
          variant: "destructive",
        });
        return;
      }

      // Submit the candidate application
      const { error } = await supabase
        .from('candidates')
        .insert({
          user_id: user?.id,
          election_id: election.id,
          platform_statement: platformStatement,
          position: election.positions && election.positions.length > 0 ? selectedPosition : null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your candidate application has been submitted for review",
      });

      onApplicationSubmitted();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-shadow border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl text-primary">Candidate Application</CardTitle>
              <CardDescription className="text-lg">
                Apply to be a candidate for: {election.title}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Election Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Election Title</Label>
              <p className="font-semibold">{election.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={election.status === 'active' ? 'default' : 'secondary'}>
                  {election.status}
                </Badge>
                {election.is_public && (
                  <Badge variant="outline">Public</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
            <p className="text-sm">{election.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Election Period</Label>
              <p className="text-sm">
                {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Max Candidates</Label>
              <p className="text-sm">{election.max_candidates}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Your Application
          </CardTitle>
          <CardDescription>
            Tell voters why you're the right candidate for this position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitApplication} className="space-y-6">
            {election.positions && election.positions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position to apply for" />
                  </SelectTrigger>
                  <SelectContent>
                    {election.positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="platformStatement">Platform Statement *</Label>
              <Textarea
                id="platformStatement"
                value={platformStatement}
                onChange={(e) => setPlatformStatement(e.target.value)}
                placeholder="Describe your qualifications, experience, and what you plan to accomplish if elected. This will be visible to voters when they make their selection."
                rows={8}
                className="min-h-[200px]"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Minimum 100 characters required</span>
                <span>{platformStatement.length} characters</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your application will be reviewed by the election administrators. You will be notified once your application status is updated.
              </AlertDescription>
            </Alert>

            <Alert className="border-success bg-success-light">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">
                By submitting this application, you confirm that you meet all eligibility requirements and agree to participate fairly in the election process.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={submitting}
              >
                Back to Elections
              </Button>
              <Button
                type="submit"
                disabled={submitting || platformStatement.length < 100}
                className="flex-1"
              >
                {submitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}