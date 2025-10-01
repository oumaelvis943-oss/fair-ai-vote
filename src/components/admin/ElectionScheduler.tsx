import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Play, Square } from 'lucide-react';

interface ElectionSchedulerProps {
  electionId: string;
  currentAutoStart: boolean;
  currentAutoEnd: boolean;
  onUpdate: () => void;
}

export default function ElectionScheduler({
  electionId,
  currentAutoStart,
  currentAutoEnd,
  onUpdate
}: ElectionSchedulerProps) {
  const { toast } = useToast();
  const [autoStart, setAutoStart] = useState(currentAutoStart);
  const [autoEnd, setAutoEnd] = useState(currentAutoEnd);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAutoStart(currentAutoStart);
    setAutoEnd(currentAutoEnd);
  }, [currentAutoStart, currentAutoEnd]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('elections')
        .update({
          auto_start: autoStart,
          auto_end: autoEnd
        })
        .eq('id', electionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Election scheduling updated successfully.",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Automated Scheduling
        </CardTitle>
        <CardDescription>
          Configure automatic start and end times for this election
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-start" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Auto-start voting
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically activate voting at the scheduled start time
            </p>
          </div>
          <Switch
            id="auto-start"
            checked={autoStart}
            onCheckedChange={setAutoStart}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-end" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Auto-end voting
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically close voting at the scheduled end time
            </p>
          </div>
          <Switch
            id="auto-end"
            checked={autoEnd}
            onCheckedChange={setAutoEnd}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Scheduling Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
