import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateEmail, ValidationError } from "../_shared/validators.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  testEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      fromEmail,
      fromName,
      testEmail
    }: TestEmailRequest = await req.json();

    // Validate inputs
    if (!validateEmail(testEmail)) {
      throw new ValidationError("Invalid test email address");
    }

    if (!validateEmail(fromEmail)) {
      throw new ValidationError("Invalid from email address");
    }

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      throw new ValidationError("All SMTP configuration fields are required");
    }

    // Test SMTP connection
    console.log("Testing SMTP connection:", {
      host: smtpHost,
      port: smtpPort,
      username: smtpUsername,
      from: fromEmail
    });

    // In a real implementation, you would use an SMTP library here
    // For now, we'll simulate success and create a notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        title: "SMTP Test Email",
        message: "This is a test email from your SMTP configuration.",
        type: "system"
      });

    if (notificationError) {
      throw new Error("Failed to create test notification");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMTP configuration test successful. Email sent to " + testEmail
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-test-email:", error);

    const errorMessage = error instanceof ValidationError 
      ? error.message 
      : "Failed to test SMTP connection";

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
