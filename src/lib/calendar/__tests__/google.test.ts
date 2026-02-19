// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock googleapis
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockGet = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn().mockImplementation(() => ({})),
    },
    calendar: vi.fn().mockReturnValue({
      events: {
        insert: mockInsert,
        delete: mockDelete,
        get: mockGet,
      },
    }),
  },
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue(
    JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key: 'test-key',
      client_email: 'test@test.iam.gserviceaccount.com',
    })
  ),
}));

describe('Google Calendar Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_FILE', '/path/to/service-account.json');
    vi.stubEnv('GOOGLE_CALENDAR_ID', 'primary');
  });

  describe('createCalendarEvent', () => {
    it('should create event and return event ID', async () => {
      const { createCalendarEvent } = await import('../google');

      mockInsert.mockResolvedValue({
        data: {
          id: 'event-123',
        },
      });

      const result = await createCalendarEvent({
        gameDate: new Date('2025-03-15'),
        gameTime: new Date('1970-01-01T19:00:00'),
        timeBlock: 'Arrive 6:30-7; cards at 7',
        location: 'Mux office',
        entryInstructions: 'Buzz 42',
        attendeeEmail: 'player@example.com',
        attendeeName: 'John Doe',
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-123');
    });

    it('should include attendee email and name', async () => {
      const { createCalendarEvent } = await import('../google');

      mockInsert.mockResolvedValue({
        data: { id: 'event-123' },
      });

      await createCalendarEvent({
        gameDate: new Date('2025-03-15'),
        gameTime: new Date('1970-01-01T19:00:00'),
        timeBlock: 'Arrive 6:30-7; cards at 7',
        location: 'Mux office',
        attendeeEmail: 'player@example.com',
        attendeeName: 'John Doe',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            attendees: [
              {
                email: 'player@example.com',
                displayName: 'John Doe',
              },
            ],
          }),
        })
      );
    });

    it('should set correct timezone', async () => {
      const { createCalendarEvent } = await import('../google');

      mockInsert.mockResolvedValue({
        data: { id: 'event-123' },
      });

      await createCalendarEvent({
        gameDate: new Date('2025-03-15'),
        gameTime: new Date('1970-01-01T19:00:00'),
        timeBlock: 'Arrive 6:30-7; cards at 7',
        location: 'Mux office',
        attendeeEmail: 'player@example.com',
        attendeeName: 'John Doe',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            start: expect.objectContaining({
              timeZone: 'America/Los_Angeles',
            }),
            end: expect.objectContaining({
              timeZone: 'America/Los_Angeles',
            }),
          }),
        })
      );
    });

    it('should include entry instructions in description', async () => {
      const { createCalendarEvent } = await import('../google');

      mockInsert.mockResolvedValue({
        data: { id: 'event-123' },
      });

      await createCalendarEvent({
        gameDate: new Date('2025-03-15'),
        gameTime: new Date('1970-01-01T19:00:00'),
        timeBlock: 'Arrive 6:30-7; cards at 7',
        location: 'Mux office',
        entryInstructions: 'Buzz 42',
        attendeeEmail: 'player@example.com',
        attendeeName: 'John Doe',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            description: expect.stringContaining('Entry instructions: Buzz 42'),
          }),
        })
      );
    });

    it('should return error on API failure', async () => {
      const { createCalendarEvent } = await import('../google');

      mockInsert.mockRejectedValue(new Error('API error'));

      const result = await createCalendarEvent({
        gameDate: new Date('2025-03-15'),
        gameTime: new Date('1970-01-01T19:00:00'),
        timeBlock: 'Arrive 6:30-7; cards at 7',
        location: 'Mux office',
        attendeeEmail: 'player@example.com',
        attendeeName: 'John Doe',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });

    it('should send update notifications to attendees', async () => {
      const { createCalendarEvent } = await import('../google');

      mockInsert.mockResolvedValue({
        data: { id: 'event-123' },
      });

      await createCalendarEvent({
        gameDate: new Date('2025-03-15'),
        gameTime: new Date('1970-01-01T19:00:00'),
        timeBlock: 'Arrive 6:30-7; cards at 7',
        location: 'Mux office',
        attendeeEmail: 'player@example.com',
        attendeeName: 'John Doe',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          sendUpdates: 'all',
        })
      );
    });
  });

  describe('cancelCalendarEvent', () => {
    it('should delete event and return success', async () => {
      const { cancelCalendarEvent } = await import('../google');

      mockDelete.mockResolvedValue({});

      const result = await cancelCalendarEvent('event-123');

      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
        sendUpdates: 'all',
      });
    });

    it('should return error if event not found', async () => {
      const { cancelCalendarEvent } = await import('../google');

      mockDelete.mockRejectedValue(new Error('Not Found'));

      const result = await cancelCalendarEvent('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Found');
    });
  });

  describe('getEventAttendeeStatus', () => {
    it("should return 'accepted' when attendee accepted", async () => {
      const { getEventAttendeeStatus } = await import('../google');

      mockGet.mockResolvedValue({
        data: {
          id: 'event-123',
          attendees: [
            {
              email: 'player@example.com',
              responseStatus: 'accepted',
            },
          ],
        },
      });

      const result = await getEventAttendeeStatus('event-123', 'player@example.com');

      expect(result.success).toBe(true);
      expect(result.status).toBe('accepted');
    });

    it("should return 'declined' when attendee declined", async () => {
      const { getEventAttendeeStatus } = await import('../google');

      mockGet.mockResolvedValue({
        data: {
          id: 'event-123',
          attendees: [
            {
              email: 'player@example.com',
              responseStatus: 'declined',
            },
          ],
        },
      });

      const result = await getEventAttendeeStatus('event-123', 'player@example.com');

      expect(result.success).toBe(true);
      expect(result.status).toBe('declined');
    });

    it('should return null if attendee not found', async () => {
      const { getEventAttendeeStatus } = await import('../google');

      mockGet.mockResolvedValue({
        data: {
          id: 'event-123',
          attendees: [
            {
              email: 'other@example.com',
              responseStatus: 'accepted',
            },
          ],
        },
      });

      const result = await getEventAttendeeStatus('event-123', 'player@example.com');

      expect(result.success).toBe(true);
      expect(result.status).toBe(null);
    });

    it('should handle case-insensitive email matching', async () => {
      const { getEventAttendeeStatus } = await import('../google');

      mockGet.mockResolvedValue({
        data: {
          id: 'event-123',
          attendees: [
            {
              email: 'PLAYER@EXAMPLE.COM',
              responseStatus: 'accepted',
            },
          ],
        },
      });

      const result = await getEventAttendeeStatus('event-123', 'player@example.com');

      expect(result.success).toBe(true);
      expect(result.status).toBe('accepted');
    });

    it('should return error if event not found', async () => {
      const { getEventAttendeeStatus } = await import('../google');

      mockGet.mockRejectedValue(new Error('Not Found'));

      const result = await getEventAttendeeStatus('nonexistent', 'player@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Found');
    });
  });
});
