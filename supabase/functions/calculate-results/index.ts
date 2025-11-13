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

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Admin access required');
    }

    const { electionId } = await req.json();

    if (!electionId) {
      throw new Error('Election ID is required');
    }

    console.log('Calculating results for election:', electionId);

    // Call the database function to calculate results
    const { error: calcError } = await supabaseClient
      .rpc('calculate_vote_results', { p_election_id: electionId });

    if (calcError) {
      console.error('Error calculating results:', calcError);
      throw new Error(`Failed to calculate results: ${calcError.message}`);
    }

    // Fetch the calculated results
    const { data: results, error: resultsError } = await supabaseClient
      .from('vote_results')
      .select(`
        *,
        candidates (
          id,
          position,
          platform_statement,
          user_id
        )
      `)
      .eq('election_id', electionId)
      .order('position')
      .order('rank');

    if (resultsError) {
      throw new Error(`Failed to fetch results: ${resultsError.message}`);
    }

    // Log audit trail
    await supabaseClient
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: 'calculate_results',
        resource_type: 'election',
        resource_id: electionId,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        details: { results_count: results?.length || 0 }
      });

    console.log('Results calculated successfully:', results?.length, 'results');

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: 'Vote results calculated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-results:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to calculate results'
      }),
      {
        status: error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
