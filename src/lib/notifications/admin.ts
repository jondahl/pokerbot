import { sendSMS } from '@/lib/sms/twilio';

// Admin phone numbers from environment
const ADMIN_PHONES = (process.env.ADMIN_PHONE_NUMBERS || '').split(',').filter(Boolean);

export type EscalationNotification = {
  playerName: string;
  playerPhone: string;
  message: string;
  reason: string;
  gameDate?: string;
  gameLocation?: string;
};

/**
 * Notify admins about an escalation via SMS
 */
export async function notifyAdminsOfEscalation(
  escalation: EscalationNotification
): Promise<{ sent: number; failed: number }> {
  if (ADMIN_PHONES.length === 0) {
    console.log('No admin phones configured, skipping escalation notification');
    return { sent: 0, failed: 0 };
  }

  const notificationText = formatEscalationNotification(escalation);
  let sent = 0;
  let failed = 0;

  for (const phone of ADMIN_PHONES) {
    try {
      await sendSMS(phone.trim(), notificationText);
      sent++;
    } catch (error) {
      console.error(`Failed to notify admin ${phone}:`, error);
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Format escalation notification message
 */
function formatEscalationNotification(escalation: EscalationNotification): string {
  let message = `[Escalation] ${escalation.playerName} (${escalation.playerPhone}): "${escalation.message}"`;

  if (escalation.gameDate) {
    message += ` | Game: ${escalation.gameDate}`;
  }

  message += ` | Reason: ${escalation.reason}`;
  message += ' | Reply in admin portal.';

  // Truncate if too long for SMS
  if (message.length > 160) {
    message = message.substring(0, 157) + '...';
  }

  return message;
}

/**
 * Check if admin notifications are configured
 */
export function isAdminNotificationsConfigured(): boolean {
  return ADMIN_PHONES.length > 0;
}
