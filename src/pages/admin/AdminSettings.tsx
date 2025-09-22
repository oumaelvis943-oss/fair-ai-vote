import AdminSettings from '@/components/admin/AdminSettings';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">System Settings</h1>
        <p className="text-muted-foreground">
          Configure platform settings, security options, and system preferences
        </p>
      </div>

      <AdminSettings />
    </div>
  );
}