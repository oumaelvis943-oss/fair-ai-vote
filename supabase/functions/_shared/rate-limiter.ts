// Shared rate limiting utility for all edge functions
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  identifier: string; // IP address or user ID
  endpoint: string;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  // Get current request count in window
  const { data: rateLimitData, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', config.identifier)
    .eq('endpoint', config.endpoint)
    .gte('window_start', windowStart.toISOString())
    .maybeSingle();

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date() };
  }

  if (!rateLimitData) {
    // First request in window
    await supabase.from('rate_limits').insert({
      identifier: config.identifier,
      endpoint: config.endpoint,
      request_count: 1,
      window_start: new Date().toISOString(),
    });
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1,
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000)
    };
  }

  if (rateLimitData.request_count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetAt: new Date(new Date(rateLimitData.window_start).getTime() + config.windowMinutes * 60 * 1000)
    };
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .update({ request_count: rateLimitData.request_count + 1 })
    .eq('id', rateLimitData.id);

  return { 
    allowed: true, 
    remaining: config.maxRequests - rateLimitData.request_count - 1,
    resetAt: new Date(new Date(rateLimitData.window_start).getTime() + config.windowMinutes * 60 * 1000)
  };
}

export function getRateLimitHeaders(remaining: number, resetAt: Date) {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetAt.getTime() / 1000).toString(),
  };
}
