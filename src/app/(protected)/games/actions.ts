'use server';

import { revalidatePath } from 'next/cache';
import type { GameStatus } from '@prisma/client';
import {
  createGame as createGameData,
  updateGameStatus as updateGameStatusData,
  type GameCreateInput,
} from '@/lib/data/games';

export async function createGameAction(data: GameCreateInput) {
  try {
    await createGameData(data);
    revalidatePath('/games');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create game:', error);
    return { success: false, error: 'Failed to create game' };
  }
}

export async function updateGameStatusAction(id: string, status: GameStatus) {
  try {
    await updateGameStatusData(id, status);
    revalidatePath('/games');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update game status:', error);
    return { success: false, error: 'Failed to update game status' };
  }
}
