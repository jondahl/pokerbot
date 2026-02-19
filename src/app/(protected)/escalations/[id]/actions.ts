'use server';

import { revalidatePath } from 'next/cache';
import { sendSMS } from '@/lib/sms/twilio';
import { resolveEscalation, getEscalation, createMessage } from '@/lib/data/messages';
import { updateInvitationStatus, getInvitationByGameAndPlayer } from '@/lib/data/invitations';

/**
 * Resolve an escalation with a custom response
 */
export async function resolveEscalationAction(
  escalationId: string,
  playerPhone: string,
  response: string
) {
  try {
    // Send SMS to player
    await sendSMS(playerPhone, response);

    // Get escalation for context
    const escalation = await getEscalation(escalationId);

    // Log outbound message
    if (escalation?.gameId) {
      await createMessage({
        invitationId: escalation.id,
        direction: 'outbound',
        body: response,
      }).catch(() => {
        // If we can't create message with invitation context, that's ok
        console.log('Could not log message with invitation context');
      });
    }

    // Mark escalation as resolved
    await resolveEscalation(escalationId, response);

    revalidatePath('/escalations');
    return { success: true };
  } catch (error) {
    console.error('Failed to resolve escalation:', error);
    return { success: false, error: 'Failed to send response' };
  }
}

/**
 * Confirm a player and resolve escalation
 */
export async function confirmPlayerAction(
  escalationId: string,
  playerId: string,
  playerPhone: string
) {
  try {
    const escalation = await getEscalation(escalationId);

    if (escalation?.gameId) {
      // Find and update the invitation
      const invitation = await getInvitationByGameAndPlayer(escalation.gameId, playerId);
      if (invitation) {
        await updateInvitationStatus(invitation.id, 'confirmed');
      }
    }

    // Send confirmation SMS
    const message = "Great, you're in! See you there.";
    await sendSMS(playerPhone, message);

    // Mark escalation as resolved
    await resolveEscalation(escalationId, message);

    revalidatePath('/escalations');
    revalidatePath('/games');
    return { success: true };
  } catch (error) {
    console.error('Failed to confirm player:', error);
    return { success: false, error: 'Failed to confirm player' };
  }
}

/**
 * Decline a player and resolve escalation
 */
export async function declinePlayerAction(
  escalationId: string,
  playerId: string,
  playerPhone: string
) {
  try {
    const escalation = await getEscalation(escalationId);

    if (escalation?.gameId) {
      // Find and update the invitation
      const invitation = await getInvitationByGameAndPlayer(escalation.gameId, playerId);
      if (invitation) {
        await updateInvitationStatus(invitation.id, 'declined');
      }
    }

    // Send decline acknowledgment SMS
    const message = 'Thanks for letting us know. Maybe next time!';
    await sendSMS(playerPhone, message);

    // Mark escalation as resolved
    await resolveEscalation(escalationId, message);

    revalidatePath('/escalations');
    revalidatePath('/games');
    return { success: true };
  } catch (error) {
    console.error('Failed to decline player:', error);
    return { success: false, error: 'Failed to decline player' };
  }
}
