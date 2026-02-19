import { prisma } from '@/lib/db/prisma';

export interface DashboardStats {
  upcomingGames: number;
  totalPlayers: number;
  pendingInvitations: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();

  const [upcomingGames, totalPlayers, pendingInvitations] = await Promise.all([
    prisma.game.count({
      where: {
        date: { gte: now },
        status: 'active',
      },
    }),
    prisma.player.count({
      where: { optedOut: false },
    }),
    prisma.invitation.count({
      where: { status: 'invited' },
    }),
  ]);

  return {
    upcomingGames,
    totalPlayers,
    pendingInvitations,
  };
}
