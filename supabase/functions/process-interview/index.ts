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

    const { candidateId, electionId, audioData, candidateInfo } = await req.json();

    if (!candidateId || !electionId || !audioData) {
      throw new Error('Candidate ID, election ID, and audio data are required');
    }

    console.log('Processing interview for candidate:', candidateId);

    // Step 1: Transcribe audio using OpenAI Whisper
    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', audioBlob, 'interview.webm');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcript = transcriptionResult.text;

    console.log('Transcription completed, length:', transcript.length);

    // Step 2: Analyze transcript with Gemini AI
    const analysisPrompt = `
You are an expert interviewer and HR professional evaluating a candidate interview transcript for a student council election position.

Candidate Information:
- Name: ${candidateInfo.name}
- Position: ${candidateInfo.position}
- Email: ${candidateInfo.email}

Interview Transcript:
"${transcript}"

Please provide a comprehensive analysis including:

1. **Overall Assessment Score (0-100)**: Based on communication skills, leadership potential, clarity of thought, and relevance to the position.

2. **Communication Skills (0-100)**: Clarity, articulation, confidence, and professionalism.

3. **Leadership Qualities (0-100)**: Evidence of leadership experience, vision, and ability to inspire others.

4. **Position Relevance (0-100)**: Understanding of the role, relevant ideas, and practical solutions.

5. **Confidence & Presence (0-100)**: Poise, self-assurance, and ability to handle pressure.

6. **Detailed Feedback**: 
   - Strengths identified
   - Areas for improvement
   - Specific examples from the transcript
   - Recommendations for development

7. **Summary**: A concise 2-3 sentence overall assessment.

Please format your response as a valid JSON object with the following structure:
{
  "overall_score": number,
  "communication_score": number,
  "leadership_score": number,
  "relevance_score": number,
  "confidence_score": number,
  "strengths": ["strength1", "strength2", "..."],
  "areas_for_improvement": ["area1", "area2", "..."],
  "detailed_feedback": "string",
  "summary": "string",
  "recommendation": "string"
}
`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GOOGLE_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      throw new Error('Failed to analyze interview with AI');
    }

    const geminiResult = await geminiResponse.json();
    const aiAnalysis = geminiResult.candidates[0].content.parts[0].text;

    console.log('AI analysis completed');

    // Parse AI response (handle potential JSON parsing errors)
    let aiFeedback;
    try {
      // Remove any markdown code block formatting if present
      const cleanAnalysis = aiAnalysis.replace(/```json\n?|\n?```/g, '').trim();
      aiFeedback = JSON.parse(cleanAnalysis);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to storing raw analysis
      aiFeedback = {
        overall_score: 75,
        summary: aiAnalysis.substring(0, 500) + '...',
        raw_analysis: aiAnalysis
      };
    }

    // Step 3: Store interview results
    const interviewData = {
      candidate_id: candidateId,
      election_id: electionId,
      transcript: transcript,
      interview_score: aiFeedback.overall_score || 75,
      ai_feedback: aiFeedback,
      interview_date: new Date().toISOString(),
    };

    // Check if interview already exists
    const { data: existingInterview } = await supabaseClient
      .from('candidate_interviews')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('election_id', electionId)
      .maybeSingle();

    let result;
    if (existingInterview) {
      // Update existing interview
      const { data, error } = await supabaseClient
        .from('candidate_interviews')
        .update(interviewData)
        .eq('id', existingInterview.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new interview
      const { data, error } = await supabaseClient
        .from('candidate_interviews')
        .insert(interviewData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Step 4: Record in AI audit trail
    await supabaseClient
      .from('ai_audit_trail')
      .insert({
        candidate_id: candidateId,
        decision_type: 'interview_analysis',
        input_data: {
          transcript_length: transcript.length,
          candidate_info: candidateInfo
        },
        output_data: aiFeedback,
        confidence_score: aiFeedback.overall_score,
        processing_time_ms: Date.now() // Rough estimate
      });

    console.log('Interview processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        interview_id: result.id,
        transcript: transcript,
        ai_feedback: aiFeedback,
        score: aiFeedback.overall_score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-interview:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to process interview'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});