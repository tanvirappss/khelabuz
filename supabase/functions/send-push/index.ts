// Supabase Edge Function: send-push
// Listen to inserts in notifications table and forward to OneSignal

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID") || "";
    const oneSignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration env variables.");
    }

    // Parse webhook payload
    const body = await req.json();
    console.log("Push webhook trigger body:", JSON.stringify(body));

    // Webhook sends table event structure
    const record = body.record;
    if (!record) {
      return new Response(JSON.stringify({ error: "No record found in webhook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process DRAFT status notifications
    if (record.status !== "DRAFT") {
      return new Response(JSON.stringify({ status: "skipped", reason: `Notification is not in DRAFT status. Current: ${record.status}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send to OneSignal if keys are present.
    // If not, log it and mark it as SENT (useful for local development without credentials)
    if (!oneSignalAppId || !oneSignalRestKey) {
      console.warn("OneSignal credentials are not set (ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY). Simulating send...");
    } else {
      console.log(`Sending OneSignal notification: "${record.title}" -> "${record.message}"`);
      
      const payload = {
        app_id: oneSignalAppId,
        included_segments: ["All"],
        headings: { en: record.title },
        contents: { en: record.message },
        data: {
          category: record.category,
          match_id: record.match_id
        }
      };

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${oneSignalRestKey}`
        },
        body: JSON.stringify(payload)
      });

      const resText = await response.text();
      console.log("OneSignal API response status:", response.status, "body:", resText);

      if (!response.ok) {
        throw new Error(`OneSignal API returned error status ${response.status}: ${resText}`);
      }
    }

    // Update database status to SENT using Service Role Client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ status: "SENT", sent_at: new Date().toISOString() })
      .eq("id", record.id);

    if (updateError) {
      console.error("Error updating notification status in database:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, message: "Push notification successfully dispatched" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error processing push notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
