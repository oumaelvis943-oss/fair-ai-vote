import { useState, useEffect } from 'react';
import ElectionsList from '@/components/admin/ElectionsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditElectionForm from '@/components/admin/EditElectionForm';
import ElectionScheduler from '@/components/admin/ElectionScheduler';
import { supabase } from '@/integrations/supabase/client';

interface ListElection {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  voting_algorithm: string;
  status: string;
  max_candidates?: number;
  require_approval?: boolean;
  is_public?: boolean;
  positions?: any;
  application_form_fields?: any;
}

type VotingAlgorithm = 'fptp' | 'borda_count' | 'ranked_choice';

interface FullElection {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  voting_algorithm: VotingAlgorithm;
  status: string;
  max_candidates: number;
  require_approval: boolean;
  is_public: boolean;
  positions: any;
  application_form_fields?: any;
  auto_start: boolean;
  auto_end: boolean;
}

export default function AdminElections() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingElection, setEditingElection] = useState<FullElection | null>(null);

  const handleElectionUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingElection(null);
  };

  const handleEditElection = async (election: ListElection) => {
    // Fetch full election details including auto_start and auto_end
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('id', election.id)
      .single();
    
    if (!error && data) {
      setEditingElection(data as FullElection);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Manage Elections</h1>
        <p className="text-muted-foreground">
          View, edit, and schedule all elections
        </p>
      </div>

      <ElectionsList 
        refreshTrigger={refreshTrigger}
        onEditElection={handleEditElection}
      />

      <Dialog open={!!editingElection} onOpenChange={(open) => !open && setEditingElection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Election</DialogTitle>
          </DialogHeader>
          
          {editingElection && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Election Details</TabsTrigger>
                <TabsTrigger value="schedule">Scheduling</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <EditElectionForm 
                  election={editingElection}
                  onElectionUpdated={handleElectionUpdated}
                  onClose={() => setEditingElection(null)}
                />
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <ElectionScheduler 
                  electionId={editingElection.id}
                  currentAutoStart={editingElection.auto_start}
                  currentAutoEnd={editingElection.auto_end}
                  onUpdate={handleElectionUpdated}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
