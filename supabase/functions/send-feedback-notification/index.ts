import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FeedbackRequest {
  document_id: string;
  token: string;
  proposal_id?: string;
  proposal_json: Record<string, unknown>;
  publicBaseUrl?: string;
}

interface PostProposal {
  titleChange?: string;
  copyChange?: string;
  comment?: string;
  note?: string;
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

    const { document_id, token, proposal_id, proposal_json, publicBaseUrl }: FeedbackRequest = await req.json();

    console.log("FEEDBACK_NOTIFY_START", { document_id, token, proposal_id });

    // 1. Validate token
    const { data: shareLink, error: linkError } = await supabase
      .from("share_links")
      .select("*")
      .eq("token", token)
      .eq("can_propose", true)
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

    // 2. Get document and calendar info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*, calendar_id")
      .eq("id", document_id)
      .single();

    if (docError || !document) {
      console.error("Document not found:", docError);
      return new Response(
        JSON.stringify({ error: "Documento no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarId = document.calendar_id;
    const contentJson = document.content_json as { 
      calendar: { client_name: string; month_start: string; month_end: string };
    };
    const clientName = contentJson?.calendar?.client_name || "Cliente";
    const monthStart = contentJson?.calendar?.month_start || "";
    const monthEnd = contentJson?.calendar?.month_end || "";
    const period = monthStart && monthEnd 
      ? `${formatMonth(monthStart)} - ${formatMonth(monthEnd)}`
      : "Sin periodo";

    // 3. Save/update proposal
    const now = new Date().toISOString();
    let savedProposalId = proposal_id;

    if (proposal_id) {
      // Update existing proposal
      const { error: updateError } = await supabase
        .from("proposals")
        .update({
          proposal_json,
          status: "submitted",
          submitted_at: now,
          updated_at: now,
        })
        .eq("id", proposal_id);

      if (updateError) {
        console.error("Error updating proposal:", updateError);
        throw updateError;
      }
    } else {
      // Create new proposal
      const { data: newProposal, error: insertError } = await supabase
        .from("proposals")
        .insert([{
          document_id,
          token,
          proposal_json,
          status: "submitted",
          submitted_at: now,
        }])
        .select()
        .single();

      if (insertError) {
        console.error("Error creating proposal:", insertError);
        throw insertError;
      }
      savedProposalId = newProposal.id;
    }

    // 4. Update calendar status to "Editado" + feedback_status and add history entry
    if (calendarId) {
      const { error: calendarError } = await supabase
        .from("content_calendars")
        .update({ 
          status: "Editado",
          feedback_status: "con_feedback" 
        })
        .eq("id", calendarId);

      if (calendarError) {
        console.error("Error updating calendar status:", calendarError);
      }

      // Add entry to content_calendar_edits for history
      const { error: editError } = await supabase
        .from("content_calendar_edits")
        .insert([{
          calendar_id: calendarId,
          action: "feedback_received",
          performed_by: "Cliente (enlace público)",
          details: {
            proposal_id: savedProposalId,
            timestamp: now,
          }
        }]);

      if (editError) {
        console.error("Error adding edit entry:", editError);
      }
    }

    // 5. Get responsibles
    let responsibleEmails: string[] = [];
    if (calendarId) {
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
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") || "Biskit Agencia <noreply@biskitagencia.com>";

    console.log("FEEDBACK_NOTIFY_EMAILS", { 
      calendarId, 
      responsibleEmails,
      fromEmail
    });

    // 6. Calculate summary
    const changes = (proposal_json as { changes?: Record<string, PostProposal> }).changes || {};
    let titleChanges = 0;
    let copyChanges = 0;
    let totalComments = 0;
    let totalNotes = 0;

    Object.values(changes).forEach((postProposal) => {
      if (postProposal.titleChange) titleChanges++;
      if (postProposal.copyChange) copyChanges++;
      if (postProposal.comment) totalComments++;
      if (postProposal.note) totalNotes++;
    });

    const totalChanges = titleChanges + copyChanges + totalComments + totalNotes;

    // 7. Send emails if there are responsibles
    const appUrl = publicBaseUrl || "https://clientesbiskit.lovable.app";
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              padding: 40px 32px; 
              text-align: center; 
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
            .info-row { 
              display: flex; 
              margin-bottom: 8px;
            }
            .info-label { 
              color: #6b7280; 
              font-size: 14px;
              min-width: 70px;
            }
            .info-value { 
              color: #1a1a2e; 
              font-size: 14px;
              font-weight: 600;
            }
            .summary-card { 
              background: #f8fafc; 
              border-radius: 12px; 
              padding: 24px;
              margin: 24px 0;
            }
            .summary-title {
              font-size: 13px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 16px 0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .summary-item { 
              display: flex;
              flex-direction: column;
            }
            .summary-item-label { 
              color: #9ca3af; 
              font-size: 13px;
              margin-bottom: 4px;
            }
            .summary-item-value { 
              font-size: 24px;
              font-weight: 700; 
              color: #1a1a2e;
            }
            .total-row {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
            }
            .total-value {
              font-size: 28px;
              font-weight: 800;
              color: #667eea;
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
              transition: all 0.2s;
            }
            .button-primary { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
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
              color: #667eea;
              font-weight: 600;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Nuevo Feedback Recibido</h1>
                <p>El cliente ha enviado comentarios sobre el calendario</p>
              </div>
              <div class="content">
                <div class="info-row">
                  <span class="info-label">Cliente:</span>
                  <span class="info-value">${clientName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Periodo:</span>
                  <span class="info-value">${period}</span>
                </div>
                
                <div class="summary-card">
                  <p class="summary-title">Resumen de cambios</p>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <span class="summary-item-label">Títulos</span>
                      <span class="summary-item-value">${titleChanges}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-item-label">Copys</span>
                      <span class="summary-item-value">${copyChanges}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-item-label">Comentarios</span>
                      <span class="summary-item-value">${totalComments}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-item-label">Notas</span>
                      <span class="summary-item-value">${totalNotes}</span>
                    </div>
                  </div>
                  <div class="total-row">
                    <span class="total-label">Total de cambios</span>
                    <span class="total-value">${totalChanges}</span>
                  </div>
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
          subject: `Nuevo feedback del cliente: ${clientName} – ${period}`,
          html: emailHtml,
        });

        // Check if Resend returned an error in the response
        if (emailResponse.error) {
          throw new Error(emailResponse.error.message || JSON.stringify(emailResponse.error));
        }

        resendId = emailResponse.data?.id || null;
        emailSent = true;

        console.log("FEEDBACK_NOTIFY_RESULT", { 
          ok: true, 
          resendId,
          to: responsibleEmails 
        });

        // Update notified_at
        if (savedProposalId) {
          await supabase
            .from("proposals")
            .update({ notified_at: now })
            .eq("id", savedProposalId);
        }

        // Log email sent in history with ✅
        await supabase
          .from("content_calendar_edits")
          .insert([{
            calendar_id: calendarId,
            action: "feedback_notification_sent",
            performed_by: "system",
            details: {
              message: "✅ Email enviado a responsables (feedback)",
              emails: responsibleEmails,
              resend_id: resendId,
              timestamp: new Date().toISOString()
            }
          }]);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        emailError = errorMsg;
        emailSent = false;

        console.log("FEEDBACK_NOTIFY_ERROR", { 
          error: errorMsg,
          to: responsibleEmails 
        });
        
        // Log email error in history with ⚠️
        await supabase
          .from("content_calendar_edits")
          .insert([{
            calendar_id: calendarId,
            action: "feedback_notification_error",
            performed_by: "system",
            details: {
              message: "⚠️ Error al enviar email a responsables (feedback)",
              error: errorMsg,
              emails: responsibleEmails,
              timestamp: new Date().toISOString()
            }
          }]);
      }
    } else {
      console.log("FEEDBACK_NOTIFY_NO_RECIPIENTS", { calendarId });
      
      // Log no recipients in history
      await supabase
        .from("content_calendar_edits")
        .insert([{
          calendar_id: calendarId,
          action: "feedback_notification_skipped",
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
        proposal_id: savedProposalId,
        emails_sent: responsibleEmails.length,
        total_changes: totalChanges,
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
    console.log("FEEDBACK_NOTIFY_FATAL_ERROR", { error: errorMessage });
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
