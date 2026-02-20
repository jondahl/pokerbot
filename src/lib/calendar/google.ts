import { google, calendar_v3 } from 'googleapis';
import * as fs from 'fs';

// Lazy-initialize client to avoid errors during build
let calendarClient: calendar_v3.Calendar | null = null;

/**
 * Load service account credentials from either:
 * - GOOGLE_SERVICE_ACCOUNT_JSON (base64 encoded, for Vercel)
 * - GOOGLE_SERVICE_ACCOUNT_FILE (file path, for local dev)
 */
function loadCredentials(): Record<string, unknown> {
  // Try base64-encoded JSON first (Vercel)
  const base64Json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (base64Json) {
    const json = Buffer.from(base64Json, 'base64').toString('utf8');
    return JSON.parse(json);
  }

  // Fall back to file path (local dev)
  const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (serviceAccountFile) {
    return JSON.parse(fs.readFileSync(serviceAccountFile, 'utf8'));
  }

  throw new Error(
    'Google Calendar credentials not configured. ' +
    'Set GOOGLE_SERVICE_ACCOUNT_JSON (base64) or GOOGLE_SERVICE_ACCOUNT_FILE (path).'
  );
}

function getClient(): calendar_v3.Calendar {
  if (!calendarClient) {
    const credentials = loadCredentials();

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    calendarClient = google.calendar({ version: 'v3', auth });
  }
  return calendarClient;
}

function getCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not configured');
  }
  return calendarId;
}

// Types
export interface CreateCalendarEventInput {
  gameDate: Date;
  gameTime: Date;
  timeBlock: string;
  location: string;
  entryInstructions?: string;
  attendeeEmail: string;
  attendeeName: string;
}

export interface CreateCalendarEventResult {
  success: boolean;
  eventId?: string;
  eventLink?: string;
  error?: string;
}

export interface CancelCalendarEventResult {
  success: boolean;
  error?: string;
}

export type CalendarEventStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction' | null;

export interface GetEventStatusResult {
  success: boolean;
  status?: CalendarEventStatus;
  error?: string;
}

/**
 * Combine a date and time into a single Date object
 */
function combineDateTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours());
  combined.setMinutes(time.getMinutes());
  combined.setSeconds(0);
  combined.setMilliseconds(0);
  return combined;
}

/**
 * Build event description from game details
 */
function buildEventDescription(input: CreateCalendarEventInput): string {
  let description = input.timeBlock;

  if (input.entryInstructions) {
    description += `\n\nEntry instructions: ${input.entryInstructions}`;
  }

  return description;
}

/**
 * Create a Google Calendar event and invite the attendee
 *
 * Note: Service accounts without Domain-Wide Delegation cannot send email invites.
 * In that case, we create the event without attendees and return a link to share.
 */
export async function createCalendarEvent(
  input: CreateCalendarEventInput
): Promise<CreateCalendarEventResult> {
  const client = getClient();
  const calendarId = getCalendarId();

  // Calculate event start/end times
  const startDateTime = combineDateTime(input.gameDate, input.gameTime);
  const endDateTime = new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000); // 4 hour duration

  // Build event description
  let description = buildEventDescription(input);
  description += `\n\nPlayer: ${input.attendeeName} (${input.attendeeEmail})`;

  const baseEvent: calendar_v3.Schema$Event = {
    summary: `Poker Night - ${input.attendeeName}`,
    description,
    location: input.location,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
  };

  // Try with attendees first (works with Domain-Wide Delegation)
  try {
    const eventWithAttendees = {
      ...baseEvent,
      attendees: [
        {
          email: input.attendeeEmail,
          displayName: input.attendeeName,
        },
      ],
    };

    const response = await client.events.insert({
      calendarId,
      requestBody: eventWithAttendees,
      sendUpdates: 'all',
    });

    return {
      success: true,
      eventId: response.data.id || undefined,
      eventLink: response.data.htmlLink || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If it's a delegation error, retry without attendees
    if (errorMessage.includes('Domain-Wide Delegation')) {
      console.log('Domain-Wide Delegation not enabled, creating event without attendees');

      try {
        const response = await client.events.insert({
          calendarId,
          requestBody: baseEvent,
        });

        return {
          success: true,
          eventId: response.data.id || undefined,
          eventLink: response.data.htmlLink || undefined,
        };
      } catch (retryError) {
        const retryMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
        console.error('Failed to create calendar event (retry):', retryMessage);

        return {
          success: false,
          error: retryMessage,
        };
      }
    }

    console.error('Failed to create calendar event:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Cancel/delete a Google Calendar event
 */
export async function cancelCalendarEvent(
  eventId: string
): Promise<CancelCalendarEventResult> {
  try {
    const client = getClient();
    const calendarId = getCalendarId();

    await client.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all', // Notify attendees of cancellation
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to cancel calendar event:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the attendee's response status for a calendar event
 * Used for polling-based decline detection
 */
export async function getEventAttendeeStatus(
  eventId: string,
  email: string
): Promise<GetEventStatusResult> {
  try {
    const client = getClient();
    const calendarId = getCalendarId();

    const response = await client.events.get({
      calendarId,
      eventId,
    });

    const attendee = response.data.attendees?.find(
      (a) => a.email?.toLowerCase() === email.toLowerCase()
    );

    if (!attendee) {
      return {
        success: true,
        status: null,
      };
    }

    return {
      success: true,
      status: attendee.responseStatus as CalendarEventStatus,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get event attendee status:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
