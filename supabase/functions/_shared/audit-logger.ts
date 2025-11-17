// Shared audit logging utility
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

export async function logSecurityEvent(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    await supabase.from('security_audit_log').insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      details: entry.details,
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

export async function logRequest(
  supabase: SupabaseClient,
  req: Request,
  endpoint: string,
  statusCode: number,
  responseTimeMs: number,
  userId?: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('request_logs').insert({
      endpoint,
      method: req.method,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      user_id: userId,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}
