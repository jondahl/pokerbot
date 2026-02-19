// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    game: {
      count: vi.fn(),
    },
    player: {
      count: vi.fn(),
    },
    invitation: {
      count: vi.fn(),
    },
  },
}));

describe('Dashboard Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return upcoming games count', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getDashboardStats } = await import('../dashboard');

      vi.mocked(prisma.game.count).mockResolvedValue(3);
      vi.mocked(prisma.player.count).mockResolvedValue(10);
      vi.mocked(prisma.invitation.count).mockResolvedValue(5);

      const stats = await getDashboardStats();

      expect(stats.upcomingGames).toBe(3);
      expect(prisma.game.count).toHaveBeenCalledWith({
        where: {
          date: { gte: expect.any(Date) },
          status: 'active',
        },
      });
    });

    it('should return total players count', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getDashboardStats } = await import('../dashboard');

      vi.mocked(prisma.game.count).mockResolvedValue(3);
      vi.mocked(prisma.player.count).mockResolvedValue(15);
      vi.mocked(prisma.invitation.count).mockResolvedValue(5);

      const stats = await getDashboardStats();

      expect(stats.totalPlayers).toBe(15);
      expect(prisma.player.count).toHaveBeenCalledWith({
        where: { optedOut: false },
      });
    });

    it('should return pending invitations count', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getDashboardStats } = await import('../dashboard');

      vi.mocked(prisma.game.count).mockResolvedValue(3);
      vi.mocked(prisma.player.count).mockResolvedValue(10);
      vi.mocked(prisma.invitation.count).mockResolvedValue(7);

      const stats = await getDashboardStats();

      expect(stats.pendingInvitations).toBe(7);
      expect(prisma.invitation.count).toHaveBeenCalledWith({
        where: { status: 'invited' },
      });
    });
  });
});
