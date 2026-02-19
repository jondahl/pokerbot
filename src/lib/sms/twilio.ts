import twilio from 'twilio';

// Lazy-initialize client to avoid errors during build
let twilioClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export type SendSMSResult = {
  success: boolean;
  messageSid?: string;
  error?: string;
};

/**
 * Format phone number to E.164 format (+1XXXXXXXXXX)
 */
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Add + prefix if missing
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS(
  to: string,
  body: string
): Promise<SendSMSResult> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!fromNumber) {
    return {
      success: false,
      error: 'TWILIO_PHONE_NUMBER not configured',
    };
  }

  try {
    const client = getClient();
    const message = await client.messages.create({
      to: formatPhoneNumber(to),
      from: fromNumber,
      body,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send SMS:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate a Twilio webhook request signature
 * Use this to verify incoming webhooks are actually from Twilio
 */
export function validateWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured for webhook validation');
    return false;
  }

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('Webhook validation failed:', error);
    return false;
  }
}
