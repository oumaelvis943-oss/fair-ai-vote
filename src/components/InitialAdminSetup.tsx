import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, UserPlus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InitialAdminSetup() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'elvis.ouma@mpesafoundationacademy.ac.ke')
        .eq('role', 'admin')
        .single();

      if (data) {
        setSetupComplete(true);
      }
    } catch (error) {
      // Admin doesn't exist, show setup option
    } finally {
      setChecking(false);
    }
  };

  const createAdminAccount = async () => {
    setLoading(true);
    
    try {
      // Sign up the admin user
      const { error: signUpError } = await supabase.auth.signUp({
        email: 'elvis.ouma@mpesafoundationacademy.ac.ke',
        password: 'Mpesa@123',
        options: {
          data: {
            full_name: 'Elvis Ouma'
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          // User exists, just need to update profile to admin
          toast({
            title: "User Already Exists",
            description: "The admin user already exists. If you need admin access, please contact support.",
            variant: "destructive",
          });
        } else {
          throw signUpError;
        }
      } else {
        toast({
          title: "Admin Account Created",
          description: "The admin account has been set up successfully. Please check email for verification.",
        });
        setSetupComplete(true);
      }
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Checking admin setup...</p>
        </CardContent>
      </Card>
    );
  }

  if (setupComplete) {
    return (
      <Card className="max-w-md mx-auto card-shadow">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <CardTitle className="text-primary">Admin Setup Complete</CardTitle>
          <CardDescription>
            The admin account is already configured and ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p><strong>Admin Email:</strong> elvis.ouma@mpesafoundationacademy.ac.ke</p>
              <p><strong>Status:</strong> <span className="text-success">Active</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto card-shadow">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-primary">Initial Admin Setup</CardTitle>
        <CardDescription>
          Set up the administrator account for SecureVote
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <UserPlus className="h-4 w-4" />
          <AlertDescription>
            This will create an admin account with the following credentials:
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <p><strong>Email:</strong> elvis.ouma@mpesafoundationacademy.ac.ke</p>
            <p><strong>Password:</strong> Mpesa@123</p>
            <p><strong>Role:</strong> Administrator</p>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> After setup, you can change these credentials in the settings page.
            </AlertDescription>
          </Alert>
        </div>

        <Button 
          onClick={createAdminAccount}
          disabled={loading}
          className="w-full institutional-gradient"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Setting up...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Create Admin Account
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}