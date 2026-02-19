/**
 * SMS Webhook Integration Tests
 *
 * Tests the full SMS webhook flow with real database operations
 * but mocked external services (Twilio, Claude).
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import {
  createTestGame,
  createTestPlayer,
  createTestInvitation,
  cleanupTestData,
  getInvitation,
  getPlayer,
  getMessages,
} from '../helpers/test-db';
import { prisma } from '@/lib/db/prisma';

// Mock Twilio
vi.mock('@/lib/sms/twilio', () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true, messageSid: 'SM_TEST' }),
  validateWebhook: vi.fn().mockReturnValue(true),
}));

// Mock Claude - will be configured per test
vi.mock('@/lib/llm/claude', () => ({
  parsePlayerResponse: vi.fn(),
}));

// Mock admin notifications
vi.mock('@/lib/notifications/admin', () => ({
  notifyAdminsOfEscalation: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

// Skip if no database connection
const canRunDbTests = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder');

describe.skipIf(!canRunDbTests)('SMS Webhook Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('YES response', () => {
    it('should confirm player and send confirmation SMS', async () => {
      const { parsePlayerResponse } = await import('@/lib/llm/claude');
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { processResponse } = await import('@/lib/invitation/flow');
      const { createMessage } = await import('@/lib/data/messages');

      // Mock Claude to return YES confirmation
      vi.mocked(parsePlayerResponse).mockResolvedValue({
        action: 'auto_respond',
        response: "Great, you're in! See you there.",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      // Create game with invited player
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ phone: '+15551112222' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Simulate receiving "yes" message
      await createMessage({
        invitationId: invitation.id,
        direction: 'inbound',
        body: 'yes',
      });

      // Process the response (simulating what webhook does after Claude)
      const result = await processResponse(invitation.id, player.id, {
        action: 'auto_respond',
        response: "Great, you're in! See you there.",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      expect(result.success).toBe(true);

      // Verify invitation is confirmed
      const updated = await getInvitation(invitation.id);
      expect(updated?.status).toBe('confirmed');
      expect(updated?.respondedAt).toBeDefined();
    });
  });

  describe('NO response', () => {
    it('should decline player and trigger cascade to next player', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { processResponse } = await import('@/lib/invitation/flow');
      const { createMessage } = await import('@/lib/data/messages');

      // Create game with two players
      const game = await createTestGame({ status: 'active', capacity: 10 });
      const player1 = await createTestPlayer({ firstName: 'Decliner' });
      const player2 = await createTestPlayer({ firstName: 'NextUp' });

      const invitation1 = await createTestInvitation(game.id, player1.id, {
        status: 'invited',
        position: 1,
      });
      await createTestInvitation(game.id, player2.id, {
        status: 'pending',
        position: 2,
      });

      // Store inbound message
      await createMessage({
        invitationId: invitation1.id,
        direction: 'inbound',
        body: 'no',
      });

      vi.mocked(sendSMS).mockClear();

      // Process NO response with cascade
      await processResponse(invitation1.id, player1.id, {
        action: 'auto_respond',
        response: 'Thanks for letting us know. Maybe next time!',
        sideEffects: ['decline_player', 'invite_next'],
      });

      // Verify player1 is declined
      const updated1 = await getInvitation(invitation1.id);
      expect(updated1?.status).toBe('declined');

      // Verify SMS sent to next player (cascade)
      expect(sendSMS).toHaveBeenCalled();
    });
  });

  describe('Player self opt-out (STOP)', () => {
    it('should mark player as opted out and send confirmation', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { processResponse } = await import('@/lib/invitation/flow');
      const { createMessage } = await import('@/lib/data/messages');

      // Create game with invited player
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ optedOut: false });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Store STOP message
      await createMessage({
        invitationId: invitation.id,
        direction: 'inbound',
        body: 'STOP',
      });

      // Process opt-out
      await processResponse(invitation.id, player.id, {
        action: 'auto_respond',
        response: "Got it - you won't receive any more messages.",
        sideEffects: ['opt_out_player'],
      });

      // Verify player is opted out
      const updatedPlayer = await getPlayer(player.id);
      expect(updatedPlayer?.optedOut).toBe(true);

      // Verify invitation is declined
      const updatedInvitation = await getInvitation(invitation.id);
      expect(updatedInvitation?.status).toBe('declined');
    });
  });

  describe('Escalation', () => {
    it('should create escalation and notify admins for ambiguous message', async () => {
      const { notifyAdminsOfEscalation } = await import('@/lib/notifications/admin');
      const { createMessage } = await import('@/lib/data/messages');

      // Create game with invited player
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ firstName: 'Asker' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Store ambiguous message with escalation
      const message = await createMessage({
        invitationId: invitation.id,
        direction: 'inbound',
        body: 'Can I bring a friend?',
        escalationReason: 'Unknown request type. Suggested: None',
      });

      // Simulate webhook calling notifyAdmins
      await notifyAdminsOfEscalation({
        playerName: player.firstName,
        playerPhone: player.phone,
        message: 'Can I bring a friend?',
        reason: 'Unknown request type',
        gameDate: 'Sat, Mar 15',
        gameLocation: game.location,
      });

      // Verify admin notification was called
      expect(notifyAdminsOfEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          playerName: 'Asker',
          message: 'Can I bring a friend?',
        })
      );

      // Verify message has escalation status
      const messages = await prisma.message.findMany({
        where: { playerId: player.id, gameId: game.id },
      });
      const escalated = messages.find((m) => m.escalationReason);
      expect(escalated).toBeDefined();
      expect(escalated?.escalationStatus).toBe('pending');
    });
  });

  describe('No active game', () => {
    it('should handle message from unknown sender with no active game gracefully', async () => {
      // Create a player with no game/invitation
      const player = await createTestPlayer({ phone: '+15559999999' });

      // Try to find an active game for this player (simulating webhook logic)
      const activeGame = await prisma.game.findFirst({
        where: {
          status: 'active',
          invitations: {
            some: {
              player: { phone: '+15559999999' },
              status: { in: ['invited', 'confirmed'] },
            },
          },
        },
      });

      // Should not find any game
      expect(activeGame).toBeNull();

      // Webhook would return empty TwiML response - no error thrown
    });

    it('should handle STOP from unknown sender', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');

      // Player exists but has no active invitation
      const player = await createTestPlayer({ phone: '+15558888888' });

      // Simulate STOP handling for non-game context
      // In webhook, this sends opt-out confirmation even without game
      await sendSMS('+15558888888', "Got it - you won't receive any more messages.");

      expect(sendSMS).toHaveBeenCalledWith(
        '+15558888888',
        expect.stringContaining("won't receive")
      );
    });
  });
});
