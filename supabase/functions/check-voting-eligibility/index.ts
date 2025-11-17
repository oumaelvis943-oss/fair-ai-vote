import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getRateLimitHeaders } from '../_shared/rate-limiter.ts';
import { validateEmail, validateUUID, ValidationError } from '../_shared/validators.ts';
import { logRequest } from '../_shared/audit-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkRateLimit(supabaseClient, {
      identifier: ipAddress,
      endpoint: 'check-voting-eligibility',
      maxRequests: 10,
      windowMinutes: 5,
    });

    if (!rateLimit.allowed) {
      await logRequest(supabaseClient, req, 'check-voting-eligibility', 429, Date.now() - startTime, undefined, 'Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt)
          } 
        }
      );
    }

    const { electionId, voterEmail } = await req.json();

    // Input validation
    if (!electionId || !voterEmail) {
      throw new ValidationError('Election ID and voter email are required');
    }

    if (!validateUUID(electionId)) {
      throw new ValidationError('Invalid election ID format');
    }

    if (!validateEmail(voterEmail)) {
      throw new ValidationError('Invalid email format');
    }

    console.log('Checking eligibility for:', { electionId, voterEmail });

    // Check if voter exists and is eligible
    const { data: voter, error: voterError } = await supabaseClient
      .from('eligible_voters')
      .select('*')
      .eq('election_id', electionId)
      .or(`email.eq.${voterEmail},google_email.eq.${voterEmail}`)
      .maybeSingle();

    if (voterError) {
      console.error('Error fetching voter:', voterError);
      throw voterError;
    }

    if (!voter) {
      return new Response(
        JSON.stringify({
          eligible: false,
          reason: 'Not in eligible voters list for this election'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if election is active
    const { data: election, error: electionError } = await supabaseClient
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .eq('status', 'active')
      .maybeSingle();

    if (electionError) {
      console.error('Error fetching election:', electionError);
      throw electionError;
    }

    if (!election) {
      return new Response(
        JSON.stringify({
          eligible: false,
          reason: 'Election is not currently active'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if election is within voting period
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);

    if (now < startDate) {
      return new Response(
        JSON.stringify({
          eligible: false,
          reason: 'Voting has not started yet'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (now > endDate) {
      return new Response(
        JSON.stringify({
          eligible: false,
          reason: 'Voting period has ended'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already voted
    const { data: existingVotes, error: voteError } = await supabaseClient
      .from('vote_submissions')
      .select('id')
      .eq('election_id', electionId)
      .eq('voter_email', voterEmail)
      .limit(1);

    if (voteError) {
      console.error('Error checking existing votes:', voteError);
      throw voteError;
    }

    if (existingVotes && existingVotes.length > 0) {
      return new Response(
        JSON.stringify({
          eligible: false,
          reason: 'You have already voted in this election'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return eligible with voter details
    return new Response(
      JSON.stringify({
        eligible: true,
        voter_id: voter.id,
        eligible_posts: voter.eligible_posts || [],
        voter_name: voter.full_name,
        voter_residence: voter.residence,
        voter_house: voter.house,
        voter_year_class: voter.year_class
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-voting-eligibility:', error);
    const statusCode = error instanceof ValidationError ? 400 : 500;
    const errorMessage = error instanceof ValidationError ? error.message : 'Internal server error';
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    await logRequest(supabaseClient, req, 'check-voting-eligibility', statusCode, Date.now() - startTime, undefined, errorMessage);
    
    return new Response(
      JSON.stringify({ 
        eligible: false, 
        reason: errorMessage
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});