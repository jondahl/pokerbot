'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GameStatus } from '@prisma/client';
import type { GameWithInvitations } from '@/lib/data/games';
import { updateGameStatusAction } from './actions';

interface GameListProps {
  games: GameWithInvitations[];
}

const statusColors: Record<GameStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<GameStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function GameList({ games }: GameListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: GameStatus) {
    setUpdatingId(id);
    try {
      await updateGameStatusAction(id, status);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No games scheduled. Create your first game above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capacity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              RSVPs
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {games.map((game) => {
            const confirmedCount = game.invitations.filter(
              (inv) => inv.status === 'confirmed'
            ).length;
            const invitedCount = game.invitations.filter(
              (inv) => inv.status === 'invited'
            ).length;

            return (
              <tr key={game.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/games/${game.id}`} className="hover:underline">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(game.time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{game.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{game.capacity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {confirmedCount} confirmed
                  </div>
                  {invitedCount > 0 && (
                    <div className="text-sm text-gray-500">
                      {invitedCount} pending
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[game.status]}`}
                  >
                    {statusLabels[game.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {game.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(game.id, 'active')}
                      disabled={updatingId === game.id}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 mr-3"
                    >
                      Activate
                    </button>
                  )}
                  {game.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(game.id, 'completed')}
                        disabled={updatingId === game.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 mr-3"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange(game.id, 'cancelled')}
                        disabled={updatingId === game.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
