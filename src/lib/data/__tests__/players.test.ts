// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Player } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    player: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Players Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlayers', () => {
    it('should return all active players ordered by first name', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getPlayers } = await import('../players');

      const mockPlayers: Partial<Player>[] = [
        { id: '1', firstName: 'Alice', lastName: 'Smith', phone: '+1234567890', email: 'alice@test.com' },
        { id: '2', firstName: 'Bob', lastName: 'Jones', phone: '+0987654321', email: 'bob@test.com' },
      ];
      vi.mocked(prisma.player.findMany).mockResolvedValue(mockPlayers as Player[]);

      const players = await getPlayers();

      expect(players).toEqual(mockPlayers);
      expect(prisma.player.findMany).toHaveBeenCalledWith({
        where: { optedOut: false },
        orderBy: { firstName: 'asc' },
      });
    });
  });

  describe('createPlayer', () => {
    it('should create a new player', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { createPlayer } = await import('../players');

      const playerData = {
        firstName: 'Charlie',
        lastName: 'Brown',
        phone: '+1111111111',
        email: 'charlie@test.com',
      };
      const mockCreated: Partial<Player> = { id: '3', ...playerData };
      vi.mocked(prisma.player.create).mockResolvedValue(mockCreated as Player);

      const result = await createPlayer(playerData);

      expect(result).toEqual(mockCreated);
      expect(prisma.player.create).toHaveBeenCalledWith({
        data: playerData,
      });
    });
  });

  describe('updatePlayer', () => {
    it('should update an existing player', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { updatePlayer } = await import('../players');

      const updateData = { firstName: 'Updated' };
      const mockUpdated: Partial<Player> = { id: '1', firstName: 'Updated', lastName: 'Smith', phone: '+1234567890' };
      vi.mocked(prisma.player.update).mockResolvedValue(mockUpdated as Player);

      const result = await updatePlayer('1', updateData);

      expect(result).toEqual(mockUpdated);
      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });
  });

  describe('deletePlayer', () => {
    it('should soft delete a player by setting optedOut to true', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { deletePlayer } = await import('../players');

      const mockDeleted: Partial<Player> = { id: '1', optedOut: true };
      vi.mocked(prisma.player.update).mockResolvedValue(mockDeleted as Player);

      const result = await deletePlayer('1');

      expect(result).toEqual(mockDeleted);
      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { optedOut: true },
      });
    });
  });

  describe('optOutPlayer', () => {
    it('should mark a player as opted out', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { optOutPlayer } = await import('../players');

      const mockOptedOut: Partial<Player> = { id: '1', optedOut: true };
      vi.mocked(prisma.player.update).mockResolvedValue(mockOptedOut as Player);

      const result = await optOutPlayer('1');

      expect(result).toEqual(mockOptedOut);
      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { optedOut: true },
      });
    });
  });

  describe('reactivatePlayer', () => {
    it('should reactivate an opted-out player', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { reactivatePlayer } = await import('../players');

      const mockReactivated: Partial<Player> = { id: '1', optedOut: false };
      vi.mocked(prisma.player.update).mockResolvedValue(mockReactivated as Player);

      const result = await reactivatePlayer('1');

      expect(result).toEqual(mockReactivated);
      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { optedOut: false },
      });
    });
  });

  describe('getOptedOutPlayers', () => {
    it('should return all opted-out players ordered by first name', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getOptedOutPlayers } = await import('../players');

      const mockPlayers: Partial<Player>[] = [
        { id: '1', firstName: 'Alice', lastName: 'Smith', optedOut: true },
        { id: '2', firstName: 'Bob', lastName: 'Jones', optedOut: true },
      ];
      vi.mocked(prisma.player.findMany).mockResolvedValue(mockPlayers as Player[]);

      const players = await getOptedOutPlayers();

      expect(players).toEqual(mockPlayers);
      expect(prisma.player.findMany).toHaveBeenCalledWith({
        where: { optedOut: true },
        orderBy: { firstName: 'asc' },
      });
    });
  });

  describe('getPlayerByPhone', () => {
    it('should find a player by phone number', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getPlayerByPhone } = await import('../players');

      const mockPlayer: Partial<Player> = { id: '1', firstName: 'Alice', phone: '+1234567890' };
      vi.mocked(prisma.player.findUnique).mockResolvedValue(mockPlayer as Player);

      const result = await getPlayerByPhone('+1234567890');

      expect(result).toEqual(mockPlayer);
      expect(prisma.player.findUnique).toHaveBeenCalledWith({
        where: { phone: '+1234567890' },
      });
    });

    it('should return null for unknown phone number', async () => {
      const { prisma } = await import('@/lib/db/prisma');
      const { getPlayerByPhone } = await import('../players');

      vi.mocked(prisma.player.findUnique).mockResolvedValue(null);

      const result = await getPlayerByPhone('+9999999999');

      expect(result).toBeNull();
    });
  });
});
