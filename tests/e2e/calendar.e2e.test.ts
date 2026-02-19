/**
 * Google Calendar E2E Tests
 *
 * These tests call the REAL Google Calendar API.
 * They require valid credentials to be configured in .env:
 *   - GOOGLE_SERVICE_ACCOUNT_FILE
 *   - GOOGLE_CALENDAR_ID
 *
 * Tests clean up after themselves by deleting any events they create.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  createCalendarEvent,
  cancelCalendarEvent,
} from '@/lib/calendar';

// Track created events for cleanup
const createdEventIds: string[] = [];

// Check if credentials are configured
const canRunE2E =
  process.env.GOOGLE_SERVICE_ACCOUNT_FILE &&
  process.env.GOOGLE_CALENDAR_ID;

describe.skipIf(!canRunE2E)('Google Calendar E2E', () => {
  afterEach(async () => {
    // Clean up any events created during tests
    for (const eventId of createdEventIds) {
      try {
        await cancelCalendarEvent(eventId);
      } catch {
        // Ignore cleanup errors
      }
    }
    createdEventIds.length = 0;
  });

  describe('Player confirmation flow', () => {
    it('should create a real calendar event when player confirms', async () => {
      // Create a test event (simulating player saying YES)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0);

      const result = await createCalendarEvent({
        gameDate: tomorrow,
        gameTime: tomorrow,
        timeBlock: 'Arrive 6:30-7; cards at 7 - TEST EVENT',
        location: 'Test Location - 123 Test St',
        entryInstructions: 'This is a test event - please ignore',
        attendeeEmail: 'test@example.com',
        attendeeName: 'Test Player',
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(typeof result.eventId).toBe('string');

      // Track for cleanup
      if (result.eventId) {
        createdEventIds.push(result.eventId);
      }

      console.log('Created test calendar event:', result.eventId);
    });

    it('should return an event link for sharing', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0);

      const result = await createCalendarEvent({
        gameDate: tomorrow,
        gameTime: tomorrow,
        timeBlock: 'TEST - Event link test',
        location: 'Test Location',
        attendeeEmail: 'linktest@example.com',
        attendeeName: 'Link Test Player',
      });

      expect(result.success).toBe(true);
      expect(result.eventLink).toBeDefined();
      expect(result.eventLink).toContain('google.com/calendar');

      if (result.eventId) {
        createdEventIds.push(result.eventId);
      }

      console.log('Event link:', result.eventLink);
    });
  });

  describe('Player decline flow', () => {
    it('should cancel calendar event when player declines', async () => {
      // First create an event
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0);

      const createResult = await createCalendarEvent({
        gameDate: tomorrow,
        gameTime: tomorrow,
        timeBlock: 'TEST - Event to be cancelled',
        location: 'Test Location',
        attendeeEmail: 'decline@example.com',
        attendeeName: 'Declining Player',
      });

      expect(createResult.success).toBe(true);
      expect(createResult.eventId).toBeDefined();

      console.log('Created event to cancel:', createResult.eventId);

      // Now cancel it (simulating player declining)
      const cancelResult = await cancelCalendarEvent(createResult.eventId!);

      expect(cancelResult.success).toBe(true);

      console.log('Successfully cancelled event');
    });

    it('should handle cancelling non-existent event gracefully', async () => {
      const result = await cancelCalendarEvent('nonexistent-event-id-12345');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
