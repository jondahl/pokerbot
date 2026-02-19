import { prisma } from '@/lib/db/prisma';
import type { Invitation, InvitationStatus, CalendarStatus, Player } from '@prisma/client';

export type InvitationWithPlayer = Invitation & {
  player: Player;
};

export type InvitationCreateInput = {
  gameId: string;
  playerId: string;
  position: number;
};

/**
 * Get all invitations for a game, including player info
 */
export async function getInvitationsForGame(
  gameId: string
): Promise<InvitationWithPlayer[]> {
  return prisma.invitation.findMany({
    where: { gameId },
    include: { player: true },
    orderBy: { position: 'asc' },
  });
}

/**
 * Get a specific invitation by ID
 */
export async function getInvitation(
  id: string
): Promise<InvitationWithPlayer | null> {
  return prisma.invitation.findUnique({
    where: { id },
    include: { player: true },
  });
}

/**
 * Get invitation by game and player
 */
export async function getInvitationByGameAndPlayer(
  gameId: string,
  playerId: string
): Promise<InvitationWithPlayer | null> {
  return prisma.invitation.findFirst({
    where: { gameId, playerId },
    include: { player: true },
  });
}

/**
 * Get invitation by player phone number for a specific game
 */
export async function getInvitationByPhone(
  gameId: string,
  phone: string
): Promise<InvitationWithPlayer | null> {
  return prisma.invitation.findFirst({
    where: {
      gameId,
      player: { phone },
    },
    include: { player: true },
  });
}

/**
 * Create a new invitation
 */
export async function createInvitation(
  data: InvitationCreateInput
): Promise<Invitation> {
  return prisma.invitation.create({
    data: {
      ...data,
      status: 'pending',
    },
  });
}

/**
 * Update invitation status
 */
export async function updateInvitationStatus(
  id: string,
  status: InvitationStatus
): Promise<Invitation> {
  return prisma.invitation.update({
    where: { id },
    data: {
      status,
      respondedAt: new Date(),
    },
  });
}

/**
 * Mark an invitation as sent (status: invited)
 */
export async function markInvitationAsSent(id: string): Promise<Invitation> {
  return prisma.invitation.update({
    where: { id },
    data: {
      status: 'invited',
      invitedAt: new Date(),
    },
  });
}

/**
 * Get the next pending invitation for a game (by position order)
 * Skips players who have opted out
 */
export async function getNextPendingInvitation(
  gameId: string
): Promise<InvitationWithPlayer | null> {
  return prisma.invitation.findFirst({
    where: {
      gameId,
      status: 'pending',
      player: { optedOut: false },
    },
    orderBy: { position: 'asc' },
    include: { player: true },
  });
}

/**
 * Get count of confirmed invitations for a game
 */
export async function getConfirmedCount(gameId: string): Promise<number> {
  return prisma.invitation.count({
    where: {
      gameId,
      status: 'confirmed',
    },
  });
}

/**
 * Mark invitations as timed out
 */
export async function markTimedOutInvitations(
  gameId: string,
  deadline: Date
): Promise<number> {
  const result = await prisma.invitation.updateMany({
    where: {
      gameId,
      status: 'invited',
      invitedAt: { lt: deadline },
      respondedAt: null,
    },
    data: {
      status: 'timeout',
    },
  });

  return result.count;
}

/**
 * Update player's response stats after they respond
 */
export async function updatePlayerResponseStats(
  playerId: string,
  responded: boolean
): Promise<void> {
  if (responded) {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        responseCount: { increment: 1 },
        lastInvitedAt: new Date(),
      },
    });
  } else {
    // Timed out
    await prisma.player.update({
      where: { id: playerId },
      data: {
        timeoutCount: { increment: 1 },
        lastInvitedAt: new Date(),
      },
    });
  }
}

/**
 * Update invitation with calendar event ID
 */
export async function updateInvitationCalendarEvent(
  id: string,
  googleCalendarEventId: string,
  calendarStatus: CalendarStatus = 'pending'
): Promise<Invitation> {
  return prisma.invitation.update({
    where: { id },
    data: {
      googleCalendarEventId,
      calendarStatus,
    },
  });
}

/**
 * Clear calendar event from invitation (when event is cancelled)
 */
export async function clearInvitationCalendarEvent(
  id: string
): Promise<Invitation> {
  return prisma.invitation.update({
    where: { id },
    data: {
      googleCalendarEventId: null,
      calendarStatus: null,
    },
  });
}

/**
 * Update calendar status (for decline detection polling)
 */
export async function updateInvitationCalendarStatus(
  id: string,
  calendarStatus: CalendarStatus
): Promise<Invitation> {
  return prisma.invitation.update({
    where: { id },
    data: {
      calendarStatus,
    },
  });
}

/**
 * Get invitations with pending calendar status (for polling)
 */
export async function getInvitationsWithPendingCalendar(
  gameId: string
): Promise<InvitationWithPlayer[]> {
  return prisma.invitation.findMany({
    where: {
      gameId,
      status: 'confirmed',
      googleCalendarEventId: { not: null },
      calendarStatus: 'pending',
    },
    include: { player: true },
  });
}
