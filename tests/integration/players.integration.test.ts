/**
 * Player Management Integration Tests
 *
 * Tests real database operations for player CRUD and opt-out functionality.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import {
  createTestPlayer,
  cleanupTestData,
  getPlayer,
} from '../helpers/test-db';
import {
  createPlayer,
  getPlayers,
  deletePlayer,
  reactivatePlayer,
  getOptedOutPlayers,
} from '@/lib/data/players';

// Skip if no database connection
const canRunDbTests = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder');

describe.skipIf(!canRunDbTests)('Player Management Integration', () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Create player', () => {
    it('should create player in database and appear in players list', async () => {
      // Use unique phone to avoid conflicts with previous test runs
      const uniquePhone = `+1555${Date.now().toString().slice(-7)}`;

      // Create player via data layer
      const playerData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: uniquePhone,
        email: 'john@example.com',
      };

      const created = await createPlayer(playerData);

      // Verify player was created
      expect(created.id).toBeDefined();
      expect(created.firstName).toBe('John');
      expect(created.lastName).toBe('Doe');
      expect(created.phone).toBe(uniquePhone);
      expect(created.optedOut).toBe(false);

      // Verify player appears in list
      const allPlayers = await getPlayers();
      const found = allPlayers.find((p) => p.id === created.id);
      expect(found).toBeDefined();
      expect(found?.firstName).toBe('John');

      // Cleanup
      await deletePlayer(created.id);
    });
  });

  describe('Admin deactivates player', () => {
    it('should mark player as opted out and move to opted-out list', async () => {
      // Create an active player
      const player = await createTestPlayer({
        firstName: 'Jane',
        lastName: 'Smith',
      });

      // Verify player is in active list
      let activePlayers = await getPlayers();
      expect(activePlayers.some((p) => p.id === player.id)).toBe(true);

      // Admin deactivates player (soft delete)
      await deletePlayer(player.id);

      // Verify player is no longer in active list
      activePlayers = await getPlayers();
      expect(activePlayers.some((p) => p.id === player.id)).toBe(false);

      // Verify player appears in opted-out list
      const optedOutPlayers = await getOptedOutPlayers();
      expect(optedOutPlayers.some((p) => p.id === player.id)).toBe(true);

      // Verify optedOut flag is true
      const updatedPlayer = await getPlayer(player.id);
      expect(updatedPlayer?.optedOut).toBe(true);
    });
  });

  describe('Reactivate player', () => {
    it('should restore opted-out player to active list', async () => {
      // Create an opted-out player
      const player = await createTestPlayer({
        firstName: 'Bob',
        lastName: 'Wilson',
        optedOut: true,
      });

      // Verify player is in opted-out list
      let optedOutPlayers = await getOptedOutPlayers();
      expect(optedOutPlayers.some((p) => p.id === player.id)).toBe(true);

      // Verify player is NOT in active list
      let activePlayers = await getPlayers();
      expect(activePlayers.some((p) => p.id === player.id)).toBe(false);

      // Reactivate player
      await reactivatePlayer(player.id);

      // Verify player is now in active list
      activePlayers = await getPlayers();
      expect(activePlayers.some((p) => p.id === player.id)).toBe(true);

      // Verify player is no longer in opted-out list
      optedOutPlayers = await getOptedOutPlayers();
      expect(optedOutPlayers.some((p) => p.id === player.id)).toBe(false);

      // Verify optedOut flag is false
      const updatedPlayer = await getPlayer(player.id);
      expect(updatedPlayer?.optedOut).toBe(false);
    });
  });
});
