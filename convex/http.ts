import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

/**
 * Clerk webhook handler
 * Handles user.created and user.updated events from Clerk
 */
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get the webhook headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get the body
    const body = await request.text();

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    // Handle the webhook event
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const primaryEmail = email_addresses.find(
        (email: any) => email.id === evt.data.primary_email_address_id
      );

      try {
        await ctx.runMutation(internal.users.syncUserFromWebhook, {
          clerkId: id,
          email: primaryEmail?.email_address || "",
          firstName: first_name || undefined,
          lastName: last_name || undefined,
          imageUrl: image_url || undefined,
        });

        console.log(`User ${eventType} webhook processed for ${id}`);
        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error(`Error processing ${eventType} webhook:`, error);
        return new Response("Error processing webhook", { status: 500 });
      }
    }

    // For other event types, just acknowledge receipt
    return new Response("OK", { status: 200 });
  }),
});

export default http;
