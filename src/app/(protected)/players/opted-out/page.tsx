import Link from 'next/link';
import { getOptedOutPlayers } from '@/lib/data/players';
import OptedOutPlayerList from './OptedOutPlayerList';

export const dynamic = 'force-dynamic';

export default async function OptedOutPlayersPage() {
  const players = await getOptedOutPlayers();

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opted-Out Players</h1>
          <p className="mt-2 text-gray-600">
            Players who have opted out of receiving SMS messages.
          </p>
        </div>
        <Link
          href="/players"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          &larr; Active Players
        </Link>
      </div>

      <div className="mt-8">
        <OptedOutPlayerList players={players} />
      </div>
    </div>
  );
}
