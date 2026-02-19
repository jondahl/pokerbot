import { prisma } from '@/lib/db/prisma';
import type { Game, GameStatus } from '@prisma/client';

export type GameCreateInput = {
  date: Date;
  time: Date;
  timeBlock: string;
  location: string;
  entryInstructions?: string;
  capacity?: number;
  rsvpDeadline: Date;
};

export type GameWithInvitations = Game & {
  invitations: { status: string }[];
};

export async function getGames(): Promise<GameWithInvitations[]> {
  return prisma.game.findMany({
    orderBy: { date: 'desc' },
    include: {
      invitations: {
        select: { status: true },
      },
    },
  });
}

export async function getGame(id: string): Promise<GameWithInvitations | null> {
  return prisma.game.findUnique({
    where: { id },
    include: {
      invitations: {
        select: { status: true },
      },
    },
  });
}

export async function createGame(data: GameCreateInput): Promise<Game> {
  return prisma.game.create({
    data: {
      ...data,
      status: 'draft',
    },
  });
}

export async function updateGameStatus(
  id: string,
  status: GameStatus
): Promise<Game> {
  return prisma.game.update({
    where: { id },
    data: { status },
  });
}
