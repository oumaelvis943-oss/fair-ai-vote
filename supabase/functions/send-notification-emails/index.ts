import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables: any;
}

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
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

    const { 
      templateName, 
      recipients, 
      variables = {},
      electionId,
      isBulk = false 
    } = await req.json();

    if (!templateName || !recipients || recipients.length === 0) {
      throw new Error('Template name and recipients are required');
    }

    console.log('Sending emails:', { templateName, recipientCount: recipients.length, isBulk });

    // Get SMTP configuration
    const { data: smtpConfig, error: smtpError } = await supabaseClient
      .from('smtp_config')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (smtpError || !smtpConfig) {
      throw new Error('SMTP configuration not found or not active');
    }

    // Get email template
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_name', templateName)
      .single();

    if (templateError || !template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.host,
        port: smtpConfig.port,
        tls: true,
        auth: {
          username: smtpConfig.username,
          password: smtpConfig.password,
        },
      },
    });

    const results = [];
    const errors = [];

    // Process recipients
    for (const recipient of recipients) {
      try {
        // Merge template variables with provided variables
        const emailVariables = {
          ...template.variables,
          ...variables,
          recipient_name: recipient.name || recipient.email,
          recipient_email: recipient.email,
        };

        // Replace variables in subject and body
        let subject = template.subject;
        let htmlBody = template.body_html;
        let textBody = template.body_text || '';

        // Simple variable replacement ({{variable_name}})
        Object.entries(emailVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, String(value));
          htmlBody = htmlBody.replace(regex, String(value));
          textBody = textBody.replace(regex, String(value));
        });

        // Send email
        await client.send({
          from: `${smtpConfig.from_name} <${smtpConfig.from_email}>`,
          to: recipient.email,
          subject: subject,
          content: textBody,
          html: htmlBody,
        });

        results.push({
          email: recipient.email,
          status: 'sent',
          timestamp: new Date().toISOString()
        });

        console.log('Email sent successfully to:', recipient.email);

      } catch (emailError) {
        console.error('Error sending email to', recipient.email, ':', emailError);
        errors.push({
          email: recipient.email,
          error: emailError.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    await client.close();

    // Log email activity (optional)
    if (electionId) {
      try {
        await supabaseClient
          .from('election_analytics')
          .insert({
            election_id: electionId,
            metric_type: 'email_sent',
            metric_value: results.length,
            additional_data: {
              template: templateName,
              total_recipients: recipients.length,
              successful_sends: results.length,
              failed_sends: errors.length
            }
          });
      } catch (analyticsError) {
        console.error('Error logging email analytics:', analyticsError);
      }
    }

    const response = {
      success: true,
      sent_count: results.length,
      failed_count: errors.length,
      results: results,
      errors: errors,
      template_used: templateName
    };

    console.log('Email sending completed:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-notification-emails:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send emails'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});