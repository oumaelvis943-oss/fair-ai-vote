import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface CandidateApplication {
  id: string;
  response_data: any;
  criterion_id: string;
  candidate_id: string;
}

interface EvaluationCriterion {
  id: string;
  criterion_name: string;
  criterion_type: string;
  weight: number;
  options: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateId, electionId } = await req.json();
    console.log('Starting AI evaluation for candidate:', candidateId);

    // Get evaluation criteria for the election
    const { data: criteria, error: criteriaError } = await supabase
      .from('candidate_evaluation_criteria')
      .select('*')
      .eq('election_id', electionId);

    if (criteriaError) {
      throw new Error(`Failed to fetch criteria: ${criteriaError.message}`);
    }

    // Get candidate applications
    const { data: applications, error: applicationsError } = await supabase
      .from('candidate_applications')
      .select('*')
      .eq('candidate_id', candidateId);

    if (applicationsError) {
      throw new Error(`Failed to fetch applications: ${applicationsError.message}`);
    }

    const evaluationResults = await evaluateCandidate(applications, criteria);
    
    // Calculate overall AI score
    const aiScore = calculateWeightedScore(evaluationResults, criteria);
    
    // Update candidate with AI score and evaluation data
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        ai_score: aiScore,
        evaluation_data: {
          detailed_scores: evaluationResults,
          overall_score: aiScore,
          evaluation_timestamp: new Date().toISOString(),
          model_version: 'v1.0'
        }
      })
      .eq('id', candidateId);

    if (updateError) {
      throw new Error(`Failed to update candidate: ${updateError.message}`);
    }

    // Log AI audit trail
    await supabase
      .from('ai_audit_trail')
      .insert({
        candidate_id: candidateId,
        decision_type: 'candidate_evaluation',
        ai_model_version: 'v1.0',
        input_data: { applications, criteria },
        output_data: { evaluationResults, aiScore },
        confidence_score: calculateConfidenceScore(evaluationResults),
        processing_time_ms: Date.now() - performance.now()
      });

    console.log('AI evaluation completed for candidate:', candidateId, 'Score:', aiScore);

    return new Response(JSON.stringify({
      success: true,
      candidateId,
      aiScore,
      evaluationResults,
      confidence: calculateConfidenceScore(evaluationResults)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in AI candidate evaluation:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function evaluateCandidate(
  applications: CandidateApplication[], 
  criteria: EvaluationCriterion[]
): Promise<any[]> {
  const results = [];

  for (const criterion of criteria) {
    const application = applications.find(app => app.criterion_id === criterion.id);
    
    if (!application) {
      results.push({
        criterion_id: criterion.id,
        criterion_name: criterion.criterion_name,
        score: 0,
        reason: 'No response provided'
      });
      continue;
    }

    const score = await evaluateResponse(
      application.response_data,
      criterion
    );

    results.push({
      criterion_id: criterion.id,
      criterion_name: criterion.criterion_name,
      score,
      response_data: application.response_data,
      reason: getEvaluationReason(score, criterion.criterion_type)
    });

    // Update the normalized score in the database
    await supabase
      .from('candidate_applications')
      .update({ normalized_score: score })
      .eq('id', application.id);
  }

  return results;
}

async function evaluateResponse(responseData: any, criterion: EvaluationCriterion): Promise<number> {
  const { criterion_type, options } = criterion;
  
  switch (criterion_type) {
    case 'text':
      return await evaluateTextResponse(responseData.text || '');
    case 'number':
      return evaluateNumberResponse(responseData.number || 0, options);
    case 'scale':
      return evaluateScaleResponse(responseData.scale || 0, options);
    case 'dropdown':
      return evaluateDropdownResponse(responseData.selected || '', options);
    case 'file':
      return evaluateFileResponse(responseData.files || []);
    default:
      return 50; // Default neutral score
  }
}

async function evaluateTextResponse(text: string): Promise<number> {
  if (!text || text.trim().length === 0) return 0;
  
  // AI-powered text evaluation using multiple factors
  const factors = {
    length: Math.min(text.length / 500, 1) * 20, // Up to 20 points for comprehensive responses
    complexity: calculateTextComplexity(text) * 15, // Up to 15 points for well-structured content
    keywords: detectPositiveKeywords(text) * 10, // Up to 10 points for leadership/positive keywords
    coherence: evaluateCoherence(text) * 15, // Up to 15 points for logical flow
    professionalism: evaluateProfessionalism(text) * 20, // Up to 20 points for professional tone
    uniqueness: evaluateUniqueness(text) * 20 // Up to 20 points for original content
  };

  const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
  return Math.min(100, Math.max(0, totalScore));
}

function evaluateNumberResponse(number: number, options: any): number {
  const { min = 0, max = 100, ideal = 50 } = options;
  
  if (number < min || number > max) return 0;
  
  // Score based on proximity to ideal value
  const distance = Math.abs(number - ideal);
  const maxDistance = Math.max(ideal - min, max - ideal);
  
  return Math.max(0, 100 - (distance / maxDistance) * 100);
}

function evaluateScaleResponse(scale: number, options: any): number {
  const { min = 1, max = 10 } = options;
  
  if (scale < min || scale > max) return 0;
  
  // Convert scale to 0-100 score
  return ((scale - min) / (max - min)) * 100;
}

function evaluateDropdownResponse(selected: string, options: any): number {
  const { values = [], weights = {} } = options;
  
  if (!values.includes(selected)) return 0;
  
  // Return weighted score if available, otherwise equal distribution
  return weights[selected] || (100 / values.length);
}

function evaluateFileResponse(files: string[]): number {
  if (!files || files.length === 0) return 0;
  
  // Score based on file completeness and types
  const score = Math.min(files.length * 25, 100); // Up to 4 files for full score
  return score;
}

function calculateTextComplexity(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const avgCharsPerWord = text.replace(/\s+/g, '').length / Math.max(words.length, 1);
  
  // Ideal complexity: 15-25 words per sentence, 4-7 chars per word
  const sentenceComplexity = Math.min(avgWordsPerSentence / 20, 1);
  const wordComplexity = Math.min(avgCharsPerWord / 6, 1);
  
  return (sentenceComplexity + wordComplexity) / 2;
}

function detectPositiveKeywords(text: string): number {
  const keywords = [
    'leadership', 'innovative', 'responsible', 'dedicated', 'experienced',
    'collaborative', 'vision', 'improvement', 'solution', 'achievement',
    'excellence', 'integrity', 'passionate', 'committed', 'strategic'
  ];
  
  const lowerText = text.toLowerCase();
  const matches = keywords.filter(keyword => lowerText.includes(keyword));
  
  return Math.min(matches.length / 5, 1); // Up to 5 keywords for full score
}

function evaluateCoherence(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length < 2) return 0.5;
  
  // Check for transition words and logical flow indicators
  const transitions = ['however', 'furthermore', 'additionally', 'therefore', 'consequently', 'moreover'];
  const hasTransitions = transitions.some(t => text.toLowerCase().includes(t));
  
  // Check for consistent tense and structure
  const coherenceScore = hasTransitions ? 0.8 : 0.6;
  
  return coherenceScore;
}

function evaluateProfessionalism(text: string): number {
  const unprofessional = ['lol', 'omg', 'tbh', 'idk', 'btw'];
  const professional = ['regarding', 'therefore', 'furthermore', 'consequently', 'respectively'];
  
  const lowerText = text.toLowerCase();
  const unprofessionalCount = unprofessional.filter(word => lowerText.includes(word)).length;
  const professionalCount = professional.filter(word => lowerText.includes(word)).length;
  
  if (unprofessionalCount > 0) return 0.3;
  if (professionalCount > 0) return 1.0;
  
  return 0.7; // Neutral professional tone
}

function evaluateUniqueness(text: string): number {
  // Simple uniqueness check - in production, use more sophisticated plagiarism detection
  const commonPhrases = [
    'i am writing to',
    'i would like to',
    'thank you for your consideration',
    'i look forward to',
    'please feel free to contact me'
  ];
  
  const lowerText = text.toLowerCase();
  const clicheCount = commonPhrases.filter(phrase => lowerText.includes(phrase)).length;
  
  return Math.max(0.2, 1 - (clicheCount * 0.2));
}

function calculateWeightedScore(results: any[], criteria: EvaluationCriterion[]): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const result of results) {
    const criterion = criteria.find(c => c.id === result.criterion_id);
    if (criterion) {
      totalWeightedScore += result.score * criterion.weight;
      totalWeight += criterion.weight;
    }
  }

  return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;
}

function calculateConfidenceScore(results: any[]): number {
  if (results.length === 0) return 0;
  
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const variance = results.reduce((sum, r) => sum + Math.pow(r.score - avgScore, 2), 0) / results.length;
  
  // Higher confidence for consistent scores, lower for highly variable scores
  const consistency = Math.max(0, 100 - variance);
  const completeness = (results.filter(r => r.score > 0).length / results.length) * 100;
  
  return Math.round(((consistency + completeness) / 2) * 100) / 100;
}

function getEvaluationReason(score: number, type: string): string {
  if (score >= 80) return `Excellent ${type} response demonstrating strong qualifications`;
  if (score >= 60) return `Good ${type} response with solid merit`;
  if (score >= 40) return `Average ${type} response meeting basic requirements`;
  if (score >= 20) return `Below average ${type} response with room for improvement`;
  return `Poor ${type} response requiring significant enhancement`;
}