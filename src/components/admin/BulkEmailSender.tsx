import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Users } from 'lucide-react';

interface Recipient {
  email: string;
  name: string;
}

interface BulkEmailSenderProps {
  electionId?: string;
  candidates?: any[];
}

export default function BulkEmailSender({ electionId, candidates }: BulkEmailSenderProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  const sendBulkEmails = async () => {
    if (!templateName || recipients.length === 0) {
      toast({
        title: "Error",
        description: "Please select a template and add recipients.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-emails', {
        body: {
          templateName,
          recipients,
          variables: customVariables,
          electionId,
          isBulk: true
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Emails sent successfully to ${data.sent_count} recipients.`,
      });

      setRecipients([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send emails.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCandidatesAsRecipients = () => {
    if (candidates) {
      const newRecipients = candidates.map(c => ({
        email: c.profiles?.email || '',
        name: c.profiles?.full_name || ''
      }));
      setRecipients(newRecipients);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Send Bulk Notifications
        </CardTitle>
        <CardDescription>
          Send automated emails to candidates or voters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email Template</Label>
          <Select value={templateName} onValueChange={setTemplateName}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="application_confirmation">Application Confirmation</SelectItem>
              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              <SelectItem value="candidate_feedback">Candidate Feedback</SelectItem>
              <SelectItem value="election_reminder">Election Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Recipients ({recipients.length})</Label>
          {candidates && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCandidatesAsRecipients}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Add All Candidates
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>Custom Variables (JSON)</Label>
          <Textarea
            placeholder='{"election_name": "Student Council 2024", "interview_date": "Jan 20"}'
            value={JSON.stringify(customVariables, null, 2)}
            onChange={(e) => {
              try {
                setCustomVariables(JSON.parse(e.target.value));
              } catch {}
            }}
            rows={4}
          />
        </div>

        <Button
          onClick={sendBulkEmails}
          disabled={loading || !templateName || recipients.length === 0}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {loading ? 'Sending...' : `Send to ${recipients.length} Recipients`}
        </Button>
      </CardContent>
    </Card>
  );
}
