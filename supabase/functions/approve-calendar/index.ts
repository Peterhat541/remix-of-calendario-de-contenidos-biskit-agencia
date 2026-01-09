import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApproveRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token }: ApproveRequest = await req.json();

    console.log("APPROVE_CALENDAR_START", { token });

    // 1. Validate token and get share link
    const { data: shareLink, error: linkError } = await supabase
      .from("share_links")
      .select("*, documents(id, calendar_id, content_json)")
      .eq("token", token)
      .eq("can_view", true)
      .single();

    if (linkError || !shareLink) {
      console.error("Invalid token:", linkError);
      return new Response(
        JSON.stringify({ error: "Token inválido o expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Enlace expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const document = shareLink.documents;
    if (!document || !document.calendar_id) {
      console.error("Document or calendar not found");
      return new Response(
        JSON.stringify({ error: "Documento no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarId = document.calendar_id;
    const contentJson = document.content_json as { 
      calendar: { client_name: string; channel: string; month_start: string; month_end: string };
    };
    const clientName = contentJson?.calendar?.client_name || "Cliente";
    const channel = contentJson?.calendar?.channel || "";
    const monthStart = contentJson?.calendar?.month_start || "";
    const monthEnd = contentJson?.calendar?.month_end || "";
    const period = monthStart && monthEnd 
      ? `${formatMonth(monthStart)} - ${formatMonth(monthEnd)}`
      : "Sin periodo";

    // 2. Check if already approved (idempotency)
    const { data: calendar, error: calError } = await supabase
      .from("content_calendars")
      .select("approval_status, approved_at, approved_via")
      .eq("id", calendarId)
      .single();

    if (calError) {
      console.error("Error fetching calendar:", calError);
      throw calError;
    }

    if (calendar.approval_status === "approved_no_changes" && calendar.approved_at) {
      console.log("Calendar already approved, skipping duplicate action");
      return new Response(
        JSON.stringify({ 
          success: true, 
          already_approved: true,
          message: "El calendario ya fue aprobado anteriormente",
          email_sent: false,
          email_error: null
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Update calendar with approval status + status = Aprobado
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("content_calendars")
      .update({
        status: "Aprobado",
        approval_status: "approved_no_changes",
        approved_at: now,
        approved_via: token,
        feedback_status: "aprobado"
      })
      .eq("id", calendarId);

    if (updateError) {
      console.error("Error updating calendar:", updateError);
      throw updateError;
    }

    // 4. Add history entry
    const { error: editError } = await supabase
      .from("content_calendar_edits")
      .insert([{
        calendar_id: calendarId,
        action: "approved_no_changes",
        performed_by: "Cliente (enlace público)",
        details: {
          timestamp: now,
          via: token
        }
      }]);

    if (editError) {
      console.error("Error adding edit entry:", editError);
    }

    // 5. Get responsibles
    let responsibleEmails: string[] = [];
    const { data: responsibles } = await supabase
      .from("content_calendar_responsibles")
      .select("team_member_id, team_members_calendar(email)")
      .eq("calendar_id", calendarId);

    if (responsibles && responsibles.length > 0) {
      responsibleEmails = responsibles
        .flatMap((r: { team_members_calendar: Array<{ email: string }> | { email: string } | null }) => {
          const tm = r.team_members_calendar;
          if (!tm) return [];
          if (Array.isArray(tm)) return tm.map((t) => t.email);
          return [tm.email];
        })
        .filter(Boolean) as string[];
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") || "Like a Rocket <noreply@likearocket.es>";

    console.log("APPROVE_CALENDAR_EMAILS", { 
      calendarId, 
      responsibleEmails,
      fromEmail
    });

    // 6. Send email to responsibles
    const appUrl = "https://likearocket-calendario.lovable.app";
    const internalLink = `${appUrl}/calendarios/${calendarId}`;
    const publicLink = `${appUrl}/share/${token}`;

    let emailSent = false;
    let emailError: string | null = null;
    let resendId: string | null = null;

    if (responsibleEmails.length > 0) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.7; 
              color: #1a1a2e; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f7fa;
            }
            .wrapper { padding: 40px 20px; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              padding: 40px 32px; 
              text-align: center; 
            }
            .header-icon {
              width: 56px;
              height: 56px;
              background: rgba(255,255,255,0.2);
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 16px;
              font-size: 28px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 22px; 
              font-weight: 700; 
              color: #ffffff; 
              letter-spacing: -0.3px;
            }
            .header p { 
              margin: 12px 0 0; 
              font-size: 15px; 
              color: rgba(255,255,255,0.9);
              font-weight: 400;
            }
            .content { padding: 32px; }
            .status-badge {
              display: inline-block;
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              color: #047857;
              font-size: 13px;
              font-weight: 700;
              padding: 8px 16px;
              border-radius: 20px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 20px;
            }
            .info-card { 
              background: #f8fafc; 
              border-radius: 12px; 
              padding: 24px;
              margin: 20px 0;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .info-row:first-child {
              padding-top: 0;
            }
            .info-label { 
              color: #6b7280; 
              font-size: 14px;
            }
            .info-value { 
              color: #1a1a2e; 
              font-size: 14px;
              font-weight: 600;
              text-align: right;
            }
            .message {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border-radius: 12px;
              padding: 20px 24px;
              margin: 24px 0;
            }
            .message p {
              margin: 0;
              color: #065f46;
              font-size: 15px;
              line-height: 1.6;
            }
            .buttons { 
              margin-top: 28px;
              text-align: center;
            }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              border-radius: 10px; 
              text-decoration: none; 
              font-weight: 600;
              font-size: 14px;
              margin: 6px;
            }
            .button-primary { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: #ffffff !important;
            }
            .button-secondary { 
              background: #f3f4f6; 
              color: #374151 !important;
            }
            .footer { 
              text-align: center; 
              padding: 24px 32px 32px;
              border-top: 1px solid #f3f4f6;
            }
            .footer-text { 
              color: #9ca3af; 
              font-size: 13px;
              margin: 0;
            }
            .footer-brand {
              color: #10b981;
              font-weight: 600;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <div class="header-icon">✓</div>
                <h1>Calendario Aprobado</h1>
                <p>Sin modificaciones solicitadas</p>
              </div>
              <div class="content">
                <div style="text-align: center;">
                  <span class="status-badge">Listo para publicar</span>
                </div>
                
                <div class="info-card">
                  <div class="info-row">
                    <span class="info-label">Cliente</span>
                    <span class="info-value">${clientName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Canal</span>
                    <span class="info-value">${channel}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Periodo</span>
                    <span class="info-value">${period}</span>
                  </div>
                </div>

                <div class="message">
                  <p>El cliente ha revisado el calendario y lo ha aprobado sin ninguna modificación. Puedes proceder con la publicación del contenido según lo planificado.</p>
                </div>

                <div class="buttons">
                  <a href="${internalLink}" class="button button-primary">Ver calendario</a>
                  <a href="${publicLink}" class="button button-secondary">Enlace público</a>
                </div>
              </div>
              <div class="footer">
                <p class="footer-text">Enviado desde <a href="https://likearocket.es" class="footer-brand">Like a Rocket</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: responsibleEmails,
          subject: `✅ Calendario aprobado: ${clientName} – ${period} – Listo para publicar`,
          html: emailHtml,
        });

        // Check if Resend returned an error in the response
        if (emailResponse.error) {
          throw new Error(emailResponse.error.message || JSON.stringify(emailResponse.error));
        }

        resendId = emailResponse.data?.id || null;
        emailSent = true;

        console.log("APPROVE_CALENDAR_RESULT", { 
          ok: true, 
          resendId,
          to: responsibleEmails 
        });

        // Log email sent in history with ✅
        await supabase
          .from("content_calendar_edits")
          .insert([{
            calendar_id: calendarId,
            action: "approval_notification_sent",
            performed_by: "system",
            details: {
              message: "✅ Email enviado a responsables (aprobación)",
              emails: responsibleEmails,
              resend_id: resendId,
              timestamp: new Date().toISOString()
            }
          }]);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        emailError = errorMsg;
        emailSent = false;

        console.log("APPROVE_CALENDAR_ERROR", { 
          error: errorMsg,
          to: responsibleEmails 
        });
        
        // Log email error in history with ⚠️
        await supabase
          .from("content_calendar_edits")
          .insert([{
            calendar_id: calendarId,
            action: "approval_notification_error",
            performed_by: "system",
            details: {
              message: "⚠️ Error al enviar email a responsables (aprobación)",
              error: errorMsg,
              emails: responsibleEmails,
              timestamp: new Date().toISOString()
            }
          }]);
      }
    } else {
      console.log("APPROVE_CALENDAR_NO_RECIPIENTS", { calendarId });
      
      // Log no recipients in history
      await supabase
        .from("content_calendar_edits")
        .insert([{
          calendar_id: calendarId,
          action: "approval_notification_skipped",
          performed_by: "system",
          details: {
            message: "⚠️ No hay responsables configurados para notificar",
            timestamp: new Date().toISOString()
          }
        }]);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        calendar_id: calendarId,
        emails_sent: responsibleEmails.length,
        email_sent: emailSent,
        email_error: emailError,
        resend_id: resendId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log("APPROVE_CALENDAR_FATAL_ERROR", { error: errorMessage });
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        email_sent: false,
        email_error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function formatMonth(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

serve(handler);
