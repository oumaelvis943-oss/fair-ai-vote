import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();

    // Auto-start elections
    const { data: electionsToStart, error: startError } = await supabaseClient
      .from('elections')
      .select('*')
      .eq('status', 'draft')
      .eq('auto_start', true)
      .lte('start_date', now)
      .is('voting_started_at', null);

    if (startError) throw startError;

    if (electionsToStart && electionsToStart.length > 0) {
      for (const election of electionsToStart) {
        await supabaseClient
          .from('elections')
          .update({
            status: 'active',
            voting_started_at: now
          })
          .eq('id', election.id);

        console.log(`Started election: ${election.title}`);
      }
    }

    // Auto-end elections
    const { data: electionsToEnd, error: endError } = await supabaseClient
      .from('elections')
      .select('*')
      .eq('status', 'active')
      .eq('auto_end', true)
      .lte('end_date', now)
      .is('voting_ended_at', null);

    if (endError) throw endError;

    if (electionsToEnd && electionsToEnd.length > 0) {
      for (const election of electionsToEnd) {
        await supabaseClient
          .from('elections')
          .update({
            status: 'completed',
            voting_ended_at: now
          })
          .eq('id', election.id);

        console.log(`Ended election: ${election.title}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        started: electionsToStart?.length || 0,
        ended: electionsToEnd?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-elections:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
