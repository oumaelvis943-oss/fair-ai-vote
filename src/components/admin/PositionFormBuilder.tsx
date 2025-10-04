import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import ApplicationFormBuilder, { FormField } from './ApplicationFormBuilder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface PositionWithForm {
  name: string;
  application_form_fields: FormField[];
}

interface PositionFormBuilderProps {
  positions: PositionWithForm[];
  onChange: (positions: PositionWithForm[]) => void;
}

export default function PositionFormBuilder({ positions, onChange }: PositionFormBuilderProps) {
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set([0]));

  const addPosition = () => {
    onChange([...positions, { name: '', application_form_fields: [] }]);
    setExpandedPositions(new Set([...expandedPositions, positions.length]));
  };

  const removePosition = (index: number) => {
    const newPositions = positions.filter((_, i) => i !== index);
    onChange(newPositions);
    const newExpanded = new Set(expandedPositions);
    newExpanded.delete(index);
    setExpandedPositions(newExpanded);
  };

  const updatePositionName = (index: number, name: string) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], name };
    onChange(newPositions);
  };

  const updatePositionForm = (index: number, fields: FormField[]) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], application_form_fields: fields };
    onChange(newPositions);
  };

  const togglePosition = (index: number) => {
    const newExpanded = new Set(expandedPositions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPositions(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Election Positions & Application Forms</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPosition}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Position
        </Button>
      </div>

      {positions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No positions added yet. Click "Add Position" to create your first position.
        </p>
      )}

      {positions.map((position, index) => (
        <Card key={index} className="border-2">
          <Collapsible
            open={expandedPositions.has(index)}
            onOpenChange={() => togglePosition(index)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={position.name}
                    onChange={(e) => updatePositionName(index, e.target.value)}
                    placeholder={`Position ${index + 1} (e.g., President, Vice President)`}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {expandedPositions.has(index) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  {positions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePosition(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <CardTitle className="text-sm mb-3">Application Form for {position.name || 'this position'}</CardTitle>
                    <ApplicationFormBuilder
                      fields={position.application_form_fields}
                      onChange={(fields) => updatePositionForm(index, fields)}
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
