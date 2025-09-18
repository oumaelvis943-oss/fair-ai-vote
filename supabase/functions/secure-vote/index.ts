import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Secure vote endpoint called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { electionId, candidateId, voterPublicKey } = await req.json();

    if (!electionId || !candidateId || !voterPublicKey) {
      throw new Error('Missing required fields');
    }

    console.log('Processing secure vote for election:', electionId);

    // Generate cryptographic values
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomUUID();
    
    // Create vote data to encrypt
    const voteData = {
      electionId,
      candidateId,
      timestamp,
      nonce
    };

    // Generate vote hash (SHA-256)
    const voteString = JSON.stringify(voteData);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(voteString));
    const voteHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Simulate encryption (in production, use proper asymmetric encryption)
    const encryptedVote = btoa(JSON.stringify(voteData));
    
    // Generate digital signature (simplified - in production use proper cryptographic signing)
    const signatureData = voteHash + voterPublicKey + timestamp;
    const signatureBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(signatureData));
    const digitalSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Get or create current vote block
    let currentBlock = await getCurrentBlock(supabase);
    if (!currentBlock || currentBlock.votes_count >= 100) {
      currentBlock = await createNewBlock(supabase, currentBlock);
    }

    // Store encrypted vote
    const { data: voteData_result, error: voteError } = await supabase
      .from('encrypted_votes')
      .insert({
        election_id: electionId,
        vote_hash: voteHash,
        encrypted_vote: encryptedVote,
        digital_signature: digitalSignature,
        voter_public_key: voterPublicKey,
        block_id: currentBlock.id,
        verification_status: 'verified'
      })
      .select()
      .single();

    if (voteError) {
      console.error('Error storing encrypted vote:', voteError);
      throw voteError;
    }

    // Update block vote count
    await supabase
      .from('vote_blocks')
      .update({ 
        votes_count: currentBlock.votes_count + 1,
        merkle_root: await calculateMerkleRoot(supabase, currentBlock.id)
      })
      .eq('id', currentBlock.id);

    // Create audit trail entry
    await supabase
      .from('vote_audit_trail')
      .insert({
        event_type: 'vote_cast',
        election_id: electionId,
        event_data: {
          vote_hash: voteHash,
          block_id: currentBlock.id,
          verification_status: 'verified'
        }
      });

    console.log('Secure vote processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        voteHash,
        blockId: currentBlock.id,
        blockNumber: currentBlock.block_number,
        digitalSignature
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secure-vote function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getCurrentBlock(supabase: any) {
  const { data } = await supabase
    .from('vote_blocks')
    .select('*')
    .order('block_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return data;
}

async function createNewBlock(supabase: any, previousBlock: any) {
  const blockNumber = previousBlock ? previousBlock.block_number + 1 : 1;
  const previousBlockHash = previousBlock ? previousBlock.block_hash : '0';
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();
  
  // Generate block hash
  const blockData = `${blockNumber}${previousBlockHash}${timestamp}${nonce}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(blockData));
  const blockHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const { data, error } = await supabase
    .from('vote_blocks')
    .insert({
      block_number: blockNumber,
      previous_block_hash: previousBlockHash,
      merkle_root: '',
      nonce,
      block_hash: blockHash,
      votes_count: 0
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function calculateMerkleRoot(supabase: any, blockId: string) {
  const { data: votes } = await supabase
    .from('encrypted_votes')
    .select('vote_hash')
    .eq('block_id', blockId);

  if (!votes || votes.length === 0) return '';
  
  // Simple merkle root calculation (in production, use proper merkle tree)
  const hashes = votes.map(v => v.vote_hash);
  const combined = hashes.join('');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(combined));
  
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}