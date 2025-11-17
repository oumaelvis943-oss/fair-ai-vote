import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, Vote, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PositionFormBuilder, { PositionWithForm } from './PositionFormBuilder';

type VotingAlgorithm = 'fptp' | 'borda_count' | 'ranked_choice';

interface CreateElectionFormProps {
  onElectionCreated: () => void;
}

export default function CreateElectionForm({ onElectionCreated }: CreateElectionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    voting_algorithm: '' as VotingAlgorithm,
    max_candidates: 10,
    require_approval: true,
    is_public: false,
    single_position_per_candidate: false
  });
  const [positions, setPositions] = useState<PositionWithForm[]>([
    { name: '', slots: 1, sub_categories: [], application_form_fields: [] }
  ]);

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
    if (!user) return;

    const { createElectionSchema, sanitizeError } = await import('@/lib/validation');

    try {
      // Validate basic form data
      const validated = createElectionSchema.parse(formData);

      // Validate positions
      const hasEmptyPositions = positions.some(p => !p.name || !p.name.trim());
      if (hasEmptyPositions) {
        setActiveTab('positions');
        toast({
          title: "Validation Error",
          description: "Please provide names for all positions.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      
      const { error } = await supabase
        .from('elections')
        .insert([{
          title: validated.title,
          description: validated.description || null,
          start_date: validated.start_date,
          end_date: validated.end_date,
          voting_algorithm: validated.voting_algorithm,
          max_candidates: validated.max_candidates,
          require_approval: validated.require_approval,
          is_public: validated.is_public,
          positions: JSON.parse(JSON.stringify(positions)),
          application_form_fields: null,
          eligibility_criteria: formData.single_position_per_candidate ? { single_position_only: true } : null,
          created_by: user.id,
          status: 'draft'
        }]);

      if (error) throw error;

      toast({
        title: "Election Created",
        description: "Election has been successfully created in draft status.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        voting_algorithm: '' as VotingAlgorithm,
        max_candidates: 10,
        require_approval: true,
        is_public: false,
        single_position_per_candidate: false
      });
      setPositions([{ name: '', slots: 1, sub_categories: [], application_form_fields: [] }]);

      onElectionCreated();
    } catch (error: any) {
      const { sanitizeError } = await import('@/lib/validation');
      toast({
        title: "Error",
        description: error.errors?.[0]?.message || sanitizeError(error),
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
          Create New Election
        </CardTitle>
        <CardDescription>
          Set up a new election with your preferred voting algorithm and parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="positions">Positions & Forms</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="basic" className="space-y-6 mt-0">
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
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Voting Algorithm</Label>
            <Select 
              value={formData.voting_algorithm} 
              onValueChange={(value: VotingAlgorithm) => setFormData({ ...formData, voting_algorithm: value })}
              required
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
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="single_position"
                checked={formData.single_position_per_candidate}
                onChange={(e) => setFormData({ ...formData, single_position_per_candidate: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="single_position" className="text-sm">
                Restrict candidates to apply for only one position
              </Label>
            </div>
          </div>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6 mt-0">
              <PositionFormBuilder
                positions={positions}
                onChange={setPositions}
              />
            </TabsContent>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Election'}
            </Button>
          </div>
        </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}