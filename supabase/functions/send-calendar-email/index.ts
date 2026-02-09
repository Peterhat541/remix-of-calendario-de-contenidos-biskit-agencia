import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Biskit Agencia <noreply@biskitagencia.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  calendarId: string;
  contactEmail: string;
  responsibleEmails: string[];
  subject: string;
  message: string;
  companyName: string;
  channel: string;
  period: string;
  shareLink?: string;
  templateType?: string;
  templateLabel?: string;
  performedBy?: string;
  agencies?: string[];
}

// Biskit Agencia branding (single agency)
const getBranding = () => ({
  name: 'Biskit Agencia',
  headerBg: '#0a0a0a',
  headerText: '#facc15',
  accentColor: '#facc15',
  badgeBg: '#1a1a1a',
  badgeText: '#facc15',
  footerText: 'Enviado por Biskit Agencia'
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      calendarId, 
      contactEmail, 
      responsibleEmails, 
      subject, 
      message, 
      companyName, 
      channel, 
      period,
      shareLink,
      templateType,
      templateLabel,
      performedBy,
      agencies
    }: SendEmailRequest = await req.json();

    const safeResponsibleEmails = responsibleEmails || [];
    
    console.log(`Sending email for calendar ${calendarId} to ${contactEmail}`);
    console.log(`Template: ${templateType || 'blank'} (${templateLabel || 'Sin plantilla'}), Share Link: ${shareLink || 'none'}`);
    console.log(`Reply-To: ${safeResponsibleEmails[0] || 'none'}, CC: ${safeResponsibleEmails.slice(1).join(', ') || 'none'}`);
    console.log(`Performed by: ${performedBy || 'unknown'}`);
    console.log(`Agencies: ${agencies?.join(', ') || 'none'}`);

    // Validate required fields
    if (!calendarId || !contactEmail || !subject || !message) {
      throw new Error("Missing required fields: calendarId, contactEmail, subject, and message are required");
    }

    // Validate contact email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      throw new Error(`Invalid contact email address: ${contactEmail}`);
    }

    // Validate responsible emails if provided
    for (const email of safeResponsibleEmails) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid responsible email address: ${email}`);
      }
    }

    // Get branding
    const branding = getBranding();

    // Build CC list (all responsibles except the first one)
    const ccEmails = safeResponsibleEmails.length > 1 ? safeResponsibleEmails.slice(1) : undefined;

    const headerStyle = `background-color: ${branding.headerBg};`;

    // Build HTML email with agency branding
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { ${headerStyle} color: ${branding.headerText}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header .agency-name { font-size: 14px; font-weight: bold; margin-bottom: 15px; letter-spacing: 1px; color: ${branding.headerText}; }
            .header h1 { margin: 0; font-size: 24px; color: ${branding.headerText}; }
            .header p { margin: 10px 0 0; opacity: 0.9; color: ${branding.headerText}; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: 0; }
            .message { background: white; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .info-badge { display: inline-block; background: ${branding.badgeBg}; color: ${branding.badgeText}; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 5px 5px 0 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="agency-name">${branding.name.toUpperCase()}</div>
              <h1>📅 Calendario de Contenidos</h1>
              <p>${companyName}</p>
            </div>
            <div class="content">
              <div style="margin-bottom: 15px;">
                <span class="info-badge">📱 ${channel}</span>
                <span class="info-badge">📆 ${period}</span>
              </div>
              <div class="message">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
              <p>${branding.footerText}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Prepare email options
    const emailOptions: any = {
      from: FROM_EMAIL,
      to: [contactEmail],
      subject: subject,
      html: htmlContent,
    };

    // Add reply-to if we have responsible emails
    if (safeResponsibleEmails.length > 0) {
      emailOptions.reply_to = safeResponsibleEmails[0];
    }

    // Add CC if there are additional responsibles
    if (ccEmails && ccEmails.length > 0) {
      emailOptions.cc = ccEmails;
    }

    console.log("Sending email with options:", JSON.stringify({
      from: emailOptions.from,
      to: emailOptions.to,
      reply_to: emailOptions.reply_to,
      cc: emailOptions.cc,
      subject: emailOptions.subject,
      agency: branding.name
    }));

    // Send email using Resend
    const emailResponse = await resend.emails.send(emailOptions);

    console.log("Email sent successfully:", emailResponse);

    // Create Supabase client to log the event
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine action type based on template
    const actionType = templateType === 'send_calendar' ? 'calendar_sent' : 'email_sent';

    // Log successful email send to history
    const { error: logError } = await supabase
      .from("content_calendar_edits")
      .insert([{
        calendar_id: calendarId,
        action: actionType,
        details: {
          to: contactEmail,
          reply_to: safeResponsibleEmails[0] || null,
          cc: ccEmails || [],
          subject: subject,
          share_link: shareLink || null,
          agencies: agencies || [],
          timestamp: new Date().toISOString()
        },
        performed_by: performedBy || null,
        template_name: templateLabel || (templateType === 'blank' ? 'Sin plantilla' : templateType)
      }]);

    if (logError) {
      console.error("Error logging email event:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-calendar-email function:", error);

    // Try to log the error if we have calendarId
    try {
      const body = await req.clone().json();
      if (body.calendarId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("content_calendar_edits")
          .insert([{
            calendar_id: body.calendarId,
            action: "email_error",
            details: {
              error: error.message,
              timestamp: new Date().toISOString()
            }
          }]);
      }
    } catch (logErr) {
      console.error("Error logging email error:", logErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);