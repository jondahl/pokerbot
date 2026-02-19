// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    message: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Messages Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingEscalations', () => {
    it('should return all pending escalations with player and game context', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getPendingEscalations } = await import('../messages');

      const mockEscalations = [
        {
          id: '1',
          body: 'Can I bring a friend?',
          escalationStatus: 'pending',
          escalationReason: 'Unknown request',
          player: { id: 'p1', firstName: 'John' },
          game: { id: 'g1', date: new Date() },
        },
      ];
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockEscalations as unknown as Message[]);

      const result = await getPendingEscalations();

      expect(result).toEqual(mockEscalations);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { escalationStatus: 'pending' },
        orderBy: { createdAt: 'desc' },
        include: { player: true, game: true },
      });
    });
  });

  describe('resolveEscalation', () => {
    it('should mark escalation as resolved with response', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { resolveEscalation } = await import('../messages');

      const mockResolved: Partial<Message> = {
        id: '1',
        escalationStatus: 'resolved',
        llmSuggestedResponse: 'Thanks for asking!',
      };
      vi.mocked(prisma.message.update).mockResolvedValue(mockResolved as Message);

      const result = await resolveEscalation('1', 'Thanks for asking!');

      expect(result).toEqual(mockResolved);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          escalationStatus: 'resolved',
          llmSuggestedResponse: 'Thanks for asking!',
        },
      });
    });
  });

  describe('countPendingEscalations', () => {
    it('should return count of pending escalations', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { countPendingEscalations } = await import('../messages');

      vi.mocked(prisma.message.count).mockResolvedValue(5);

      const result = await countPendingEscalations();

      expect(result).toBe(5);
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: { escalationStatus: 'pending' },
      });
    });
  });

  describe('getConversationHistory', () => {
    it('should return messages for a player/game sorted by sentAt', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getConversationHistory } = await import('../messages');

      const mockMessages = [
        { id: '1', body: 'Hi', direction: 'inbound' },
        { id: '2', body: 'Hello!', direction: 'outbound' },
      ];
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages as Message[]);

      const result = await getConversationHistory('player-1', 'game-1');

      expect(result).toEqual(mockMessages);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-1', gameId: 'game-1' },
        orderBy: { sentAt: 'asc' },
        take: 20,
      });
    });
  });
});
