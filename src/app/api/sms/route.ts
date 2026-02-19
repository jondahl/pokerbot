import { NextRequest, NextResponse } from 'next/server';
import { validateWebhook, sendSMS } from '@/lib/sms/twilio';
import { parsePlayerResponse } from '@/lib/llm/claude';
import { getInvitationByPhone } from '@/lib/data/invitations';
import { processResponse } from '@/lib/invitation/flow';
import { prisma } from '@/lib/db/prisma';
import { notifyAdminsOfEscalation } from '@/lib/notifications/admin';

// Store messages for conversation history
import { createMessage, getRecentMessages } from '@/lib/data/messages';

/**
 * Handle incoming SMS from Twilio
 * POST /api/sms
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries()) as Record<string, string>;

    const from = body.From; // Player's phone number
    const messageBody = body.Body?.trim();
    const messageSid = body.MessageSid;

    if (!from || !messageBody) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Optionally validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('x-twilio-signature') || '';
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/sms`;
      const isValid = validateWebhook(signature, url, body);

      if (!isValid) {
        console.error('Invalid Twilio signature');
        return new NextResponse('Invalid signature', { status: 403 });
      }
    }

    // Find active game with invitation for this player
    const activeGame = await prisma.game.findFirst({
      where: {
        status: 'active',
        invitations: {
          some: {
            player: { phone: from },
            status: { in: ['invited', 'confirmed'] },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    if (!activeGame) {
      // No active invitation found - could be opt-out or unknown sender
      if (messageBody.toLowerCase() === 'stop') {
        // Handle opt-out for unknown/no-game sender
        await sendSMS(from, "Got it - you won't receive any more messages.");
        return createTwiMLResponse('');
      }

      // No active game - ignore or send generic response
      console.log('No active game found for phone:', from);
      return createTwiMLResponse('');
    }

    // Get the invitation
    const invitation = await getInvitationByPhone(activeGame.id, from);

    if (!invitation) {
      console.log('No invitation found for phone:', from, 'game:', activeGame.id);
      return createTwiMLResponse('');
    }

    // Store incoming message
    await createMessage({
      invitationId: invitation.id,
      direction: 'inbound',
      body: messageBody,
      twilioSid: messageSid,
    });

    // Get conversation history
    const recentMessages = await getRecentMessages(invitation.id, 5);

    // Parse the response using Claude
    const parsedResponse = await parsePlayerResponse({
      playerMessage: messageBody,
      playerName: invitation.player.firstName,
      playerStatus: invitation.status as 'invited' | 'confirmed' | 'declined',
      gameDate: activeGame.date.toISOString().split('T')[0],
      gameTime: activeGame.time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      gameLocation: activeGame.location,
      gameTimeBlock: activeGame.timeBlock,
      entryInstructions: activeGame.entryInstructions || undefined,
      conversationHistory: recentMessages.map((m) => ({
        role: m.direction === 'inbound' ? 'player' as const : 'bot' as const,
        message: m.body,
      })),
    });

    // Handle escalation
    if (parsedResponse.action === 'escalate') {
      // Store escalation for admin review
      console.log('Escalation needed:', parsedResponse.reason);

      // Store the message with escalation info
      await createMessage({
        invitationId: invitation.id,
        direction: 'inbound',
        body: messageBody,
        twilioSid: messageSid,
        escalationReason: `${parsedResponse.reason}. Suggested: ${parsedResponse.suggestedResponse || 'None'}`,
      });

      // Notify admins of the escalation
      await notifyAdminsOfEscalation({
        playerName: invitation.player.firstName,
        playerPhone: from,
        message: messageBody,
        reason: parsedResponse.reason,
        gameDate: activeGame.date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        gameLocation: activeGame.location,
      });

      // Don't auto-respond for escalations
      return createTwiMLResponse('');
    }

    // Process the response and execute side effects
    const result = await processResponse(
      invitation.id,
      invitation.playerId,
      parsedResponse
    );

    // Send the response
    if (result.smsResponse) {
      await sendSMS(from, result.smsResponse);

      // Store outbound message
      await createMessage({
        invitationId: invitation.id,
        direction: 'outbound',
        body: result.smsResponse,
      });
    }

    // Return empty TwiML (we're sending via API, not TwiML response)
    return createTwiMLResponse('');
  } catch (error) {
    console.error('SMS webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Create a TwiML response
 */
function createTwiMLResponse(message: string): NextResponse {
  const twiml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
