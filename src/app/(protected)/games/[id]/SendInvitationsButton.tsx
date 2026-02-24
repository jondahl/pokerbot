'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SendInvitationsButtonProps {
  gameId: string;
}

export default function SendInvitationsButton({ gameId }: SendInvitationsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; error?: string } | null>(null);
  const router = useRouter();

  async function handleSend() {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/games/${gameId}/send-invitations`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult({ count: data.sentCount || 0 });
        router.refresh();
      } else {
        setResult({ count: 0, error: data.error || 'Unknown error' });
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
      setResult({ count: 0, error: String(error) });
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
        <span className={`text-sm ${result.error ? 'text-red-600' : 'text-gray-600'}`}>
          {result.error
            ? `Error: ${result.error}`
            : result.count > 0
              ? `Sent ${result.count} invitation${result.count === 1 ? '' : 's'}`
              : 'No invitations to send'}
        </span>
      )}
    </div>
  );
}
