import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface VotingStatusBannerProps {
  election: {
    status: string;
    start_date: string;
    end_date: string;
    voting_started_at?: string;
    voting_ended_at?: string;
  };
}

export default function VotingStatusBanner({ election }: VotingStatusBannerProps) {
  const now = new Date();
  const startDate = new Date(election.start_date);
  const endDate = new Date(election.end_date);

  const isBeforeStart = now < startDate;
  const isAfterEnd = now > endDate;
  const isActive = election.status === 'active' && !isBeforeStart && !isAfterEnd;

  if (isBeforeStart) {
    return (
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertTitle>Voting Not Started</AlertTitle>
        <AlertDescription>
          Voting will open on {format(startDate, 'PPP p')}
        </AlertDescription>
      </Alert>
    );
  }

  if (isAfterEnd || election.status === 'completed') {
    return (
      <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle>Voting Closed</AlertTitle>
        <AlertDescription>
          Voting ended on {format(election.voting_ended_at ? new Date(election.voting_ended_at) : endDate, 'PPP p')}
        </AlertDescription>
      </Alert>
    );
  }

  if (isActive) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>Voting is Open</AlertTitle>
        <AlertDescription>
          Vote now! Voting closes on {format(endDate, 'PPP p')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Calendar className="h-4 w-4" />
      <AlertTitle>Election Status: {election.status}</AlertTitle>
      <AlertDescription>
        Check back later for updates
      </AlertDescription>
    </Alert>
  );
}
