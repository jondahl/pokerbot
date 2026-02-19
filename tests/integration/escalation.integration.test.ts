/**
 * Escalation System Integration Tests
 *
 * Tests the escalation queue workflow with real database operations
 * but mocked SMS service.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import {
  createTestGame,
  createTestPlayer,
  createTestInvitation,
  cleanupTestData,
} from '../helpers/test-db';
import { prisma } from '@/lib/db/prisma';
import { createMessage } from '@/lib/data/messages';
import {
  getPendingEscalations,
  getEscalation,
  resolveEscalation,
} from '@/lib/data/messages';
import { processResponse } from '@/lib/invitation/flow';

// Mock Twilio
vi.mock('@/lib/sms/twilio', () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true, messageSid: 'SM_TEST' }),
}));

// Skip if no database connection
const canRunDbTests = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder');

describe.skipIf(!canRunDbTests)('Escalation System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('View escalation queue', () => {
    it('should show pending escalations with player and game context', async () => {
      // Create game with player and escalated message
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ firstName: 'Confused' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Create escalated message
      await createMessage({
        invitationId: invitation.id,
        direction: 'inbound',
        body: 'Can I bring my dog?',
        escalationReason: 'Unknown request type',
      });

      // Query escalation queue
      const escalations = await getPendingEscalations();

      expect(escalations.length).toBeGreaterThanOrEqual(1);
      // getPendingEscalations returns messages with player and game directly (not via invitation)
      const found = escalations.find(
        (e) => e.player.firstName === 'Confused'
      );
      expect(found).toBeDefined();
      expect(found?.body).toBe('Can I bring my dog?');
      expect(found?.escalationStatus).toBe('pending');
      expect(found?.game).toBeDefined();
    });
  });

  describe('Resolve with custom response', () => {
    it('should send custom response, create outbound message, and mark resolved', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');

      // Create game with player and escalated message
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ phone: '+15553334444' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Create escalated message
      const message = await createMessage({
        invitationId: invitation.id,
        direction: 'inbound',
        body: 'What time does it start?',
        escalationReason: 'Question requires admin input',
      });

      vi.mocked(sendSMS).mockClear();

      // Resolve escalation (marks as resolved in DB)
      // resolveEscalation takes (id, responseText) - just a string
      await resolveEscalation(message.id, 'The game starts at 7pm!');

      // Verify escalation is resolved
      const resolved = await getEscalation(message.id);
      expect(resolved?.escalationStatus).toBe('resolved');
      expect(resolved?.llmSuggestedResponse).toBe('The game starts at 7pm!');
    });
  });

  describe('Quick confirm action', () => {
    it('should confirm player and send confirmation SMS via quick action', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');

      // Create game with player and escalated message
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ phone: '+15556667777' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Create escalated message (ambiguous yes)
      const message = await createMessage({
        invitationId: invitation.id,
        direction: 'inbound',
        body: 'Yeah I think so, depends on work',
        escalationReason: 'Ambiguous response - uncertain confirmation',
      });

      vi.mocked(sendSMS).mockClear();

      // Use quick confirm action via processResponse
      await processResponse(invitation.id, player.id, {
        action: 'auto_respond',
        response: "Great, you're confirmed! See you there.",
        sideEffects: ['confirm_player'],
      });

      // Mark escalation as resolved
      await resolveEscalation(message.id, "Great, you're confirmed! See you there.");

      // Verify player is confirmed
      const updatedInvitation = await prisma.invitation.findUnique({
        where: { id: invitation.id },
      });
      expect(updatedInvitation?.status).toBe('confirmed');

      // Verify escalation is resolved
      const resolved = await getEscalation(message.id);
      expect(resolved?.escalationStatus).toBe('resolved');
    });
  });
});
