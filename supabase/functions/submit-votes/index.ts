import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting helper
async function checkRateLimit(supabase: any, identifier: string, endpoint: string, maxRequests: number = 10): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - 5); // 5-minute window

  const { data, error } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Rate limit check error:', error);
    return true; // Allow on error
  }

  if (data && data.request_count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Update or insert rate limit record
  await supabase
    .from('rate_limits')
    .upsert({
      identifier,
      endpoint,
      request_count: (data?.request_count || 0) + 1,
      window_start: data ? data.window_start : new Date().toISOString()
    }, {
      onConflict: 'identifier,endpoint,window_start'
    });

  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { electionId, votes, voterEmail } = await req.json();

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitOk = await checkRateLimit(supabaseClient, clientIp, 'submit-votes', 5);
    
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Too many requests. Please try again in a few minutes.'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!electionId || !votes || !voterEmail || Object.keys(votes).length === 0) {
      throw new Error('Election ID, votes, and voter email are required');
    }

    console.log('Processing votes:', { electionId, voterEmail, voteCount: Object.keys(votes).length });

    // Check eligibility first (using existing function logic)
    const { data: voter } = await supabaseClient
      .from('eligible_voters')
      .select('*')
      .eq('election_id', electionId)
      .or(`email.eq.${voterEmail},google_email.eq.${voterEmail}`)
      .single();

    if (!voter) {
      throw new Error('Voter not eligible for this election');
    }

    // Check if already voted
    const { data: existingVotes } = await supabaseClient
      .from('vote_submissions')
      .select('id')
      .eq('election_id', electionId)
      .eq('voter_email', voterEmail);

    if (existingVotes && existingVotes.length > 0) {
      throw new Error('You have already voted in this election');
    }

    // Validate all candidates belong to positions voter is eligible for
    const eligiblePosts = voter.eligible_posts || [];
    const candidateIds = Object.values(votes) as string[];
    
    const { data: candidates, error: candidatesError } = await supabaseClient
      .from('candidates')
      .select('id, position')
      .in('id', candidateIds)
      .eq('election_id', electionId);

    if (candidatesError) throw candidatesError;

    // Validate each vote
    for (const [position, candidateId] of Object.entries(votes)) {
      if (!eligiblePosts.includes(position)) {
        throw new Error(`You are not eligible to vote for position: ${position}`);
      }

      const candidate = candidates?.find(c => c.id === candidateId);
      if (!candidate || candidate.position !== position) {
        throw new Error(`Invalid candidate selection for position: ${position}`);
      }
    }

    // Generate unique submission hash
    const submissionData = {
      electionId,
      voterEmail,
      votes,
      timestamp: new Date().toISOString()
    };
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(submissionData)));
    const submissionHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Start transaction - record vote submission first
    const { error: submissionError } = await supabaseClient
      .from('vote_submissions')
      .insert({
        election_id: electionId,
        voter_email: voterEmail,
        voter_id: voter.id,
        submission_hash: submissionHash,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    if (submissionError) {
      console.error('Error recording vote submission:', submissionError);
      throw new Error('Failed to record vote submission');
    }

    // Record individual votes
    const voteRecords = Object.entries(votes).map(([position, candidateId]) => ({
      election_id: electionId,
      candidate_id: candidateId as string,
      voter_id: voter.id,
      vote_hash: `${submissionHash}-${position}`
    }));

    const { error: votesError } = await supabaseClient
      .from('votes')
      .insert(voteRecords);

    if (votesError) {
      console.error('Error recording votes:', votesError);
      // Try to clean up the submission record
      await supabaseClient
        .from('vote_submissions')
        .delete()
        .eq('submission_hash', submissionHash);
      throw new Error('Failed to record votes');
    }

    // Update voter record to mark as voted
    const { error: voterUpdateError } = await supabaseClient
      .from('eligible_voters')
      .update({ 
        has_voted: true, 
        voted_at: new Date().toISOString() 
      })
      .eq('id', voter.id);

    if (voterUpdateError) {
      console.error('Error updating voter record:', voterUpdateError);
      // Non-fatal error, continue
    }

    // Record audit trail
    const auditEntries = Object.entries(votes).map(([position, candidateId]) => ({
      election_id: electionId,
      voter_id: voter.id,
      event_type: 'vote_cast',
      event_data: {
        position,
        candidate_id: candidateId,
        submission_hash: submissionHash
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    }));

    await supabaseClient
      .from('vote_audit_trail')
      .insert(auditEntries);

    // Log security audit
    await supabaseClient
      .from('security_audit_log')
      .insert({
        user_id: voter.id,
        action: 'vote_submitted',
        resource_type: 'election',
        resource_id: electionId,
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        details: {
          submission_hash: submissionHash,
          positions_voted: Object.keys(votes).length
        }
      });

    console.log('Votes submitted successfully:', submissionHash);

    return new Response(
      JSON.stringify({
        success: true,
        submission_hash: submissionHash,
        votes_recorded: Object.keys(votes).length,
        message: 'Votes submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-votes:', error);
    
    // Don't expose detailed error messages to users for security
    const userMessage = error.message.includes('eligible') || 
                        error.message.includes('already voted') ||
                        error.message.includes('not eligible')
      ? error.message 
      : 'Failed to submit votes. Please try again or contact support.';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: userMessage
      }),
      {
        status: error.message.includes('eligible') || error.message.includes('already voted') ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});