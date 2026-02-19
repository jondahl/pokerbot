'use client';

import { useState } from 'react';
import { sendInvitationsAction } from './actions';

interface SendInvitationsButtonProps {
  gameId: string;
}

export default function SendInvitationsButton({ gameId }: SendInvitationsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);

  async function handleSend() {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendInvitationsAction(gameId);
      if (response.success) {
        setResult({ count: response.sentCount || 0 });
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSend}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send Invitations'}
      </button>
      {result && (
        <span className="text-sm text-gray-600">
          {result.count > 0
            ? `Sent ${result.count} invitation${result.count === 1 ? '' : 's'}`
            : 'No invitations to send'}
        </span>
      )}
    </div>
  );
}
