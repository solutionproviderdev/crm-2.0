import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient as createStandardClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { SENTINEL_USER_ID } from "@/constants/system";



async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, newCreId, newSalesId } = body;

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    // 1. Auth check
    const cookieStore = await cookies();
    const standardClient = createStandardClient(cookieStore);
    
    const { data: { user: authUser } } = await standardClient.auth.getUser();
    if (!authUser) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: currentUser } = await standardClient
      .from("users")
      .select("type")
      .eq("id", authUser.id)
      .single();

    if (!currentUser || currentUser.type !== "Admin") {
      return new Response("Forbidden. Admin access required.", { status: 403 });
    }

    if (userId === authUser.id) {
      return new Response("You cannot delete your own account.", { status: 400 });
    }

    // Use admin client for destructive operations
    const adminClient = createAdminClient();

    // 2. Setup the stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          let step = 1;

          // Step 1: Reassign CRE leads
          if (newCreId) {
            sendEvent('progress', { step: step++, message: 'Reassigning CRE leads...', percent: 11.1 });
            const { error } = await adminClient
              .from('leads')
              .update({ cre_id: newCreId })
              .eq('cre_id', userId);
            if (error) throw new Error(`CRE Reassignment failed: ${error.message}`);
          } else {
            step++;
          }

          // Step 2: Reassign Sales leads
          if (newSalesId) {
            sendEvent('progress', { step: step++, message: 'Reassigning Sales leads...', percent: 22.2 });
            const { error } = await adminClient
              .from('leads')
              .update({ sales_executive_id: newSalesId })
              .eq('sales_executive_id', userId);
            if (error) throw new Error(`Sales Reassignment failed: ${error.message}`);
          } else {
            step++;
          }

          // Step 3: Reassign messages to SENTINEL
          sendEvent('progress', { step: step++, message: 'Preserving chat messages...', percent: 33.3 });
          const { error: msgError } = await adminClient
            .from('messages')
            .update({ sender_id: SENTINEL_USER_ID })
            .eq('sender_id', userId);
          if (msgError) throw new Error(`Messages reassignment failed: ${msgError.message}`);

          // Step 4: Remove from chat_participants
          sendEvent('progress', { step: step++, message: 'Removing user from chats...', percent: 44.4 });
          const { error: chatError } = await adminClient
            .from('chat_participants')
            .delete()
            .eq('user_id', userId);
          if (chatError) throw new Error(`Chat removal failed: ${chatError.message}`);

          // Log the deletion action in user_activity_logs for the admin before clearing the target's logs
          await adminClient.from('user_activity_logs').insert({
            user_id: authUser.id,
            action: 'DELETED_EMPLOYEE',
            details: `Admin deleted employee with ID: ${userId}`
          });

          // Step 5: Deleting activity logs
          sendEvent('progress', { step: step++, message: 'Deleting activity logs...', percent: 55.5 });
          const { error: logError } = await adminClient
            .from('user_activity_logs')
            .delete()
            .eq('user_id', userId);
          if (logError && logError.code !== 'PGRST116') { // PGRST116 is no rows, which is fine
              console.warn(logError);
          }

          // Step 6: Deleting documents
          sendEvent('progress', { step: step++, message: 'Deleting user documents...', percent: 66.6 });
          const { error: docError } = await adminClient
            .from('user_documents')
            .delete()
            .eq('user_id', userId);
          if (docError) throw new Error(`Document deletion failed: ${docError.message}`);

          // Step 7: Deleting social links
          sendEvent('progress', { step: step++, message: 'Deleting social links...', percent: 77.7 });
          const { error: socialError } = await adminClient
            .from('user_social_links')
            .delete()
            .eq('user_id', userId);
          if (socialError) throw new Error(`Social link deletion failed: ${socialError.message}`);

          // Step 8: Deleting public.users
          sendEvent('progress', { step: step++, message: 'Deleting employee record...', percent: 88.8 });
          const { error: userError } = await adminClient
            .from('users')
            .delete()
            .eq('id', userId);
          if (userError) throw new Error(`User record deletion failed: ${userError.message}`);

          // Step 9: Deleting auth account
          sendEvent('progress', { step: step++, message: 'Deleting auth account...', percent: 100.0 });
          const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
          if (authError) throw new Error(`Auth deletion failed: ${authError.message}`);

          // Final success
          sendEvent('complete', { success: true });
          controller.close();
        } catch (error: any) {
          console.error("Deletion stream error:", error);
          sendEvent('error', { message: error.message || "An unknown error occurred" });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error("API error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
