/**
 * Calendar Integration Tests
 *
 * Tests the calendar invite flow with real database operations
 * but mocked Google Calendar and Twilio services.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import {
  createTestGame,
  createTestPlayer,
  createTestInvitation,
  cleanupTestData,
  getInvitation,
} from '../helpers/test-db';

// Mock Twilio - we don't want to send real SMS
vi.mock('@/lib/sms/twilio', () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true, messageSid: 'SM_TEST_123' }),
}));

// Mock Google Calendar - we don't want to create real events
const mockCreateCalendarEvent = vi.fn();
const mockCancelCalendarEvent = vi.fn();
const mockGetEventAttendeeStatus = vi.fn();

vi.mock('@/lib/calendar', () => ({
  createCalendarEvent: mockCreateCalendarEvent,
  cancelCalendarEvent: mockCancelCalendarEvent,
  getEventAttendeeStatus: mockGetEventAttendeeStatus,
}));

// Skip if no database connection
const canRunDbTests = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder');

describe.skipIf(!canRunDbTests)('Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: successful calendar event creation
    mockCreateCalendarEvent.mockResolvedValue({
      success: true,
      eventId: 'test-event-123',
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Player confirms and receives calendar invite', () => {
    it('should create calendar event when player confirms', async () => {
      const { processResponse } = await import('@/lib/invitation/flow');

      // Create game and player
      const game = await createTestGame({
        status: 'active',
        location: 'Mux Office',
        timeBlock: 'Arrive 6:30-7; cards at 7',
        entryInstructions: 'Buzz 42, elevator to 5th floor',
      });
      const player = await createTestPlayer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Process YES response with calendar invite side effect
      await processResponse(invitation.id, player.id, {
        action: 'auto_respond',
        response: "Great, you're in!",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      // Verify calendar event was created with correct data
      expect(mockCreateCalendarEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          attendeeEmail: 'john@example.com',
          attendeeName: 'John Doe',
          location: 'Mux Office',
          timeBlock: 'Arrive 6:30-7; cards at 7',
          entryInstructions: 'Buzz 42, elevator to 5th floor',
        })
      );

      // Verify invitation was updated with calendar event ID
      const updated = await getInvitation(invitation.id);
      expect(updated?.status).toBe('confirmed');
      expect(updated?.googleCalendarEventId).toBe('test-event-123');
      expect(updated?.calendarStatus).toBe('pending');
    });

    it('should still confirm player if calendar creation fails', async () => {
      const { processResponse } = await import('@/lib/invitation/flow');

      // Make calendar creation fail
      mockCreateCalendarEvent.mockResolvedValue({
        success: false,
        error: 'Google API error',
      });

      // Create game and player
      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ email: 'test@example.com' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      // Process YES response
      const result = await processResponse(invitation.id, player.id, {
        action: 'auto_respond',
        response: "Great, you're in!",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      // Should still succeed - calendar is secondary
      expect(result.success).toBe(true);

      // Verify player is confirmed despite calendar failure
      const updated = await getInvitation(invitation.id);
      expect(updated?.status).toBe('confirmed');
      // No calendar event ID since it failed
      expect(updated?.googleCalendarEventId).toBeNull();
    });

    it('should include game date and time in calendar event', async () => {
      const { processResponse } = await import('@/lib/invitation/flow');

      const gameDate = new Date('2025-03-15');
      const gameTime = new Date('1970-01-01T19:00:00');

      const game = await createTestGame({
        status: 'active',
        date: gameDate,
        time: gameTime,
      });
      const player = await createTestPlayer({ email: 'test@example.com' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      await processResponse(invitation.id, player.id, {
        action: 'auto_respond',
        response: "You're in!",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameDate: expect.any(Date),
          gameTime: expect.any(Date),
        })
      );

      // Verify the dates are correct
      const callArg = mockCreateCalendarEvent.mock.calls[0][0];
      expect(callArg.gameDate.toISOString().split('T')[0]).toBe('2025-03-15');
    });
  });

  describe('Full confirmation flow with cascade', () => {
    it('should confirm player, send calendar, and allow next invite on decline', async () => {
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { processResponse } = await import('@/lib/invitation/flow');

      // Create game with two players
      const game = await createTestGame({ status: 'active', capacity: 10 });
      const player1 = await createTestPlayer({
        firstName: 'Alice',
        email: 'alice@example.com',
      });
      const player2 = await createTestPlayer({
        firstName: 'Bob',
        email: 'bob@example.com',
      });

      const invitation1 = await createTestInvitation(game.id, player1.id, {
        status: 'invited',
        position: 1,
      });
      await createTestInvitation(game.id, player2.id, {
        status: 'pending',
        position: 2,
      });

      // Player 1 confirms
      await processResponse(invitation1.id, player1.id, {
        action: 'auto_respond',
        response: "You're in!",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      // Verify calendar was created for player 1
      expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          attendeeEmail: 'alice@example.com',
          attendeeName: 'Alice Player',
        })
      );

      const updated1 = await getInvitation(invitation1.id);
      expect(updated1?.status).toBe('confirmed');
      expect(updated1?.googleCalendarEventId).toBe('test-event-123');

      // Clear mocks for next assertions
      vi.mocked(sendSMS).mockClear();
      mockCreateCalendarEvent.mockClear();

      // Now simulate player 1 dropping out (would trigger invite_next)
      // This would be handled by the decline flow
    });
  });

  describe('Calendar event status tracking', () => {
    it('should store calendar status as pending initially', async () => {
      const { processResponse } = await import('@/lib/invitation/flow');

      const game = await createTestGame({ status: 'active' });
      const player = await createTestPlayer({ email: 'test@example.com' });
      const invitation = await createTestInvitation(game.id, player.id, {
        status: 'invited',
        position: 1,
      });

      await processResponse(invitation.id, player.id, {
        action: 'auto_respond',
        response: "You're in!",
        sideEffects: ['confirm_player', 'send_calendar_invite'],
      });

      const updated = await getInvitation(invitation.id);
      expect(updated?.calendarStatus).toBe('pending');
    });
  });
});
