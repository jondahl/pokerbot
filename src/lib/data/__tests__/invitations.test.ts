// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Invitation } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    invitation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    player: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) => callback({
      invitation: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      player: {
        update: vi.fn(),
      },
    })),
  },
}));

describe('Invitations Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInvitationsForGame', () => {
    it('should return all invitations for a game with player info', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getInvitationsForGame } = await import('../invitations');

      const mockInvitations: Partial<Invitation>[] = [
        { id: '1', gameId: 'game-1', playerId: 'player-1', status: 'confirmed', position: 1 },
        { id: '2', gameId: 'game-1', playerId: 'player-2', status: 'invited', position: 2 },
      ];
      vi.mocked(prisma.invitation.findMany).mockResolvedValue(mockInvitations as Invitation[]);

      const invitations = await getInvitationsForGame('game-1');

      expect(invitations).toEqual(mockInvitations);
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: { gameId: 'game-1' },
        include: { player: true },
        orderBy: { position: 'asc' },
      });
    });
  });

  describe('createInvitation', () => {
    it('should create an invitation with pending status', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { createInvitation } = await import('../invitations');

      const mockCreated: Partial<Invitation> = {
        id: '3',
        gameId: 'game-1',
        playerId: 'player-3',
        status: 'pending',
        position: 3,
      };
      vi.mocked(prisma.invitation.create).mockResolvedValue(mockCreated as Invitation);

      const result = await createInvitation({
        gameId: 'game-1',
        playerId: 'player-3',
        position: 3,
      });

      expect(result).toEqual(mockCreated);
      expect(prisma.invitation.create).toHaveBeenCalledWith({
        data: {
          gameId: 'game-1',
          playerId: 'player-3',
          position: 3,
          status: 'pending',
        },
      });
    });
  });

  describe('updateInvitationStatus', () => {
    it('should update invitation status and set respondedAt', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { updateInvitationStatus } = await import('../invitations');

      const mockUpdated: Partial<Invitation> = {
        id: '1',
        status: 'confirmed',
        respondedAt: new Date(),
      };
      vi.mocked(prisma.invitation.update).mockResolvedValue(mockUpdated as Invitation);

      const result = await updateInvitationStatus('1', 'confirmed');

      expect(result).toEqual(mockUpdated);
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'confirmed',
          respondedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markInvitationAsSent', () => {
    it('should update status to invited and set invitedAt', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { markInvitationAsSent } = await import('../invitations');

      const mockUpdated: Partial<Invitation> = {
        id: '1',
        status: 'invited',
        invitedAt: new Date(),
      };
      vi.mocked(prisma.invitation.update).mockResolvedValue(mockUpdated as Invitation);

      const result = await markInvitationAsSent('1');

      expect(result).toEqual(mockUpdated);
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'invited',
          invitedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getNextPendingInvitation', () => {
    it('should return the next pending invitation for non-opted-out player', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getNextPendingInvitation } = await import('../invitations');

      const mockInvitation: Partial<Invitation> = {
        id: '2',
        gameId: 'game-1',
        playerId: 'player-2',
        status: 'pending',
        position: 2,
      };
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue(mockInvitation as Invitation);

      const result = await getNextPendingInvitation('game-1');

      expect(result).toEqual(mockInvitation);
      expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
        where: {
          gameId: 'game-1',
          status: 'pending',
          player: { optedOut: false },
        },
        orderBy: { position: 'asc' },
        include: { player: true },
      });
    });
  });
});
