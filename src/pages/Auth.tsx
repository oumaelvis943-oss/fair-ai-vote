import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { Separator } from '@/components/ui/separator';

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Uchaguzi MFA</CardTitle>
          <CardDescription>
            Access your secure voting platform
          </CardDescription>
          <Alert className="mt-4">
            <AlertDescription className="text-sm">
              Sign in with your <strong>@mpesafoundationacademy.ac.ke</strong> Google account to access the platform
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <GoogleSignIn />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}