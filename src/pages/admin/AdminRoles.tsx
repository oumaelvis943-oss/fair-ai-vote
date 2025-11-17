import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'candidate' | 'voter';
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export default function AdminRoles() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'candidate' | 'voter'>('voter');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<UserRole | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      
      // First get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      if (!rolesData || rolesData.length === 0) {
        setUserRoles([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(rolesData.map(r => r.user_id))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles by user_id
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));

      // Combine roles with profiles
      const combinedData = rolesData.map(role => ({
        ...role,
        profiles: profilesMap.get(role.user_id) || { email: 'Unknown', full_name: null }
      }));

      setUserRoles(combinedData as UserRole[]);
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user roles.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRole = async () => {
    if (!email || !role) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an email and select a role.',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      // First, find the user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.trim())
        .single();

      if (profileError || !profile) {
        toast({
          title: 'User Not Found',
          description: 'No user found with this email. User must sign up first.',
          variant: 'destructive',
        });
        return;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('role', role)
        .maybeSingle();

      if (existingRole) {
        toast({
          title: 'Role Exists',
          description: 'This user already has this role.',
          variant: 'destructive',
        });
        return;
      }

      // Add the role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.user_id,
          role: role,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: `${role} role added successfully.`,
      });

      setEmail('');
      setRole('voter');
      fetchUserRoles();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add role.',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role removed successfully.',
      });

      fetchUserRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'candidate':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            User Role Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Users must create an account first before roles can be assigned.
          Admin role grants full system access.
        </AlertDescription>
      </Alert>

      {/* Add Role Form */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add User Role
          </CardTitle>
          <CardDescription>
            Assign roles to registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voter">Voter</SelectItem>
                  <SelectItem value="candidate">Candidate</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addRole} disabled={adding} className="w-full">
                {adding ? 'Adding...' : 'Add Role'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Roles List */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Current User Roles</CardTitle>
          <CardDescription>
            {userRoles.length} role assignment(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : userRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No role assignments found.
            </div>
          ) : (
            <div className="space-y-2">
              {userRoles.map((userRole) => (
                <div
                  key={userRole.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{userRole.profiles.full_name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{userRole.profiles.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(userRole.role)}>
                      {userRole.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRoleToDelete(userRole);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the <strong>{roleToDelete?.role}</strong> role from{' '}
              <strong>{roleToDelete?.profiles.email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
