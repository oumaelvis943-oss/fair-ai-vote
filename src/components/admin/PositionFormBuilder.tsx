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
  slots: number;
  sub_categories?: string[];
  application_form_fields: FormField[];
}

interface PositionFormBuilderProps {
  positions: PositionWithForm[];
  onChange: (positions: PositionWithForm[]) => void;
}

export default function PositionFormBuilder({ positions, onChange }: PositionFormBuilderProps) {
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set([0]));

  const addPosition = () => {
    onChange([...positions, { name: '', slots: 1, sub_categories: [], application_form_fields: [] }]);
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

  const updatePositionSlots = (index: number, slots: number) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], slots };
    onChange(newPositions);
  };

  const updateSubCategories = (index: number, categories: string) => {
    const newPositions = [...positions];
    const subCategories = categories.split(',').map(c => c.trim()).filter(c => c.length > 0);
    newPositions[index] = { ...newPositions[index], sub_categories: subCategories };
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
              <div className="flex items-center justify-between gap-3 mb-3">
                <CardTitle className="text-lg">Position {index + 1}</CardTitle>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor={`position-name-${index}`}>Position Name</Label>
                  <Input
                    id={`position-name-${index}`}
                    value={position.name}
                    onChange={(e) => updatePositionName(index, e.target.value)}
                    placeholder="e.g., Residential Coordinator"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`position-slots-${index}`}>Number of Slots</Label>
                  <Input
                    id={`position-slots-${index}`}
                    type="number"
                    min="1"
                    max="20"
                    value={position.slots}
                    onChange={(e) => updatePositionSlots(index, parseInt(e.target.value) || 1)}
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-3">
                <Label htmlFor={`position-categories-${index}`}>
                  Sub-Categories (Optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    Separate with commas (e.g., Mara, Lewa, Olpejeta, Sibiloi, Serengeti)
                  </span>
                </Label>
                <Input
                  id={`position-categories-${index}`}
                  value={position.sub_categories?.join(', ') || ''}
                  onChange={(e) => updateSubCategories(index, e.target.value)}
                  placeholder="e.g., Mara, Lewa, Olpejeta, Sibiloi, Serengeti"
                />
                {position.sub_categories && position.sub_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {position.sub_categories.map((cat, catIndex) => (
                      <span key={catIndex} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
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
