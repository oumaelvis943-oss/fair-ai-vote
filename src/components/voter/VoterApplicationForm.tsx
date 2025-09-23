import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Vote, Users, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Election {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  positions?: any;
}

interface VoterApplicationFormProps {
  election: Election;
  onApplicationSubmitted: () => void;
  onBack: () => void;
}

export default function VoterApplicationForm({ 
  election, 
  onApplicationSubmitted, 
  onBack 
}: VoterApplicationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [platformStatement, setPlatformStatement] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!platformStatement.trim()) {
      toast({
        title: "Platform Statement Required",
        description: "Please provide your platform statement",
        variant: "destructive",
      });
      return;
    }

    const positions = Array.isArray(election.positions) ? election.positions : [];
    if (positions.length > 0 && !selectedPosition) {
      toast({
        title: "Position Required",
        description: "Please select a position you're applying for",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Check if user has already applied for this election
      const { data: existingApplication, error: checkError } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', user?.id)
        .eq('election_id', election.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingApplication) {
        toast({
          title: "Application Already Submitted",
          description: "You have already applied for this election",
          variant: "destructive",
        });
        return;
      }

      // Submit the application
      const { error } = await supabase
        .from('candidates')
        .insert({
          user_id: user?.id,
          election_id: election.id,
          platform_statement: platformStatement,
          position: selectedPosition || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your candidate application has been submitted successfully",
      });

      onApplicationSubmitted();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Elections
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Candidate Application</h1>
            <p className="text-muted-foreground">Apply to become a candidate for this election</p>
          </div>
        </div>

        {/* Election Information */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Vote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{election.title}</CardTitle>
                  <CardDescription>
                    {election.description || "Election details"}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant={election.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {election.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Election Period</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {Array.isArray(election.positions) && election.positions.length > 0 && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Available Positions</p>
                    <p className="text-sm text-muted-foreground">
                      {election.positions.length} position(s) available
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Your Application</CardTitle>
            <CardDescription>
              Complete the form below to submit your candidate application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              {/* Position Selection */}
              {Array.isArray(election.positions) && election.positions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the position you're applying for" />
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

              {/* Platform Statement */}
              <div className="space-y-2">
                <Label htmlFor="platform">Platform Statement *</Label>
                <Textarea
                  id="platform"
                  placeholder="Describe your qualifications, goals, and why you would be a good candidate for this position..."
                  value={platformStatement}
                  onChange={(e) => setPlatformStatement(e.target.value)}
                  className="min-h-[200px] resize-y"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {platformStatement.length} characters (minimum 100 recommended)
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={submitting || !platformStatement.trim()}
                  className="btn-primary-gradient gap-2"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}