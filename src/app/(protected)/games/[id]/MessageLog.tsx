import type { MessageWithContext } from '@/lib/data/messages';

interface MessageLogProps {
  messages: MessageWithContext[];
}

export default function MessageLog({ messages }: MessageLogProps) {
  if (messages.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500 text-center">No messages sent yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {messages.map((message) => (
          <li key={message.id} className="p-4">
            <div className="flex items-start space-x-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  message.direction === 'outbound'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {message.direction === 'outbound' ? '→' : '←'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {message.direction === 'outbound' ? 'Sent to' : 'Received from'}{' '}
                    {message.player.firstName} {message.player.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.sentAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{message.body}</p>
                {message.handlingType && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        message.handlingType === 'auto'
                          ? 'bg-green-100 text-green-800'
                          : message.handlingType === 'escalated'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.handlingType === 'auto'
                        ? 'Auto-handled'
                        : message.handlingType === 'escalated'
                        ? 'Escalated'
                        : 'Admin'}
                    </span>
                    {message.llmConfidence && (
                      <span className="text-xs text-gray-500">
                        {(Number(message.llmConfidence) * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
