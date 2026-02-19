'use server';

import { revalidatePath } from 'next/cache';
import { createInvitation } from '@/lib/data/invitations';
import { sendInvitationsForGame } from '@/lib/invitation/flow';

export async function addPlayersToGameAction(
  gameId: string,
  playerIds: string[],
  startPosition: number
) {
  try {
    // Create invitations for each player
    for (let i = 0; i < playerIds.length; i++) {
      await createInvitation({
        gameId,
        playerId: playerIds[i],
        position: startPosition + i,
      });
    }

    revalidatePath(`/games/${gameId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to add players to game:', error);
    return { success: false, error: 'Failed to add players' };
  }
}

export async function sendInvitationsAction(gameId: string) {
  try {
    const sentCount = await sendInvitationsForGame(gameId);
    revalidatePath(`/games/${gameId}`);
    return { success: true, sentCount };
  } catch (error) {
    console.error('Failed to send invitations:', error);
    return { success: false, error: 'Failed to send invitations' };
  }
}
