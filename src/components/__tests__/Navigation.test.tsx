import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navigation from '../Navigation';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}));

// Mock logout action
const mockLogout = vi.fn();
vi.mock('@/app/actions', () => ({
  logout: () => mockLogout(),
}));

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the app title', () => {
    render(<Navigation />);
    expect(screen.getByText('PokerList')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /players/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /games/i })).toBeInTheDocument();
  });

  it('should have correct href for each link', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /players/i })).toHaveAttribute('href', '/players');
    expect(screen.getByRole('link', { name: /games/i })).toHaveAttribute('href', '/games');
  });

  it('should render a logout button', () => {
    render(<Navigation />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should call logout action when logout button is clicked', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue(undefined);

    render(<Navigation />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });
});
