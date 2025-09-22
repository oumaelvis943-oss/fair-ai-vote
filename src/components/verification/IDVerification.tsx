import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Camera, 
  FileText, 
  Phone,
  Mail,
  University
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface VerificationStep {
  id: string;
  type: 'email' | 'id_document' | 'phone' | 'institutional';
  title: string;
  description: string;
  icon: any;
  required: boolean;
  status: 'pending' | 'verified' | 'rejected';
}

export default function IDVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [institutionalId, setInstitutionalId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const verificationSteps: VerificationStep[] = [
    {
      id: 'email',
      type: 'email',
      title: 'Email Verification',
      description: 'Verify your email address to ensure account security',
      icon: Mail,
      required: true,
      status: user?.email_confirmed_at ? 'verified' : 'pending'
    },
    {
      id: 'id_document',
      type: 'id_document',
      title: 'ID Document Upload',
      description: 'Upload a government-issued photo ID for identity verification',
      icon: FileText,
      required: true,
      status: 'pending'
    },
    {
      id: 'phone',
      type: 'phone',
      title: 'Phone Verification',
      description: 'Verify your phone number with SMS confirmation',
      icon: Phone,
      required: false,
      status: 'pending'
    },
    {
      id: 'institutional',
      type: 'institutional',
      title: 'Institutional Verification',
      description: 'Verify your institutional affiliation (student/employee ID)',
      icon: University,
      required: false,
      status: 'pending'
    }
  ];

  const [steps, setSteps] = useState(verificationSteps);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStepBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const submitVerification = async (type: string, data: any) => {
    if (!user) return;

    setUploading(true);
    try {
      const { error } = await supabase
        .from('user_verification')
        .insert({
          user_id: user.id,
          verification_type: type,
          verification_data: data,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: "Your verification has been submitted for review.",
      });

      // Update step status
      setSteps(prev => prev.map(step => 
        step.type === type ? { ...step, status: 'pending' as const } : step
      ));

    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or PDF file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setDocumentFile(file);
  };

  const submitDocumentVerification = async () => {
    if (!documentFile) {
      toast({
        title: "No File Selected",
        description: "Please select a document to upload.",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, you would upload the file to storage
    // For now, we'll simulate the upload
    const documentData = {
      fileName: documentFile.name,
      fileSize: documentFile.size,
      fileType: documentFile.type,
      uploadTimestamp: new Date().toISOString(),
      // In production, add the actual file URL after upload
      fileUrl: `placeholder-url-for-${documentFile.name}`
    };

    await submitVerification('id_document', documentData);
    setDocumentFile(null);
  };

  const submitPhoneVerification = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number.",
        variant: "destructive"
      });
      return;
    }

    const phoneData = {
      phoneNumber: phoneNumber,
      requestTimestamp: new Date().toISOString()
    };

    await submitVerification('phone', phoneData);
    setPhoneNumber('');
  };

  const submitInstitutionalVerification = async () => {
    if (!institutionalId) {
      toast({
        title: "ID Required",
        description: "Please enter your institutional ID.",
        variant: "destructive"
      });
      return;
    }

    const institutionalData = {
      institutionalId: institutionalId,
      requestTimestamp: new Date().toISOString()
    };

    await submitVerification('institutional', institutionalData);
    setInstitutionalId('');
  };

  const resendEmailVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || ''
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'verified').length;
    return (completedSteps / steps.length) * 100;
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Overview */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Identity Verification
          </CardTitle>
          <CardDescription>
            Complete verification steps to ensure secure participation in elections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={calculateProgress()} className="flex-1" />
            <span className="text-sm font-medium">
              {Math.round(calculateProgress())}% Complete
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  currentStep === index ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <step.icon className="h-5 w-5 text-primary" />
                    {getStepIcon(step.status)}
                  </div>
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    {getStepBadge(step.status)}
                    {step.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Details */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentStepData.icon className="h-5 w-5 text-primary" />
            {currentStepData.title}
          </CardTitle>
          <CardDescription>
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStepData.type === 'email' && (
            <div className="space-y-4">
              {currentStepData.status === 'verified' ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your email has been verified successfully.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Please check your email ({user?.email}) for a verification link.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={resendEmailVerification}
                    variant="outline"
                    className="w-full"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStepData.type === 'id_document' && (
            <div className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Upload a clear photo of a government-issued ID (driver's license, passport, etc.). 
                  Ensure all text is readable and the document is not expired.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="document-upload">Select Document</Label>
                <Input
                  id="document-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleDocumentUpload}
                />
              </div>

              {documentFile && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{documentFile.name}</span>
                    <Badge variant="outline">{(documentFile.size / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                </div>
              )}

              <Button
                onClick={submitDocumentVerification}
                disabled={!documentFile || uploading}
                className="w-full institutional-gradient"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Document
                  </>
                )}
              </Button>
            </div>
          )}

          {currentStepData.type === 'phone' && (
            <div className="space-y-4">
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  We'll send a verification code to your phone number via SMS.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <Button
                onClick={submitPhoneVerification}
                disabled={!phoneNumber || uploading}
                className="w-full institutional-gradient"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </div>
          )}

          {currentStepData.type === 'institutional' && (
            <div className="space-y-4">
              <Alert>
                <University className="h-4 w-4" />
                <AlertDescription>
                  Enter your student ID, employee ID, or other institutional identifier.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="institutional-id">Institutional ID</Label>
                <Input
                  id="institutional-id"
                  placeholder="Student/Employee ID"
                  value={institutionalId}
                  onChange={(e) => setInstitutionalId(e.target.value)}
                />
              </div>

              <Button
                onClick={submitInstitutionalVerification}
                disabled={!institutionalId || uploading}
                className="w-full institutional-gradient"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <University className="mr-2 h-4 w-4" />
                    Submit ID
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous Step
            </Button>
            
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next Step
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}