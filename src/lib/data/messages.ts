import { prisma } from '@/lib/db/prisma';
import type { Message, Player, Game } from '@prisma/client';

export type MessageWithContext = Message & {
  player: Player;
  game: Game | null;
};

export type MessageCreateInput = {
  invitationId: string; // We'll look up playerId and gameId from invitation
  direction: 'inbound' | 'outbound';
  body: string;
  twilioSid?: string;
  escalationReason?: string;
};

/**
 * Create a new message
 */
export async function createMessage(data: MessageCreateInput): Promise<Message> {
  // Get the invitation to find playerId and gameId
  const invitation = await prisma.invitation.findUnique({
    where: { id: data.invitationId },
    select: { playerId: true, gameId: true },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  return prisma.message.create({
    data: {
      playerId: invitation.playerId,
      gameId: invitation.gameId,
      direction: data.direction,
      body: data.body,
      twilioSid: data.twilioSid,
      sentAt: new Date(),
      escalationReason: data.escalationReason,
      escalationStatus: data.escalationReason ? 'pending' : undefined,
    },
  });
}

/**
 * Get recent messages for an invitation/player-game combo
 */
export async function getRecentMessages(
  invitationId: string,
  limit: number = 10
): Promise<Message[]> {
  // Get the invitation to find playerId and gameId
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { playerId: true, gameId: true },
  });

  if (!invitation) {
    return [];
  }

  return prisma.message.findMany({
    where: {
      playerId: invitation.playerId,
      gameId: invitation.gameId,
    },
    orderBy: { sentAt: 'desc' },
    take: limit,
  });
}

/**
 * Get messages that need escalation review
 */
export async function getPendingEscalations(): Promise<MessageWithContext[]> {
  return prisma.message.findMany({
    where: {
      escalationStatus: 'pending',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      player: true,
      game: true,
    },
  });
}

/**
 * Get a single escalation message with full context
 */
export async function getEscalation(id: string): Promise<MessageWithContext | null> {
  return prisma.message.findUnique({
    where: { id },
    include: {
      player: true,
      game: true,
    },
  });
}

/**
 * Get conversation history for a player/game
 */
export async function getConversationHistory(
  playerId: string,
  gameId: string,
  limit: number = 20
): Promise<Message[]> {
  return prisma.message.findMany({
    where: {
      playerId,
      gameId,
    },
    orderBy: { sentAt: 'asc' },
    take: limit,
  });
}

/**
 * Resolve an escalation
 */
export async function resolveEscalation(
  id: string,
  response: string
): Promise<Message> {
  return prisma.message.update({
    where: { id },
    data: {
      escalationStatus: 'resolved',
      llmSuggestedResponse: response,
    },
  });
}

/**
 * Count pending escalations
 */
export async function countPendingEscalations(): Promise<number> {
  return prisma.message.count({
    where: {
      escalationStatus: 'pending',
    },
  });
}
