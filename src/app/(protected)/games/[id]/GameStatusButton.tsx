'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GameStatus } from '@prisma/client';
import { updateGameStatusAction } from '../actions';

interface GameStatusButtonProps {
  gameId: string;
  currentStatus: GameStatus;
}

export default function GameStatusButton({ gameId, currentStatus }: GameStatusButtonProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(newStatus: GameStatus) {
    setIsUpdating(true);
    try {
      const result = await updateGameStatusAction(gameId, newStatus);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  if (currentStatus === 'draft') {
    return (
      <button
        onClick={() => handleStatusChange('active')}
        disabled={isUpdating}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {isUpdating ? 'Activating...' : 'Activate Game'}
      </button>
    );
  }

  if (currentStatus === 'active') {
    return (
      <div className="flex space-x-3">
        <button
          onClick={() => handleStatusChange('completed')}
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Mark Complete'}
        </button>
        <button
          onClick={() => handleStatusChange('cancelled')}
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Cancel Game'}
        </button>
      </div>
    );
  }

  return null;
}
