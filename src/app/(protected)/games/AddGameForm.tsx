'use client';

import { useState, FormEvent } from 'react';
import { createGameAction } from './actions';

export default function AddGameForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const location = formData.get('location') as string;
    const entryInstructions = formData.get('entryInstructions') as string;
    const capacity = parseInt(formData.get('capacity') as string, 10);

    // Create date and time objects
    const date = new Date(dateStr);
    const time = new Date(`${dateStr}T${timeStr}`);

    // RSVP deadline is 1 day before the game
    const rsvpDeadline = new Date(date);
    rsvpDeadline.setDate(rsvpDeadline.getDate() - 1);

    // Determine time block based on time
    const hour = parseInt(timeStr.split(':')[0], 10);
    let timeBlock = 'Evening';
    if (hour < 12) timeBlock = 'Morning';
    else if (hour < 17) timeBlock = 'Afternoon';

    try {
      const result = await createGameAction({
        date,
        time,
        timeBlock,
        location,
        entryInstructions: entryInstructions || undefined,
        capacity,
        rsvpDeadline,
      });
      if (result.success) {
        setIsOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error || 'Failed to create game');
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
        + Schedule Game
      </button>
    );
  }

  // Default to next Saturday at 7 PM
  const getNextSaturday = () => {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Game</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name="date"
              id="date"
              required
              defaultValue={getNextSaturday()}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Time
            </label>
            <input
              type="time"
              name="time"
              id="time"
              required
              defaultValue="19:00"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              required
              placeholder="123 Main St"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
              Max Players
            </label>
            <input
              type="number"
              name="capacity"
              id="capacity"
              required
              min="2"
              max="20"
              defaultValue="8"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="entryInstructions" className="block text-sm font-medium text-gray-700">
            Entry Instructions (optional)
          </label>
          <input
            type="text"
            name="entryInstructions"
            id="entryInstructions"
            placeholder="Ring doorbell, unit 3B"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </form>
    </div>
  );
}
