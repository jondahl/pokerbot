import Link from 'next/link';
import { getPlayers, getOptedOutPlayers } from '@/lib/data/players';
import PlayerList from './PlayerList';
import AddPlayerForm from './AddPlayerForm';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const [players, optedOutPlayers] = await Promise.all([
    getPlayers(),
    getOptedOutPlayers(),
  ]);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="mt-2 text-gray-600">
            Manage your poker player roster.
          </p>
        </div>
        {optedOutPlayers.length > 0 && (
          <Link
            href="/players/opted-out"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Opted Out ({optedOutPlayers.length})
          </Link>
        )}
      </div>

      <div className="mt-8">
        <AddPlayerForm />
      </div>

      <div className="mt-8">
        <PlayerList players={players} />
      </div>
    </div>
  );
}
