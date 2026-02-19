'use server';

import { revalidatePath } from 'next/cache';
import {
  createPlayer as createPlayerData,
  updatePlayer as updatePlayerData,
  deletePlayer as deletePlayerData,
  reactivatePlayer as reactivatePlayerData,
  type PlayerCreateInput,
  type PlayerUpdateInput,
} from '@/lib/data/players';

export async function createPlayerAction(data: PlayerCreateInput) {
  try {
    await createPlayerData(data);
    revalidatePath('/players');
    return { success: true };
  } catch (error) {
    console.error('Failed to create player:', error);
    return { success: false, error: 'Failed to create player' };
  }
}

export async function updatePlayerAction(id: string, data: PlayerUpdateInput) {
  try {
    await updatePlayerData(id, data);
    revalidatePath('/players');
    return { success: true };
  } catch (error) {
    console.error('Failed to update player:', error);
    return { success: false, error: 'Failed to update player' };
  }
}

export async function deletePlayerAction(id: string) {
  try {
    await deletePlayerData(id);
    revalidatePath('/players');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete player:', error);
    return { success: false, error: 'Failed to delete player' };
  }
}

export async function reactivatePlayerAction(id: string) {
  try {
    await reactivatePlayerData(id);
    revalidatePath('/players');
    revalidatePath('/players/opted-out');
    return { success: true };
  } catch (error) {
    console.error('Failed to reactivate player:', error);
    return { success: false, error: 'Failed to reactivate player' };
  }
}
