// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock twilio
vi.mock('@/lib/sms/twilio', () => ({
  sendSMS: vi.fn(),
}));

describe('Admin Notifications', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('notifyAdminsOfEscalation', () => {
    it('should send SMS to all configured admin phones', async () => {
      process.env.ADMIN_PHONE_NUMBERS = '+15551111111,+15552222222';

      // Need to re-import to pick up new env
      vi.resetModules();
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { notifyAdminsOfEscalation } = await import('../admin');

      vi.mocked(sendSMS).mockResolvedValue({ success: true });

      const result = await notifyAdminsOfEscalation({
        playerName: 'John',
        playerPhone: '+15553333333',
        message: 'Can I bring a friend?',
        reason: 'Unknown request type',
        gameDate: 'Sat, Mar 15',
        gameLocation: '123 Main St',
      });

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(sendSMS).toHaveBeenCalledTimes(2);
      expect(sendSMS).toHaveBeenCalledWith(
        '+15551111111',
        expect.stringContaining('John')
      );
      expect(sendSMS).toHaveBeenCalledWith(
        '+15552222222',
        expect.stringContaining('Can I bring a friend?')
      );
    });

    it('should skip notification if no admin phones configured', async () => {
      process.env.ADMIN_PHONE_NUMBERS = '';

      vi.resetModules();
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { notifyAdminsOfEscalation } = await import('../admin');

      const result = await notifyAdminsOfEscalation({
        playerName: 'John',
        playerPhone: '+15553333333',
        message: 'Test',
        reason: 'Test reason',
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(sendSMS).not.toHaveBeenCalled();
    });

    it('should handle partial failures', async () => {
      process.env.ADMIN_PHONE_NUMBERS = '+15551111111,+15552222222';

      vi.resetModules();
      const { sendSMS } = await import('@/lib/sms/twilio');
      const { notifyAdminsOfEscalation } = await import('../admin');

      vi.mocked(sendSMS)
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Failed'));

      const result = await notifyAdminsOfEscalation({
        playerName: 'John',
        playerPhone: '+15553333333',
        message: 'Test',
        reason: 'Test reason',
      });

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('isAdminNotificationsConfigured', () => {
    it('should return true when admin phones configured', async () => {
      process.env.ADMIN_PHONE_NUMBERS = '+15551111111';

      vi.resetModules();
      const { isAdminNotificationsConfigured } = await import('../admin');

      expect(isAdminNotificationsConfigured()).toBe(true);
    });

    it('should return false when no admin phones configured', async () => {
      process.env.ADMIN_PHONE_NUMBERS = '';

      vi.resetModules();
      const { isAdminNotificationsConfigured } = await import('../admin');

      expect(isAdminNotificationsConfigured()).toBe(false);
    });
  });
});
