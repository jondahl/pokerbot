'use client';

import type { InvitationWithPlayer } from '@/lib/data/invitations';

interface InvitationListProps {
  invitations: InvitationWithPlayer[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  invited: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  timeout: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<string, string> = {
  pending: 'In Queue',
  invited: 'Invited',
  confirmed: 'Confirmed',
  declined: 'Declined',
  timeout: 'Timed Out',
};

export default function InvitationList({ invitations }: InvitationListProps) {
  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No invitations yet. Add players to the queue above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invited At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Responded At
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invitations.map((invitation) => (
            <tr key={invitation.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invitation.position}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {invitation.player.firstName} {invitation.player.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{invitation.player.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invitation.status]}`}
                >
                  {statusLabels[invitation.status]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invitation.invitedAt
                  ? new Date(invitation.invitedAt).toLocaleString()
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invitation.respondedAt
                  ? new Date(invitation.respondedAt).toLocaleString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
