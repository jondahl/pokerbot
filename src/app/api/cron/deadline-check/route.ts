import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { inviteNextPlayer } from '@/lib/invitation/flow';
import { updatePlayerResponseStats } from '@/lib/data/invitations';

/**
 * RSVP Deadline Timeout Cron Job
 *
 * Runs hourly to:
 * 1. Find all active games past their RSVP deadline
 * 2. Mark invited players who haven't responded as timed out
 * 3. Trigger invite cascade for each timeout
 *
 * POST /api/cron/deadline-check
 */
export async function POST(request: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    // Find all active games that are past their RSVP deadline
    const activeGames = await prisma.game.findMany({
      where: {
        status: 'active',
        rsvpDeadline: { lt: now },
      },
    });

    let totalTimedOut = 0;
    let totalCascaded = 0;

    for (const game of activeGames) {
      // Find invitations that are still "invited" (no response) and were sent before the deadline
      const timedOutInvitations = await prisma.invitation.findMany({
        where: {
          gameId: game.id,
          status: 'invited',
          invitedAt: { lt: game.rsvpDeadline },
          respondedAt: null,
        },
        include: { player: true },
      });

      for (const invitation of timedOutInvitations) {
        // Mark as timed out
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'timeout',
            respondedAt: now,
          },
        });

        // Update player stats (timeout counts against them)
        await updatePlayerResponseStats(invitation.playerId, false);

        totalTimedOut++;

        console.log(
          `Timed out invitation for ${invitation.player.firstName} ${invitation.player.lastName} (game: ${game.id})`
        );

        // Trigger cascade - invite next player
        const cascaded = await inviteNextPlayer(game.id);
        if (cascaded) {
          totalCascaded++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      gamesProcessed: activeGames.length,
      timedOut: totalTimedOut,
      cascaded: totalCascaded,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Deadline check cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
