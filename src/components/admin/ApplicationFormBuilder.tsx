import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'multiselect' | 'radio' | 'file';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select, multiselect, radio
  validation?: {
    minLength?: number;
    maxLength?: number;
    fileTypes?: string[];
  };
}

interface ApplicationFormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export default function ApplicationFormBuilder({ fields, onChange }: ApplicationFormBuilderProps) {
  const [editingField, setEditingField] = useState<string | null>(null);

  const fieldTypes = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text / Essay' },
    { value: 'date', label: 'Date Picker' },
    { value: 'select', label: 'Dropdown (Single Choice)' },
    { value: 'multiselect', label: 'Multiple Choice (Checkboxes)' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'file', label: 'File Upload' },
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: '',
    };
    onChange([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
    if (editingField === id) setEditingField(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Application Form Fields</h3>
          <p className="text-sm text-muted-foreground">
            Configure custom fields for candidate applications
          </p>
        </div>
        <Button onClick={addField} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No custom fields added yet. Click "Add Field" to start building your form.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.id} className={editingField === field.id ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="h-6 px-2"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="h-6 px-2"
                    >
                      ↓
                    </Button>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {field.label || 'Untitled Field'}
                      {field.required && <span className="text-destructive">*</span>}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {fieldTypes.find(t => t.value === field.type)?.label}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {editingField === field.id && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="e.g., Why do you want this position?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: any) => updateField(field.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Placeholder Text (Optional)</Label>
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      placeholder="Helper text for the candidate"
                    />
                  </div>

                  {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') && (
                    <div className="space-y-2">
                      <Label>Options (one per line)</Label>
                      <Textarea
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => updateField(field.id, { 
                          options: e.target.value.split('\n').filter(o => o.trim()) 
                        })}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={4}
                      />
                    </div>
                  )}

                  {field.type === 'textarea' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Length</Label>
                        <Input
                          type="number"
                          value={field.validation?.minLength || ''}
                          onChange={(e) => updateField(field.id, { 
                            validation: { 
                              ...field.validation, 
                              minLength: parseInt(e.target.value) || undefined 
                            } 
                          })}
                          placeholder="e.g., 100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Length</Label>
                        <Input
                          type="number"
                          value={field.validation?.maxLength || ''}
                          onChange={(e) => updateField(field.id, { 
                            validation: { 
                              ...field.validation, 
                              maxLength: parseInt(e.target.value) || undefined 
                            } 
                          })}
                          placeholder="e.g., 1000"
                        />
                      </div>
                    </div>
                  )}

                  {field.type === 'file' && (
                    <div className="space-y-2">
                      <Label>Allowed File Types</Label>
                      <Input
                        value={field.validation?.fileTypes?.join(', ') || ''}
                        onChange={(e) => updateField(field.id, { 
                          validation: { 
                            ...field.validation, 
                            fileTypes: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                          } 
                        })}
                        placeholder=".pdf, .doc, .docx, .jpg, .png"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
                    />
                    <Label htmlFor={`required-${field.id}`} className="text-sm cursor-pointer">
                      This field is required
                    </Label>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}