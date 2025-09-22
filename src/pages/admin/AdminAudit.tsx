import AuditTrailViewer from '@/components/admin/AuditTrailViewer';

export default function AdminAudit() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Audit Trail</h1>
        <p className="text-muted-foreground">
          Monitor system activities and maintain compliance with detailed audit logs
        </p>
      </div>

      <AuditTrailViewer />
    </div>
  );
}