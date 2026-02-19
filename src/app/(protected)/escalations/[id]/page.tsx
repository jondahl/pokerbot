import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEscalation, getConversationHistory } from '@/lib/data/messages';
import EscalationResponseForm from './EscalationResponseForm';

export const dynamic = 'force-dynamic';

interface EscalationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EscalationDetailPage({ params }: EscalationDetailPageProps) {
  const { id } = await params;
  const escalation = await getEscalation(id);

  if (!escalation) {
    notFound();
  }

  // Get conversation history
  const history = escalation.gameId
    ? await getConversationHistory(escalation.playerId, escalation.gameId)
    : [];

  // Parse suggested response from escalation reason if present
  const suggestedMatch = escalation.escalationReason?.match(/Suggested: (.+)$/);
  const suggestedResponse = suggestedMatch ? suggestedMatch[1] : undefined;
  const reason = escalation.escalationReason?.replace(/\. Suggested: .+$/, '') || 'Unknown';

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/escalations"
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          &larr; Back to Queue
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Context */}
        <div className="space-y-6">
          {/* Player Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Player Info</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {escalation.player.firstName} {escalation.player.lastName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Phone</dt>
                <dd className="text-sm font-medium text-gray-900">{escalation.player.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Response Rate</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {escalation.player.responseCount} responses / {escalation.player.timeoutCount} timeouts
                </dd>
              </div>
            </dl>
          </div>

          {/* Game Info */}
          {escalation.game && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Game Info</h2>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Date</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(escalation.game.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Time</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(escalation.game.time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Location</dt>
                  <dd className="text-sm font-medium text-gray-900">{escalation.game.location}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Conversation History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Conversation History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No previous messages.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {history.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.direction === 'inbound'
                        ? 'bg-gray-100 mr-8'
                        : 'bg-indigo-50 ml-8'
                    }`}
                  >
                    <p className="text-sm text-gray-900">{msg.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.direction === 'inbound' ? 'Player' : 'Bot'} &middot;{' '}
                      {new Date(msg.sentAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Response Form */}
        <div className="space-y-6">
          {/* Current Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">Escalated Message</h2>
            <p className="text-lg text-gray-900">&quot;{escalation.body}&quot;</p>
            <p className="mt-2 text-sm text-gray-500">
              Received: {new Date(escalation.sentAt).toLocaleString()}
            </p>
          </div>

          {/* Escalation Reason */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Why Escalated</h2>
            <p className="text-sm text-gray-600">{reason}</p>
          </div>

          {/* Response Form */}
          <EscalationResponseForm
            escalationId={escalation.id}
            playerId={escalation.playerId}
            playerPhone={escalation.player.phone}
            suggestedResponse={suggestedResponse && suggestedResponse !== 'None' ? suggestedResponse : undefined}
          />
        </div>
      </div>
    </div>
  );
}
