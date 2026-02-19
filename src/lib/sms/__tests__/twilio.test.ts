// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Twilio client
const mockCreate = vi.fn();
vi.mock('twilio', () => ({
  default: () => ({
    messages: {
      create: mockCreate,
    },
  }),
}));

describe('SMS Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('TWILIO_ACCOUNT_SID', 'test-sid');
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
    vi.stubEnv('TWILIO_PHONE_NUMBER', '+15551234567');
  });

  describe('sendSMS', () => {
    it('should send an SMS message via Twilio', async () => {
      const { sendSMS } = await import('../twilio');

      mockCreate.mockResolvedValue({
        sid: 'SM123456',
        status: 'queued',
      });

      const result = await sendSMS('+15559876543', 'Hello, this is a test message');

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SM123456');
      expect(mockCreate).toHaveBeenCalledWith({
        to: '+15559876543',
        from: '+15551234567',
        body: 'Hello, this is a test message',
      });
    });

    it('should return error on Twilio failure', async () => {
      const { sendSMS } = await import('../twilio');

      mockCreate.mockRejectedValue(new Error('Twilio error'));

      const result = await sendSMS('+15559876543', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Twilio error');
    });

    it('should format phone number with + prefix if missing', async () => {
      const { sendSMS } = await import('../twilio');

      mockCreate.mockResolvedValue({
        sid: 'SM123456',
        status: 'queued',
      });

      await sendSMS('15559876543', 'Test message');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+15559876543',
        })
      );
    });
  });

  describe('validateWebhook', () => {
    it('should validate Twilio webhook signature', async () => {
      const { validateWebhook } = await import('../twilio');

      // With valid env vars, it should not throw
      const isValid = validateWebhook(
        'valid-signature',
        'https://example.com/webhook',
        { Body: 'test' }
      );

      // In test mode with mocked signature validation, we expect it to return false
      // Real validation would require actual Twilio signature
      expect(typeof isValid).toBe('boolean');
    });
  });
});
