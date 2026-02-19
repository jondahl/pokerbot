'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveEscalationAction, confirmPlayerAction, declinePlayerAction } from './actions';

interface EscalationResponseFormProps {
  escalationId: string;
  playerId: string;
  playerPhone: string;
  suggestedResponse?: string;
}

const quickResponses = [
  { label: 'Confirm player', action: 'confirm', message: "Great, you're in! See you there." },
  { label: 'Decline player', action: 'decline', message: 'Thanks for letting us know. Maybe next time!' },
  { label: "Can't help", action: 'custom', message: "Sorry, I can't help with that. A host will reach out if needed." },
];

export default function EscalationResponseForm({
  escalationId,
  playerId,
  playerPhone,
  suggestedResponse,
}: EscalationResponseFormProps) {
  const router = useRouter();
  const [response, setResponse] = useState(suggestedResponse || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleQuickAction(action: string, message: string) {
    setIsLoading(true);
    setError('');

    try {
      if (action === 'confirm') {
        await confirmPlayerAction(escalationId, playerId, playerPhone);
      } else if (action === 'decline') {
        await declinePlayerAction(escalationId, playerId, playerPhone);
      } else {
        await resolveEscalationAction(escalationId, playerPhone, message);
      }
      router.push('/escalations');
    } catch {
      setError('Failed to send response');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCustomResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await resolveEscalationAction(escalationId, playerPhone, response);
      router.push('/escalations');
    } catch {
      setError('Failed to send response');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Respond</h2>

      {/* Quick Actions */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
        <div className="space-y-2">
          {quickResponses.map((qr) => (
            <button
              key={qr.action}
              onClick={() => handleQuickAction(qr.action, qr.message)}
              disabled={isLoading}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                qr.action === 'confirm'
                  ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-800'
                  : qr.action === 'decline'
                  ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-800'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
              } disabled:opacity-50`}
            >
              <span className="font-medium">{qr.label}</span>
              <span className="block text-sm opacity-75 mt-1">&quot;{qr.message}&quot;</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or custom response</span>
        </div>
      </div>

      {/* Custom Response Form */}
      <form onSubmit={handleCustomResponse}>
        <div>
          <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Message
          </label>
          <textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Type your response to the player..."
          />
          <p className="mt-1 text-xs text-gray-400">
            This will be sent as an SMS to {playerPhone}
          </p>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600">{error}</div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !response.trim()}
            className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Response'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/escalations')}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
