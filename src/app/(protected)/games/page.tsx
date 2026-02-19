import { getGames } from '@/lib/data/games';
import GameList from './GameList';
import AddGameForm from './AddGameForm';

export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Games</h1>
          <p className="mt-2 text-gray-600">
            Schedule and manage poker games.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AddGameForm />
      </div>

      <div className="mt-8">
        <GameList games={games} />
      </div>
    </div>
  );
}
