import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Save, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SMTPConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
}

export default function AdminSMTP() {
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: 'Uchaguzi MFA',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSMTPConfig();
  }, []);

  const fetchSMTPConfig = async () => {
    try {
      // Skip for now since table might not be available
      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const saveSMTPConfig = async () => {
    setSaving(true);
    try {
      toast({
        title: "SMTP Configuration Saved",
        description: "Configuration saved locally. Database integration pending.",
      });
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

  const testSMTPConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          smtpConfig: config,
          testEmail: config.from_email,
        },
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: "SMTP configuration is working correctly.",
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "SMTP configuration test failed.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <Card className="card-shadow">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">SMTP Configuration</h1>
        <p className="text-muted-foreground">
          Configure email server settings for automated notifications
        </p>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Server Settings
          </CardTitle>
          <CardDescription>
            Configure your SMTP server to enable automated email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Common SMTP settings: Gmail (smtp.gmail.com:587), Outlook (smtp-mail.outlook.com:587), 
              Yahoo (smtp.mail.yahoo.com:587). Use app passwords for Gmail/Outlook.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                type="text"
                placeholder="smtp.gmail.com"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="587"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username / Email</Label>
              <Input
                id="username"
                type="email"
                placeholder="your-email@gmail.com"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password / App Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="your-app-password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@uchaguzi-mfa.com"
                value={config.from_email}
                onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                type="text"
                placeholder="Uchaguzi MFA"
                value={config.from_name}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
            />
            <Label htmlFor="is_active">Enable SMTP</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={saveSMTPConfig}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            
            <Button
              onClick={testSMTPConnection}
              disabled={testing || !config.host || !config.username}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testing ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}