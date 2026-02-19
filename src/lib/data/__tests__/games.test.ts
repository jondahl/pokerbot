// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Game } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    game: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Games Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGames', () => {
    it('should return all games ordered by date descending', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getGames } = await import('../games');

      const mockGames: Partial<Game>[] = [
        { id: '1', date: new Date('2024-02-01'), capacity: 8, status: 'active' },
        { id: '2', date: new Date('2024-01-15'), capacity: 6, status: 'completed' },
      ];
      vi.mocked(prisma.game.findMany).mockResolvedValue(mockGames as Game[]);

      const games = await getGames();

      expect(games).toEqual(mockGames);
      expect(prisma.game.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
        include: {
          invitations: {
            select: { status: true },
          },
        },
      });
    });
  });

  describe('createGame', () => {
    it('should create a new game', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { createGame } = await import('../games');

      const gameData = {
        date: new Date('2024-02-15'),
        time: new Date('2024-02-15T19:00:00'),
        timeBlock: 'Evening',
        location: '123 Main St',
        rsvpDeadline: new Date('2024-02-14'),
        capacity: 8,
      };
      const mockCreated: Partial<Game> = { id: '3', ...gameData, status: 'draft' };
      vi.mocked(prisma.game.create).mockResolvedValue(mockCreated as Game);

      const result = await createGame(gameData);

      expect(result).toEqual(mockCreated);
      expect(prisma.game.create).toHaveBeenCalledWith({
        data: {
          ...gameData,
          status: 'draft',
        },
      });
    });
  });

  describe('updateGameStatus', () => {
    it('should update game status', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { updateGameStatus } = await import('../games');

      const mockUpdated: Partial<Game> = { id: '1', status: 'active' };
      vi.mocked(prisma.game.update).mockResolvedValue(mockUpdated as Game);

      const result = await updateGameStatus('1', 'active');

      expect(result).toEqual(mockUpdated);
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'active' },
      });
    });
  });
});
