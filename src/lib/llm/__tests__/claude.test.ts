// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic client
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: mockCreate,
    };
  },
}));

describe('Claude LLM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
  });

  describe('parsePlayerResponse', () => {
    it('should parse a YES response correctly', async () => {
      const { parsePlayerResponse } = await import('../claude');

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              action: 'auto_respond',
              response: 'Great, you\'re in. See you March 11.',
              side_effects: ['confirm_player', 'send_calendar_invite'],
            }),
          },
        ],
      });

      const result = await parsePlayerResponse({
        playerMessage: 'Yes, I\'m in!',
        playerName: 'John',
        playerStatus: 'invited',
        gameDate: '2024-03-11',
        gameTime: '7:00 PM',
        gameLocation: '123 Main St',
      });

      expect(result.action).toBe('auto_respond');
      expect(result.response).toContain('you\'re in');
      expect(result.sideEffects).toContain('confirm_player');
    });

    it('should parse a NO response correctly', async () => {
      const { parsePlayerResponse } = await import('../claude');

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              action: 'auto_respond',
              response: 'Thanks. Another time!',
              side_effects: ['decline_player', 'invite_next'],
            }),
          },
        ],
      });

      const result = await parsePlayerResponse({
        playerMessage: 'Can\'t make it, sorry',
        playerName: 'Jane',
        playerStatus: 'invited',
        gameDate: '2024-03-11',
        gameTime: '7:00 PM',
        gameLocation: '123 Main St',
      });

      expect(result.action).toBe('auto_respond');
      expect(result.response).toBe('Thanks. Another time!');
      expect(result.sideEffects).toContain('decline_player');
    });

    it('should escalate ambiguous messages', async () => {
      const { parsePlayerResponse } = await import('../claude');

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              action: 'escalate',
              reason: 'Player asking about bringing a friend',
              suggested_response: 'Let me check with Jon and get back to you.',
            }),
          },
        ],
      });

      const result = await parsePlayerResponse({
        playerMessage: 'Can I bring my friend Mike?',
        playerName: 'Bob',
        playerStatus: 'invited',
        gameDate: '2024-03-11',
        gameTime: '7:00 PM',
        gameLocation: '123 Main St',
      });

      expect(result.action).toBe('escalate');
      expect(result.reason).toBeDefined();
      expect(result.suggestedResponse).toBeDefined();
    });

    it('should handle opt-out correctly', async () => {
      const { parsePlayerResponse } = await import('../claude');

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              action: 'auto_respond',
              response: 'Got it - you won\'t receive any more messages.',
              side_effects: ['opt_out_player'],
            }),
          },
        ],
      });

      const result = await parsePlayerResponse({
        playerMessage: 'STOP',
        playerName: 'Alice',
        playerStatus: 'invited',
        gameDate: '2024-03-11',
        gameTime: '7:00 PM',
        gameLocation: '123 Main St',
      });

      expect(result.action).toBe('auto_respond');
      expect(result.sideEffects).toContain('opt_out_player');
    });
  });
});
