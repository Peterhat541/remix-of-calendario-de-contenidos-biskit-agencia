import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Like a Rocket <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PublishCalendarUpdateRequest {
  calendarId: string;
  publicBaseUrl: string;
  performedBy?: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { calendarId, publicBaseUrl, performedBy }: PublishCalendarUpdateRequest =
      await req.json();

    if (!calendarId) {
      return jsonResponse({ error: "calendarId is required" }, 400);
    }

    if (!publicBaseUrl) {
      return jsonResponse({ error: "publicBaseUrl is required" }, 400);
    }

    console.log("PUBLISH_CALENDAR_UPDATE_START", { calendarId, performedBy });

    // 1) Load calendar + contact
    const { data: calendar, error: calError } = await supabase
      .from("content_calendars")
      .select("id, channel, month_start, month_end, calendar_contact_id")
      .eq("id", calendarId)
      .single();

    if (calError || !calendar) {
      console.error("PUBLISH_CALENDAR_UPDATE_CALENDAR_NOT_FOUND", calError);
      return jsonResponse({ error: "Calendar not found" }, 404);
    }

    const { data: contact, error: contactError } = await supabase
      .from("calendar_contacts")
      .select("company_name, email, contact_name")
      .eq("id", calendar.calendar_contact_id)
      .single();

    if (contactError || !contact) {
      console.error("PUBLISH_CALENDAR_UPDATE_CONTACT_NOT_FOUND", contactError);
      return jsonResponse({ error: "Contact not found" }, 404);
    }

    const contactEmail = contact.email || "";
    if (!contactEmail) {
      return jsonResponse(
        { error: "Contact has no email configured" },
        400
      );
    }

    // 2) Load responsibles for reply-to / cc
    let responsibleEmails: string[] = [];
    const { data: responsibles, error: respError } = await supabase
      .from("content_calendar_responsibles")
      .select("team_member_id, team_members_calendar(email)")
      .eq("calendar_id", calendarId);

    if (respError) {
      console.error("PUBLISH_CALENDAR_UPDATE_RESPONSIBLES_ERROR", respError);
    }

    if (responsibles && responsibles.length > 0) {
      responsibleEmails = responsibles
        .flatMap(
          (r: {
            team_members_calendar:
              | Array<{ email: string }>
              | { email: string }
              | null;
          }) => {
            const tm = r.team_members_calendar;
            if (!tm) return [];
            if (Array.isArray(tm)) return tm.map((t) => t.email);
            return [tm.email];
          }
        )
        .filter(Boolean) as string[];
    }

    // 3) Load previous published document + token + latest submitted proposal (to attach in email)
    const { data: prevDocs } = await supabase
      .from("documents")
      .select("id, content_json, created_at")
      .eq("calendar_id", calendarId)
      .order("created_at", { ascending: false })
      .limit(1);

    const prevDoc = prevDocs?.[0] || null;

    let prevToken: string | null = null;
    let prevProposalJson: any | null = null;

    if (prevDoc?.id) {
      const { data: prevLinks } = await supabase
        .from("share_links")
        .select("token, created_at")
        .eq("document_id", prevDoc.id)
        .order("created_at", { ascending: false })
        .limit(1);

      prevToken = prevLinks?.[0]?.token || null;

      if (prevToken) {
        const { data: proposals } = await supabase
          .from("proposals")
          .select("proposal_json, updated_at")
          .eq("token", prevToken)
          .eq("status", "submitted")
          .order("updated_at", { ascending: false })
          .limit(1);

        prevProposalJson = proposals?.[0]?.proposal_json || null;
      }
    }

    // 4) Create NEW document snapshot from current DB posts
    const { data: posts, error: postsError } = await supabase
      .from("calendar_posts")
      .select("*")
      .eq("calendar_id", calendarId)
      .order("post_order", { ascending: true });

    if (postsError) {
      console.error("PUBLISH_CALENDAR_UPDATE_POSTS_ERROR", postsError);
      throw postsError;
    }

    const monthsMap = new Map<string, any>();
    (posts || []).forEach((post: any) => {
      const key = `${post.month_name}-${post.month_year}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          month: post.month_name,
          year: post.month_year,
          posts: [],
        });
      }

      monthsMap.get(key).posts.push({
        id: post.id,
        day_of_month: post.day_of_month,
        image: {
          source: post.image_source || "none",
          clipboard_data_url: post.image_source === "clipboard" ? post.image_url : "",
          file_url: post.image_source === "file" ? post.image_url : "",
        },
        title: post.title || "",
        copy: post.copy || "",
      });
    });

    const contentJson = {
      calendar: {
        client_name: contact.company_name || "",
        brand: "",
        channel: calendar.channel,
        month_start: calendar.month_start,
        month_end: calendar.month_end,
      },
      months: Array.from(monthsMap.values()),
    };

    const { data: newDoc, error: docError } = await supabase
      .from("documents")
      .insert([
        {
          calendar_id: calendarId,
          content_json: contentJson,
        },
      ])
      .select("id")
      .single();

    if (docError || !newDoc) {
      console.error("PUBLISH_CALENDAR_UPDATE_DOC_ERROR", docError);
      throw docError;
    }

    // 5) Create NEW share link
    const newToken = crypto.randomUUID() + "-" + Date.now().toString(36);
    const baseUrl = publicBaseUrl.replace(/\/$/, "");
    const shareUrl = `${baseUrl}/share/${newToken}`;

    const { error: linkError } = await supabase
      .from("share_links")
      .insert([
        {
          document_id: newDoc.id,
          token: newToken,
          can_view: true,
          can_propose: true,
        },
      ]);

    if (linkError) {
      console.error("PUBLISH_CALENDAR_UPDATE_LINK_ERROR", linkError);
      throw linkError;
    }

    // 6) Compose email to the client (include feedback summary if exists)
    const period = `${formatMonth(calendar.month_start)} – ${formatMonth(
      calendar.month_end
    )}`;

    const feedbackHtml = buildFeedbackHtml(prevDoc?.content_json, prevProposalJson);

    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; margin: 0; padding: 0; }
      .container { max-width: 680px; margin: 0 auto; padding: 24px; }
      .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white; padding: 28px; border-radius: 14px 14px 0 0; }
      .header h1 { margin: 0; font-size: 20px; }
      .header p { margin: 8px 0 0; opacity: 0.95; }
      .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 14px 14px; }
      .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
      .btn { display: inline-block; background: #4f46e5; color: white !important; text-decoration: none; padding: 12px 16px; border-radius: 10px; font-weight: 600; }
      .muted { color: #475569; font-size: 14px; }
      .footer { text-align: center; color: #94a3b8; font-size: 12px; padding-top: 16px; }
      ul { margin: 8px 0 0 18px; }
      code { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Calendario actualizado</h1>
        <p><strong>${escapeHtml(contact.company_name || "")}</strong> · ${escapeHtml(
      calendar.channel || ""
    )} · ${escapeHtml(period)}</p>
      </div>
      <div class="content">
        <p>Hola${contact.contact_name ? ` ${escapeHtml(contact.contact_name)}` : ""},</p>
        <p>Hemos actualizado el calendario con los cambios correspondientes.</p>

        <div class="card">
          <p style="margin-top: 0"><strong>Enlace actualizado:</strong></p>
          <p class="muted" style="margin: 8px 0 14px">Puedes revisarlo aquí:</p>
          <p><a class="btn" href="${escapeHtml(shareUrl)}" target="_blank" rel="noreferrer">Ver calendario actualizado</a></p>
          <p class="muted" style="margin-bottom: 0">Si el botón no funciona, copia y pega este enlace:<br /><code>${escapeHtml(
      shareUrl
    )}</code></p>
        </div>

        ${feedbackHtml}

        <p class="muted">Gracias y seguimos en contacto.</p>
        <p>Un saludo,<br />Equipo Like a Rocket</p>

        <div class="footer">Enviado automáticamente</div>
      </div>
    </div>
  </body>
</html>
    `.trim();

    const emailOptions: any = {
      from: FROM_EMAIL,
      to: [contactEmail],
      subject: `Calendario actualizado – ${contact.company_name} – ${period}`,
      html: emailHtml,
    };

    if (responsibleEmails.length > 0) {
      emailOptions.reply_to = responsibleEmails[0];
      if (responsibleEmails.length > 1) {
        emailOptions.cc = responsibleEmails.slice(1);
      }
    }

    const emailResponse = await resend.emails.send(emailOptions);

    if ((emailResponse as any)?.error) {
      throw new Error((emailResponse as any).error.message || "Email send error");
    }

    // 7) Log event
    await supabase.from("content_calendar_edits").insert([
      {
        calendar_id: calendarId,
        action: "calendar_update_sent",
        performed_by: performedBy || null,
        template_name: "Actualización automática",
        details: {
          to: contactEmail,
          reply_to: responsibleEmails[0] || null,
          cc: responsibleEmails.slice(1),
          share_link: shareUrl,
          new_document_id: newDoc.id,
          timestamp: new Date().toISOString(),
        },
      },
    ]);

    console.log("PUBLISH_CALENDAR_UPDATE_DONE", {
      calendarId,
      newDocumentId: newDoc.id,
      shareUrl,
    });

    return jsonResponse({
      success: true,
      documentId: newDoc.id,
      token: newToken,
      shareUrl,
      email_sent: true,
    });
  } catch (error: any) {
    console.error("PUBLISH_CALENDAR_UPDATE_ERROR", error);
    return jsonResponse({ success: false, error: error?.message || String(error) }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function escapeHtml(input: string): string {
  return (input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMonth(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function buildFeedbackHtml(prevContentJson: any, proposalJson: any): string {
  if (!proposalJson) {
    return "";
  }

  const changes: Record<string, any> = proposalJson?.changes || {};
  const generalNotes: string[] = proposalJson?.generalNotes || [];

  const hasAny =
    Object.values(changes).some((c: any) =>
      Boolean(
        c?.titleChange ||
          c?.copyChange ||
          (Array.isArray(c?.comments) && c.comments.length > 0) ||
          (Array.isArray(c?.notes) && c.notes.length > 0)
      )
    ) || (Array.isArray(generalNotes) && generalNotes.length > 0);

  if (!hasAny) return "";

  const postMetaById = new Map<string, { title: string; day: any; month: string; year: any }>();
  try {
    const months = prevContentJson?.months || [];
    months.forEach((m: any) => {
      (m.posts || []).forEach((p: any) => {
        postMetaById.set(p.id, {
          title: p.title || "(Sin título)",
          day: p.day_of_month,
          month: m.month,
          year: m.year,
        });
      });
    });
  } catch {
    // ignore
  }

  const itemsHtml = Object.entries(changes)
    .map(([postId, c]) => {
      const meta = postMetaById.get(postId);
      const labelParts = [
        meta?.day ? `Día ${meta.day}` : null,
        meta?.month ? `${meta.month}${meta?.year ? ` ${meta.year}` : ""}` : null,
      ].filter(Boolean);

      const label = labelParts.length > 0 ? `(${labelParts.join(" · ")})` : "";

      const sub: string[] = [];
      if (c?.titleChange) sub.push(`<li><strong>Título propuesto:</strong> “${escapeHtml(c.titleChange)}”</li>`);
      if (c?.copyChange) sub.push(`<li><strong>Copy propuesto:</strong> “${escapeHtml(c.copyChange)}”</li>`);

      if (Array.isArray(c?.comments) && c.comments.length > 0) {
        sub.push(`<li><strong>Comentarios:</strong><ul>${c.comments.map((x: string) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></li>`);
      }
      if (Array.isArray(c?.notes) && c.notes.length > 0) {
        sub.push(`<li><strong>Notas:</strong><ul>${c.notes.map((x: string) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></li>`);
      }

      if (sub.length === 0) return "";

      return `
<li>
  <strong>${escapeHtml(meta?.title || `Post ${postId.slice(0, 8)}`)}</strong> ${escapeHtml(label)}
  <ul>
    ${sub.join("\n")}
  </ul>
</li>
      `.trim();
    })
    .filter(Boolean)
    .join("\n");

  const generalNotesHtml =
    Array.isArray(generalNotes) && generalNotes.length > 0
      ? `<div class="card"><p style="margin-top:0"><strong>Notas generales:</strong></p><ul>${generalNotes
          .map((n) => `<li>${escapeHtml(n)}</li>`)
          .join("")}</ul></div>`
      : "";

  return `
<div class="card">
  <p style="margin-top:0"><strong>Feedback recibido:</strong></p>
  <p class="muted" style="margin: 6px 0 0">Incluimos aquí el feedback asociado a esta actualización, para referencia.</p>
  <ul>
    ${itemsHtml || "<li>(Sin cambios detallados)</li>"}
  </ul>
</div>
${generalNotesHtml}
  `.trim();
}
