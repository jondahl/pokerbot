/**
 * Invitation Flow Integration Tests
 *
 * Tests the invitation sending flow with real database operations
 * but mocked Twilio SMS service.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import {
  createTestGame,
  createTestPlayer,
  createTestInvitation,
  cleanupTestData,
  getInvitation,
} from '../helpers/test-db';
import {
  createInvitation,
  getInvitationsForGame,
  getNextPendingInvitation,
} from '@/lib/data/invitations';

// Mock Twilio - we don't want to send real SMS
vi.mock('@/lib/sms/twilio', () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true, messageSid: 'SM_TEST_123' }),
}));

// Skip if no database connection
const canRunDbTests = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder');

describe.skipIf(!canRunDbTests)('Invitation Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Add players to queue', () => {
    it('should create invitations with correct positions and pending status', async () => {
      // Create game and players
      const game = await createTestGame({ status: 'active' });
      const player1 = await createTestPlayer({ firstName: 'Alice' });
      const player2 = await createTestPlayer({ firstName: 'Bob' });
      const player3 = await createTestPlayer({ firstName: 'Charlie' });

      // Add players to queue with positions
      await createInvitation({ gameId: game.id, playerId: player1.id, position: 1 });
      await createInvitation({ gameId: game.id, playerId: player2.id, position: 2 });
      await createInvitation({ gameId: game.id, playerId: player3.id, position: 3 });

      // Verify invitations created
      const invitations = await getInvitationsForGame(game.id);

      expect(invitations).toHaveLength(3);
      expect(invitations[0].position).toBe(1);
      expect(invitations[0].player.firstName).toBe('Alice');
      expect(invitations[0].status).toBe('pending');

      expect(invitations[1].position).toBe(2);
      expect(invitations[1].player.firstName).toBe('Bob');
      expect(invitations[1].status).toBe('pending');

      expect(invitations[2].position).toBe(3);
      expect(invitations[2].player.firstName).toBe('Charlie');
      expect(invitations[2].status).toBe('pending');
    });
  });

  describe('Send invitations', () => {
    it('should send SMS via Twilio and update invitation status to invited', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { sendInvitation } = await import('@/lib/invitation/flow');

      // Create game with pending invitation
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ phone: '+15559876543' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'pending',
        position: 1,
      });

      // Send the invitation
      const result = await sendInvitation(invitation.id);

      // Verify SMS was called
      expect(sendSMS).toHaveBeenCalledWith(
        '+15559876543',
        expect.stringContaining('Poker game')
      );
      expect(result.success).toBe(true);

      // Verify invitation status updated
      const updated = await getInvitation(invitation.id);
      expect(updated?.status).toBe('invited');
      expect(updated?.invitedAt).toBeDefined();
    });
  });

  describe('Skip opted-out players', () => {
    it('should skip opted-out players when getting next pending invitation', async () => {
      // Create game
      const game = await createTestGame({ status: 'active' });

      // Create players - first one is opted out
      const optedOutPlayer = await createTestPlayer({
        firstName: 'OptedOut',
        optedOut: true,
      });
      const activePlayer = await createTestPlayer({
        firstName: 'Active',
        optedOut: false,
      });

      // Add both to queue
      await createTestInvitation(game.id, optedOutPlayer.id, {
        status: 'pending',
        position: 1,
      });
      await createTestInvitation(game.id, activePlayer.id, {
        status: 'pending',
        position: 2,
      });

      // Get next pending - should skip opted-out player
      const next = await getNextPendingInvitation(game.id);

      expect(next).not.toBeNull();
      expect(next?.player.firstName).toBe('Active');
      expect(next?.position).toBe(2);
    });

    it('should not send invitation to opted-out player', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { sendInvitation } = await import('@/lib/invitation/flow');

      // Create game with opted-out player
      const game = await createTestGame({ status: 'active' });
      const optedOutPlayer = await createTestPlayer({ optedOut: true });
      const invitation = await createTestInvitation(game.id, optedOutPlayer.id, {
        status: 'pending',
        position: 1,
      });

      // Try to send invitation
      const result = await sendInvitation(invitation.id);

      // Should fail
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player has opted out');
      expect(sendSMS).not.toHaveBeenCalled();
    });
  });

  describe('Cascade on decline', () => {
    it('should invite next player when current player declines', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { processResponse } = await import('@/lib/invitation/flow');
      const { updateInvitationStatus } = await import('@/lib/data/invitations');

      // Create game with two players
      const game = await createTestGame({ status: 'active', capacity: 10 });
      const player1 = await createTestPlayer({ firstName: 'First' });
      const player2 = await createTestPlayer({ firstName: 'Second' });

      // First player is invited, second is pending
      const invitation1 = await createTestInvitation(game.id, player1.id, {
        status: 'invited',
        position: 1,
      });
      await createTestInvitation(game.id, player2.id, {
        status: 'pending',
        position: 2,
      });

      // Clear mock calls from setup
      vi.mocked(sendSMS).mockClear();

      // Process decline with invite_next side effect
      await processResponse(invitation1.id, player1.id, {
        action: 'auto_respond',
        response: 'Maybe next time!',
        sideEffects: ['decline_player', 'invite_next'],
      });

      // Verify first player is declined
      const updated1 = await getInvitation(invitation1.id);
      expect(updated1?.status).toBe('declined');

      // Verify SMS was sent to second player (cascade)
      expect(sendSMS).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Poker game')
      );
    });
  });
});
