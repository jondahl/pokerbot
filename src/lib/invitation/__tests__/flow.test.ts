// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Invitation, Player } from '@prisma/client';
import type { InvitationWithPlayer } from '@/lib/data/invitations';
import type { GameWithInvitations } from '@/lib/data/games';

// Mock dependencies
vi.mock('@/lib/sms/twilio', () => ({
  sendSMS: vi.fn(),
}));

vi.mock('@/lib/data/invitations', () => ({
  getInvitation: vi.fn(),
  markInvitationAsSent: vi.fn(),
  updateInvitationStatus: vi.fn(),
  getNextPendingInvitation: vi.fn(),
  getConfirmedCount: vi.fn(),
  updatePlayerResponseStats: vi.fn(),
}));

vi.mock('@/lib/data/games', () => ({
  getGame: vi.fn(),
}));

vi.mock('@/lib/data/players', () => ({
  optOutPlayer: vi.fn(),
}));

describe('Invitation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendInvitation', () => {
    it('should send SMS and mark invitation as sent', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { markInvitationAsSent, getInvitation } = await import('@/lib/data/invitations');
      const { getGame } = await import('@/lib/data/games');
      const { sendInvitation } = await import('../flow');

      const mockInvitation: Partial<InvitationWithPlayer> = {
        id: 'inv-1',
        gameId: 'game-1',
        playerId: 'player-1',
        status: 'pending',
        player: {
          id: 'player-1',
          firstName: 'John',
          phone: '+15551234567',
        } as Player,
      };

      const mockGame: Partial<GameWithInvitations> = {
        id: 'game-1',
        date: new Date('2024-03-11'),
        time: new Date('2024-03-11T19:00:00'),
        location: '123 Main St',
        capacity: 8,
      };

      vi.mocked(getInvitation).mockResolvedValue(mockInvitation as InvitationWithPlayer);
      vi.mocked(getGame).mockResolvedValue(mockGame as GameWithInvitations);
      vi.mocked(sendSMS).mockResolvedValue({ success: true, messageSid: 'SM123' });
      vi.mocked(markInvitationAsSent).mockResolvedValue(mockInvitation as Invitation);

      const result = await sendInvitation('inv-1');

      expect(result.success).toBe(true);
      expect(sendSMS).toHaveBeenCalledWith(
        '+15551234567',
        expect.stringMatching(/poker/i)
      );
      expect(markInvitationAsSent).toHaveBeenCalledWith('inv-1');
    });

    it('should return error if invitation not found', async () => {
      const { getInvitation } = await import('@/lib/data/invitations');
      const { sendInvitation } = await import('../flow');

      vi.mocked(getInvitation).mockResolvedValue(null);

      const result = await sendInvitation('inv-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invitation not found');
    });
  });

  describe('processResponse', () => {
    it('should confirm player and trigger calendar invite for YES', async () => {
      const { updateInvitationStatus, updatePlayerResponseStats } = await import('@/lib/data/invitations');
      const { processResponse } = await import('../flow');

      vi.mocked(updateInvitationStatus).mockResolvedValue({} as Invitation);
      vi.mocked(updatePlayerResponseStats).mockResolvedValue();

      const result = await processResponse('inv-1', 'player-1', {
        action: 'auto_respond',
        response: "Great, you're in!",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      expect(result.success).toBe(true);
      expect(updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'confirmed');
      expect(updatePlayerResponseStats).toHaveBeenCalledWith('player-1', true);
    });

    it('should decline player and invite next for NO', async () => {
      const { updateInvitationStatus, getNextPendingInvitation, updatePlayerResponseStats } = await import('@/lib/data/invitations');
      const { processResponse } = await import('../flow');

      vi.mocked(updateInvitationStatus).mockResolvedValue({} as Invitation);
      vi.mocked(getNextPendingInvitation).mockResolvedValue(null);
      vi.mocked(updatePlayerResponseStats).mockResolvedValue();

      const result = await processResponse('inv-1', 'player-1', {
        action: 'auto_respond',
        response: 'Thanks. Another time!',
        sideEffects: ['decline_player', 'invite_next'],
      });

      expect(result.success).toBe(true);
      expect(updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'declined');
    });

    it('should opt out player for STOP messages', async () => {
      const { updateInvitationStatus } = await import('@/lib/data/invitations');
      const { optOutPlayer } = await import('@/lib/data/players');
      const { processResponse } = await import('../flow');

      vi.mocked(updateInvitationStatus).mockResolvedValue({} as Invitation);
      vi.mocked(optOutPlayer).mockResolvedValue({} as Player);

      const result = await processResponse('inv-1', 'player-1', {
        action: 'auto_respond',
        response: "You've been removed from future invitations.",
        sideEffects: ['opt_out_player'],
      });

      expect(result.success).toBe(true);
      expect(updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'declined');
      expect(optOutPlayer).toHaveBeenCalledWith('player-1');
    });
  });

  describe('sendInvitation opt-out handling', () => {
    it('should not send to opted-out players', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { getInvitation } = await import('@/lib/data/invitations');
      const { sendInvitation } = await import('../flow');

      const mockInvitation: Partial<InvitationWithPlayer> = {
        id: 'inv-1',
        gameId: 'game-1',
        playerId: 'player-1',
        status: 'pending',
        player: {
          id: 'player-1',
          firstName: 'John',
          phone: '+15551234567',
          optedOut: true,
        } as Player,
      };

      vi.mocked(getInvitation).mockResolvedValue(mockInvitation as InvitationWithPlayer);

      const result = await sendInvitation('inv-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player has opted out');
      expect(sendSMS).not.toHaveBeenCalled();
    });
  });
});
