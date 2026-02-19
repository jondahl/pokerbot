import { prisma } from '@/lib/db/prisma';
import type { Player } from '@prisma/client';

export type PlayerCreateInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

export type PlayerUpdateInput = Partial<PlayerCreateInput>;

export async function getPlayers(): Promise<Player[]> {
  return prisma.player.findMany({
    where: { optedOut: false },
    orderBy: { firstName: 'asc' },
  });
}

export async function getPlayer(id: string): Promise<Player | null> {
  return prisma.player.findUnique({
    where: { id },
  });
}

export async function createPlayer(data: PlayerCreateInput): Promise<Player> {
  return prisma.player.create({
    data,
  });
}

export async function updatePlayer(
  id: string,
  data: PlayerUpdateInput
): Promise<Player> {
  return prisma.player.update({
    where: { id },
    data,
  });
}

export async function deletePlayer(id: string): Promise<Player> {
  // Soft delete - just mark as opted out
  return prisma.player.update({
    where: { id },
    data: { optedOut: true },
  });
}

export async function optOutPlayer(id: string): Promise<Player> {
  return prisma.player.update({
    where: { id },
    data: { optedOut: true },
  });
}

export async function reactivatePlayer(id: string): Promise<Player> {
  return prisma.player.update({
    where: { id },
    data: { optedOut: false },
  });
}

export async function getOptedOutPlayers(): Promise<Player[]> {
  return prisma.player.findMany({
    where: { optedOut: true },
    orderBy: { firstName: 'asc' },
  });
}

export async function getPlayerByPhone(phone: string): Promise<Player | null> {
  return prisma.player.findUnique({
    where: { phone },
  });
}
