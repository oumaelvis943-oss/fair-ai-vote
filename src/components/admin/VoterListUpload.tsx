import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Users, Check, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoterListUploadProps {
  electionId: string;
  onUploadComplete: () => void;
}

interface CSVRow {
  email?: string;
  full_name?: string;
  voter_id_number?: string;
  [key: string]: any;
}

export default function VoterListUpload({ electionId, onUploadComplete }: VoterListUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Ensure email is present
      if (row.email) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    
    const text = await file.text();
    const parsed = parseCSV(text);
    
    if (parsed.length === 0) {
      toast({
        title: "Invalid CSV",
        description: "No valid voter data found. Ensure the CSV has an 'email' column.",
        variant: "destructive",
      });
      return;
    }

    setCsvData(parsed);
    setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
    
    toast({
      title: "CSV Parsed",
      description: `Found ${parsed.length} valid voter records.`,
    });
  };

  const handleUpload = async () => {
    if (csvData.length === 0) return;

    setUploading(true);
    try {
      // Validate CSV data
      const { validateCSVData, sanitizeError } = await import('@/lib/validation');
      const { valid, invalid } = validateCSVData(csvData);

      if (invalid.length > 0) {
        toast({
          title: "Validation Errors",
          description: `${invalid.length} rows have validation errors. Please fix and re-upload.`,
          variant: "destructive",
        });
        console.error('Invalid rows:', invalid);
        setUploading(false);
        return;
      }

      // Prepare data for insertion
      const voterData = valid.map(row => ({
        election_id: electionId,
        email: row.email,
        full_name: row.full_name || '',
        voter_id_number: row.voter_id_number || '',
        additional_info: JSON.parse(JSON.stringify(Object.fromEntries(
          Object.entries(row).filter(([key]) => 
            !['email', 'full_name', 'voter_id_number', '_rowIndex'].includes(key)
          )
        )))
      }));

      // Check for existing voters first
      const emails = voterData.map(v => v.email);
      const { data: existingVoters } = await supabase
        .from('eligible_voters')
        .select('email')
        .eq('election_id', electionId)
        .in('email', emails);

      const existingEmails = new Set(existingVoters?.map(v => v.email) || []);
      
      // Separate new and existing voters
      const newVoters = voterData.filter(v => !existingEmails.has(v.email));
      const updateVoters = voterData.filter(v => existingEmails.has(v.email));

      // Insert new voters
      if (newVoters.length > 0) {
        const { error: insertError } = await supabase
          .from('eligible_voters')
          .insert(newVoters);
        
        if (insertError) throw insertError;
      }

      // Update existing voters
      for (const voter of updateVoters) {
        const { error: updateError } = await supabase
          .from('eligible_voters')
          .update({
            full_name: voter.full_name,
            voter_id_number: voter.voter_id_number,
            additional_info: voter.additional_info,
          })
          .eq('election_id', electionId)
          .eq('email', voter.email);
        
        if (updateError) throw updateError;
      }

      if (newVoters.length === 0 && updateVoters.length === 0) {
        throw new Error('No voters to upload');
      }

      toast({
        title: "Voters Uploaded",
        description: `Successfully uploaded ${newVoters.length} new voters and updated ${updateVoters.length} existing voters.`,
      });

      // Reset form
      setCsvData([]);
      setPreview([]);
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete();
    } catch (error: any) {
      const { sanitizeError } = await import('@/lib/validation');
      toast({
        title: "Upload Failed",
        description: sanitizeError(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'email,full_name,voter_id_number,google_email,house,residence,year_class\nvoter@example.com,John Doe,12345,voter@gmail.com,Mara,Residence A,Form 4\nvoter2@example.com,Jane Smith,67890,voter2@gmail.com,Lewa,Residence B,Form 3';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voter_list_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Use this template to format your voter list CSV file.",
    });
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Eligible Voters
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing eligible voter information for this election
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="csv-upload">Select CSV File</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
          
          <Input
            ref={fileInputRef}
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          
          {fileName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {fileName}
            </div>
          )}
        </div>

        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Preview ({csvData.length} total records)
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Full Name</th>
                      <th className="px-3 py-2 text-left">Voter ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">{row.full_name || row.name || '-'}</td>
                        <td className="px-3 py-2">{row.voter_id_number || row.id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {csvData.length > 5 && (
              <p className="text-xs text-muted-foreground">
                Showing first 5 of {csvData.length} records
              </p>
            )}
          </div>
        )}

        {csvData.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Ready to upload {csvData.length} eligible voters
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                This will allow these voters to participate in the election
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={csvData.length === 0 || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Voters ({csvData.length})
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>CSV Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Must include an 'email' column (required)</li>
            <li>Optional columns: 'full_name', 'voter_id_number'</li>
            <li>Additional columns will be stored as metadata</li>
            <li>Duplicate emails for the same election will be updated</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}