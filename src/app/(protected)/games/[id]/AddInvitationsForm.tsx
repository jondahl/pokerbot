'use client';

import { useState } from 'react';
import type { Player } from '@prisma/client';
import { addPlayersToGameAction } from './actions';

interface AddInvitationsFormProps {
  gameId: string;
  availablePlayers: Player[];
  nextPosition: number;
}

export default function AddInvitationsForm({
  gameId,
  availablePlayers,
  nextPosition,
}: AddInvitationsFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function togglePlayer(playerId: string) {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  async function handleSubmit() {
    if (selectedPlayers.length === 0) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await addPlayersToGameAction(gameId, selectedPlayers, nextPosition);
      if (result.success) {
        setSelectedPlayers([]);
        setIsOpen(false);
      } else {
        setError(result.error || 'Failed to add players');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        + Add Players to Queue
      </button>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add Players to Queue</h3>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {availablePlayers.map((player) => (
          <label
            key={player.id}
            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedPlayers.includes(player.id)}
              onChange={() => togglePlayer(player.id)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-900">
              {player.firstName} {player.lastName}
            </span>
            <span className="ml-2 text-sm text-gray-500">({player.phone})</span>
          </label>
        ))}
      </div>

      {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}

      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setSelectedPlayers([]);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || selectedPlayers.length === 0}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : `Add ${selectedPlayers.length} Player${selectedPlayers.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
