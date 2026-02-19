import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock the login action
const mockLogin = vi.fn();
vi.mock('../actions', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should have a password input of type password', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should call login action with password on submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ success: true });

      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(passwordInput, 'test-password');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test-password');
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ success: true });

      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(passwordInput, 'correct-password');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should show error message on failed login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ success: false, error: 'Invalid password' });

      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(passwordInput, 'wrong-password');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      // Slow promise to keep loading state
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(passwordInput, 'test-password');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should not submit with empty password', async () => {
      const user = userEvent.setup();

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });
});
