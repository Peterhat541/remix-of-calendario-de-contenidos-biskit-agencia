import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type ActivityAction =
  | "login"
  | "logout"
  | "calendar_created"
  | "calendar_updated"
  | "calendar_deleted"
  | "email_sent"
  | "user_created"
  | "user_updated"
  | "role_changed"
  | "responsible_assigned";

interface ActivityDetails {
  [key: string]: unknown;
}

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = async (
    action: ActivityAction,
    details: ActivityDetails = {}
  ) => {
    if (!user) {
      console.warn("Cannot log activity: no authenticated user");
      return;
    }

    try {
      const { error } = await supabase.from("user_activity_logs").insert({
        user_id: user.id,
        user_email: user.email || "unknown",
        action,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        console.error("Error logging activity:", error);
      }
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  return { logActivity };
}
