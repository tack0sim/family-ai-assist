import { render } from "react-email";
import { Resend } from "resend";
import InvitationEmail from "../../../emails/invitation-email";

export interface SendInvitationEmailParams {
  baseUrl?: string;
  email: string;
  expiresAt: Date;
  familyName: string;
  from?: string;
  invitedByName?: string;
  token: string;
}

/**
 * Send an invitation email to a user
 * Logs failures but doesn't throw - email failures shouldn't block the action
 */
export async function sendInvitationEmail(params: SendInvitationEmailParams) {
  const {
    email,
    familyName,
    invitedByName,
    token,
    expiresAt,
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://family-ai.app",
    from = process.env.RESEND_FROM_EMAIL || "",
  } = params;

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build the invitation link
    const invitationLink = `${baseUrl}/invite/${token}`;

    // Render the email template to HTML
    const emailHtml = render(
      InvitationEmail({
        familyName,
        invitedByName,
        invitationLink,
        expiresAt,
      })
    );

    // Send the email
    const result = await resend.emails.send({
      from,
      to: email,
      subject: `Join ${familyName} on Family Assist`,
      react: emailHtml,
    });

    if (result.error) {
      console.error(
        `Failed to send invitation email to ${email}:`,
        result.error
      );
      return { success: false, error: result.error };
    }

    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error sending invitation email to ${email}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send invitation emails to multiple recipients
 * Returns array of results - individual failures don't block other sends
 */
export async function sendInvitationEmails(
  params: Omit<SendInvitationEmailParams, "email" | "token"> & {
    emails: Array<{ email: string; token: string }>;
  }
) {
  const results = await Promise.all(
    params.emails.map((recipient) =>
      sendInvitationEmail({
        ...params,
        email: recipient.email,
        token: recipient.token,
      })
    )
  );

  return results;
}
