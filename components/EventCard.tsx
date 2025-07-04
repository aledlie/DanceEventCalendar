// components/EventCard.tsx

import { format } from 'date-fns';
import type { DanceEvent } from '../types/types.ts'; // Adjusted import path

interface EventCardProps {
  event: DanceEvent;
}

export const EventCard = ({ event }: EventCardProps) => {
  const formatDisplayDate = (isoDate: string | null): string => {
    if (!isoDate) return 'Time not available';
    try {
      return format(new Date(isoDate), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    // You can replace these classNames with your actual theme's classes
    <div className="event-card-item">
      <h3>{event.title}</h3>
      <p className="location-detail">{event.location}</p>
      <p className="date-detail">📅 {event.rawDateStr}</p>
      <p className="parsed-date-detail">
        <strong>Starts:</strong> {formatDisplayDate(event.startDateTimeISO)}
      </p>
      <div className="actions">
        <a href={event.eventUrl} target="_blank" rel="noopener noreferrer">
          View on DancePlace
        </a>
        {event.googleCalendarUrl && (
          <a href={event.googleCalendarUrl} target="_blank" rel="noopener noreferrer">
            + Add to Google Calendar
          </a>
        )}
      </div>
    </div>
  );
};
