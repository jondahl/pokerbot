'use client';

import { useState } from 'react';
import type { Player } from '@prisma/client';
import { reactivatePlayerAction } from '../actions';

interface OptedOutPlayerListProps {
  players: Player[];
}

export default function OptedOutPlayerList({ players }: OptedOutPlayerListProps) {
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  async function handleReactivate(id: string) {
    setReactivatingId(id);
    try {
      await reactivatePlayerAction(id);
    } catch (error) {
      console.error('Failed to reactivate player:', error);
    } finally {
      setReactivatingId(null);
    }
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No opted-out players.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {players.map((player) => (
            <tr key={player.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {player.firstName} {player.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{player.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{player.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleReactivate(player.id)}
                  disabled={reactivatingId === player.id}
                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                >
                  {reactivatingId === player.id ? 'Reactivating...' : 'Reactivate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
