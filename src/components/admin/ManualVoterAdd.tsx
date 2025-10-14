import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ManualVoterAddProps {
  electionId: string;
  onVoterAdded: () => void;
}

export default function ManualVoterAdd({ electionId, onVoterAdded }: ManualVoterAddProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    voter_id_number: '',
    house: '',
    residence: '',
    year_class: '',
    google_email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('eligible_voters')
        .insert({
          election_id: electionId,
          email: formData.email,
          full_name: formData.full_name || null,
          voter_id_number: formData.voter_id_number || null,
          house: formData.house || null,
          residence: formData.residence || null,
          year_class: formData.year_class || null,
          google_email: formData.google_email || null
        });

      if (error) throw error;

      toast({
        title: "Voter Added",
        description: "Eligible voter has been successfully added.",
      });

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        voter_id_number: '',
        house: '',
        residence: '',
        year_class: '',
        google_email: ''
      });

      onVoterAdded();
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

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Add Single Voter
        </CardTitle>
        <CardDescription>
          Manually add an eligible voter to this election
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="voter@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voter_id">Voter ID Number</Label>
              <Input
                id="voter_id"
                value={formData.voter_id_number}
                onChange={(e) => setFormData({ ...formData, voter_id_number: e.target.value })}
                placeholder="12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_email">Google Email</Label>
              <Input
                id="google_email"
                type="email"
                value={formData.google_email}
                onChange={(e) => setFormData({ ...formData, google_email: e.target.value })}
                placeholder="voter@gmail.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="house">House</Label>
              <Input
                id="house"
                value={formData.house}
                onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                placeholder="Mara, Lewa, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residence">Residence</Label>
              <Input
                id="residence"
                value={formData.residence}
                onChange={(e) => setFormData({ ...formData, residence: e.target.value })}
                placeholder="Residence name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_class">Year/Class</Label>
              <Input
                id="year_class"
                value={formData.year_class}
                onChange={(e) => setFormData({ ...formData, year_class: e.target.value })}
                placeholder="2024, Form 4, etc."
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Voter...' : 'Add Voter'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
