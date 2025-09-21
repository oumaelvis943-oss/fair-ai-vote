import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, Vote, Settings, Plus, X, Save } from 'lucide-react';

type VotingAlgorithm = 'fptp' | 'borda_count' | 'ranked_choice';

interface Election {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  voting_algorithm: VotingAlgorithm;
  max_candidates: number;
  require_approval: boolean;
  is_public: boolean;
  positions: string[];
  status: string;
}

interface EditElectionFormProps {
  election: Election;
  onElectionUpdated: () => void;
  onClose: () => void;
}

export default function EditElectionForm({ election, onElectionUpdated, onClose }: EditElectionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: election.title,
    description: election.description || '',
    start_date: election.start_date.slice(0, 16),
    end_date: election.end_date.slice(0, 16),
    voting_algorithm: election.voting_algorithm,
    max_candidates: election.max_candidates,
    require_approval: election.require_approval,
    is_public: election.is_public,
    positions: election.positions?.length ? election.positions : ['']
  });

  const votingAlgorithms = [
    {
      value: 'fptp' as const,
      label: 'First-Past-The-Post (FPTP)',
      description: 'Winner takes all - candidate with most votes wins',
      icon: Vote
    },
    {
      value: 'borda_count' as const,
      label: 'Borda Count',
      description: 'Points-based ranking system with weighted preferences',
      icon: Users
    },
    {
      value: 'ranked_choice' as const,
      label: 'Ranked Choice Voting',
      description: 'Eliminates candidates until majority is reached',
      icon: Settings
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('elections')
        .update({
          title: formData.title,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          voting_algorithm: formData.voting_algorithm,
          max_candidates: formData.max_candidates,
          require_approval: formData.require_approval,
          is_public: formData.is_public,
          positions: formData.positions.filter(p => p.trim())
        })
        .eq('id', election.id);

      if (error) throw error;

      toast({
        title: "Election Updated",
        description: "Election has been successfully updated.",
      });

      onElectionUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAlgorithm = votingAlgorithms.find(alg => alg.value === formData.voting_algorithm);

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-primary" />
          Edit Election
        </CardTitle>
        <CardDescription>
          Update election details and configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Election Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Student Government President 2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_candidates">Maximum Candidates</Label>
              <Input
                id="max_candidates"
                type="number"
                value={formData.max_candidates}
                onChange={(e) => setFormData({ ...formData, max_candidates: parseInt(e.target.value) })}
                min="2"
                max="50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the election purpose, requirements, and any additional information..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date & Time
              </Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                disabled={election.status !== 'draft'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Date & Time
              </Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                disabled={election.status === 'completed'}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Voting Algorithm</Label>
            <Select 
              value={formData.voting_algorithm} 
              onValueChange={(value: VotingAlgorithm) => setFormData({ ...formData, voting_algorithm: value })}
              required
              disabled={election.status !== 'draft'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose voting algorithm" />
              </SelectTrigger>
              <SelectContent>
                {votingAlgorithms.map((algorithm) => (
                  <SelectItem key={algorithm.value} value={algorithm.value}>
                    <div className="flex items-center gap-2">
                      <algorithm.icon className="h-4 w-4" />
                      {algorithm.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedAlgorithm && (
              <div className="p-3 bg-muted rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <selectedAlgorithm.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedAlgorithm.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedAlgorithm.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Election Positions</Label>
            {formData.positions.map((position, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={position}
                  onChange={(e) => {
                    const newPositions = [...formData.positions];
                    newPositions[index] = e.target.value;
                    setFormData({ ...formData, positions: newPositions });
                  }}
                  placeholder={`Position ${index + 1} (e.g., President, Vice President)`}
                />
                {formData.positions.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPositions = formData.positions.filter((_, i) => i !== index);
                      setFormData({ ...formData, positions: newPositions });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, positions: [...formData.positions, ''] })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Position
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_approval"
                checked={formData.require_approval}
                onChange={(e) => setFormData({ ...formData, require_approval: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="require_approval" className="text-sm">
                Require admin approval for candidate applications
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="is_public" className="text-sm">
                Make election public (voters can apply to participate)
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Updating...' : 'Update Election'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}