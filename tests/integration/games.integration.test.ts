/**
 * Game Management Integration Tests
 *
 * Tests real database operations for game CRUD and status transitions.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  createTestGame,
  createTestPlayer,
  createTestInvitation,
  cleanupTestData,
} from '../helpers/test-db';
import {
  createGame,
  getGames,
  getGame,
  updateGameStatus,
} from '@/lib/data/games';

// Skip if no database connection
const canRunDbTests = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder');

describe.skipIf(!canRunDbTests)('Game Management Integration', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Create game', () => {
    it('should create game with draft status and appear in games list', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const gameData = {
        date: tomorrow,
        time: new Date('2024-01-01T19:00:00'),
        timeBlock: 'evening',
        location: '123 Poker Lane',
        capacity: 8,
        rsvpDeadline: tomorrow,
      };

      // Create game via data layer
      const created = await createGame(gameData);

      // Verify game was created with draft status
      expect(created.id).toBeDefined();
      expect(created.status).toBe('draft');
      expect(created.location).toBe('123 Poker Lane');
      expect(created.capacity).toBe(8);

      // Verify game appears in list
      const allGames = await getGames();
      const found = allGames.find((g) => g.id === created.id);
      expect(found).toBeDefined();
      expect(found?.status).toBe('draft');

      // Cleanup - update to use test helper tracking
      await cleanupTestData();
    });
  });

  describe('Activate game', () => {
    it('should transition game from draft to active', async () => {
      // Create a draft game
      const game = await createTestGame({ status: 'draft' });

      // Verify initial status
      expect(game.status).toBe('draft');

      // Activate the game
      const activated = await updateGameStatus(game.id, 'active');

      // Verify status changed
      expect(activated.status).toBe('active');

      // Verify change persisted
      const fetched = await getGame(game.id);
      expect(fetched?.status).toBe('active');
    });

    it('should allow invitations to be sent for active game', async () => {
      // Create an active game with a player and invitation
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer();
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'pending',
      });

      // Verify the setup
      const gameWithInvitations = await getGame(game.id);
      expect(gameWithInvitations?.status).toBe('active');
      expect(gameWithInvitations?.invitations).toHaveLength(1);
      expect(gameWithInvitations?.invitations[0].status).toBe('pending');
    });
  });

  describe('Complete game', () => {
    it('should transition game from active to completed', async () => {
      // Create an active game
      const game = await createTestGame({ status: 'active' });

      // Complete the game
      const completed = await updateGameStatus(game.id, 'completed');

      // Verify status changed
      expect(completed.status).toBe('completed');

      // Verify change persisted
      const fetched = await getGame(game.id);
      expect(fetched?.status).toBe('completed');
    });

    it('should preserve invitations when game is completed', async () => {
      // Create active game with confirmed invitation
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer();
      await createTestInvitation(game.id, player.id, {
        status: 'confirmed',
      });

      // Complete the game
      await updateGameStatus(game.id, 'completed');

      // Verify invitation is still there
      const gameWithInvitations = await getGame(game.id);
      expect(gameWithInvitations?.invitations).toHaveLength(1);
      expect(gameWithInvitations?.invitations[0].status).toBe('confirmed');
    });
  });
});
