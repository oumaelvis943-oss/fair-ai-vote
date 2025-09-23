import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Brain, 
  FileAudio,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Candidate {
  id: string;
  user_id: string;
  position: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Interview {
  id: string;
  candidate_id: string;
  election_id: string;
  transcript?: string;
  interview_score?: number;
  ai_feedback?: any;
  interview_date?: string;
  audio_file_url?: string;
}

interface AIInterviewSystemProps {
  candidate: Candidate;
  electionId: string;
  onInterviewComplete?: () => void;
}

export default function AIInterviewSystem({ 
  candidate, 
  electionId, 
  onInterviewComplete 
}: AIInterviewSystemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingInterview, setExistingInterview] = useState<Interview | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchExistingInterview();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [candidate.id, electionId]);

  const fetchExistingInterview = async () => {
    try {
      // Skip for now since table might not be available in types
      console.log('Interview system ready for candidate:', candidate.id);
    } catch (error: any) {
      console.error('Error fetching interview:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Interview recording has begun.",
      });
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      toast({
        title: "Recording Completed",
        description: "Interview recording has been saved.",
      });
    }
  };

  const processInterview = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      // Convert audio to base64 for API call
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // Process audio with AI
      const { data, error } = await supabase.functions.invoke('process-interview', {
        body: {
          candidateId: candidate.id,
          electionId: electionId,
          audioData: base64Audio,
          candidateInfo: {
            name: candidate.profiles.full_name,
            position: candidate.position,
            email: candidate.profiles.email,
          }
        },
      });

      if (error) throw error;

      // Refresh interview data
      await fetchExistingInterview();

      toast({
        title: "Interview Processed",
        description: "AI analysis has been completed successfully.",
      });

      if (onInterviewComplete) {
        onInterviewComplete();
      }

      // Clear audio blob after processing
      setAudioBlob(null);
      setRecordingTime(0);

    } catch (error: any) {
      console.error('Error processing interview:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process interview.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setIsPlaying(false);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Candidate Info */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Interview System
          </CardTitle>
          <CardDescription>
            Record and analyze interview for {candidate.profiles.full_name} ({candidate.position})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{candidate.position}</Badge>
            <span className="text-sm text-muted-foreground">{candidate.profiles.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Existing Interview Results */}
      {existingInterview && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Previous Interview Analysis
            </CardTitle>
            <CardDescription>
              Interview conducted on {existingInterview.interview_date ? 
                new Date(existingInterview.interview_date).toLocaleDateString() : 'Unknown date'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingInterview.interview_score && (
              <div className="flex items-center gap-3">
                <span className="font-medium">Overall Score:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getScoreColor(existingInterview.interview_score)}`}></div>
                  <Badge variant="outline">{existingInterview.interview_score}/100</Badge>
                </div>
              </div>
            )}

            {existingInterview.ai_feedback && (
              <div className="space-y-2">
                <h4 className="font-medium">AI Feedback Summary:</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  {typeof existingInterview.ai_feedback === 'object' ? 
                    existingInterview.ai_feedback.summary || 'No summary available' :
                    existingInterview.ai_feedback
                  }
                </div>
              </div>
            )}

            {existingInterview.transcript && (
              <div className="space-y-2">
                <h4 className="font-medium">Transcript:</h4>
                <div className="bg-muted p-3 rounded-lg text-sm max-h-40 overflow-y-auto">
                  {existingInterview.transcript}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recording Interface */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            {existingInterview ? 'Record New Interview' : 'Record Interview'}
          </CardTitle>
          <CardDescription>
            Record a voice interview for AI analysis and feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The AI will analyze communication skills, confidence, clarity, and content relevance.
              Speak clearly and ensure good audio quality for best results.
            </AlertDescription>
          </Alert>

          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-2xl font-mono">
              {formatTime(recordingTime)}
            </div>

            <div className="flex items-center gap-3">
              {!isRecording && !audioBlob && (
                <Button
                  onClick={startRecording}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <>
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="lg"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}

              {audioBlob && !isProcessing && (
                <>
                  <Button
                    onClick={playAudio}
                    variant="outline"
                    size="lg"
                    disabled={isPlaying}
                  >
                    <Play className="h-4 w-4" />
                    {isPlaying ? 'Playing...' : 'Play'}
                  </Button>
                  <Button
                    onClick={processInterview}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Brain className="h-4 w-4" />
                    Process with AI
                  </Button>
                  <Button
                    onClick={() => {
                      setAudioBlob(null);
                      setRecordingTime(0);
                    }}
                    variant="outline"
                    size="lg"
                  >
                    <MicOff className="h-4 w-4" />
                    Re-record
                  </Button>
                </>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span>Processing with AI...</span>
                </div>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Recording in progress...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
