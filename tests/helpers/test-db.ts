import { prisma } from '@/lib/db/prisma';
import type { Player, Game, Invitation, Message } from '@prisma/client';

/**
 * Test database helpers for integration tests
 * Uses real database operations with cleanup after each test
 */

// Track created records for cleanup
let createdPlayers: string[] = [];
let createdGames: string[] = [];
let createdInvitations: string[] = [];
let createdMessages: string[] = [];

/**
 * Create a test player
 */
export async function createTestPlayer(overrides: Partial<Player> = {}): Promise<Player> {
  const player = await prisma.player.create({
    data: {
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'Player',
      phone: overrides.phone ?? `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      email: overrides.email ?? `test${Date.now()}@example.com`,
      optedOut: overrides.optedOut ?? false,
      responseCount: overrides.responseCount ?? 0,
      timeoutCount: overrides.timeoutCount ?? 0,
    },
  });
  createdPlayers.push(player.id);
  return player;
}

/**
 * Create a test game
 */
export async function createTestGame(overrides: Partial<Game> = {}): Promise<Game> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const game = await prisma.game.create({
    data: {
      date: overrides.date ?? tomorrow,
      time: overrides.time ?? new Date('2024-01-01T19:00:00'),
      timeBlock: overrides.timeBlock ?? 'evening',
      location: overrides.location ?? '123 Test St',
      capacity: overrides.capacity ?? 10,
      rsvpDeadline: overrides.rsvpDeadline ?? tomorrow,
      status: overrides.status ?? 'draft',
      entryInstructions: overrides.entryInstructions,
    },
  });
  createdGames.push(game.id);
  return game;
}

/**
 * Create a test invitation
 */
export async function createTestInvitation(
  gameId: string,
  playerId: string,
  overrides: Partial<Invitation> = {}
): Promise<Invitation> {
  const invitation = await prisma.invitation.create({
    data: {
      gameId,
      playerId,
      position: overrides.position ?? 1,
      status: overrides.status ?? 'pending',
      invitedAt: overrides.invitedAt,
      respondedAt: overrides.respondedAt,
    },
  });
  createdInvitations.push(invitation.id);
  return invitation;
}

/**
 * Create a test message
 */
export async function createTestMessage(
  playerId: string,
  gameId: string | null,
  overrides: Partial<Message> = {}
): Promise<Message> {
  const message = await prisma.message.create({
    data: {
      playerId,
      gameId,
      direction: overrides.direction ?? 'inbound',
      body: overrides.body ?? 'Test message',
      sentAt: overrides.sentAt ?? new Date(),
      escalationStatus: overrides.escalationStatus,
      escalationReason: overrides.escalationReason,
    },
  });
  createdMessages.push(message.id);
  return message;
}

/**
 * Get a player by ID (for assertions)
 */
export async function getPlayer(id: string): Promise<Player | null> {
  return prisma.player.findUnique({ where: { id } });
}

/**
 * Get a game by ID with invitations
 */
export async function getGameWithInvitations(id: string) {
  return prisma.game.findUnique({
    where: { id },
    include: { invitations: { include: { player: true } } },
  });
}

/**
 * Get an invitation by ID
 */
export async function getInvitation(id: string) {
  return prisma.invitation.findUnique({
    where: { id },
    include: { player: true, game: true },
  });
}

/**
 * Get messages for a player/game
 */
export async function getMessages(playerId: string, gameId: string) {
  return prisma.message.findMany({
    where: { playerId, gameId },
    orderBy: { sentAt: 'asc' },
  });
}

/**
 * Cleanup all test data created during tests
 * Call this in afterEach()
 */
export async function cleanupTestData(): Promise<void> {
  // Delete in reverse order of dependencies
  if (createdMessages.length > 0) {
    await prisma.message.deleteMany({
      where: { id: { in: createdMessages } },
    });
    createdMessages = [];
  }

  if (createdInvitations.length > 0) {
    await prisma.invitation.deleteMany({
      where: { id: { in: createdInvitations } },
    });
    createdInvitations = [];
  }

  if (createdGames.length > 0) {
    await prisma.game.deleteMany({
      where: { id: { in: createdGames } },
    });
    createdGames = [];
  }

  if (createdPlayers.length > 0) {
    await prisma.player.deleteMany({
      where: { id: { in: createdPlayers } },
    });
    createdPlayers = [];
  }
}

/**
 * Reset cleanup tracking (call in beforeEach if needed)
 */
export function resetTracking(): void {
  createdPlayers = [];
  createdGames = [];
  createdInvitations = [];
  createdMessages = [];
}
