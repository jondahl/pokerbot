import { sendSMS } from '@/lib/sms/twilio';
import {
  getInvitation,
  markInvitationAsSent,
  updateInvitationStatus,
  getNextPendingInvitation,
  updatePlayerResponseStats,
  getConfirmedCount,
  updateInvitationCalendarEvent,
} from '@/lib/data/invitations';
import { getGame } from '@/lib/data/games';
import { optOutPlayer } from '@/lib/data/players';
import { createCalendarEvent } from '@/lib/calendar';
import type { ParsedResponse, SideEffect } from '@/lib/llm/claude';

export type SendInvitationResult = {
  success: boolean;
  messageSid?: string;
  error?: string;
};

export type ProcessResponseResult = {
  success: boolean;
  smsResponse?: string;
  error?: string;
};

/**
 * Format the invitation message
 */
function formatInvitationMessage(
  gameDate: Date,
  gameTime: Date,
  location: string
): string {
  const dateStr = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = gameTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `Poker game ${dateStr}, ${timeStr}, at ${location}. Want a spot?\n\nReply STOP to opt out.`;
}

/**
 * Check if we're within the 4-hour cutoff window before game start
 */
function isWithinCutoffWindow(game: { date: Date; time: Date }): boolean {
  const now = new Date();

  // Combine game date and time
  const gameStart = new Date(game.date);
  gameStart.setHours(game.time.getHours());
  gameStart.setMinutes(game.time.getMinutes());
  gameStart.setSeconds(0);

  // Calculate hours until game
  const hoursUntilGame = (gameStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilGame <= 4;
}


/**
 * Send an invitation SMS to a player
 */
export async function sendInvitation(
  invitationId: string
): Promise<SendInvitationResult> {
  const invitation = await getInvitation(invitationId);

  if (!invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  // Don't send to opted-out players
  if (invitation.player.optedOut) {
    return { success: false, error: 'Player has opted out' };
  }

  const game = await getGame(invitation.gameId);

  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  const message = formatInvitationMessage(
    game.date,
    game.time,
    game.location
  );

  const smsResult = await sendSMS(invitation.player.phone, message);

  if (!smsResult.success) {
    return { success: false, error: smsResult.error };
  }

  await markInvitationAsSent(invitationId);

  return { success: true, messageSid: smsResult.messageSid };
}

/**
 * Process a parsed response and execute side effects
 */
export async function processResponse(
  invitationId: string,
  playerId: string,
  parsedResponse: ParsedResponse
): Promise<ProcessResponseResult> {
  if (parsedResponse.action === 'escalate') {
    // Don't process escalations automatically
    return {
      success: true,
      smsResponse: undefined, // No auto-response for escalations
    };
  }

  const sideEffects = parsedResponse.sideEffects;

  // Process each side effect
  for (const effect of sideEffects) {
    await processSideEffect(invitationId, playerId, effect);
  }

  return {
    success: true,
    smsResponse: parsedResponse.response,
  };
}

/**
 * Process a single side effect
 */
async function processSideEffect(
  invitationId: string,
  playerId: string,
  effect: SideEffect
): Promise<void> {
  switch (effect) {
    case 'confirm_player':
      await updateInvitationStatus(invitationId, 'confirmed');
      await updatePlayerResponseStats(playerId, true);
      break;

    case 'decline_player':
      await updateInvitationStatus(invitationId, 'declined');
      await updatePlayerResponseStats(playerId, true);
      break;

    case 'opt_out_player':
      await updateInvitationStatus(invitationId, 'declined');
      await optOutPlayer(playerId);
      break;

    case 'send_calendar_invite':
      // Get invitation and game details for calendar event
      const invitationForCalendar = await getInvitation(invitationId);
      if (!invitationForCalendar) {
        console.error('Cannot send calendar invite: invitation not found', invitationId);
        break;
      }

      const gameForCalendar = await getGame(invitationForCalendar.gameId);
      if (!gameForCalendar) {
        console.error('Cannot send calendar invite: game not found', invitationForCalendar.gameId);
        break;
      }

      const calendarResult = await createCalendarEvent({
        gameDate: gameForCalendar.date,
        gameTime: gameForCalendar.time,
        timeBlock: gameForCalendar.timeBlock,
        location: gameForCalendar.location,
        entryInstructions: gameForCalendar.entryInstructions ?? undefined,
        attendeeEmail: invitationForCalendar.player.email,
        attendeeName: `${invitationForCalendar.player.firstName} ${invitationForCalendar.player.lastName}`,
      });

      if (calendarResult.success && calendarResult.eventId) {
        await updateInvitationCalendarEvent(invitationId, calendarResult.eventId, 'pending');
        console.log('Calendar invite sent for invitation:', invitationId, 'eventId:', calendarResult.eventId);
      } else {
        // Log error but don't fail the confirmation - calendar is secondary
        console.error('Failed to send calendar invite:', calendarResult.error);
      }
      break;

    case 'invite_next':
      // Get the invitation to find the game
      const invitation = await getInvitation(invitationId);
      if (invitation) {
        await inviteNextPlayer(invitation.gameId);
      }
      break;
  }
}

/**
 * Invite the next player in the queue
 */
export async function inviteNextPlayer(gameId: string): Promise<boolean> {
  const game = await getGame(gameId);

  if (!game) {
    console.error('Game not found:', gameId);
    return false;
  }

  // Don't send invites within 4 hours of game start
  if (isWithinCutoffWindow(game)) {
    console.log('Within 4-hour cutoff window, not sending more invites:', gameId);
    return false;
  }

  // Check if we have room for more players
  const confirmedCount = await getConfirmedCount(gameId);

  if (confirmedCount >= game.capacity) {
    console.log('Game is full:', gameId);
    return false;
  }

  // Get next pending invitation
  const nextInvitation = await getNextPendingInvitation(gameId);

  if (!nextInvitation) {
    console.log('No more pending invitations for game:', gameId);
    return false;
  }

  // Send the invitation
  const result = await sendInvitation(nextInvitation.id);

  return result.success;
}

/**
 * Send invitations to fill a game to capacity
 */
export async function sendInvitationsForGame(
  gameId: string,
  batchSize: number = 5
): Promise<number> {
  const game = await getGame(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  let sentCount = 0;
  const confirmedCount = await getConfirmedCount(gameId);
  const spotsToFill = game.capacity - confirmedCount;

  // Send invitations up to batchSize or spotsToFill, whichever is smaller
  const toSend = Math.min(batchSize, spotsToFill);

  for (let i = 0; i < toSend; i++) {
    const invitation = await getNextPendingInvitation(gameId);

    if (!invitation) {
      break;
    }

    const result = await sendInvitation(invitation.id);

    if (result.success) {
      sentCount++;
    }
  }

  return sentCount;
}
