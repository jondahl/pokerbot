import Link from 'next/link';
import { getPendingEscalations } from '@/lib/data/messages';

export const dynamic = 'force-dynamic';

export default async function EscalationsPage() {
  const escalations = await getPendingEscalations();

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escalation Queue</h1>
          <p className="mt-2 text-gray-600">
            Messages requiring admin review and response.
          </p>
        </div>
        {escalations.length > 0 && (
          <span className="mt-4 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            {escalations.length} pending
          </span>
        )}
      </div>

      <div className="mt-8">
        {escalations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No pending escalations. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {escalations.map((escalation) => (
              <div
                key={escalation.id}
                className="bg-white shadow rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {escalation.player.firstName} {escalation.player.lastName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {escalation.player.phone}
                      </span>
                    </div>

                    {escalation.game && (
                      <p className="mt-1 text-sm text-gray-500">
                        Game: {new Date(escalation.game.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })} at {escalation.game.location}
                      </p>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Player message:</p>
                      <p className="mt-1 text-gray-900">&quot;{escalation.body}&quot;</p>
                    </div>

                    {escalation.escalationReason && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Reason for escalation:</p>
                        <p className="mt-1 text-sm text-gray-600">{escalation.escalationReason}</p>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-gray-400">
                      Received: {new Date(escalation.sentAt).toLocaleString()}
                    </p>
                  </div>

                  <Link
                    href={`/escalations/${escalation.id}`}
                    className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Respond
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
