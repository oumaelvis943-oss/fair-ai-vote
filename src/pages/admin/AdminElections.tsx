import { useState } from 'react';
import ElectionsList from '@/components/admin/ElectionsList';
import EditElectionForm from '@/components/admin/EditElectionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Election {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  voting_algorithm: 'fptp' | 'borda_count' | 'ranked_choice';
  max_candidates: number;
  require_approval: boolean;
  is_public: boolean;
  positions: string[];
  status: string;
}

export default function AdminElections() {
  const [refreshElections, setRefreshElections] = useState(0);
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  const handleElectionUpdated = () => {
    setRefreshElections(prev => prev + 1);
    setEditingElection(null);
  };

  const handleEditElection = (election: Election) => {
    setEditingElection(election);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Elections Management</h1>
        <p className="text-muted-foreground">
          Manage all elections, update status, and monitor voting progress
        </p>
      </div>

      <ElectionsList 
        refreshTrigger={refreshElections} 
        onEditElection={handleEditElection}
      />

      <Dialog open={!!editingElection} onOpenChange={() => setEditingElection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Election</DialogTitle>
          </DialogHeader>
          {editingElection && (
            <EditElectionForm
              election={editingElection}
              onElectionUpdated={handleElectionUpdated}
              onClose={() => setEditingElection(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}