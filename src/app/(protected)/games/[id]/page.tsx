import { notFound } from 'next/navigation';
import { getGame } from '@/lib/data/games';
import { getInvitationsForGame } from '@/lib/data/invitations';
import { getPlayers } from '@/lib/data/players';
import { getMessagesForGame } from '@/lib/data/messages';
import InvitationList from './InvitationList';
import AddInvitationsForm from './AddInvitationsForm';
import SendInvitationsButton from './SendInvitationsButton';
import GameStatusButton from './GameStatusButton';
import MessageLog from './MessageLog';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    notFound();
  }

  const invitations = await getInvitationsForGame(id);
  const allPlayers = await getPlayers();
  const messages = await getMessagesForGame(id);

  // Players not yet invited to this game
  const invitedPlayerIds = new Set(invitations.map((inv) => inv.playerId));
  const availablePlayers = allPlayers.filter((p) => !invitedPlayerIds.has(p.id));

  const confirmedCount = invitations.filter((inv) => inv.status === 'confirmed').length;
  const invitedCount = invitations.filter((inv) => inv.status === 'invited').length;
  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const pendingCount = pendingInvitations.length;
  const pendingOptedOutCount = pendingInvitations.filter((inv) => inv.player.optedOut).length;
  const pendingEligibleCount = pendingCount - pendingOptedOutCount;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Game: {game.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h1>
          <p className="mt-2 text-gray-600">
            {game.time.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })} at {game.location}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              game.status === 'active'
                ? 'bg-green-100 text-green-800'
                : game.status === 'draft'
                ? 'bg-gray-100 text-gray-800'
                : game.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Capacity</div>
          <div className="text-2xl font-semibold">{game.capacity}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Confirmed</div>
          <div className="text-2xl font-semibold text-green-600">{confirmedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Invited (Waiting)</div>
          <div className="text-2xl font-semibold text-yellow-600">{invitedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">In Queue</div>
          <div className="text-2xl font-semibold text-gray-600">
            {pendingCount}
            {pendingOptedOutCount > 0 && (
              <span className="text-sm font-normal text-red-500 ml-2">
                ({pendingOptedOutCount} opted out)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Game Status Actions */}
      <div className="mt-6 flex items-center space-x-4">
        <GameStatusButton gameId={id} currentStatus={game.status} />
        {game.status === 'active' && pendingCount > 0 && (
          <SendInvitationsButton gameId={id} />
        )}
      </div>

      {/* Draft Mode Instructions */}
      {game.status === 'draft' && pendingCount > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Game is in draft mode.</strong> Click &ldquo;Activate Game&rdquo; to enable sending invitations,
            then click &ldquo;Send Invitations&rdquo; to send SMS to players in the queue.
          </p>
        </div>
      )}

      {/* Warning: All pending players opted out */}
      {game.status === 'active' && pendingCount > 0 && pendingEligibleCount === 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> All players in the queue have opted out of SMS notifications.
            They will not receive invitations. Add new players or reactivate opted-out players from the Players page.
          </p>
        </div>
      )}

      {/* Warning: Some pending players opted out */}
      {game.status === 'active' && pendingOptedOutCount > 0 && pendingEligibleCount > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> {pendingOptedOutCount} player{pendingOptedOutCount === 1 ? ' has' : 's have'} opted out and will be skipped.
            {pendingEligibleCount} eligible player{pendingEligibleCount === 1 ? ' remains' : 's remain'} in the queue.
          </p>
        </div>
      )}

      {/* Add Players to Queue */}
      {availablePlayers.length > 0 && (
        <div className="mt-6">
          <AddInvitationsForm
            gameId={id}
            availablePlayers={availablePlayers}
            nextPosition={invitations.length + 1}
          />
        </div>
      )}

      {/* Invitations List */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Invitations</h2>
        <InvitationList invitations={invitations} />
      </div>

      {/* Message Log */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Message Log ({messages.length})
        </h2>
        <MessageLog messages={messages} />
      </div>
    </div>
  );
}
