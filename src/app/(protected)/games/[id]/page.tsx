import { notFound } from 'next/navigation';
import { getGame } from '@/lib/data/games';
import { getInvitationsForGame } from '@/lib/data/invitations';
import { getPlayers } from '@/lib/data/players';
import InvitationList from './InvitationList';
import AddInvitationsForm from './AddInvitationsForm';
import SendInvitationsButton from './SendInvitationsButton';

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

  // Players not yet invited to this game
  const invitedPlayerIds = new Set(invitations.map((inv) => inv.playerId));
  const availablePlayers = allPlayers.filter((p) => !invitedPlayerIds.has(p.id));

  const confirmedCount = invitations.filter((inv) => inv.status === 'confirmed').length;
  const invitedCount = invitations.filter((inv) => inv.status === 'invited').length;
  const pendingCount = invitations.filter((inv) => inv.status === 'pending').length;

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
          <div className="text-2xl font-semibold text-gray-600">{pendingCount}</div>
        </div>
      </div>

      {/* Actions */}
      {game.status === 'active' && pendingCount > 0 && (
        <div className="mt-6">
          <SendInvitationsButton gameId={id} />
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
    </div>
  );
}
