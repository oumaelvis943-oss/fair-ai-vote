import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import VoterListUpload from '@/components/admin/VoterListUpload';

interface Election {
  id: string;
  title: string;
  status: string;
}

export default function AdminUpload() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('id, title, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Voter Management</h1>
        <p className="text-muted-foreground">
          Upload and manage eligible voter lists for your elections
        </p>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Select Election
          </CardTitle>
          <CardDescription>
            Choose an election to upload eligible voters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={selectedElection}
              onValueChange={setSelectedElection}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an election to upload voters" />
              </SelectTrigger>
              <SelectContent>
                {elections.map((election) => (
                  <SelectItem key={election.id} value={election.id}>
                    {election.title} ({election.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {elections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No elections available. Create an election first to upload voters.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedElection && (
        <VoterListUpload
          electionId={selectedElection}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}